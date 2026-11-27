import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { getSnapshot, setStatus, subscribe } from './store';
import { syncOutbox } from './sync';

/** Bottom banner: offline notice, waiting changes, sync progress and result. */
export default function OfflineBanner() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [dismissedAt, setDismissedAt] = useState(0);

  useEffect(() => {
    if (!s.result || s.result.failed.length) return undefined;
    const timer = setTimeout(() => setStatus({ result: null }), 6000);
    return () => clearTimeout(timer);
  }, [s.result]);

  const showResult = s.result && s.result.at > dismissedAt;
  let banner = null;

  if (!s.online) {
    banner = (
      <div className="alert alert-warning shadow-sm mb-0 py-2 d-flex align-items-center gap-2" role="status">
        <i className="bi bi-wifi-off"></i>
        <span className="small">
          You are offline. You can still read your saved notes{s.pending > 0 ? <> · <strong>{s.pending}</strong> {s.pending === 1 ? 'change' : 'changes'} saved on this device</> : null}. Changes sync automatically when you are back online.
        </span>
      </div>
    );
  } else if (s.syncing) {
    banner = (
      <div className="alert alert-info shadow-sm mb-0 py-2 d-flex align-items-center gap-2" role="status">
        <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span className="small">Syncing your changes...</span>
      </div>
    );
  } else if (s.pending > 0) {
    banner = (
      <div className="alert alert-warning shadow-sm mb-0 py-2 d-flex align-items-center gap-2" role="status">
        <i className="bi bi-cloud-arrow-up"></i>
        <span className="small flex-grow-1">{s.pending} {s.pending === 1 ? 'change is' : 'changes are'} waiting to sync.</span>
        <button type="button" className="btn btn-sm btn-outline-dark py-0" onClick={syncOutbox}>Sync now</button>
      </div>
    );
  } else if (showResult) {
    const { applied, failed } = s.result;
    banner = (
      <div className={`alert ${failed.length ? 'alert-danger' : 'alert-success'} shadow-sm mb-0 py-2 d-flex align-items-start gap-2`} role="status">
        <i className={`bi ${failed.length ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} mt-1`}></i>
        <div className="small flex-grow-1">
          {applied > 0 && <div>Synced {applied} {applied === 1 ? 'change' : 'changes'}. <a href="#refresh" className="alert-link" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>Refresh the page</a> to see the latest data.</div>}
          {failed.map((f, i) => <div key={i}>The server rejected a change ({f.method.toUpperCase()} {f.url}): {f.message}</div>)}
        </div>
        <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => { setDismissedAt(Date.now()); setStatus({ result: null }); }} />
      </div>
    );
  }

  if (!banner) return null;
  return (
    <div className="position-fixed bottom-0 start-0 end-0 d-flex justify-content-center p-2" style={{ zIndex: 1090, pointerEvents: 'none' }} aria-live="polite">
      <div style={{ pointerEvents: 'auto', maxWidth: 640, width: '100%' }}>{banner}</div>
    </div>
  );
}
