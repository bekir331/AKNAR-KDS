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
    } catch (err: any) {
      const msg = err.response?.data?.error || 'E-posta veya şifre hatalı';
      toast.error(msg, { duration: 5000 });
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
      // 'background' yerine 'backgroundImage' kullanıyoruz ve karanlık filtresini çok daha hafif (0.4) yapıyoruz
      backgroundImage: `linear-gradient(rgba(10, 15, 20, 0.4), rgba(10, 15, 20, 0.5)), url('/bg-lemon.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
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
          <h1 style={{
            fontSize: '36px',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '6px',
            textShadow: '0 4px 16px rgba(0,0,0,0.8)',
            letterSpacing: '1px'
          }}>
            AKNAR-KDS
          </h1>
          <p style={{
            color: '#f8fafc',
            fontSize: '15px',
            fontWeight: 500,
            textShadow: '0 2px 8px rgba(0,0,0,0.9)'
          }}>
            IoT Entegre Narenciye Karar Destek Sistemi
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{
          padding: '32px',
          background: 'rgba(20, 25, 35, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
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
        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '12px', marginTop: '24px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          AKNAR-KDS © 2026 · Akıllı Narenciye Yönetim Sistemi
        </p>
      </div>
    </div>
  );
}
