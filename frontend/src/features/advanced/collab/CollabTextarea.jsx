import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../../../services/api';
import { isServerId } from '../config';
import { mapPos } from './ot.js';
import useNoteCollab from './useNoteCollab';

/**
 * Drop-in replacement for the note content <textarea>.
 *
 *  - Normal notes: behaves exactly like a controlled textarea (value / onChange).
 *  - Notes that are shared with "edit" permission: edits are merged live over WebSocket
 *    (many people can type at the same time and see each other's changes).
 *
 * Props
 *   noteId, value, onChange(text)       required
 *   title, onTitleChange(title)         optional - also keeps the title in sync
 *   collab                              'auto' (default: asks the server) | true | false
 *   readOnly                            force read-only
 *   onActiveChange(isLive)              true while live collaboration is running -
 *                                       Member 2: skip the REST auto-save of `content` while this is true
 *   onRevoked()                         the owner removed this user's access
 *   ...rest                             forwarded to <textarea> (rows, className, placeholder ...)
 */
export default function CollabTextarea({
  noteId,
  value,
  onChange,
  title,
  onTitleChange,
  collab = 'auto',
  readOnly = false,
  onActiveChange,
  onRevoked,
  className = 'form-control',
  ...rest
}) {
  const taRef = useRef(null);
  const selectionRef = useRef(null);
  const remoteTitleRef = useRef(null);
  const [enabled, setEnabled] = useState(collab === true);

  // decide whether this note needs live collaboration
  const checkMeta = useCallback(async () => {
    if (collab !== 'auto') return;
    if (!isServerId(noteId)) {
      setEnabled(false);
      return;
    }
    try {
      const res = await api.get(`/notes/${noteId}/meta`);
      setEnabled(!!res.data.meta?.collab);
    } catch (err) {
      setEnabled(false);
    }
  }, [collab, noteId]);

  useEffect(() => {
    if (collab !== 'auto') {
      setEnabled(collab === true);
      return undefined;
    }
    checkMeta();
    window.addEventListener('note-shares-changed', checkMeta);
    return () => window.removeEventListener('note-shares-changed', checkMeta);
  }, [collab, checkMeta]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onTitleRef = useRef(onTitleChange);
  onTitleRef.current = onTitleChange;

  const handleRemoteText = useCallback((text, op) => {
    const ta = taRef.current;
    if (ta && op && document.activeElement === ta) {
      selectionRef.current = [mapPos(ta.selectionStart, op), mapPos(ta.selectionEnd, op)];
    }
    onChangeRef.current?.(text);
  }, []);

  const handleRemoteTitle = useCallback((t) => {
    remoteTitleRef.current = t;
    onTitleRef.current?.(t);
  }, []);

  const live = useNoteCollab({
    noteId: String(noteId),
    enabled: enabled && isServerId(noteId),
    onRemoteText: handleRemoteText,
    onRemoteTitle: handleRemoteTitle,
  });

  // keep the caret where it was after a remote edit changed the text
  useLayoutEffect(() => {
    if (selectionRef.current && taRef.current) {
      taRef.current.setSelectionRange(selectionRef.current[0], selectionRef.current[1]);
      selectionRef.current = null;
    }
  }, [value]);

  // send local title edits (debounced), but never echo a title that just arrived
  useEffect(() => {
    if (live.status !== 'live' || !live.canEdit || title === undefined) return undefined;
    if (title === remoteTitleRef.current) return undefined;
    const timer = setTimeout(() => live.sendTitle(title), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const isLive = live.status === 'live';
  useEffect(() => {
    onActiveChange?.(isLive);
  }, [isLive, onActiveChange]);

  useEffect(() => {
    if (live.status === 'revoked') onRevoked?.();
  }, [live.status, onRevoked]);

  const collabOn = enabled && live.status !== 'off';
  const locked = readOnly || (collabOn && !(isLive && live.canEdit));

  const handleChange = (e) => {
    const text = e.target.value;
    onChange?.(text);
    if (collabOn) live.sendLocal(text);
  };

  let badge = null;
  if (collabOn) {
    if (live.status === 'live') {
      badge = (
        <span className={live.canEdit ? 'text-success' : 'text-secondary'}>
          <i className={`bi ${live.canEdit ? 'bi-broadcast' : 'bi-eye'} me-1`}></i>
          {live.canEdit ? 'Live editing' : 'View only'} · {live.count} {live.count === 1 ? 'person' : 'people'} in this note
        </span>
      );
    } else if (live.status === 'revoked' || live.status === 'error') {
      badge = <span className="text-danger"><i className="bi bi-exclamation-triangle me-1"></i>{live.error || 'Live editing is unavailable.'}</span>;
    } else {
      badge = <span className="text-warning"><i className="bi bi-arrow-repeat me-1"></i>{live.status === 'connecting' ? 'Connecting...' : 'Reconnecting... editing is paused'}</span>;
    }
  }

  return (
    <div>
      <textarea
        {...rest}
        ref={taRef}
        className={className}
        value={value}
        onChange={handleChange}
        onCompositionStart={() => collabOn && live.startComposition()}
        onCompositionEnd={(e) => collabOn && live.endComposition(e.target.value)}
        readOnly={locked}
        aria-readonly={locked}
      />
      {badge && <div className="form-text mt-1" aria-live="polite">{badge}</div>}
    </div>
  );
}
