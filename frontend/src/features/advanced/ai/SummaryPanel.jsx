import React, { useState } from 'react';
import api from '../../../services/api';
import { apiError } from '../components/format';

/** AI Summary of one note, can be regenerated as often as needed. */
export default function SummaryPanel({ noteId }) {
  const [summary, setSummary] = useState('');
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async (regenerate) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/ai/notes/${noteId}/summary`, { regenerate }, { timeout: 60000 });
      setSummary(res.data.summary);
      setTruncated(!!res.data.truncated);
    } catch (err) {
      setError(apiError(err, 'Could not generate the summary.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-primary-subtle mt-3">
      <div className="card-header d-flex justify-content-between align-items-center py-2">
        <span className="small fw-semibold"><i className="bi bi-stars text-primary me-1"></i>AI Summary</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => generate(!!summary)} disabled={loading}>
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Summarizing...</>
          ) : summary ? (
            <><i className="bi bi-arrow-repeat me-1"></i>Regenerate</>
          ) : (
            'Generate summary'
          )}
        </button>
      </div>
      <div className="card-body py-2" aria-live="polite">
        {error && <div className="alert alert-danger py-2 small mb-0" role="alert">{error}</div>}
        {!error && summary && (
          <>
            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
            {truncated && <div className="form-text">Only the first part of a very long note was summarized.</div>}
          </>
        )}
        {!error && !summary && !loading && <p className="small text-muted mb-0">Create a short summary of this note with AI.</p>}
      </div>
    </div>
  );
}
