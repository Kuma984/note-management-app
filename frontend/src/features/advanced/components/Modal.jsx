import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

let openModals = 0;

/**
 * Small Bootstrap-styled modal (the project does not load Bootstrap's JavaScript,
 * so dialogs are plain React). Closes with Esc or a click on the backdrop.
 */
export default function Modal({ show, title, onClose, children, footer, size = '', busy = false }) {
  useEffect(() => {
    if (!show) return undefined;
    openModals += 1;
    document.body.classList.add('modal-open');
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      openModals -= 1;
      if (openModals <= 0) document.body.classList.remove('modal-open');
    };
  }, [show, busy, onClose]);

  if (!show) return null;

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !busy) onClose?.();
        }}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fs-6 fw-semibold">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={busy} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body
  );
}
