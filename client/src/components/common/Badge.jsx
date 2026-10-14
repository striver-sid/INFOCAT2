import React from 'react';

export function Badge({ children, variant = 'muted', icon: Icon, className = '' }) {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

export default Badge;
