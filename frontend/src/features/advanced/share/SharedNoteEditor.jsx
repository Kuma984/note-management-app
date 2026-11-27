import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { apiError, formatDateTime } from '../components/format';
import CollabTextarea from '../collab/CollabTextarea';
import NoteAdvancedToolbar from '../NoteAdvancedToolbar';

/**
 * Screen for a note that was shared WITH the current user  (route /shared/:id).
 *  - "Can edit": edit the title and text together with the owner, changes appear live.
 *  - "Read only": view the note (and see changes appear live); AI summary is available too.
 */
export default function SharedNoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/shared-notes/${id}`);
      setData(res.data);
      setTitle(res.data.note.title || '');
      setContent(res.data.note.content || '');
    } catch (err) {
      setError(err.canceled ? 'This note is password protected. Enter its password to open it.' : apiError(err, 'Could not open this note.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevoked = useCallback(() => navigate('/shared', { replace: true }), [navigate]);

  if (loading) {
    return <div className="text-center text-muted py-5"><div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>Opening note...</div>;
  }
  if (error || !data) {
    return (
      <div>
        <Link to="/shared" className="btn btn-link btn-sm px-0 mb-3"><i className="bi bi-arrow-left me-1"></i>Shared with me</Link>
        <div className="alert alert-danger" role="alert">{error || 'Note not found.'}</div>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={load}>Try again</button>
      </div>
    );
  }

  const { note, permission, shared_at: sharedAt } = data;
  const canEdit = permission === 'edit' || permission === 'owner';

  return (
    <div style={{ maxWidth: 860 }}>
      <Link to="/shared" className="btn btn-link btn-sm px-0 mb-2"><i className="bi bi-arrow-left me-1"></i>Shared with me</Link>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3 small text-muted">
        <span className={`badge ${canEdit ? 'text-bg-success' : 'text-bg-secondary'}`}>{canEdit ? 'Can edit' : 'Read only'}</span>
        <span><i className="bi bi-person me-1"></i>Shared by {note.owner_name || note.owner_email}</span>
        {sharedAt && <span><i className="bi bi-clock me-1"></i>{formatDateTime(sharedAt)}</span>}
        {note.is_locked ? <span><i className="bi bi-lock-fill text-warning me-1"></i>Password protected</span> : null}
      </div>

      <input
        className="form-control form-control-lg fw-semibold mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={255}
        readOnly={!canEdit}
        aria-label="Note title"
      />

      <CollabTextarea
        noteId={note.id}
        value={content}
        onChange={setContent}
        title={title}
        onTitleChange={setTitle}
        collab
        readOnly={!canEdit}
        onRevoked={handleRevoked}
        rows={16}
        placeholder="This note is empty."
        aria-label="Note content"
      />

      <NoteAdvancedToolbar noteId={note.id} className="mt-3" />
    </div>
  );
}
