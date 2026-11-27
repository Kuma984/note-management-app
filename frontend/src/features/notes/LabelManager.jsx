import { useState } from 'react';
import NoteDialog, { ConfirmNoteDialog } from './NoteDialog';

export default function LabelManager({ labels, api, onChanged, onClose, notify }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) return setError('Tên nhãn không được để trống.');
    setBusy(true); setError('');
    try {
      if (editing) await api.renameLabel(editing, name.trim());
      else await api.addLabel(name.trim());
      setName(''); setEditing(null);
      await onChanged();
      notify('Đã cập nhật nhãn.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try {
      await api.deleteLabel(deleting.id);
      if (editing === deleting.id) { setEditing(null); setName(''); }
      setDeleting(null);
      await onChanged();
      notify('Đã xóa nhãn. Các ghi chú vẫn được giữ nguyên.');
    } catch (failure) { setError(failure.message); setDeleting(null); }
    finally { setBusy(false); }
  }
  return <>
    <NoteDialog title="Quản lý nhãn" onCancel={onClose} busy={busy}>
      {error && <p role="alert" className="alert alert-danger">{error}</p>}
      <form onSubmit={submit} className="mb-3">
        <label htmlFor="label-name" className="form-label">{editing ? 'Đổi tên nhãn' : 'Thêm nhãn'}</label>
        <div className="d-flex gap-2">
          <input id="label-name" className="form-control" value={name} maxLength={50} onChange={event => setName(event.target.value)} required disabled={busy} autoFocus />
          <button className="btn btn-primary" disabled={busy}>{editing ? 'Đổi tên' : 'Thêm'}</button>
        </div>
        {editing && <button type="button" className="btn btn-link" onClick={() => { setEditing(null); setName(''); }}>Hủy đổi tên</button>}
      </form>
      {!labels.length && <p className="text-body-secondary">Bạn chưa có nhãn nào.</p>}
      <ul className="list-group">
        {labels.map(label => <li key={label.id} className="list-group-item d-flex justify-content-between gap-2 align-items-center">
          <span className="note-title">{label.name}</span>
          <span className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => { setEditing(label.id); setName(label.name); }}>Đổi tên</button>
            <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => setDeleting(label)}>Xóa</button>
          </span>
        </li>)}
      </ul>
    </NoteDialog>
    {deleting && <ConfirmNoteDialog title="Xóa nhãn?" message={`Xóa nhãn “${deleting.name}”? Các ghi chú không bị xóa.`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </>;
}
