import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDemoUser } from '../context/DemoUserContext.jsx';
import { encryptText } from '../api/cipher.api.js';
import { createMessage } from '../api/message.api.js';
import { 
  PenSquare, 
  Lock, 
  Send, 
  Key, 
  Copy, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

const ALGORITHMS = [
  {
    id: 'caesar',
    name: 'Caesar Shift Cipher',
    category: 'Substitution',
    defaultKey: 3,
    badgeVariant: 'cyan',
    description: 'Monoalphabetic shift cipher rotating letters through the alphabet. Preserves casing, spaces, digits, and punctuation.',
    keyLabel: 'Shift Offset (0 - 25)',
    keyType: 'number',
    keyPlaceholder: '3',
    minKey: 0,
    maxKey: 25,
  },
  {
    id: 'playfair',
    name: 'Playfair 5×5 Matrix Cipher',
    category: 'Polygraphic',
    defaultKey: 'MONARCHY',
    badgeVariant: 'indigo',
    description: 'Polygraphic substitution using a 5×5 key matrix with I/J combined. Repeated digraph letters are separated by X; odd lengths are padded with X.',
    keyLabel: 'Matrix Keyword',
    keyType: 'text',
    keyPlaceholder: 'e.g. MONARCHY, SECRET',
  },
  {
    id: 'rail_fence',
    name: 'Rail Fence Zigzag Cipher',
    category: 'Transposition',
    defaultKey: 3,
    badgeVariant: 'emerald',
    description: 'Transposition cipher writing characters along successive zigzag rails. Preserves all spaces, punctuation, casing, and symbols.',
    keyLabel: 'Number of Rails (Depth ≥ 2)',
    keyType: 'number',
    keyPlaceholder: '3',
    minKey: 2,
    maxKey: 20,
  },
  {
    id: 'columnar_transposition',
    name: 'Row-Columnar Transposition',
    category: 'Transposition',
    defaultKey: 'ZEBRA',
    badgeVariant: 'amber',
    description: 'Row-by-row transposition ranking columns alphabetically by keyword. Duplicate key letters break ties by original position. Incomplete final rows are handled without artificial padding.',
    keyLabel: 'Columnar Keyword',
    keyType: 'text',
    keyPlaceholder: 'e.g. ZEBRA, GERMAN',
  },
];

export function ComposePage() {
  const { users, currentUser } = useDemoUser();

  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [algorithm, setAlgorithm] = useState('caesar');
  const [key, setKey] = useState(3);
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Synchronize sender with currentUser, and default receiver to the other user
  useEffect(() => {
    if (currentUser?.id) {
      setSenderId(currentUser.id);
      const other = users.find((u) => u.id !== currentUser.id);
      if (other) {
        setReceiverId(other.id);
      }
    } else if (users.length >= 2) {
      setSenderId(users[0].id);
      setReceiverId(users[1].id);
    }
  }, [currentUser?.id, users]);

  // When algorithm changes, update key to default for that algorithm and clear ciphertext
  const handleAlgorithmChange = (algoId) => {
    setAlgorithm(algoId);
    const selected = ALGORITHMS.find((a) => a.id === algoId);
    if (selected) {
      setKey(selected.defaultKey);
    }
    setCiphertext('');
    setError(null);
  };

  const currentAlgoConfig = ALGORITHMS.find((a) => a.id === algorithm) || ALGORITHMS[0];

  // Validation function
  const validateForm = () => {
    if (!senderId || !receiverId) {
      throw new Error('Please select both a sender and a receiver.');
    }
    if (Number(senderId) === Number(receiverId)) {
      throw new Error('Sender and receiver must be different demonstration identities.');
    }
    if (!plaintext || plaintext.trim().length === 0) {
      throw new Error('Please enter plaintext message content to encrypt.');
    }
    if (key === null || key === undefined || (typeof key === 'string' && key.trim().length === 0)) {
      throw new Error('Please provide an encryption key for the selected cipher.');
    }

    if (algorithm === 'caesar') {
      const num = Number(key);
      if (isNaN(num) || num < 0 || num > 25 || !Number.isInteger(num)) {
        throw new Error('Caesar cipher key must be an integer between 0 and 25.');
      }
    } else if (algorithm === 'rail_fence') {
      const num = Number(key);
      if (isNaN(num) || num < 2 || !Number.isInteger(num)) {
        throw new Error('Rail Fence cipher key must be an integer greater than or equal to 2.');
      }
    } else if (algorithm === 'playfair' || algorithm === 'columnar_transposition') {
      if (typeof key !== 'string' || key.trim().length === 0) {
        throw new Error('Keyword must contain at least one valid character.');
      }
    }
  };

  // Encrypt action
  const handleEncrypt = async () => {
    setError(null);
    setSuccessData(null);
    try {
      validateForm();
      setIsEncrypting(true);

      const result = await encryptText(algorithm, plaintext, key);
      setCiphertext(result.ciphertext);
    } catch (err) {
      setError(err.message || 'Encryption failed.');
    } finally {
      setIsEncrypting(false);
    }
  };

  // Send message action
  const handleSendMessage = async () => {
    setError(null);
    setSuccessData(null);
    try {
      // If ciphertext has not yet been generated, encrypt first
      let activeCiphertext = ciphertext;
      if (!activeCiphertext) {
        validateForm();
        setIsEncrypting(true);
        const result = await encryptText(algorithm, plaintext, key);
        activeCiphertext = result.ciphertext;
        setCiphertext(result.ciphertext);
        setIsEncrypting(false);
      }

      if (Number(senderId) === Number(receiverId)) {
        throw new Error('Sender and receiver must be different demonstration identities.');
      }

      setIsSending(true);

      // Transmit ONLY ciphertext, senderId, receiverId, algorithm
      // Plaintext and encryption key are NEVER sent to create-message endpoint
      const created = await createMessage({
        senderId: Number(senderId),
        receiverId: Number(receiverId),
        algorithm,
        ciphertext: activeCiphertext,
      });

      setSuccessData(created);
      // Clear inputs for next dispatch
      setPlaintext('');
      setCiphertext('');
    } catch (err) {
      setError(err.message || 'Failed to dispatch encrypted message.');
    } finally {
      setIsSending(false);
      setIsEncrypting(false);
    }
  };

  // Copy ciphertext action
  const handleCopyCiphertext = async () => {
    if (!ciphertext) return;
    try {
      await navigator.clipboard.writeText(ciphertext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Reset action
  const handleReset = () => {
    setPlaintext('');
    setCiphertext('');
    setError(null);
    setSuccessData(null);
    setKey(currentAlgoConfig.defaultKey);
  };

  const senderUser = users.find((u) => u.id === Number(senderId));
  const receiverUser = users.find((u) => u.id === Number(receiverId));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          <PenSquare size={28} style={{ color: 'var(--accent-cyan)' }} />
          Compose Encrypted Message
        </h1>
        <p className="page-description">
          Encrypt internal communications using classical cryptography algorithms before persistent dispatch.
        </p>
      </div>

      {/* Success Notification Alert */}
      {successData && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <CheckCircle2 size={24} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Transmission Confirmed #{successData.id}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Ciphertext was securely persisted to SQLite with status{' '}
              <strong style={{ color: 'var(--accent-emerald)' }}>{successData.status}</strong> for recipient{' '}
              <strong style={{ color: '#fff' }}>{successData.receiver_name}</strong> ({successData.receiver_email}). Plaintext and encryption keys were not saved.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to="/sent"
                className="refresh-btn"
                style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'var(--accent-emerald)', color: '#fff', padding: '0.45rem 0.9rem', textDecoration: 'none' }}
              >
                <span>View in Sent Ledger</span>
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="refresh-btn"
                style={{ padding: '0.45rem 0.9rem' }}
              >
                Compose Another Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Notification Alert */}
      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fb7185',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Cipher Preview Right */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Compose Form */}
        <Card title="Message Configuration" icon={Lock}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Sender & Receiver Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                  Sender (From)
                </label>
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                  }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                  Recipient (To)
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                  }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Algorithm Selector Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                Classical Cipher Algorithm
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {ALGORITHMS.map((algo) => {
                  const isSelected = algorithm === algo.id;
                  return (
                    <button
                      key={algo.id}
                      type="button"
                      onClick={() => handleAlgorithmChange(algo.id)}
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                          {algo.name}
                        </span>
                        <Badge variant={algo.badgeVariant}>{algo.category}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Algorithm Instructions */}
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.25rem' }}>
                <Info size={14} />
                <span>{currentAlgoConfig.name} Protocol</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                {currentAlgoConfig.description}
              </p>
            </div>

            {/* Dynamic Key Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  {currentAlgoConfig.keyLabel}
                </label>
                {algorithm === 'caesar' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    Shift: {key}
                  </span>
                )}
              </div>

              {currentAlgoConfig.keyType === 'number' ? (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min={currentAlgoConfig.minKey}
                    max={currentAlgoConfig.maxKey}
                    value={key}
                    onChange={(e) => setKey(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={currentAlgoConfig.keyPlaceholder}
                    style={{
                      width: '90px',
                      padding: '0.7rem 0.9rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                    }}
                  />
                  {algorithm === 'caesar' && (
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={key || 0}
                      onChange={(e) => setKey(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder={currentAlgoConfig.keyPlaceholder}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                  }}
                />
              )}
            </div>

            {/* Plaintext Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Plaintext Payload
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {plaintext.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={plaintext}
                onChange={(e) => {
                  setPlaintext(e.target.value);
                  setCiphertext(''); // Invalidate old ciphertext on text change
                }}
                placeholder="Type your confidential internal message here..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleEncrypt}
                disabled={isEncrypting || isSending}
                className="refresh-btn"
                style={{
                  padding: '0.7rem 1.4rem',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))',
                  borderColor: 'var(--accent-cyan)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
              >
                <Lock size={15} style={{ animation: isEncrypting ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isEncrypting ? 'Encrypting...' : '1. Encrypt Payload'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSending || isEncrypting}
                className="refresh-btn"
                style={{
                  padding: '0.7rem 1.4rem',
                  background: ciphertext
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3))'
                    : 'rgba(255,255,255,0.05)',
                  borderColor: ciphertext ? 'var(--accent-emerald)' : 'var(--border-subtle)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
              >
                <Send size={15} style={{ animation: isSending ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSending ? 'Transmitting...' : '2. Send Message'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="refresh-btn"
                style={{ padding: '0.7rem 1rem', marginLeft: 'auto' }}
                title="Clear all fields"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

          </div>
        </Card>

        {/* Right Column: Resulting Ciphertext Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card
            title="Generated Ciphertext"
            icon={Key}
            action={
              ciphertext ? (
                <Badge variant={currentAlgoConfig.badgeVariant}>
                  {ciphertext.length} Chars Encrypted
                </Badge>
              ) : (
                <Badge variant="muted">Awaiting Encryption</Badge>
              )
            }
          >
            {ciphertext ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Encrypted Payload (Ready for Dispatch)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCiphertext}
                    className="refresh-btn"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy Ciphertext'}</span>
                  </button>
                </div>

                {/* Crypto terminal output container */}
                <pre
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    minHeight: '140px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                  }}
                >
                  {ciphertext}
                </pre>

                {/* Dispatch Specs Summary */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sender:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{senderUser?.name} ({senderUser?.email})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Recipient:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{receiverUser?.name} ({receiverUser?.email})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cipher Algorithm:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{algorithm}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Persistence Payload:</span>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Ciphertext Only (Zero Plaintext Stored)</span>
                  </div>
                </div>

                {/* Send action CTA */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isSending}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send size={16} style={{ animation: isSending ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isSending ? 'Transmitting to SQLite...' : 'Dispatch Message to Recipient'}</span>
                </button>
              </div>
            ) : (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                <div className="empty-placeholder-icon">
                  <Lock size={26} />
                </div>
                <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.35rem' }}>
                  No Ciphertext Generated
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 1.25rem' }}>
                  Enter your plaintext and encryption key on the left, then click <strong>Encrypt Payload</strong> to preview the resulting ciphertext here before transmission.
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  🔒 Cryptographic Security Guarantee: Only the ciphertext output will be transmitted to the database.
                </div>
              </div>
            )}
          </Card>

          {/* Cryptographic Architecture Card */}
          <div style={{ padding: '1.25rem', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <span>Two-Stage Cryptographic Pipeline</span>
            </div>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.7, margin: 0 }}>
              <li><strong>Local Encryption Call:</strong> Invokes <code>POST /api/v1/cipher/:algorithm/encrypt</code> to transform plaintext into ciphertext.</li>
              <li><strong>Zero-Plaintext Dispatch:</strong> Sends only <code>&#123; senderId, receiverId, algorithm, ciphertext &#125;</code> to <code>POST /api/v1/messages</code>.</li>
              <li><strong>Persistent Storage:</strong> SQLite stores ciphertext with status <code>SENT</code> without storing keys or plaintext.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComposePage;
