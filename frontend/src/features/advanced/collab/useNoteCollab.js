import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientDoc } from './ClientDoc.js';
import { getNoteToken, requestUnlock } from '../lock/noteTokens';

// Relative to the page (no hard-coded host/port): ws://<same host>/ws  or  wss:// on https
const wsUrl = () => `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

/**
 * Real-time collaboration for the text of ONE note.
 *
 *  const collab = useNoteCollab({ noteId, enabled, onRemoteText, onRemoteTitle });
 *  collab.sendLocal(newText)        // call whenever the user edits the text
 *  collab.sendTitle(newTitle)
 *  collab.status                    // off | connecting | live | reconnecting | error | revoked
 *  collab.canEdit / collab.count    // server-confirmed permission / people currently in the note
 *
 * Reconnects automatically. While disconnected the text is read-only so no edit is ever lost.
 * Incoming messages are held back during IME composition (Vietnamese Telex etc.).
 */
export default function useNoteCollab({ noteId, enabled, onRemoteText, onRemoteTitle }) {
  const [status, setStatus] = useState('off');
  const [canEdit, setCanEdit] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');

  const docRef = useRef(null);
  const sendRef = useRef(() => {});
  const handleRef = useRef(() => {});
  const composingRef = useRef(false);
  const inboxRef = useRef([]);
  const callbacks = useRef({});
  callbacks.current = { onRemoteText, onRemoteTitle };

  useEffect(() => {
    if (!enabled || !noteId) {
      setStatus('off');
      return undefined;
    }
    let stopped = false;
    let halted = false;
    let retries = 0;
    let timer = null;
    let ws = null;

    const send = (msg) => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    };
    sendRef.current = send;

    const fail = (message, nextStatus = 'error') => {
      halted = true;
      setError(message);
      setStatus(nextStatus);
      setCanEdit(false);
    };

    const handle = (msg) => {
      switch (msg.t) {
        case 'joined':
          docRef.current = new ClientDoc(msg.text, msg.rev);
          retries = 0;
          setCanEdit(!!msg.canEdit);
          setCount(msg.count || 1);
          setError('');
          setStatus('live');
          callbacks.current.onRemoteText?.(msg.text, null);
          if (typeof msg.title === 'string') callbacks.current.onRemoteTitle?.(msg.title);
          break;
        case 'ack':
        case 'op':
        case 'doc': {
          const doc = docRef.current;
          if (!doc) break;
          const out = doc.receive(msg);
          if (out.send) send(out.send);
          if (out.resync) send({ t: 'resync' });
          if (out.text !== null) callbacks.current.onRemoteText?.(out.text, out.op);
          break;
        }
        case 'title':
          callbacks.current.onRemoteTitle?.(msg.title);
          break;
        case 'presence':
          setCount(msg.count);
          break;
        case 'perm':
          setCanEdit(!!msg.canEdit);
          break;
        case 'error':
          if (msg.code === 'NOTE_LOCKED') {
            halted = true;
            setStatus('connecting');
            requestUnlock(noteId).then(
              () => {
                halted = false;
                if (!stopped) connect();
              },
              () => fail('This note is password protected.')
            );
          } else if (msg.code === 'REVOKED') {
            fail('Access to this note was removed by its owner.', 'revoked');
          } else if (msg.code === 'READ_ONLY') {
            setCanEdit(false);
          } else if (['NOT_FOUND', 'UNAUTHORIZED', 'BAD_REQUEST'].includes(msg.code)) {
            fail(msg.message || 'Live editing is not available for this note.');
          } else {
            setError(msg.message || '');
          }
          break;
        default:
      }
    };
    handleRef.current = handle;

    function connect() {
      if (stopped || halted) return;
      setStatus(docRef.current ? 'reconnecting' : 'connecting');
      setCanEdit(false);
      ws = new WebSocket(wsUrl());
      ws.onopen = () => send({ t: 'join', token: localStorage.getItem('token'), noteId, noteToken: getNoteToken(noteId) });
      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch (err) {
          return;
        }
        if (composingRef.current) inboxRef.current.push(msg);
        else handle(msg);
      };
      ws.onclose = () => {
        if (stopped || halted) return;
        setStatus('reconnecting');
        setCanEdit(false);
        retries += 1;
        timer = setTimeout(connect, Math.min(500 * 2 ** retries, 10000));
      };
      ws.onerror = () => {};
    }

    const onOnline = () => {
      if (!stopped && !halted && (!ws || ws.readyState > 1)) {
        clearTimeout(timer);
        connect();
      }
    };
    window.addEventListener('online', onOnline);
    connect();

    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      sendRef.current = () => {};
      docRef.current = null;
      inboxRef.current = [];
      if (ws) ws.close();
      setStatus('off');
    };
  }, [enabled, noteId]);

  /** The text changed locally (typing, paste, cut ...). */
  const sendLocal = useCallback((text) => {
    const doc = docRef.current;
    if (!doc) return;
    if (composingRef.current) {
      doc.local = text; // remember it, it is sent when composition ends
      return;
    }
    const msg = doc.setLocal(text);
    if (msg) sendRef.current(msg);
  }, []);

  const sendTitle = useCallback((title) => sendRef.current({ t: 'title', title }), []);

  const startComposition = useCallback(() => {
    composingRef.current = true;
  }, []);

  /** IME composition finished: send the final text first, then apply what arrived meanwhile. */
  const endComposition = useCallback((text) => {
    composingRef.current = false;
    const doc = docRef.current;
    if (doc) {
      const msg = doc.setLocal(text);
      if (msg) sendRef.current(msg);
    }
    const queued = inboxRef.current.splice(0);
    queued.forEach((m) => handleRef.current(m));
  }, []);

  return { status, canEdit, count, error, sendLocal, sendTitle, startComposition, endComposition };
}
