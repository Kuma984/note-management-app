import { useCallback, useEffect, useState } from 'react';
import { notesApi } from './notes.api';
import { useNotesSearch } from './NotesSearchContext';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import LabelManager from './LabelManager';
import { ConfirmNoteDialog } from './NoteDialog';
import './notes.css';

export default function NoteList({ api = notesApi, preferences = {} }) {
  const { query, setQuery } = useNotesSearch();
  const [debounced, setDebounced] = useState(query);
  const [view, setView] = useState('grid');
  const [items, setItems] = useState([]);
  const [labels, setLabels] = useState([]);
  const [filters, setFilters] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, has_more: false });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(null);
  const [manager, setManager] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState(false);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  const notify = useCallback((message, type = 'success') => setNotice({ message, type }), []);
  const filterKey = filters.slice().sort((a, b) => a - b).join(',');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => { setPage(1); }, [debounced, filterKey]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError('');
    api.list({ q: debounced, label_ids: filterKey || undefined, page, limit: 20 }, abort.signal)
      .then(result => { if (!abort.signal.aborted) { setItems(result.items); setMeta(result.meta); } })
      .catch(failure => { if (!abort.signal.aborted) setError(failure.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [api, debounced, filterKey, page, revision]);

  const reloadLabels = useCallback(async () => {
    const current = await api.labels();
    setLabels(current);
    setFilters(previous => previous.filter(id => current.some(label => label.id === id)));
    refresh();
  }, [api, refresh]);
  useEffect(() => {
    let active = true;
    api.labels().then(result => { if (active) setLabels(result); }).catch(failure => { if (active) notify(failure.message, 'danger'); });
    return () => { active = false; };
  }, [api, notify]);
  useEffect(() => {
    window.addEventListener('notes:changed', refresh);
    return () => window.removeEventListener('notes:changed', refresh);
  }, [refresh]);
  useEffect(() => {
    if (page > 1 && !loading && !error && !items.length) setPage(value => Math.max(1, value - 1));
  }, [page, loading, error, items.length]);

  function unlockRequest(note, action, onUnlocked) {
    window.dispatchEvent(new CustomEvent('notes:unlock-request', { detail: { noteId: note.id, action, onUnlocked } }));
    notify('Bạn cần mở khóa ghi chú trước khi thực hiện thao tác này.', 'warning');
  }
  async function open(note) {
    setPending(true);
    try { setEditor({ key: crypto.randomUUID(), note: await api.get(note.id) }); }
    catch (failure) {
      if (failure.status === 423) unlockRequest(note, 'read', () => open(note));
      else notify(failure.message, 'danger');
    } finally { setPending(false); }
  }
  async function pin(note) {
    setPending(true);
    try {
      await api.pin(note.id, { pinned: !note.is_pinned, base_version: note.version, operation_id: crypto.randomUUID() });
      refresh(); notify(note.is_pinned ? 'Đã bỏ ghim.' : 'Đã ghim ghi chú.');
    } catch (failure) {
      if (failure.status === 423) unlockRequest(note, 'pin', () => pin(note));
      else notify(failure.message, 'danger');
      refresh();
    } finally { setPending(false); }
  }
  async function remove() {
    const note = deleting;
    setPending(true);
    try {
      await api.remove(note.id, { base_version: note.version, operation_id: crypto.randomUUID() });
      setDeleting(null); refresh(); notify('Đã xóa ghi chú.');
    } catch (failure) {
      setDeleting(null);
      if (failure.status === 423) unlockRequest(note, 'delete', () => setDeleting(note));
      else notify(failure.message, 'danger');
      refresh();
    } finally { setPending(false); }
  }

  const fontSize = { small: 14, medium: 16, large: 20 }[preferences.font_size] || Number(preferences.font_size) || 16;
  return <section className="notes-page" style={{ '--note-font-size': `${fontSize}px`, '--note-color': preferences.note_color || 'var(--bs-body-bg)' }}>
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
      <div><h1 className="h4 fw-bold mb-1">Ghi chú của tôi</h1><p className="text-body-secondary small mb-0">{meta.total} ghi chú · Ghim trước, cập nhật gần nhất ở trên.</p></div>
      <div className="d-flex flex-wrap gap-2">
        <div className="btn-group" role="group" aria-label="Chế độ hiển thị">
          <button className={`btn btn-outline-secondary ${view === 'grid' ? 'active' : ''}`} aria-label="Dạng lưới" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><i className="bi bi-grid" aria-hidden="true" /></button>
          <button className={`btn btn-outline-secondary ${view === 'list' ? 'active' : ''}`} aria-label="Dạng danh sách" aria-pressed={view === 'list'} onClick={() => setView('list')}><i className="bi bi-list-ul" aria-hidden="true" /></button>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => setManager(true)}>Quản lý nhãn</button>
        <button className="btn btn-primary" disabled={pending} onClick={() => setEditor({ key: crypto.randomUUID(), note: null })}>Thêm ghi chú</button>
      </div>
    </div>
    <div className="mb-3 d-sm-none">
      <label htmlFor="mobile-note-search" className="form-label">Tìm tiêu đề hoặc nội dung</label>
      <input id="mobile-note-search" type="search" className="form-control" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="Nhập để tìm kiếm…" />
    </div>
    {notice && <div className={`alert alert-${notice.type} d-flex justify-content-between gap-3`} role={notice.type === 'danger' ? 'alert' : 'status'}><span>{notice.message}</span><button className="btn-close" aria-label="Đóng thông báo" onClick={() => setNotice(null)} /></div>}
    <fieldset className="note-filters mb-3">
      <legend className="h6 mb-2">Lọc theo nhãn <span className="text-body-secondary fw-normal small">— khớp ít nhất một nhãn</span></legend>
      <div className="d-flex flex-wrap gap-2">
        {!labels.length && <span className="small text-body-secondary">Chưa có nhãn.</span>}
        {labels.map(label => <label key={label.id} className="note-label-option"><input type="checkbox" checked={filters.includes(label.id)} onChange={event => setFilters(current => event.target.checked ? [...current, label.id] : current.filter(id => id !== label.id))} /> {label.name}</label>)}
        {(filters.length > 0 || query) && <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilters([]); setQuery(''); }}>Xóa bộ lọc</button>}
      </div>
    </fieldset>
    {error ? <div className="alert alert-danger" role="alert"><p>{error}</p><button className="btn btn-outline-danger" onClick={refresh}>Thử tải lại</button></div>
      : loading ? <p role="status" className="notes-empty"><span className="spinner-border spinner-border-sm me-2" />Đang tải ghi chú…</p>
      : !items.length ? <div className="notes-empty"><i className="bi bi-journal-text display-5" aria-hidden="true" /><h2 className="h5 mt-3">{debounced || filters.length ? 'Không có kết quả' : 'Chưa có ghi chú'}</h2><p>{debounced || filters.length ? 'Thử từ khóa hoặc nhãn khác.' : 'Tạo ghi chú đầu tiên bằng nút Thêm ghi chú.'}</p></div>
      : <div className={view === 'grid' ? 'notes-grid' : 'notes-list'}>{items.map(note => <NoteCard key={note.id} note={note} list={view === 'list'} onOpen={open} onPin={pin} onDelete={setDeleting} pending={pending} />)}</div>}
    {!error && !loading && (page > 1 || meta.has_more) && <nav aria-label="Phân trang ghi chú" className="d-flex justify-content-center align-items-center gap-3 mt-4"><button className="btn btn-outline-secondary" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page}</span><button className="btn btn-outline-secondary" disabled={!meta.has_more} onClick={() => setPage(value => value + 1)}>Sau</button></nav>}
    {editor && <NoteEditor key={editor.key} initialNote={editor.note} api={api} labels={labels} onSaved={refresh} onClose={() => { setEditor(null); refresh(); }} notify={notify} />}
    {manager && <LabelManager labels={labels} api={api} onChanged={reloadLabels} onClose={() => setManager(false)} notify={notify} />}
    {deleting && <ConfirmNoteDialog title="Xóa ghi chú?" message={`Xóa vĩnh viễn “${deleting.title}”? Thao tác này không thể hoàn tác.`} busy={pending} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </section>;
}
