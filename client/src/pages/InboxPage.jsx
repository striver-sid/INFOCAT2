import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDemoUser } from '../context/DemoUserContext.jsx';
import { fetchInboxMessages, deleteMessage } from '../api/message.api.js';
import { 
  Inbox, 
  RefreshCw, 
  AlertCircle, 
  Lock, 
  Unlock,
  Layers, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  UserCheck, 
  CheckCircle2,
  Trash2,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  User
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import MessageReaderModal from '../components/message/MessageReaderModal.jsx';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal.jsx';

export function InboxPage() {
  const { currentUser } = useDemoUser();

  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SENT, DECRYPTED

  // Modals state
  const [activeMessage, setActiveMessage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const loadInbox = useCallback(async (targetPage = page) => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchInboxMessages(currentUser.id, { page: targetPage, limit: 10 });
      setMessages(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('[InboxPage] Failed to fetch inbox:', err);
      setError(err.message || 'Unable to retrieve inbox messages from API.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, page]);

  // When user changes, reset to page 1 and load inbox
  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    loadInbox(1);
  }, [currentUser?.id]);

  // Load when page number changes
  useEffect(() => {
    loadInbox(page);
  }, [page, loadInbox]);

  const handleNextPage = () => {
    if (pagination.hasNextPage) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) setPage((p) => Math.max(1, p - 1));
  };

  const handleStatusUpdated = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))
    );
    if (activeMessage && activeMessage.id === updatedMessage.id) {
      setActiveMessage((prev) => ({ ...prev, ...updatedMessage }));
    }
  };

  const handleDeleteConfirm = async (id) => {
    setIsDeleting(true);
    try {
      await deleteMessage(id);
      // Remove message from local list
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      setDeleteSuccess(`Message #${id} permanently deleted.`);
      setTimeout(() => setDeleteSuccess(null), 3000);
      setMessageToDelete(null);
      if (activeMessage && activeMessage.id === id) {
        setActiveMessage(null);
      }
    } catch (err) {
      console.error('[InboxPage] Failed to delete message:', err);
      setError(`Failed to delete message: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAlgorithmBadgeVariant = (algorithm) => {
    switch (algorithm) {
      case 'caesar': return 'cyan';
      case 'playfair': return 'indigo';
      case 'rail_fence': return 'emerald';
      case 'columnar_transposition': return 'amber';
      default: return 'muted';
    }
  };

  const getAlgorithmDisplayName = (algorithm) => {
    switch (algorithm) {
      case 'caesar': return 'Caesar';
      case 'playfair': return 'Playfair';
      case 'rail_fence': return 'Rail Fence';
      case 'columnar_transposition': return 'Columnar';
      default: return algorithm?.toUpperCase() || 'UNKNOWN';
    }
  };

  // Client-side search and status filter on the loaded page
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Status filter
      if (statusFilter !== 'ALL' && msg.status !== statusFilter) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(msg.id).includes(q) ||
        msg.sender_name?.toLowerCase().includes(q) ||
        msg.sender_email?.toLowerCase().includes(q) ||
        msg.algorithm?.toLowerCase().includes(q) ||
        msg.ciphertext?.toLowerCase().includes(q)
      );
    });
  }, [messages, searchQuery, statusFilter]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <Inbox size={28} style={{ color: 'var(--accent-cyan)' }} />
            Secure Inbound Messages
          </h1>
          <p className="page-description">
            Encrypted inbound dispatch ledger for recipient{' '}
            <strong style={{ color: '#fff' }}>{currentUser ? currentUser.name : '...'}</strong> ({currentUser?.email}).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => loadInbox(page)}
            disabled={isLoading}
            className="refresh-btn"
            style={{ padding: '0.5rem 0.9rem' }}
            title="Refresh inbox from API"
            id="reload-inbox-btn"
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Reload Ledger</span>
          </button>
        </div>
      </div>

      {/* Delete Success Alert */}
      {deleteSuccess && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Demo Identity & Search Controls Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              id="inbox-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, algorithm, ciphertext, or ID..."
              aria-label="Search inbox messages"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter by Status Pill Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <SlidersHorizontal size={13} /> Filter:
          </span>
          {['ALL', 'SENT', 'DECRYPTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className="refresh-btn"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: statusFilter === st ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: statusFilter === st ? 'var(--border-accent)' : 'var(--border-subtle)',
                color: statusFilter === st ? '#fff' : 'var(--text-muted)',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <Card title="Querying Database Layer..." icon={RefreshCw}>
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-cyan)', margin: '0 auto 1rem' }} />
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.35rem' }}>
              Fetching Messages from SQLite
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Querying GET /api/v1/messages/inbox/{currentUser?.id} with newest-first ordering...
            </p>
          </div>
        </Card>
      ) : error ? (
        <Card title="API Query Error" icon={AlertCircle}>
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Failed to Load Inbound Messages</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => loadInbox(page)}
              className="refresh-btn"
              style={{ margin: '0 auto', padding: '0.5rem 1rem' }}
            >
              <RefreshCw size={14} />
              <span>Retry Query</span>
            </button>
          </div>
        </Card>
      ) : messages.length === 0 ? (
        <Card
          title="Inbound Message Ledger"
          icon={Inbox}
          action={<Badge variant="muted">0 Messages</Badge>}
        >
          <div className="empty-placeholder">
            <div className="empty-placeholder-icon">
              <Inbox size={28} />
            </div>
            <div className="empty-placeholder-title">No Inbound Messages for {currentUser?.name}</div>
            <p className="empty-placeholder-desc">
              There are currently no ciphertext messages in the SQLite database addressed to recipient ID{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{currentUser?.id}</span>.
            </p>
            <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Badge variant="cyan">Caesar</Badge>
              <Badge variant="indigo">Playfair</Badge>
              <Badge variant="emerald">Rail Fence</Badge>
              <Badge variant="amber">Columnar Transposition</Badge>
            </div>
          </div>
        </Card>
      ) : filteredMessages.length === 0 ? (
        <Card title="No Filter Matches" icon={Search}>
          <div className="empty-placeholder" style={{ padding: '3rem 1.5rem' }}>
            <div className="empty-placeholder-icon">
              <Search size={24} />
            </div>
            <div className="empty-placeholder-title">No Messages Match Criteria</div>
            <p className="empty-placeholder-desc">
              No messages found matching query "<strong>{searchQuery}</strong>" (Filter: {statusFilter}).
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
              className="refresh-btn"
              style={{ margin: '0 auto', padding: '0.5rem 1rem' }}
            >
              Reset Filters
            </button>
          </div>
        </Card>
      ) : (
        <Card
          title={`Inbound Ciphertexts (${filteredMessages.length}${filteredMessages.length !== pagination.total ? ` of ${pagination.total}` : ''})`}
          icon={Inbox}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant="emerald">{pagination.total} Total in DB</Badge>
            </div>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="spec-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Sender</th>
                  <th>Cipher Algorithm</th>
                  <th>Ciphertext Preview</th>
                  <th>Status</th>
                  <th>Sent Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                      #{msg.id}
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: '#fff' }}>{msg.sender_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {msg.sender_email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getAlgorithmBadgeVariant(msg.algorithm)}>
                        {getAlgorithmDisplayName(msg.algorithm)}
                      </Badge>
                    </td>
                    <td>
                      <code
                        style={{
                          background: 'rgba(0,0,0,0.35)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          color: 'var(--accent-cyan)',
                          maxWidth: '220px',
                          display: 'inline-block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          border: '1px solid var(--border-subtle)',
                        }}
                        title={msg.ciphertext}
                      >
                        {msg.ciphertext}
                      </code>
                    </td>
                    <td>
                      <Badge variant={msg.status === 'DECRYPTED' ? 'emerald' : 'indigo'}>
                        {msg.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {msg.created_at}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => setActiveMessage(msg)}
                          className="refresh-btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          title={msg.status === 'DECRYPTED' ? 'Read deciphered message' : 'Decrypt message payload with key'}
                          id={`open-message-${msg.id}-btn`}
                        >
                          {msg.status === 'DECRYPTED' ? (
                            <Unlock size={12} color="var(--accent-emerald)" />
                          ) : (
                            <Lock size={12} color="var(--accent-cyan)" />
                          )}
                          <span>{msg.status === 'DECRYPTED' ? 'Read' : 'Decrypt'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMessageToDelete(msg)}
                          className="refresh-btn"
                          style={{
                            padding: '4px 8px',
                            color: 'var(--accent-rose)',
                            borderColor: 'rgba(244, 63, 94, 0.25)',
                          }}
                          title="Delete message from SQLite"
                          id={`delete-message-${msg.id}-btn`}
                          aria-label={`Delete message #${msg.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Showing page <strong style={{ color: '#fff' }}>{pagination.page}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{pagination.totalPages}</strong> ({pagination.total} records in database)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={!pagination.hasPrevPage || isLoading}
                className="refresh-btn"
                style={{ padding: '0.4rem 0.8rem' }}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage || isLoading}
                className="refresh-btn"
                style={{ padding: '0.4rem 0.8rem' }}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Receiver Message Reading & Decryption Modal */}
      {activeMessage && (
        <MessageReaderModal
          message={activeMessage}
          onClose={() => setActiveMessage(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      {/* Message Deletion Confirmation Modal */}
      {messageToDelete && (
        <DeleteConfirmationModal
          message={messageToDelete}
          isOpen={Boolean(messageToDelete)}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setMessageToDelete(null)}
        />
      )}
    </div>
  );
}

export default InboxPage;
