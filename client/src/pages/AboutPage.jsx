import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Info, 
  Shield, 
  Server, 
  Database, 
  Lock, 
  Code, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  Key
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

export function AboutPage() {
  const { status, healthData } = useOutletContext();
  const isOnline = status === 'online';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Info size={28} style={{ color: 'var(--accent-cyan)' }} />
          Information Security Lab Guide & Specifications
        </h1>
        <p className="page-description">
          Comprehensive cryptographic reference, architecture documentation, algorithm notes, and lab viva preparation.
        </p>
      </div>

      {/* Prominent Lab Disclaimer Banner */}
      <div
        className="foundation-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(244, 63, 94, 0.08))',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          marginBottom: '2rem',
        }}
      >
        <div className="foundation-banner-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
          <AlertTriangle size={22} />
        </div>
        <div className="foundation-banner-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ color: '#fff', margin: 0 }}>Information Security Coursework & Demonstration Disclaimer</h3>
            <Badge variant="amber">Pedagogical Demonstration</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            All four classical ciphers implemented in CipherMail (Caesar Shift, Playfair 5×5 Matrix, Rail Fence Zigzag, and Row-Columnar Transposition) are designed exclusively for educational instruction in classical cryptanalysis, mathematical permutation, and substitution. <strong>They lack computational security and are trivially breakable using frequency analysis, brute force, or anagramming. They must never be used for protecting real confidential information.</strong>
          </p>
        </div>
      </div>

      {/* Core Educational Topic: Substitution vs. Transposition */}
      <Card title="Cryptographic Foundations: Substitution vs. Transposition" icon={Layers} style={{ marginBottom: '2rem' }}>
        <p className="card-text" style={{ marginBottom: '1.25rem' }}>
          Classical symmetric ciphers are divided into two fundamental cryptographic primitives: <strong>Substitution</strong> and <strong>Transposition</strong>. Modern block ciphers (e.g., SP-networks like AES) combine both through Shannon's principles of <em>Confusion</em> and <em>Diffusion</em>.
        </p>

        <div className="grid-2" style={{ gap: '1.25rem' }}>
          {/* Substitution Box */}
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.04)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                1. Substitution Ciphers
              </h4>
              <Badge variant="cyan">Shannon Confusion</Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Substitution replaces characters (or groups of characters) with other characters, symbols, or numbers. The <strong>identities of characters change</strong>, but their relative positions in the message stream remain sequential.
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>Caesar Cipher (Monoalphabetic):</strong> Maps each character to a fixed offset <code style={{ color: '#fff' }}>C = (P + k) mod 26</code>. Key space is limited to 26 possible shifts, rendering it vulnerable to exhaustive brute force.
              </div>
              <div>
                <strong style={{ color: 'var(--accent-indigo)' }}>Playfair Cipher (Polygraphic):</strong> Encrypts pairs of letters (digraphs) using a 5×5 key matrix. Significantly flattens single-letter frequency distribution compared to monoalphabetic substitution.
              </div>
            </div>
          </div>

          {/* Transposition Box */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                2. Transposition Ciphers
              </h4>
              <Badge variant="emerald">Shannon Diffusion</Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Transposition rearranges (permutes) the order of characters in the plaintext according to a geometric or algorithmic key. The <strong>character identities remain strictly unchanged</strong>; letter frequencies are identical, but their positional relationships are scrambled.
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong style={{ color: 'var(--accent-emerald)' }}>Rail Fence (Zigzag):</strong> Writes characters along successive diagonal rails like a fence, then reads them row-by-row. Key is the integer depth (rails ≥ 2).
              </div>
              <div>
                <strong style={{ color: 'var(--accent-amber)' }}>Row-Columnar Transposition:</strong> Writes text row-by-row into a matrix of width <code style={{ color: '#fff' }}>len(key)</code> and reads off columns ranked alphabetically by keyword characters.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lab Viva Questions & Model Answers */}
      <Card title="Information Security Lab Viva Questions & Answers" icon={HelpCircle} style={{ marginBottom: '2rem' }}>
        <p className="card-text" style={{ marginBottom: '1.25rem' }}>
          Common technical and conceptual viva questions frequently asked during Information Security laboratory examinations:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Q1 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              Q1: What is the fundamental difference between Monoalphabetic and Polygraphic ciphers?
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
              <strong>Answer:</strong> In a monoalphabetic cipher (such as Caesar), each letter in the plaintext always maps to the exact same ciphertext letter throughout the entire message, preserving the 1-to-1 letter frequency profile of the language. In a polygraphic cipher (such as Playfair), groups of letters (e.g. digraphs of 2 letters) are encrypted together as a single block. Consequently, the letter 'E' will encrypt to different ciphertext characters depending on its paired neighbor, flattening single-letter frequency distribution.
            </p>
          </div>

          {/* Q2 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              Q2: Why does Playfair combine 'I' and 'J', and how does it handle duplicate adjacent letters?
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
              <strong>Answer:</strong> The English alphabet contains 26 letters, but a symmetric square matrix must be 5×5 = 25 cells. Therefore, 'I' and 'J' are conventionally merged into a single cell. If identical adjacent letters occur in the same digraph (e.g. "BALLOON" having "LL"), the cipher inserts a filler letter ('X' or 'Q') between them ("BALXLOON") so that no digraph consists of two identical letters, which would make rectangle rule evaluation impossible.
            </p>
          </div>

          {/* Q3 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              Q3: How does CipherMail guarantee zero plaintext/key leakage to the server database?
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
              <strong>Answer:</strong> Plaintext and encryption keys are strictly excluded from the message creation endpoint (<code style={{ color: 'var(--accent-cyan)' }}>POST /api/v1/messages</code>). The backend rejects any payload containing <code style={{ color: '#fff' }}>plaintext</code> or <code style={{ color: '#fff' }}>key</code> with HTTP 400. In SQLite, the messages schema persists only <code style={{ color: '#fff' }}>sender_id, receiver_id, algorithm, ciphertext, status, created_at, updated_at</code>. Decryption keys are held only in ephemeral, in-memory client state and never saved to database, localStorage, or sessionStorage.
            </p>
          </div>

          {/* Q4 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              Q4: Why can a pure transposition cipher be detected via unigram frequency analysis?
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
              <strong>Answer:</strong> Because a transposition cipher only changes the positions of characters without altering their identities, the unigram (single-character) frequency counts in the ciphertext are exactly identical to those of the plaintext. For English text, 'E', 'T', 'A', and 'O' will still be the most frequent letters in the ciphertext, signaling that a permutation occurred rather than substitution.
            </p>
          </div>
        </div>
      </Card>

      {/* Technical Specifications Table */}
      <Card title="Live Technical Stack & Configuration" icon={Cpu}>
        <table className="spec-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Technology / Library</th>
              <th>Configuration / Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frontend Runtime</td>
              <td>React 18.3 + Vite 6 + React Router 6</td>
              <td><Badge variant="cyan">Port 5173 (HMR Active)</Badge></td>
            </tr>
            <tr>
              <td>Backend Gateway</td>
              <td>Node.js Express 4.21 + Helmet 8.0 + CORS</td>
              <td><Badge variant={isOnline ? 'emerald' : 'muted'}>Port 5000 ({status})</Badge></td>
            </tr>
            <tr>
              <td>Database Engine</td>
              <td>SQLite3 via better-sqlite3 11.8</td>
              <td><Badge variant={isOnline ? 'emerald' : 'muted'}>WAL Mode (ciphermail.db)</Badge></td>
            </tr>
            <tr>
              <td>Classical Ciphers</td>
              <td>Pure ES6 Independent Algorithm Registry</td>
              <td>Caesar, Playfair, Rail Fence, Columnar</td>
            </tr>
            <tr>
              <td>Test Framework</td>
              <td>Node.js Test Runner (node:test + assert)</td>
              <td>103 Automated Integration Tests</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default AboutPage;
