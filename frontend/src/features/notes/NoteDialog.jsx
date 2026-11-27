import { useEffect, useId, useRef } from 'react';

export default function NoteDialog({ title, children, onCancel, busy = false, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} className={`note-dialog ${wide ? 'note-dialog-wide' : ''}`} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
      <header className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h2 id={titleId} className="h5 mb-0">{title}</h2>
        <button type="button" className="btn btn-outline-secondary" aria-label="Đóng hộp thoại" disabled={busy} onClick={onCancel}>×</button>
      </header>
      {children}
    </dialog>
  );
}

export function ConfirmNoteDialog({ title, message, busy, onCancel, onConfirm, confirmText = 'Xóa' }) {
  return <NoteDialog title={title} onCancel={onCancel} busy={busy}>
    <p>{message}</p>
    <div className="d-flex justify-content-end gap-2">
      <button className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>Hủy</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Đang xử lý…' : confirmText}</button>
    </div>
  </NoteDialog>;
}
