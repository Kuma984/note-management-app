import React from 'react';

export default function NoteList() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">My Notes</h4>
        <button className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i> New Note
        </button>
      </div>

      <div className="card text-center p-5 border-dashed">
        <div className="card-body">
          <i className="bi bi-journal-plus display-5 text-secondary"></i>
          <h5 className="card-title mt-3 text-secondary">No notes yet</h5>
          <p className="card-text text-muted small">
            This section is ready for Member 2 to build note creation and grid/list views.
          </p>
        </div>
      </div>
    </div>
  );
}
