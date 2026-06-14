import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('E-posta ve şifre zorunludur');
      return;
    }
    setLoading(true);
    try {
      const user = await login({ email, password });
      toast.success(`Hoş geldiniz! 🍊`);
      // Role göre yönlendirme
      navigate(user.role === 'Producer' ? '/orchards' : '/dashboard');
    } catch {
      toast.error('E-posta veya şifre hatalı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Arka plan efekti */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', padding: '24px', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
          }}>
            🍊
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            AKNAR-KDS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            IoT Entegre Narenciye Karar Destek Sistemi
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
            Giriş Yap
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-posta Adresi</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Şifre</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: '8px', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                  Giriş yapılıyor...
                </>
              ) : (
                '→ Giriş Yap'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Hesabınız yok mu?{' '}
              <Link to="/register" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
                Kayıt Ol
              </Link>
            </span>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px' }}>
          AKNAR-KDS © 2026 · Mersin Narenciye Yönetim Sistemi
        </p>
      </div>
    </div>
  );
}
