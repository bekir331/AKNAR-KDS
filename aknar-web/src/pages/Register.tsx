import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.password || !form.phone || !form.city) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        city: form.city,
        address: form.address || undefined,
      });
      toast.success('Kayıt başarılı! Lütfen e-posta adresinize gönderilen doğrulama linkine tıklayın.', { duration: 6000 });
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Kayıt sırasında bir hata oluştu';
      toast.error(msg);
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

      <div style={{ width: '100%', maxWidth: '480px', padding: '24px', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            Üretici Kayıt Formu
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
            Hesap Oluştur
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Ad Soyad *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ahmet Yılmaz"
                value={form.fullName}
                onChange={set('fullName')}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-posta Adresi *</label>
              <input
                type="email"
                className="form-input"
                placeholder="ornek@email.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Şifre *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Şifre Tekrar *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.passwordConfirm}
                  onChange={set('passwordConfirm')}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Telefon *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="05XX XXX XX XX"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Şehir *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Mersin"
                  value={form.city}
                  onChange={set('city')}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Adres</label>
              <input
                type="text"
                className="form-input"
                placeholder="Mahalle, Sokak, No (opsiyonel)"
                value={form.address}
                onChange={set('address')}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: '8px', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                  Kayıt yapılıyor...
                </>
              ) : (
                '→ Kayıt Ol'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Zaten hesabınız var mı?{' '}
              <Link to="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
                Giriş Yap
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
