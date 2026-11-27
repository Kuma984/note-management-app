import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const links = [
    { to: '/', label: 'All Notes', icon: 'bi-journal-richtext' },
    { to: '/pinned', label: 'Pinned Notes', icon: 'bi-pin-angle-fill' },
    { to: '/shared', label: 'Shared with Me', icon: 'bi-people-fill' },
    { to: '/labels', label: 'Labels', icon: 'bi-tags-fill' },
    { to: '/profile', label: 'My Profile', icon: 'bi-person-fill' },
    { to: '/preferences', label: 'Preferences', icon: 'bi-gear-fill' },
  ];

  const renderLinks = () => (
    <ul className="nav nav-pills flex-column gap-1">
      {links.map((link) => (
        <li key={link.to} className="nav-item">
          <NavLink
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'text-body'}`
            }
          >
            <i className={`bi ${link.icon}`}></i>
            <span>{link.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-nav bg-body-tertiary p-3 d-none d-md-block">
        {renderLinks()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
          style={{ zIndex: 1045, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        >
          <aside
            className="bg-body-tertiary h-100 p-3 shadow"
            style={{ width: '250px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <span className="fw-bold text-primary">Menu</span>
              <button type="button" className="btn-close btn-sm" onClick={onClose}></button>
            </div>
            {renderLinks()}
          </aside>
        </div>
      )}
    </>
  );
}
