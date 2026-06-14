import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getUsers, createUser, deleteUser } from '../api/users';
import { useAuth } from '../hooks/useAuth';
import type { User, CreateSystemUserDto } from '../types';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<CreateSystemUserDto>({
    fullName: '',
    email: '',
    password: '',
    role: 'Producer',
    phone: '',
    city: ''
  });

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error('Lütfen ad ve e-posta alanlarını doldurun');
      return;
    }

    try {
      await createUser(formData);
      toast.success('Kullanıcı başarıyla oluşturuldu');
      setIsAdding(false);
      setFormData({ fullName: '', email: '', password: '', role: 'Producer', phone: '', city: '' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Kullanıcı oluşturulamadı');
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.userId) {
      toast.error('Kendi hesabınızı silemezsiniz');
      return;
    }
    
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteUser(id);
      toast.success('Kullanıcı silindi');
      loadUsers();
    } catch {
      toast.error('Kullanıcı silinemedi');
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Kullanıcı Yönetimi</h1>
          <p className="page-subtitle">Sistemdeki tüm yöneticileri, danışmanları ve üreticileri yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          + Yeni Kullanıcı
        </button>
      </div>

      {isAdding && (
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Kullanıcı Ekle</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select 
                className="form-select" 
                value={formData.role} 
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              >
                <option value="Producer">Üretici (Producer)</option>
                <option value="Consultant">Danışman (Consultant)</option>
                <option value="Admin">Sistem Yöneticisi (Admin)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Ad Soyad</label>
              <input 
                className="form-input" 
                value={formData.fullName} 
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">E-posta</label>
              <input 
                className="form-input" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                placeholder="ornek@aknar.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Şifre (Opsiyonel)</label>
              <input 
                className="form-input" 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                placeholder="Boş bırakılırsa: 123456"
              />
            </div>

            {formData.role === 'Producer' && (
              <>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Şehir</label>
                  <input 
                    className="form-input" 
                    value={formData.city} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                    placeholder="Örn: Adana"
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">Kaydet</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>İptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>E-posta</th>
                <th>Kayıt Tarihi</th>
                <th style={{ textAlign: 'right' }}>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => {
                const isMe = u.id === currentUser?.userId;
                return (
                  <tr key={u.id || `user-${index}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: u.role === 'Admin' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 
                                      u.role === 'Consultant' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' :
                                      'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, color: 'white'
                        }}>
                          {u.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {u.fullName} {isMe && <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>(Sen)</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'Admin' ? 'badge-red' : 
                        u.role === 'Consultant' ? 'badge-blue' : 'badge-green'
                      }`}>
                        {u.role === 'Admin' ? 'Yönetici' : u.role === 'Consultant' ? 'Danışman' : 'Üretici'}
                      </span>
                    </td>
                    <td>{u.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ color: 'var(--color-danger)', border: '1px solid var(--border)' }}
                        onClick={() => handleDelete(u.id)}
                        disabled={isMe}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
