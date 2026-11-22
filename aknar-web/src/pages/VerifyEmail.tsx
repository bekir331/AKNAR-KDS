import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('E-posta adresiniz doğrulanıyor...');

  useEffect(() => {
    if (!userId || !token) {
      setStatus('error');
      setMessage('Geçersiz doğrulama linki.');
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyEmail(Number(userId), token);
        setStatus('success');
        setMessage(res.message || 'E-posta adresiniz başarıyla doğrulandı.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Doğrulama işlemi başarısız oldu veya link süresi dolmuş.');
      }
    };

    verify();
  }, [userId, token]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px'
    }}>
      <div className="card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          {status === 'loading' && (
            <Loader2 className="loading-spinner" size={48} style={{ color: '#10b981', margin: '0 auto' }} />
          )}
          {status === 'success' && (
            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto' }} />
          )}
          {status === 'error' && (
            <XCircle size={48} style={{ color: '#ef4444', margin: '0 auto' }} />
          )}
        </div>

        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '12px'
        }}>
          E-posta Doğrulama
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          marginBottom: '24px',
          lineHeight: 1.5
        }}>
          {message}
        </p>

        {status !== 'loading' && (
          <Link
            to="/login"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center' }}
          >
            Giriş Sayfasına Dön
          </Link>
        )}
      </div>
    </div>
  );
}
