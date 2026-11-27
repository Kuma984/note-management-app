/**
 * WebSocket server for real-time note collaboration  (endpoint: /ws).
 *
 * Protocol (JSON messages)
 *   client -> server : {t:'join', token, noteId, noteToken}
 *                      {t:'op', rev, op:{p,d,s}}      one text edit created against server revision `rev`
 *                      {t:'title', title}
 *                      {t:'resync'}
 *   server -> client : {t:'joined', rev, text, title, canEdit, count}
 *                      {t:'ack', rev, h}               your op was applied as revision `rev`
 *                      {t:'op', rev, op, h}            somebody else's op (already transformed)
 *                      {t:'title', title}  {t:'presence', count}  {t:'perm', canEdit}
 *                      {t:'doc', rev, text}            full snapshot (answer to resync)
 *                      {t:'error', code, message}
 *
 * Every open note has ONE in-memory room holding the authoritative text; edits are serialised
 * and transformed by CollabDoc, and the text is written back to MySQL (debounced).
 */
const { WebSocketServer } = require('ws');
const { pool } = require('../../config/db');
const { verifyAccessToken } = require('./auth');
const { getNoteAccess, verifyNoteToken } = require('./noteAccess');
const { CollabDoc } = require('./collabDoc');

const SAVE_DEBOUNCE_MS = 800;
const HEARTBEAT_MS = 30000;
const MAX_TITLE_LENGTH = 255;

const rooms = new Map(); // noteId -> Promise<Room>
const liveRooms = new Map(); // noteId -> Room (resolved)

class Room {
  constructor(noteId, text, title) {
    this.noteId = noteId;
    this.doc = new CollabDoc(text || '');
    this.title = title || '';
    this.clients = new Set();
    this.contentDirty = false;
    this.titleDirty = false;
    this.timer = null;
  }
}

const send = (ws, msg) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
};

async function loadRoom(noteId) {
  const [rows] = await pool.query('SELECT content, title FROM notes WHERE id = ?', [noteId]);
  if (!rows[0]) throw new Error('Note not found');
  return new Room(noteId, rows[0].content, rows[0].title);
}

function getRoom(noteId) {
  if (!rooms.has(noteId)) {
    const p = loadRoom(noteId).then(
      (room) => {
        liveRooms.set(noteId, room);
        return room;
      },
      (err) => {
        rooms.delete(noteId);
        throw err;
      }
    );
    rooms.set(noteId, p);
  }
  return rooms.get(noteId);
}

async function saveRoom(room) {
  if (!room.contentDirty && !room.titleDirty) return;
  const content = room.doc.text;
  const title = room.title;
  const hadContent = room.contentDirty;
  const hadTitle = room.titleDirty;
  room.contentDirty = false;
  room.titleDirty = false;
  try {
    if (hadContent && hadTitle) {
      await pool.query('UPDATE notes SET content = ?, title = ? WHERE id = ?', [content, title, room.noteId]);
    } else if (hadContent) {
      await pool.query('UPDATE notes SET content = ? WHERE id = ?', [content, room.noteId]);
    } else {
      await pool.query('UPDATE notes SET title = ? WHERE id = ?', [title, room.noteId]);
    }
  } catch (err) {
    room.contentDirty = room.contentDirty || hadContent;
    room.titleDirty = room.titleDirty || hadTitle;
    console.error('[realtime] failed to save note', room.noteId, err.message);
  }
}

function scheduleSave(room) {
  clearTimeout(room.timer);
  room.timer = setTimeout(() => saveRoom(room), SAVE_DEBOUNCE_MS);
}

function broadcast(room, msg, except) {
  for (const c of room.clients) if (c !== except) send(c.ws, msg);
}

async function leave(client) {
  const room = client.room;
  if (!room || !room.clients.has(client)) return;
  room.clients.delete(client);
  if (room.clients.size > 0) {
    broadcast(room, { t: 'presence', count: room.clients.size });
    return;
  }
  clearTimeout(room.timer);
  await saveRoom(room);
  // a client may have joined while we were saving - only drop truly empty rooms
  if (room.clients.size === 0) {
    rooms.delete(room.noteId);
    liveRooms.delete(room.noteId);
  }
}

