import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { isServerId } from './config';
import useOnline from './components/useOnline';
import LockManageDialog from './lock/LockManageDialog';
import ShareDialog from './share/ShareDialog';
import SummaryPanel from './ai/SummaryPanel';

/**
 * One toolbar with the advanced note actions. Member 2 only has to render it in the note editor:
 *
 *    <NoteAdvancedToolbar noteId={note.id} />
 *
 * Owner:     password protection, sharing, AI summary.
 * Recipient: AI summary.
 * Everything here needs the server, so the buttons are disabled while offline.
 */
export default function NoteAdvancedToolbar({ noteId, className = '' }) {
  const online = useOnline();
  const [meta, setMeta] = useState(null);
  const [dialog, setDialog] = useState(null); // 'lock' | 'share'
  const [showSummary, setShowSummary] = useState(false);
  const valid = isServerId(noteId);

  const loadMeta = useCallback(async () => {
    if (!valid) return;
    try {
      const res = await api.get(`/notes/${noteId}/meta`);
      setMeta(res.data.meta);
    } catch (err) {
      /* keep the previous value */
    }
  }, [noteId, valid]);

  useEffect(() => {
    setMeta(null);
    setShowSummary(false);
    loadMeta();
    window.addEventListener('note-lock-changed', loadMeta);
    window.addEventListener('note-shares-changed', loadMeta);
    return () => {
      window.removeEventListener('note-lock-changed', loadMeta);
      window.removeEventListener('note-shares-changed', loadMeta);
    };
  }, [loadMeta]);

  if (!valid) return null; // note not saved on the server yet
  const isOwner = meta?.role === 'owner';
  const offlineHint = online ? undefined : 'Requires an internet connection';

  return (
    <div className={className}>
      <div className="d-flex flex-wrap gap-2">
        {isOwner && (
          <button type="button" className={`btn btn-sm ${meta.is_locked ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={() => setDialog('lock')} disabled={!online} title={offlineHint || 'Password protection'}>
            <i className={`bi ${meta.is_locked ? 'bi-lock-fill' : 'bi-unlock'} me-1`}></i>{meta.is_locked ? 'Password' : 'Lock'}
          </button>
        )}
        {isOwner && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDialog('share')} disabled={!online} title={offlineHint || 'Share this note'}>
            <i className="bi bi-people me-1"></i>Share
            {meta.share_count > 0 && <span className="badge text-bg-primary ms-1">{meta.share_count}</span>}
          </button>
        )}
        <button type="button" className={`btn btn-sm ${showSummary ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setShowSummary((s) => !s)} disabled={!online} title={offlineHint || 'AI summary'} aria-pressed={showSummary}>
          <i className="bi bi-stars me-1"></i>AI Summary
        </button>
      </div>

      {showSummary && online && <SummaryPanel noteId={noteId} />}

      {isOwner && (
        <>
          <LockManageDialog show={dialog === 'lock'} noteId={noteId} isLocked={!!meta.is_locked} onClose={() => setDialog(null)} onChanged={loadMeta} />
          <ShareDialog show={dialog === 'share'} noteId={noteId} onClose={() => setDialog(null)} />
        </>
      )}
    </div>
  );
}
