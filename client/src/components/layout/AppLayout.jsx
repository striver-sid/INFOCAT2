import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import { useSystemHealth } from '../../hooks/useSystemHealth.js';

export function AppLayout() {
  const { status, healthData, error, isLoading, refresh } = useSystemHealth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar 
        status={status} 
        healthData={healthData} 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Navbar
          status={status}
          healthData={healthData}
          error={error}
          isLoading={isLoading}
          onRefresh={refresh}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="content-body" id="main-content">
          <Outlet context={{ status, healthData, error, isLoading, refresh }} />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
