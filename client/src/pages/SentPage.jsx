import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDemoUser } from '../context/DemoUserContext.jsx';
import { fetchSentMessages, deleteMessage } from '../api/message.api.js';
import { 
  Send, 
  RefreshCw, 
  AlertCircle, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  UserCheck,
  CheckCircle2,
  Trash2,
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  Clock,
  User,
  Layers,
  ArrowRight
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal.jsx';

export function SentPage() {
  const { currentUser } = useDemoUser();

  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [algorithmFilter, setAlgorithmFilter] = useState('ALL');

  // Modals state
  const [activeMessage, setActiveMessage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [copiedCiphertext, setCopiedCiphertext] = useState(false);

  const loadSent = useCallback(async (targetPage = page) => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchSentMessages(currentUser.id, { page: targetPage, limit: 10 });
      setMessages(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('[SentPage] Failed to fetch sent messages:', err);
      setError(err.message || 'Unable to retrieve sent messages from API.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, page]);

  // Reset to page 1 on user change
  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    loadSent(1);
  }, [currentUser?.id]);

  // Load when page number changes
  useEffect(() => {
    loadSent(page);
  }, [page, loadSent]);

  const handleNextPage = () => {
    if (pagination.hasNextPage) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) setPage((p) => Math.max(1, p - 1));
  };

  const handleDeleteConfirm = async (id) => {
    setIsDeleting(true);
    try {
      await deleteMessage(id);
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
      console.error('[SentPage] Failed to delete message:', err);
      setError(`Failed to delete message: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyCiphertext = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCiphertext(true);
      setTimeout(() => setCopiedCiphertext(false), 2000);
    } catch (err) {
      console.error('Failed to copy ciphertext:', err);
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
      case 'caesar': return 'Caesar Shift';
      case 'playfair': return 'Playfair 5×5';
      case 'rail_fence': return 'Rail Fence';
      case 'columnar_transposition': return 'Row-Columnar';
      default: return algorithm?.toUpperCase() || 'UNKNOWN';
    }
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (algorithmFilter !== 'ALL' && msg.algorithm !== algorithmFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(msg.id).includes(q) ||
        msg.receiver_name?.toLowerCase().includes(q) ||
        msg.receiver_email?.toLowerCase().includes(q) ||
        msg.algorithm?.toLowerCase().includes(q) ||
        msg.ciphertext?.toLowerCase().includes(q)
      );
    });
  }, [messages, searchQuery, algorithmFilter]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <Send size={28} style={{ color: 'var(--accent-emerald)' }} />
            Sent Message Ledger
          </h1>
          <p className="page-description">
            Audit history of encrypted dispatches sent by{' '}
            <strong style={{ color: '#fff' }}>{currentUser ? currentUser.name : '...'}</strong> ({currentUser?.email}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSent(page)}
          disabled={isLoading}
          className="refresh-btn"
          style={{ padding: '0.5rem 0.9rem' }}
          title="Refresh sent messages from API"
          id="reload-sent-btn"
        >
          <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Reload Ledger</span>
        </button>
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

      {/* Search and Algorithm Filter Bar */}
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
              id="sent-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipient, algorithm, ciphertext, or ID..."
              aria-label="Search sent messages"
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

        {/* Algorithm Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <SlidersHorizontal size={13} /> Algorithm:
          </span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'caesar', label: 'Caesar' },
            { id: 'playfair', label: 'Playfair' },
            { id: 'rail_fence', label: 'Rail Fence' },
            { id: 'columnar_transposition', label: 'Columnar' },
          ].map((alg) => (
            <button
              key={alg.id}
              type="button"
              onClick={() => setAlgorithmFilter(alg.id)}
              className="refresh-btn"
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                background: algorithmFilter === alg.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: algorithmFilter === alg.id ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                color: algorithmFilter === alg.id ? '#fff' : 'var(--text-muted)',
              }}
            >
              {alg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <Card title="Querying Sent Messages..." icon={RefreshCw}>
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-emerald)', margin: '0 auto 1rem' }} />
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.35rem' }}>
              Fetching Dispatched Records from SQLite
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Querying GET /api/v1/messages/sent/{currentUser?.id}...
            </p>
          </div>
        </Card>
      ) : error ? (
        <Card title="API Query Error" icon={AlertCircle}>
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Failed to Load Sent Messages</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => loadSent(page)}
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
          title="Dispatched Message Ledger"
          icon={Send}
          action={<Badge variant="muted">0 Messages</Badge>}
        >
          <div className="empty-placeholder">
            <div className="empty-placeholder-icon">
              <Send size={28} />
            </div>
            <div className="empty-placeholder-title">No Sent Messages from {currentUser?.name}</div>
            <p className="empty-placeholder-desc">
              No encrypted messages have been dispatched by user ID{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{currentUser?.id}</span> yet.
            </p>
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
              No messages found matching query "<strong>{searchQuery}</strong>" (Algorithm: {algorithmFilter}).
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setAlgorithmFilter('ALL'); }}
              className="refresh-btn"
              style={{ margin: '0 auto', padding: '0.5rem 1rem' }}
            >
              Reset Filters
            </button>
          </div>
        </Card>
      ) : (
        <Card
          title={`Dispatched Ciphertexts (${filteredMessages.length}${filteredMessages.length !== pagination.total ? ` of ${pagination.total}` : ''})`}
          icon={Send}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant="emerald">{pagination.total} Total Dispatched</Badge>
            </div>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="spec-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Recipient Details</th>
                  <th>Algorithm Label</th>
                  <th>Ciphertext Preview</th>
                  <th>Delivery Status</th>
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
                        <strong style={{ color: '#fff' }}>{msg.receiver_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {msg.receiver_email}
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
                          title="Inspect full cryptographic transmission metadata"
                          id={`inspect-sent-${msg.id}-btn`}
                        >
                          <Eye size={12} />
                          <span>Details</span>
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
                          id={`delete-sent-${msg.id}-btn`}
                          aria-label={`Delete sent message #${msg.id}`}
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

      {/* Message Details Inspection Modal */}
      {activeMessage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
          }}
          onClick={() => setActiveMessage(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '580px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
              padding: '1.75rem',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sent-details-modal-title"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="var(--accent-emerald)" />
                <h3 id="sent-details-modal-title" style={{ fontSize: '1.1rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                  Dispatched Message Details #{activeMessage.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMessage(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close message details"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              {/* Sender & Receiver Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Sender</span>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{activeMessage.sender_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{activeMessage.sender_email}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Recipient</span>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{activeMessage.receiver_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{activeMessage.receiver_email}</div>
                </div>
              </div>

              {/* Algorithm & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Algorithm</span>
                  <div>
                    <Badge variant={getAlgorithmBadgeVariant(activeMessage.algorithm)}>
                      {getAlgorithmDisplayName(activeMessage.algorithm)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Delivery Status</span>
                  <div>
                    <Badge variant={activeMessage.status === 'DECRYPTED' ? 'emerald' : 'indigo'}>
                      {activeMessage.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Persisted Ciphertext */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Persisted Ciphertext ({activeMessage.ciphertext?.length} chars)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCiphertext(activeMessage.ciphertext)}
                    className="refresh-btn"
                    style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                  >
                    {copiedCiphertext ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                    <span>{copiedCiphertext ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    maxHeight: '140px',
                    overflowY: 'auto',
                  }}
                >
                  {activeMessage.ciphertext}
                </pre>
              </div>

              {/* Timestamps */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Created: {activeMessage.created_at}</span>
                <span>Updated: {activeMessage.updated_at}</span>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = activeMessage;
                    setActiveMessage(null);
                    setMessageToDelete(toDelete);
                  }}
                  className="btn-danger"
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: 'var(--accent-rose)',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete Message</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMessage(null)}
                  className="refresh-btn"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
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

export default SentPage;
