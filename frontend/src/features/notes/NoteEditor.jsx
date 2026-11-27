import { useEffect, useRef, useState } from 'react';
import { AutosaveSession, validDraft } from './autosave';
import NoteDialog, { ConfirmNoteDialog } from './NoteDialog';
import AttachmentPanel from './AttachmentPanel';
import NoteStatusIcons from './NoteStatusIcons';

const STATUS = { empty: 'Nhập tiêu đề và nội dung', invalid: 'Chưa lưu: cần đủ tiêu đề và nội dung hợp lệ', dirty: 'Chờ tự lưu…', saving: 'Đang lưu…', saved: 'Đã lưu', error: 'Lỗi lưu', conflict: 'Có xung đột — cần kiểm tra' };

export default function NoteEditor({ initialNote, api, labels, onSaved, onClose, notify }) {
  const session = useRef(null);
  const callbacks = useRef({ onSaved, onClose, notify });
  callbacks.current = { onSaved, onClose, notify };
  const [state, setState] = useState({ title: initialNote?.title || '', content: initialNote?.content || '', note: initialNote, status: initialNote ? 'saved' : 'empty', dirty: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const readOnly = state.note?.access?.can_edit === false;

  useEffect(() => {
    // Construct inside the effect so React StrictMode cleanup cannot permanently dispose it.
    const controller = new AutosaveSession({ note: initialNote, api, onChange: setState,
      onSaved: note => callbacks.current.onSaved(note),
      onAccessLost: failure => {
        callbacks.current.notify(failure.message, 'danger');
        callbacks.current.onClose();
      },
    });
    session.current = controller;
    setState(controller.snapshot());
    const beforeUnload = event => { if (controller.snapshot().dirty) { event.preventDefault(); event.returnValue = ''; } };
    const online = () => { if (controller.status === 'error') controller.save(); };
    const remote = async event => {
      const change = event.detail || {};
      if (Number(change.note_id ?? change.noteId) !== controller.note?.id) return;
      if (['deleted', 'locked', 'revoked'].includes(change.kind)) {
        callbacks.current.notify('Quyền truy cập hoặc trạng thái ghi chú đã thay đổi.', 'warning');
        return callbacks.current.onClose();
      }
      try { controller.receiveRemote(await api.get(controller.note.id), change.operation_id ?? change.operationId); }
      catch (failure) { callbacks.current.notify(failure.message, 'danger'); if ([401, 403, 404, 423].includes(failure.status)) callbacks.current.onClose(); }
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('online', online);
    window.addEventListener('notes:changed', remote);
    return () => {
      controller.dispose();
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('online', online);
      window.removeEventListener('notes:changed', remote);
    };
  }, [api]);

  async function close() {
    setBusy(true);
    const saved = await session.current.flush();
    setBusy(false);
    if (saved) onClose();
    else setConfirm({ kind: 'discard' });
  }

  async function metadata(action) {
    setBusy(true); setError('');
    try {
      const saved = await session.current.flush();
      if (!saved?.id) throw new Error('Hãy nhập đủ tiêu đề/nội dung và xử lý lỗi lưu trước.');
      const result = await action(saved, { base_version: saved.version, operation_id: crypto.randomUUID() });
      session.current.accept(result.note);
      onSaved(result.note);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function changeLabel(labelId, checked) {
    const ids = new Set((session.current.note?.labels || []).map(label => label.id));
    if (checked) ids.add(labelId); else ids.delete(labelId);
    await metadata((note, body) => api.setLabels(note.id, { ...body, label_ids: [...ids] }));
  }

  async function upload(files) {
    await metadata((note, body) => {
      const form = new FormData();
      form.append('base_version', body.base_version);
      form.append('operation_id', body.operation_id);
      files.forEach(file => form.append('files', file));
      return api.upload(note.id, form);
    });
  }

  return <>
    <NoteDialog title={initialNote ? 'Ghi chú' : 'Ghi chú mới'} onCancel={close} busy={busy} wide>
      <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
        <span role="status" aria-live="polite" className={['error', 'conflict', 'invalid'].includes(state.status) ? 'text-danger' : 'text-body-secondary'}>{STATUS[state.status]}</span>
        {state.note && <NoteStatusIcons note={state.note} />}
      </div>
      {(error || state.message) && <p role="alert" className="alert alert-danger">{error || state.message}</p>}
      {readOnly && <p className="alert alert-info">Bạn có quyền chỉ đọc.</p>}
      <label htmlFor="note-title" className="form-label">Tiêu đề <span aria-hidden="true">*</span></label>
      <input id="note-title" className="form-control mb-3" autoFocus value={state.title} maxLength={200} required readOnly={readOnly} disabled={busy} onChange={event => session.current.change('title', event.target.value)} />
      <label htmlFor="note-content" className="form-label">Nội dung <span aria-hidden="true">*</span></label>
      <textarea id="note-content" className="form-control note-content" rows={8} value={state.content} maxLength={20000} required readOnly={readOnly} disabled={busy} onChange={event => session.current.change('content', event.target.value)} />
      <small className="text-body-secondary">{[...state.content].length.toLocaleString('vi-VN')} / 20.000 ký tự · Tự lưu sau khi ngừng gõ.</small>
      {state.status === 'error' && !readOnly && <button className="btn btn-outline-danger d-block mt-2" onClick={() => session.current.save()} disabled={busy || !validDraft(state)}>Thử lưu lại</button>}
      {state.remote && <section className="alert alert-warning mt-3" aria-label="Giải quyết xung đột">
        <p>Server có phiên bản {state.remote.version}. Bản bạn đang nhập vẫn được giữ ở trên.</p>
        <details><summary>Xem bản server</summary><strong>{state.remote.title}</strong><p className="note-preview-full">{state.remote.content}</p></details>
        <div className="d-flex flex-wrap gap-2 mt-2">
          <button className="btn btn-outline-secondary" onClick={() => session.current.resolve('server')}>Dùng bản server</button>
          <button className="btn btn-warning" onClick={() => session.current.resolve('mine')}>Áp dụng bản của tôi</button>
        </div>
      </section>}
      {state.note?.access.can_manage && <fieldset className="mt-3" disabled={busy || Boolean(state.remote)}>
        <legend className="h6">Nhãn <span className="fw-normal text-body-secondary">(tùy chọn)</span></legend>
        {!labels.length && <p className="small text-body-secondary">Tạo nhãn ở trang danh sách để sử dụng.</p>}
        <div className="d-flex flex-wrap gap-2">{labels.map(label => <label key={label.id} className="note-label-option">
          <input type="checkbox" checked={state.note.labels.some(item => item.id === label.id)} onChange={event => changeLabel(label.id, event.target.checked)} /> {label.name}
        </label>)}</div>
      </fieldset>}
      <AttachmentPanel api={api} note={state.note} readOnly={readOnly} busy={busy || Boolean(state.remote)} onUpload={upload} onDelete={file => setConfirm({ kind: 'file', file })} onError={setError} />
      <div className="d-flex justify-content-end mt-3"><button className="btn btn-outline-secondary" onClick={close} disabled={busy}>Đóng</button></div>
    </NoteDialog>
    {confirm && <ConfirmNoteDialog
      title={confirm.kind === 'discard' ? 'Bản đang nhập chưa được lưu' : 'Xóa tệp đính kèm?'}
      message={confirm.kind === 'discard' ? 'Đóng và bỏ các thay đổi chưa lưu? Bạn có thể hủy để tiếp tục sửa hoặc thử lại.' : `Xóa “${confirm.file.original_name}”?`}
      confirmText={confirm.kind === 'discard' ? 'Bỏ thay đổi và đóng' : 'Xóa tệp'} busy={busy}
      onCancel={() => setConfirm(null)} onConfirm={async () => {
        if (confirm.kind === 'discard') return onClose();
        const file = confirm.file;
        setConfirm(null);
        await metadata((note, body) => api.removeFile(note.id, file.id, body));
      }} />}
  </>;
}
