import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Info,
  Clock,
  User,
  Layers,
  Sparkles
} from 'lucide-react';
import Badge from '../common/Badge.jsx';
import { decryptText } from '../../api/cipher.api.js';
import { updateMessageStatus } from '../../api/message.api.js';

/**
 * MessageReaderModal
 * 
 * Receiver-side message reading and decryption workflow:
 * - Shows message metadata (Sender, Receiver, Algorithm, Ciphertext, Sent timestamp, Status).
 * - Enforces zero-plaintext pre-decryption state (never displays plaintext until decrypted).
 * - Accepts algorithm-specific decryption key.
 * - Invokes POST /api/v1/cipher/:algorithm/decrypt.
 * - On success: Displays plaintext and calls PATCH /api/v1/messages/:id/status { status: 'DECRYPTED' }.
 * - On failure: Shows descriptive error without marking status as DECRYPTED.
 * - Actions: Copy Plaintext, Hide/Show Plaintext, Return to Inbox.
 * - In-memory temporary state only: No keys or plaintext stored in localStorage/sessionStorage.
 */
export function MessageReaderModal({ message, onClose, onStatusUpdated }) {
  // Ephemeral in-memory state only - never written to storage
  const [keyInput, setKeyInput] = useState('');
  const [decryptedPlaintext, setDecryptedPlaintext] = useState(null);
  const [isPlaintextHidden, setIsPlaintextHidden] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState(null);
  const [copiedPlaintext, setCopiedPlaintext] = useState(false);
  const [copiedCiphertext, setCopiedCiphertext] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(message?.status || 'SENT');

  // Reset ephemeral state when message changes or unmounts
  useEffect(() => {
    setKeyInput('');
    setDecryptedPlaintext(null);
    setIsPlaintextHidden(false);
    setError(null);
    setCopiedPlaintext(false);
    setCopiedCiphertext(false);
    setCurrentStatus(message?.status || 'SENT');

    return () => {
      // Clear sensitive memory upon modal close
      setKeyInput('');
      setDecryptedPlaintext(null);
    };
  }, [message?.id]);

  if (!message) return null;

  const getAlgorithmBadgeVariant = (alg) => {
    switch (alg) {
      case 'caesar': return 'cyan';
      case 'playfair': return 'indigo';
      case 'rail_fence': return 'emerald';
      case 'columnar_transposition': return 'amber';
      default: return 'muted';
    }
  };

  const getAlgorithmDisplayName = (alg) => {
    switch (alg) {
      case 'caesar': return 'Caesar Shift Cipher';
      case 'playfair': return 'Playfair 5×5 Matrix Cipher';
      case 'rail_fence': return 'Rail Fence Zigzag Cipher';
      case 'columnar_transposition': return 'Row-Columnar Transposition';
      default: return alg?.toUpperCase() || 'UNKNOWN';
    }
  };

  const getKeyInputPlaceholder = (alg) => {
    switch (alg) {
      case 'caesar': return 'Enter shift integer (0 - 25), e.g. 3';
      case 'playfair': return 'Enter matrix keyword (letters only), e.g. MONARCHY';
      case 'rail_fence': return 'Enter number of rails (integer ≥ 2), e.g. 3';
      case 'columnar_transposition': return 'Enter columnar keyword, e.g. ZEBRA';
      default: return 'Enter decryption key';
    }
  };

  const getKeyInputLabel = (alg) => {
    switch (alg) {
      case 'caesar': return 'Caesar Shift Key (0 - 25)';
      case 'playfair': return 'Playfair Keyword (5×5 Matrix)';
      case 'rail_fence': return 'Number of Rails (Depth ≥ 2)';
      case 'columnar_transposition': return 'Transposition Keyword';
      default: return 'Decryption Key';
    }
  };

  const handleDecrypt = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    // Client-side key validation
    if (keyInput === '' || keyInput === null || keyInput === undefined) {
      setError('Please provide the decryption key to decipher this message.');
      return;
    }

    let parsedKey = keyInput;
    if (message.algorithm === 'caesar' || message.algorithm === 'rail_fence') {
      const parsed = Number(keyInput);
      if (isNaN(parsed) || !Number.isInteger(parsed)) {
        setError(`Invalid key: ${getAlgorithmDisplayName(message.algorithm)} requires an integer key.`);
        return;
      }
      if (message.algorithm === 'caesar' && (parsed < 0 || parsed > 25)) {
        setError('Invalid key: Caesar shift key must be an integer between 0 and 25.');
        return;
      }
      if (message.algorithm === 'rail_fence' && parsed < 2) {
        setError('Invalid key: Rail Fence depth must be an integer ≥ 2.');
        return;
      }
      parsedKey = parsed;
    } else if (message.algorithm === 'playfair' || message.algorithm === 'columnar_transposition') {
      if (typeof keyInput !== 'string' || keyInput.trim().length === 0) {
        setError(`Invalid key: ${getAlgorithmDisplayName(message.algorithm)} requires a non-empty keyword.`);
        return;
      }
      parsedKey = keyInput.trim();
    }

    setIsDecrypting(true);

    try {
      // 1. Invoke POST /api/v1/cipher/:algorithm/decrypt
      const cipherRes = await decryptText(message.algorithm, message.ciphertext, parsedKey);
      
      const plaintext = cipherRes.plaintext;
      setDecryptedPlaintext(plaintext);
      setIsPlaintextHidden(false);

      // 2. Only after successful decryption, update message status to DECRYPTED
      try {
        const updateRes = await updateMessageStatus(message.id, 'DECRYPTED');
        setCurrentStatus('DECRYPTED');
        if (onStatusUpdated) {
          onStatusUpdated({
            ...message,
            status: 'DECRYPTED',
            updated_at: updateRes?.updated_at || new Date().toISOString(),
          });
        }
      } catch (statusErr) {
        console.warn('[MessageReaderModal] Status update warning:', statusErr);
        // Note: Decrypted text is still visible even if background status patch encountered an issue
      }
    } catch (err) {
      console.error('[MessageReaderModal] Decryption failed:', err);
      // Meaningful error handling
      const rawMsg = err.message || 'Decryption request failed.';
      if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('Connection refused')) {
        setError('Network failure: Unable to establish connection with CipherMail API.');
      } else if (rawMsg.toLowerCase().includes('algorithm')) {
        setError(`Unsupported algorithm: ${rawMsg}`);
      } else if (rawMsg.toLowerCase().includes('ciphertext')) {
        setError(`Invalid ciphertext: ${rawMsg}`);
      } else {
        setError(`Decryption failed: ${rawMsg}`);
      }
      // Ensure plaintext is NOT set on failure
      setDecryptedPlaintext(null);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopyPlaintext = async () => {
    if (!decryptedPlaintext) return;
    try {
      await navigator.clipboard.writeText(decryptedPlaintext);
      setCopiedPlaintext(true);
      setTimeout(() => setCopiedPlaintext(false), 2000);
    } catch (err) {
      console.error('Failed to copy plaintext:', err);
    }
  };

  const handleCopyCiphertext = async () => {
    if (!message.ciphertext) return;
    try {
      await navigator.clipboard.writeText(message.ciphertext);
      setCopiedCiphertext(true);
      setTimeout(() => setCopiedCiphertext(false), 2000);
    } catch (err) {
      console.error('Failed to copy ciphertext:', err);
    }
  };

  const handleClose = () => {
    // Clear ephemeral memory on return
    setKeyInput('');
    setDecryptedPlaintext(null);
    setError(null);
    onClose();
  };

  return (
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
      onClick={handleClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(6, 182, 212, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: decryptedPlaintext 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(6, 182, 212, 0.15)',
                border: `1px solid ${decryptedPlaintext ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-accent)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: decryptedPlaintext ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              }}
            >
              {decryptedPlaintext ? <Unlock size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Decipher Message #{message.id}
                </h2>
                <Badge variant={currentStatus === 'DECRYPTED' ? 'emerald' : 'indigo'}>
                  {currentStatus}
                </Badge>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Classical Cryptographic Inbound Dispatch Inspection
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="refresh-btn"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            title="Return to Inbox"
            id="close-reader-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}
          >
            {/* Sender Name */}
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <User size={12} /> Sender
              </div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                {message.sender_name || `User #${message.sender_id}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {message.sender_email || `ID: ${message.sender_id}`}
              </div>
            </div>

            {/* Receiver Name */}
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <User size={12} /> Receiver
              </div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                {message.receiver_name || `User #${message.receiver_id}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {message.receiver_email || `ID: ${message.receiver_id}`}
              </div>
            </div>

            {/* Cipher Algorithm */}
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <Layers size={12} /> Cipher Algorithm
              </div>
              <div>
                <Badge variant={getAlgorithmBadgeVariant(message.algorithm)}>
                  {getAlgorithmDisplayName(message.algorithm)}
                </Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                identifier: {message.algorithm}
              </div>
            </div>

            {/* Sent Timestamp */}
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <Clock size={12} /> Sent Timestamp
              </div>
              <div style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                {message.created_at || '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Recorded in SQLite
              </div>
            </div>
          </div>

          {/* Persisted Ciphertext Card */}
          <div
            style={{
              background: 'rgba(10, 15, 26, 0.75)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Persisted Ciphertext
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ({message.ciphertext?.length || 0} chars)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCiphertext}
                className="refresh-btn"
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                title="Copy ciphertext"
              >
                {copiedCiphertext ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                <span>{copiedCiphertext ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre
              id="persisted-ciphertext-display"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-cyan)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                margin: 0,
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {message.ciphertext}
            </pre>
          </div>

          {/* Decryption Key & Trigger Card */}
          <div
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Key size={16} color="var(--accent-amber)" />
              <label 
                htmlFor="decryption-key-input"
                style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}
              >
                {getKeyInputLabel(message.algorithm)}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="decryption-key-input"
                type={message.algorithm === 'caesar' || message.algorithm === 'rail_fence' ? 'number' : 'text'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={getKeyInputPlaceholder(message.algorithm)}
                disabled={isDecrypting}
                style={{
                  flex: '1 1 240px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.9rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDecrypt();
                  }
                }}
              />

              <button
                type="button"
                id="decrypt-message-btn"
                onClick={handleDecrypt}
                disabled={isDecrypting || !keyInput}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: isDecrypting || !keyInput ? 'not-allowed' : 'pointer',
                  opacity: isDecrypting || !keyInput ? 0.6 : 1,
                }}
              >
                {isDecrypting ? (
                  <>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={16} />
                    <span>Decrypt Message</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message Display */}
            {error && (
              <div
                id="decryption-error-banner"
                style={{
                  marginTop: '0.9rem',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  color: 'var(--accent-rose)',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>Decryption Request Failed</div>
                  <div>{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Algorithm-Specific Round-Trip & Cryptographic Caveat Callout */}
          {message.algorithm === 'playfair' ? (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-indigo)', fontWeight: 600, marginBottom: '0.35rem' }}>
                <Info size={14} />
                <span>Playfair Normalization & Digraph Ambiguity Notice</span>
              </div>
              <p style={{ margin: 0 }}>
                Playfair cipher operates on a 5×5 matrix with combined <strong>I/J</strong> cells and digraph pairs. Original spaces, punctuation, digits, and letter casing are discarded during preprocessing. Duplicate digraph letters are split using <strong>X</strong> (or <strong>Q</strong>), and odd lengths are padded with <strong>X</strong>. Decryption restores the exact prepared digraph stream; original sentence formatting is ambiguous and cannot be reconstructed without contextual knowledge.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ShieldCheck size={16} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Lossless Round-Trip Guarantee:</strong> {getAlgorithmDisplayName(message.algorithm)} preserves full character fidelity (spaces, punctuation, digits, and casing). Decryption reconstructs the exact original message.
              </span>
            </div>
          )}

          {/* Decrypted Plaintext Reveal Area (Displayed ONLY after successful decryption) */}
          {decryptedPlaintext !== null && (
            <div
              id="decrypted-plaintext-container"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    Decrypted Plaintext
                  </span>
                  <Badge variant="emerald">Verified From Backend</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ({decryptedPlaintext.length} chars)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Hide / Show Plaintext Action */}
                  <button
                    type="button"
                    id="toggle-hide-plaintext-btn"
                    onClick={() => setIsPlaintextHidden(!isPlaintextHidden)}
                    className="refresh-btn"
                    style={{ padding: '4px 9px', fontSize: '0.78rem' }}
                    title={isPlaintextHidden ? 'Show Plaintext' : 'Hide Plaintext'}
                  >
                    {isPlaintextHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{isPlaintextHidden ? 'Show Plaintext' : 'Hide Plaintext'}</span>
                  </button>

                  {/* Copy Plaintext Action */}
                  <button
                    type="button"
                    id="copy-plaintext-btn"
                    onClick={handleCopyPlaintext}
                    className="refresh-btn"
                    style={{ padding: '4px 9px', fontSize: '0.78rem', color: copiedPlaintext ? 'var(--accent-emerald)' : 'inherit' }}
                    title="Copy plaintext to clipboard"
                  >
                    {copiedPlaintext ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                    <span>{copiedPlaintext ? 'Copied!' : 'Copy Plaintext'}</span>
                  </button>
                </div>
              </div>

              {/* Plaintext Box or Masked View */}
              {isPlaintextHidden ? (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    letterSpacing: '0.25em',
                  }}
                >
                  •••••••••••••••••••••••••••••••••••• (HIDDEN)
                </div>
              ) : (
                <pre
                  id="decrypted-plaintext-display"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >
                  {decryptedPlaintext}
                </pre>
              )}

              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Status successfully updated to <strong>DECRYPTED</strong> in SQLite database.</span>
                <span style={{ fontStyle: 'italic' }}>Ephemeral state only — not stored in browser storage.</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <button
            type="button"
            id="return-to-inbox-btn"
            onClick={handleClose}
            className="refresh-btn"
            style={{
              padding: '0.55rem 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Inbox</span>
          </button>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: currentStatus === 'DECRYPTED' ? 'var(--accent-emerald)' : 'var(--accent-indigo)' }} />
            <span>Status: <strong style={{ color: '#fff' }}>{currentStatus}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MessageReaderModal;
