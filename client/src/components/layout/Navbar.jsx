import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { StatusIndicator } from '../common/StatusIndicator.jsx';
import { DemoUserSelector } from '../common/DemoUserSelector.jsx';

export function Navbar({ status, healthData, error, isLoading, onRefresh, onToggleMobileSidebar }) {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Security Dashboard';
      case '/inbox':
        return 'Secure Inbound Messages';
      case '/compose':
        return 'Compose & Encrypt Message';
      case '/sent':
        return 'Dispatched Message Ledger';
      case '/about':
        return 'Lab Guide & Specifications';
      default:
        return 'Security Operations';
    }
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="refresh-btn mobile-menu-btn"
          aria-label="Toggle navigation menu"
          style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
        >
          <Menu size={18} />
        </button>

        <div className="nav-breadcrumbs">
          <span className="breadcrumb-root">CipherMail</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{currentTitle}</span>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Predefined Demo User Selector */}
        <DemoUserSelector />

        {/* Backend Online/Offline Health Pill */}
        <StatusIndicator
          status={status}
          healthData={healthData}
          error={error}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </div>
    </header>
  );
}

export default Navbar;
