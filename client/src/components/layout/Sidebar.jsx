import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  Inbox, 
  Send, 
  PenSquare, 
  Info, 
  ShieldCheck, 
  Database,
  UserCheck,
  X
} from 'lucide-react';
import { useDemoUser } from '../../context/DemoUserContext.jsx';

export function Sidebar({ status, healthData, isOpen, onClose }) {
  const { currentUser } = useDemoUser();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', path: '/inbox', icon: Inbox },
    { name: 'Compose', path: '/compose', icon: PenSquare },
    { name: 'Sent Messages', path: '/sent', icon: Send },
    { name: 'Lab Guide & Specs', path: '/about', icon: Info },
  ];

  const dbConnected = healthData?.services?.database?.status === 'connected';

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">CipherMail</span>
              <span className="brand-badge">v1.1</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Classical Cryptography
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            className="refresh-btn mobile-menu-btn"
            style={{ padding: '4px', borderRadius: 'var(--radius-sm)' }}
            aria-label="Close navigation sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0.75rem 0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          Messaging Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Current Demo Identity Callout */}
        {currentUser && (
          <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              <UserCheck size={12} />
              <span>Active Demo Context</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              {currentUser.email}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', marginTop: '0.35rem' }}>
              * Simulated demo identity (no auth)
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer with Persisted DB Status */}
      <div className="sidebar-footer">
        <div className="system-status-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="status-label">Persistence</span>
            <span style={{ fontSize: '0.72rem', color: dbConnected ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
              {dbConnected ? 'SQLite Ready' : 'Standby'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Database size={13} color={dbConnected ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
            <span>ciphermail.db (WAL)</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Users & Cipher Messages Schema
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
