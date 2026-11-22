import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'All Notes', icon: 'bi-journal-richtext' },
    { to: '/pinned', label: 'Pinned Notes', icon: 'bi-pin-angle-fill' },
    { to: '/shared', label: 'Shared with Me', icon: 'bi-people-fill' },
    { to: '/labels', label: 'Labels', icon: 'bi-tags-fill' },
    { to: '/preferences', label: 'Preferences', icon: 'bi-gear-fill' },
  ];

  return (
    <aside className="sidebar-nav bg-body-tertiary p-3 d-none d-md-block">
      <ul className="nav nav-pills flex-column gap-1">
        {links.map((link) => (
          <li key={link.to} className="nav-item">
            <NavLink
              to={link.to}
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
    </aside>
  );
}
