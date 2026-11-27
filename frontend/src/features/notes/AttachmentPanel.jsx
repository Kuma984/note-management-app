import { useEffect, useRef, useState } from 'react';

const LIMIT = 10 * 1024 * 1024;
const ACCEPT = '.jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf,.txt';

function MediaPreview({ api, noteId, file, onError }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    let objectUrl;
    api.file(noteId, file.id, abort.signal).then(blob => {
      if (abort.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(error => { if (!abort.signal.aborted) onError(error.message); });
    return () => { abort.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [api, noteId, file.id]);
  if (!url) return <span className="small text-body-secondary">Đang tải bản xem trước…</span>;
  return file.media_kind === 'image'
    ? <img src={url} alt={file.original_name} className="note-media" loading="lazy" />
    : <video src={url} controls preload="metadata" className="note-media" aria-label={file.original_name} />;
}

export default function AttachmentPanel({ api, note, readOnly, busy, onUpload, onDelete, onError }) {
  const input = useRef(null);
  async function select(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    if (files.length > 5 || (note?.attachments.length || 0) + files.length > 10) return onError('Tối đa 5 tệp mỗi lần và 10 tệp mỗi ghi chú.');
    if (files.some(file => file.size > LIMIT || file.size === 0)) return onError('Mỗi tệp phải lớn hơn 0 byte và không quá 10 MiB.');
    if (files.some(file => !/\.(jpe?g|png|webp|mp4|webm|pdf|txt)$/i.test(file.name))) return onError('Định dạng tệp chưa được hỗ trợ.');
    await onUpload(files);
  }
  async function download(file) {
    try {
      const blob = await api.file(note.id, file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { onError(error.message); }
  }
  return <section className="mt-3" aria-labelledby="attachment-heading">
    <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2">
      <h3 id="attachment-heading" className="h6 mb-0">Tệp đính kèm</h3>
      {!readOnly && <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy || !note?.id} onClick={() => input.current.click()}>Thêm ảnh / video / tệp</button>}
    </div>
    <input ref={input} type="file" multiple accept={ACCEPT} className="visually-hidden" tabIndex={-1} onChange={select} aria-label="Chọn tệp đính kèm" disabled={busy || readOnly || !note?.id} />
    {!note?.id && <p className="small text-body-secondary">Nhập đủ tiêu đề và nội dung; sau khi ghi chú tự lưu, bạn có thể đính kèm tệp.</p>}
    <p className="small text-body-secondary">JPEG, PNG, WebP, MP4, WebM, PDF, TXT · 10 MiB/tệp · tối đa 10 tệp.</p>
    <div className="note-attachments">
      {(note?.attachments || []).map(file => <article key={file.id} className="note-attachment">
        {file.media_kind !== 'file' && <MediaPreview api={api} noteId={note.id} file={file} onError={onError} />}
        <strong className="small note-filename">{file.original_name}</strong>
        <small className="text-body-secondary">{Math.max(1, Math.round(file.file_size / 1024))} KiB</small>
        <div className="d-flex flex-wrap gap-2 mt-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => download(file)}>Tải xuống</button>
          {!readOnly && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => onDelete(file)}>Xóa tệp</button>}
        </div>
      </article>)}
    </div>
  </section>;
}
