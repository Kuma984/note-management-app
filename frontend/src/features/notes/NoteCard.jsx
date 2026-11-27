import NoteStatusIcons from './NoteStatusIcons';

export default function NoteCard({ note, list, onOpen, onPin, onDelete, pending }) {
  return <article className={`note-card ${list ? 'note-card-list' : ''}`}>
    <button className="note-card-open" onClick={() => onOpen(note)} aria-label={`Mở ghi chú ${note.title}`}>
      <span className="d-flex align-items-start justify-content-between gap-3">
        <strong className="note-title">{note.title}</strong>
        <NoteStatusIcons note={note} />
      </span>
      <span className="note-preview">{note.is_locked ? 'Cần mật khẩu để mở ghi chú.' : note.content_preview}</span>
    </button>
    <div className="note-card-footer">
      <div className="d-flex flex-wrap gap-1">{note.labels.map(label => <span key={label.id} className="badge text-bg-secondary">{label.name}</span>)}</div>
      <div className="d-flex align-items-center gap-1">
        <small className="text-body-secondary me-2">{new Date(note.updated_at).toLocaleDateString('vi-VN')}</small>
        {note.access.can_manage && <>
          <button className="btn btn-sm btn-outline-secondary" disabled={pending} title={note.is_pinned ? 'Bỏ ghim' : 'Ghim'} aria-label={`${note.is_pinned ? 'Bỏ ghim' : 'Ghim'} ${note.title}`} onClick={() => onPin(note)}><i className={`bi ${note.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`} aria-hidden="true" /></button>
          <button className="btn btn-sm btn-outline-danger" disabled={pending} aria-label={`Xóa ${note.title}`} onClick={() => onDelete(note)}><i className="bi bi-trash" aria-hidden="true" /></button>
        </>}
      </div>
    </div>
  </article>;
}