async function handleJoin(client, msg) {
  let userId;
  try {
    userId = verifyAccessToken(msg.token).id;
  } catch (err) {
    return fail(client, 'UNAUTHORIZED', 'Please sign in again.');
  }
  const noteId = parseInt(msg.noteId, 10);
  if (!Number.isInteger(noteId)) return fail(client, 'BAD_REQUEST', 'Invalid note id.');

  const access = await getNoteAccess(noteId, userId);
  if (!access) return fail(client, 'NOT_FOUND', 'Note not found or no access.');
  if (access.locked && !verifyNoteToken(msg.noteToken, noteId, userId)) {
    return fail(client, 'NOTE_LOCKED', 'This note is password protected.');
  }

  const room = await getRoom(noteId);
  client.userId = userId;
  client.noteId = noteId;
  client.canEdit = access.role === 'owner' || access.role === 'edit';
  client.room = room;
  room.clients.add(client);

  send(client.ws, {
    t: 'joined',
    rev: room.doc.rev,
    text: room.doc.text,
    title: room.title,
    canEdit: client.canEdit,
    count: room.clients.size,
  });
  broadcast(room, { t: 'presence', count: room.clients.size }, client);
}

function fail(client, code, message) {
  send(client.ws, { t: 'error', code, message });
  client.ws.close(4000, code);
}

async function handleMessage(client, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch (err) {
    return;
  }
  if (msg.t === 'join') {
    if (client.room) return;
    return handleJoin(client, msg);
  }
  const room = client.room;
  if (!room) return;

  if (msg.t === 'op') {
    if (!client.canEdit) return send(client.ws, { t: 'error', code: 'READ_ONLY', message: 'Read-only access.' });
    const res = room.doc.submit(msg.rev, msg.op);
    if (!res) return send(client.ws, { t: 'doc', rev: room.doc.rev, text: room.doc.text });
    room.contentDirty = true;
    scheduleSave(room);
    send(client.ws, { t: 'ack', rev: res.rev, h: res.h });
    broadcast(room, { t: 'op', rev: res.rev, op: res.op, h: res.h }, client);
  } else if (msg.t === 'title') {
    if (!client.canEdit || typeof msg.title !== 'string') return;
    room.title = msg.title.slice(0, MAX_TITLE_LENGTH);
    room.titleDirty = true;
    scheduleSave(room);
    broadcast(room, { t: 'title', title: room.title }, client);
  } else if (msg.t === 'resync') {
    send(client.ws, { t: 'doc', rev: room.doc.rev, text: room.doc.text });
  }
}

/** Re-check every connection of a note (call after a share was changed or revoked). */
async function onShareChanged(noteId) {
  const room = liveRooms.get(Number(noteId));
  if (!room) return;
  for (const client of [...room.clients]) {
    try {
      const access = await getNoteAccess(noteId, client.userId);
      if (!access) {
        send(client.ws, { t: 'error', code: 'REVOKED', message: 'Access to this note was removed.' });
        client.ws.close(4003, 'REVOKED');
      } else {
        const canEdit = access.role === 'owner' || access.role === 'edit';
        if (canEdit !== client.canEdit) {
          client.canEdit = canEdit;
          send(client.ws, { t: 'perm', canEdit });
        }
      }
    } catch (err) {
      console.error('[realtime] access re-check failed:', err.message);
    }
  }
}

/** A password was just set on the note: everybody must reconnect with a note token. */
function onLockChanged(noteId) {
  const room = liveRooms.get(Number(noteId));
  if (!room) return;
  for (const client of [...room.clients]) client.ws.close(4001, 'LOCK_CHANGED');
}

async function flushAll() {
  await Promise.all([...liveRooms.values()].map((room) => saveRoom(room)));
}

function attachRealtime(server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4 * 1024 * 1024 });

  wss.on('connection', (ws) => {
    const client = { ws, room: null, userId: null, canEdit: false };
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    const joinTimeout = setTimeout(() => {
      if (!client.room) ws.close(4008, 'JOIN_TIMEOUT');
    }, 10000);
    ws.on('message', (data) => {
      handleMessage(client, data.toString()).catch((err) => {
        console.error('[realtime] message error:', err.message);
        send(ws, { t: 'error', code: 'SERVER_ERROR', message: 'Something went wrong.' });
      });
    });
    ws.on('close', () => {
      clearTimeout(joinTimeout);
      leave(client).catch((err) => console.error('[realtime] leave error:', err.message));
    });
    ws.on('error', () => {});
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_MS);
  wss.on('close', () => clearInterval(heartbeat));

  const shutdown = async () => {
    await flushAll();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  console.log('Realtime collaboration ready on /ws');
  return wss;
}

module.exports = { attachRealtime, onShareChanged, onLockChanged, flushAll };
