import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDemoUser } from '../context/DemoUserContext.jsx';
import { fetchUserStats } from '../api/message.api.js';
import { 
  LayoutDashboard, 
  Inbox, 
  Send, 
  PenSquare, 
  ShieldAlert, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  BookOpen,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Info
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

export function DashboardPage() {
  const { currentUser, users } = useDemoUser();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchUserStats(currentUser.id);
      setStats(data);
    } catch (err) {
      console.error('[DashboardPage] Failed to fetch stats:', err);
      setError(err.message || 'Unable to load dashboard statistics from backend API.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <LayoutDashboard size={28} style={{ color: 'var(--accent-cyan)' }} />
            Security Operations Dashboard
          </h1>
          <p className="page-description">
            Live classical cryptographic telemetry and message ledger summary for active demo identity{' '}
            <strong style={{ color: '#fff' }}>{currentUser?.name || '...'}</strong> ({currentUser?.email}).
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="refresh-btn"
          style={{ padding: '0.5rem 0.9rem' }}
          title="Refresh dashboard metrics from SQLite"
          id="refresh-dashboard-btn"
        >
          <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Prominent Educational Lab Disclaimer Banner */}
      <div
        className="foundation-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(244, 63, 94, 0.08))',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          marginBottom: '1.75rem',
        }}
      >
        <div
          className="foundation-banner-icon"
          style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}
        >
          <ShieldAlert size={22} />
        </div>
        <div className="foundation-banner-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ color: '#fff', margin: 0 }}>
              Academic & Information Security Lab Demonstration Notice
            </h3>
            <Badge variant="amber">Educational Use Only</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            The classical ciphers demonstrated in CipherMail (Caesar Shift, Playfair 5×5 Matrix, Rail Fence Zigzag, and Row-Columnar Transposition) are implemented strictly for cryptographic laboratory instruction and history of ciphers. These algorithms are computationally insecure against modern frequency analysis, brute-force search, and known-plaintext attacks, and <strong>must never be deployed for confidential or production communication</strong>.
          </p>
        </div>
      </div>

      {/* Primary Telemetry Metrics Row (Loaded from Backend Data) */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {/* Inbox Messages Count */}
        <div className="metric-card">
          <div className="metric-header">
            <span>Inbound Messages</span>
            <Inbox size={18} color="var(--accent-cyan)" />
          </div>
          <div className="metric-value">
            {isLoading ? '...' : stats?.inbox?.total ?? 0}
          </div>
          <div className="metric-sub" style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-emerald)' }}>
              ● {stats?.inbox?.decrypted ?? 0} Decrypted
            </span>
            <span style={{ color: 'var(--accent-indigo)' }}>
              ● {stats?.inbox?.sent ?? 0} Unread
            </span>
          </div>
        </div>

        {/* Sent Messages Count */}
        <div className="metric-card">
          <div className="metric-header">
            <span>Dispatched Messages</span>
            <Send size={18} color="var(--accent-emerald)" />
          </div>
          <div className="metric-value">
            {isLoading ? '...' : stats?.sent?.total ?? 0}
          </div>
          <div className="metric-sub">
            Dispatched by {currentUser?.name}
          </div>
        </div>

        {/* Pending Ciphertexts (Status: SENT) */}
        <div className="metric-card">
          <div className="metric-header">
            <span>Pending Ciphertexts</span>
            <Clock size={18} color="var(--accent-indigo)" />
          </div>
          <div className="metric-value">
            {isLoading ? '...' : stats?.statusCounts?.pendingSent ?? 0}
          </div>
          <div className="metric-sub">
            Status: <code style={{ color: 'var(--accent-indigo)' }}>SENT</code>
          </div>
        </div>

        {/* Decrypted Messages (Status: DECRYPTED) */}
        <div className="metric-card">
          <div className="metric-header">
            <span>Deciphered Total</span>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>
          <div className="metric-value">
            {isLoading ? '...' : stats?.statusCounts?.decrypted ?? 0}
          </div>
          <div className="metric-sub">
            Status: <code style={{ color: 'var(--accent-emerald)' }}>DECRYPTED</code>
          </div>
        </div>
      </div>

      {/* Main Grid: Cipher Taxonomy & Quick Actions */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Educational Taxonomy: Substitution vs. Transposition */}
        <Card title="Cryptographic Taxonomy: Substitution vs. Transposition" icon={Layers}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
            {/* Substitution Category */}
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>1. Substitution Ciphers</strong>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <Badge variant="cyan">Caesar Shift</Badge>
                  <Badge variant="indigo">Playfair 5×5</Badge>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                In substitution ciphers, the <strong>identities of characters are replaced</strong> with other characters according to a fixed translation rule or matrix. The character order remains unchanged, but their symbols are substituted.
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                • <em>Caesar</em>: Monoalphabetic shift rotation (keys 0–25).<br />
                • <em>Playfair</em>: Polygraphic digraph substitution using a 5×5 key matrix with I/J combined.
              </div>
            </div>

            {/* Transposition Category */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>2. Transposition Ciphers</strong>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <Badge variant="emerald">Rail Fence</Badge>
                  <Badge variant="amber">Columnar Transposition</Badge>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                In transposition ciphers, character <strong>identities are strictly preserved</strong>, but their <strong>positions are systematically rearranged</strong> (permuted) across geometric tracks or matrix columns.
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                • <em>Rail Fence</em>: Zigzag diagonal routing with depth key ≥ 2.<br />
                • <em>Row-Columnar</em>: Written row-by-row and read off by alphabetical column keyword ranking.
              </div>
            </div>
          </div>
        </Card>

        {/* Algorithm Usage Distribution & Quick Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Algorithm Distribution Breakdown */}
          <Card title="Algorithm Utilization in Database" icon={Lock}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="cyan">Caesar Shift</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monoalphabetic</span>
                </div>
                <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {isLoading ? '...' : stats?.algorithms?.caesar ?? 0} msgs
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="indigo">Playfair 5×5</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Polygraphic</span>
                </div>
                <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {isLoading ? '...' : stats?.algorithms?.playfair ?? 0} msgs
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="emerald">Rail Fence</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zigzag Transposition</span>
                </div>
                <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {isLoading ? '...' : stats?.algorithms?.rail_fence ?? 0} msgs
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="amber">Row-Columnar</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Permutation Transposition</span>
                </div>
                <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {isLoading ? '...' : stats?.algorithms?.columnar_transposition ?? 0} msgs
                </strong>
              </div>
            </div>
          </Card>

          {/* Quick Workflow Action Shortcuts */}
          <Card title="Quick Security Workflows" icon={Sparkles}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <Link
                to="/compose"
                className="btn-primary"
                style={{
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                <PenSquare size={14} />
                <span>Compose</span>
              </Link>

              <Link
                to="/inbox"
                className="refresh-btn"
                style={{
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                <Inbox size={14} />
                <span>Inbox</span>
              </Link>

              <Link
                to="/sent"
                className="refresh-btn"
                style={{
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                <Send size={14} />
                <span>Sent Ledger</span>
              </Link>

              <Link
                to="/about"
                className="refresh-btn"
                style={{
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                <BookOpen size={14} />
                <span>Lab Guide</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
