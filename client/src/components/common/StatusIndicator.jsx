import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Database, CheckCircle2, AlertOctagon, Activity, Server, Clock, X } from 'lucide-react';

export function StatusIndicator({
  status,
  healthData,
  error,
  isLoading,
  onRefresh,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  const isOnline = status === 'online';
  const isChecking = status === 'checking';

  const label = isChecking
    ? 'Checking API...'
    : isOnline
    ? 'Backend Online'
    : 'Backend Offline';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        className={`status-pill ${status}`}
        onClick={() => setShowDetails((prev) => !prev)}
        title="Click to view detailed system telemetry"
        style={{ cursor: 'pointer', border: 'none' }}
      >
        <span className="status-dot" />
        <span>{label}</span>
        {isOnline && healthData?.roundTripMs !== undefined && (
          <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>
            {healthData.roundTripMs}ms
          </span>
        )}
      </button>

      <button
        type="button"
        className="refresh-btn"
        onClick={onRefresh}
        disabled={isLoading}
        title="Re-check backend API status"
      >
        <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
        <span>Check</span>
      </button>

      {/* Popover Card */}
      {showDetails && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 100,
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Server size={14} color="var(--accent-cyan)" />
              System Diagnostics
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {status}
              </span>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                title="Close diagnostics"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {isOnline && healthData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>API Endpoint:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>/api/v1/health</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database:</span>
                <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Database size={12} />
                  {healthData.services?.database?.status || 'connected'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>DB Engine:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {healthData.services?.database?.engine || 'SQLite3'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>DB Latency:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {healthData.services?.database?.latencyMs} ms
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Server Uptime:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {healthData.uptimeSeconds}s
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Environment:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {healthData.environment}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <AlertOctagon size={16} />
                <strong>Connection Failed</strong>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                {error || 'Unable to reach backend API at configured base URL.'}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Verify the server is running on port 5000 and CORS allows origin.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StatusIndicator;
