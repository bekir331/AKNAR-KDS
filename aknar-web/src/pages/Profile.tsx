import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getMyProfile, updateProducer } from '../api/producers';
import type { Producer } from '../types';
import { User, Lock, Phone, MapPin, Building2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const myProfile = await getMyProfile();
        if (myProfile) {
          setProfile(myProfile);
          setFormData({
            ...formData,
            fullName: myProfile.fullName || '',
            phone: myProfile.phone || '',
            city: myProfile.city || '',
            address: myProfile.address || '',
          });
        }
      } catch (err) {
        toast.error('Profil bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    setSaving(true);
    try {
      await updateProducer(profile.id, {
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        ...(formData.password ? { password: formData.password } : {})
      });
      toast.success('Profil bilgileriniz güncellendi.');
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Profil güncellenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in max-w-2xl mx-auto" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <User className="text-primary" size={28} /> Profil Yönetimi
          </h1>
          <p className="page-subtitle">Kişisel bilgilerinizi ve şifrenizi güncelleyin</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <User size={16} className="text-muted" /> Ad Soyad
              </label>
              <input 
                className="form-input" 
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Phone size={16} className="text-muted" /> Telefon
              </label>
              <input 
                className="form-input" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Building2 size={16} className="text-muted" /> Şehir
              </label>
              <input 
                className="form-input" 
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <MapPin size={16} className="text-muted" /> Adres
              </label>
              <input 
                className="form-input" 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '8px 0' }} />

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} className="text-primary" /> Şifre Güncelleme
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Yeni Şifre</label>
                <input 
                  type="password"
                  className="form-input" 
                  placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Yeni Şifre (Tekrar)</label>
                <input 
                  type="password"
                  className="form-input" 
                  placeholder="Şifreyi tekrar girin"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary px-8" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
