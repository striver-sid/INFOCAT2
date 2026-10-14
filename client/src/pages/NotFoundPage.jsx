import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Card from '../components/common/Card.jsx';

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto 0' }}>
      <Card title="Page Not Found" icon={AlertTriangle}>
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            The requested page does not exist within the CipherMail application.
          </p>
          <Link
            to="/inbox"
            className="refresh-btn"
            style={{ display: 'inline-flex', padding: '0.65rem 1.25rem', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Secure Inbox</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default NotFoundPage;
