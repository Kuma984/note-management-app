import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { makeNotesApi } from './notes.api';
import { NotesSearchProvider, useNotesSearch } from './NotesSearchContext';
import NoteList from './NoteList';

function Playground() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { query, setQuery } = useNotesSearch();
  async function choose(userId) {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/dev/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Không thể mở phiên thử.');
      setSession({ user: data.user, api: makeNotesApi(data.token) });
    } catch (failure) { setError(`${failure.message} Kiểm tra MySQL và chạy backend bằng npm run notes:dev.`); }
    finally { setBusy(false); }
  }
  return <main className="container-fluid p-3 p-md-4">
    <div className="alert alert-warning"><strong>LOCAL PLAYGROUND — không phải đăng nhập thật.</strong> Chỉ để thử TV2 bằng tài khoản seed. Không đưa server này lên hosting. Trang này không nằm trong bundle production.</div>
    {error && <div role="alert" className="alert alert-danger">{error}</div>}
    {!session ? <section><h1 className="h4">Chạy thử phần quản lý note</h1><p>Chọn user seed; token chỉ giữ trong RAM, không thay phiên đăng nhập của app chính.</p>
      <div className="d-flex flex-wrap gap-2">{[1, 2, 3].map(id => <button key={id} className="btn btn-primary" disabled={busy} onClick={() => choose(id)}>{busy ? 'Đang mở…' : `User ${id}`}</button>)}</div>
    </section> : <>
      <header className="d-flex flex-wrap justify-content-between gap-3 mb-3"><span>Đang thử: <strong>{session.user.email}</strong></span><button className="btn btn-outline-secondary" onClick={() => setSession(null)}>Kết thúc phiên thử</button></header>
      <div className="mb-3 d-none d-sm-block"><label htmlFor="dev-search" className="form-label">Tìm tiêu đề hoặc nội dung</label><input id="dev-search" className="form-control" type="search" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} /></div>
      <NoteList key={session.user.id} api={session.api} />
    </>}
  </main>;
}

if (!import.meta.env.DEV) throw new Error('Playground is development-only.');
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><NotesSearchProvider><Playground /></NotesSearchProvider></BrowserRouter></React.StrictMode>);
