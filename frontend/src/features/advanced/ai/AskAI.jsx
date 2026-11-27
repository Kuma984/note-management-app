import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { NOTE_EDIT_ROUTE, SHARED_NOTE_ROUTE } from '../config';
import { apiError } from '../components/format';
import useOnline from '../components/useOnline';

/**
 * AI Question & Answer over the user's notes (RAG on the server).
 * Floating button -> side panel. Every answer lists the notes it was built from;
 * clicking a reference opens that note.
 */
export default function AskAI() {
  const navigate = useNavigate();
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]); // {q, a?, references?, error?, skipped?}
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [items, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    setBusy(true);
    setItems((list) => [...list, { q, loading: true }]);
    try {
      const res = await api.post('/ai/ask', { question: q }, { timeout: 90000 });
      setItems((list) => list.map((it, i) => (i === list.length - 1 ? { q, a: res.data.answer, references: res.data.references, skipped: res.data.skipped_locked } : it)));
    } catch (err) {
      setItems((list) => list.map((it, i) => (i === list.length - 1 ? { q, error: apiError(err, 'The AI could not answer right now.') } : it)));
    } finally {
      setBusy(false);
    }
  };

  const openNote = (ref) => {
    setOpen(false);
    navigate(ref.source === 'shared' ? SHARED_NOTE_ROUTE(ref.id) : NOTE_EDIT_ROUTE(ref.id));
  };

  // turn "[1]" markers in the answer into buttons that open the referenced note
  const renderAnswer = (item) =>
    item.a.split(/(\[\d+\])/g).map((part, i) => {
      const m = /^\[(\d+)\]$/.exec(part);
      const ref = m && item.references?.find((r) => r.n === Number(m[1]));
      return ref ? (
        <button key={i} type="button" className="btn btn-outline-primary btn-sm py-0 px-1 mx-1 align-baseline" title={ref.title} onClick={() => openNote(ref)}>
          {m[1]}
        </button>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      );
    });

  return (
    <>
      <button
        type="button"
        className="btn btn-primary rounded-circle shadow position-fixed d-flex align-items-center justify-content-center"
        style={{ right: 20, bottom: 20, width: 52, height: 52, zIndex: 1040 }}
        onClick={() => setOpen(true)}
        title="Ask AI about your notes"
        aria-label="Ask AI about your notes"
      >
        <i className="bi bi-stars fs-5"></i>
      </button>

      {open && (
        <>
          <div className="offcanvas offcanvas-end show" tabIndex={-1} role="dialog" aria-label="Ask AI about your notes" style={{ visibility: 'visible', width: 'min(420px, 100vw)', zIndex: 1060 }}>
            <div className="offcanvas-header border-bottom">
              <h5 className="offcanvas-title fs-6 fw-semibold"><i className="bi bi-stars text-primary me-1"></i>Ask AI about your notes</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setOpen(false)} />
            </div>
            <div className="offcanvas-body d-flex flex-column gap-3" style={{ overflowY: 'auto' }}>
              {items.length === 0 && (
                <p className="small text-muted mb-0">
                  Ask a question in your own words, for example “What did we decide in the last meeting?”. The answer is written from your notes and shows which notes it used.
                  Password-protected notes are never read by the AI.
                </p>
              )}
              {items.map((it, i) => (
                <div key={i}>
                  <div className="bg-body-secondary rounded-3 px-3 py-2 small ms-4 mb-2">{it.q}</div>
                  <div className="me-2">
                    {it.loading && <div className="small text-muted"><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Reading your notes...</div>}
                    {it.error && <div className="alert alert-danger py-2 small mb-0" role="alert">{it.error}</div>}
                    {it.a && (
                      <>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{renderAnswer(it)}</div>
                        {it.references?.length > 0 && (
                          <div className="mt-2">
                            <div className="small text-muted mb-1">{it.references.some((r) => r.cited) ? 'Sources' : 'Possibly related notes'}</div>
                            <div className="d-flex flex-column gap-1">
                              {it.references.map((r) => (
                                <button key={r.id} type="button" className="btn btn-outline-secondary btn-sm text-start text-truncate" onClick={() => openNote(r)}>
                                  <span className="badge text-bg-primary me-2">{r.n}</span>{r.title || 'Untitled'}
                                  {r.source === 'shared' && <i className="bi bi-people-fill ms-2 text-muted" title="Shared with you"></i>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {it.skipped > 0 && <div className="form-text">{it.skipped} password-protected {it.skipped === 1 ? 'note was' : 'notes were'} not searched.</div>}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="border-top p-3" onSubmit={ask}>
              {!online && <div className="small text-warning mb-2"><i className="bi bi-wifi-off me-1"></i>AI needs an internet connection.</div>}
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Ask about your notes..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={500}
                  disabled={busy}
                  aria-label="Your question"
                  autoFocus
                />
                <button className="btn btn-primary" type="submit" disabled={busy || !online || !question.trim()} aria-label="Send question">
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </form>
          </div>
          <div className="offcanvas-backdrop fade show" style={{ zIndex: 1055 }} onClick={() => setOpen(false)} />
        </>
      )}
    </>
  );
}
