import React from 'react';

export function Card({ title, icon: Icon, children, className = '', action = null }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          {title && (
            <h3 className="card-title" style={{ margin: 0 }}>
              {Icon && <Icon size={18} style={{ color: 'var(--accent-cyan)' }} />}
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

export default Card;
