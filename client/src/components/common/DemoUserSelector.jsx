import React from 'react';
import { useDemoUser } from '../../context/DemoUserContext.jsx';
import { UserCheck, Users, ArrowLeftRight, AlertCircle, RefreshCw } from 'lucide-react';

export function DemoUserSelector({ compact = false }) {
  const { users, currentUser, selectUser, isLoading, error, reloadUsers } = useDemoUser();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading identities...</span>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontSize: '0.78rem' }}>
        <AlertCircle size={14} />
        <span>Identities unavailable</span>
        <button
          type="button"
          onClick={reloadUsers}
          className="refresh-btn"
          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.75rem',
        }}
      >
        {/* User avatar badge */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: currentUser.name === 'Alice'
              ? 'linear-gradient(135deg, #06b6d4, #6366f1)'
              : 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {currentUser.name[0]}
        </div>

        {/* Identity Info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
              {currentUser.name}
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                textTransform: 'uppercase',
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.1)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              Demo Identity
            </span>
          </div>
          {!compact && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {currentUser.email}
            </span>
          )}
        </div>

        {/* Switch identity toggle buttons */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.5rem' }}>
          {users.map((u) => {
            const isSelected = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u.id)}
                title={`Switch demo view to ${u.name} (${u.email}) - Note: Not authenticated login`}
                style={{
                  background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DemoUserSelector;
