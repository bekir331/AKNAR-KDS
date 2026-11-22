import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrchards, createOrchard, deleteOrchard, activateOrchard } from '../api/orchards';
import type { Orchard, CreateOrchardDto } from '../types';
import toast from 'react-hot-toast';

import LocationPicker from '../components/LocationPicker';

export default function Orchards() {
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState<CreateOrchardDto>({ 
    name: '', 
    areaHectare: undefined, 
    location: '',
    latitude: undefined,
    longitude: undefined,
    boundaries: undefined,
    imageUrl: undefined
  });

  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOrchards(showInactive);
      setOrchards(data);
    } catch {
      toast.error('Bahçeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [showInactive]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateOrchardDto = {
        name: form.name,
        areaHectare: form.areaHectare,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        boundaries: form.boundaries,
        imageUrl: form.imageUrl
      };
      await createOrchard(payload);
      toast.success('Bahçe oluşturuldu ✅');
      setShowModal(false);
      setForm({ name: '', areaHectare: undefined, location: '', latitude: undefined, longitude: undefined, boundaries: undefined, imageUrl: undefined });
      load();
    } catch {
      toast.error('Bahçe oluşturulamadı');
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string, area?: number, boundariesJson?: string) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address || prev.location,
      areaHectare: area || prev.areaHectare,
      boundaries: boundariesJson || prev.boundaries
    }));
    if (address) {
      toast.success('Konum belirlendi: ' + address.split(',')[0]);
    }
    if (area && area > 0) {
      toast.success(`Alan hesaplandı: ${area} hektar`, { icon: '📐' });
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`"${name}" bahçesini pasife almak istediğine emin misin? Veriler silinmeyecek.`)) return;
    try {
      await deleteOrchard(id); // API'de delete artik deactivate yapiyor
      toast.success('Bahçe pasifleştirildi');
      load();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await activateOrchard(id);
      toast.success('Bahçe tekrar aktifleştirildi');
      load();
    } catch {
      toast.error('Aktifleştirme başarısız');
    }
  };

  if (loading && orchards.length === 0) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌿 Bahçelerim</h1>
          <p className="page-subtitle">{orchards.length} bahçe listeleniyor</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${showInactive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? '👁️ Pasifleri Gizle' : '👁️ Pasifleri Göster'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Yeni Bahçe
          </button>
        </div>
      </div>

      {orchards.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🌿</div>
            <div className="empty-state-title">Henüz bahçe eklenmedi</div>
            <div className="empty-state-desc">İlk bahçeni ekleyerek sensör verilerini takip etmeye başla</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
              + Bahçe Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-auto">
          {orchards.map((orchard) => (
              <div
                key={orchard.id}
                className={`card ${!orchard.isActive ? 'card-inactive' : ''}`}
                style={{ cursor: 'pointer', opacity: orchard.isActive ? 1 : 0.7, padding: 0, overflow: 'hidden', border: orchard.isActive ? '' : '1px dashed var(--text-muted)', display: 'flex', flexDirection: 'column' }}
                onClick={() => orchard.isActive && navigate(`/orchards/${orchard.id}`)}
              >
                <div style={{ position: 'relative', height: '160px', width: '100%', flexShrink: 0 }}>
                  <img 
                    src={orchard.imageUrl || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80'}
                    alt={orchard.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: orchard.isActive ? '' : 'var(--text-muted)' }}>
                    {orchard.name} {!orchard.isActive && '(Pasif)'}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {orchard.location && <span>📍 {orchard.location}</span>}
                    {orchard.areaHectare && <span>📐 {orchard.areaHectare} hektar</span>}
                    {orchard.latitude && (
                      <span style={{ color: 'var(--color-primary)' }}>
                        🎯 {orchard.latitude.toFixed(4)}, {orchard.longitude?.toFixed(4)}
                      </span>
                    )}
                    <span>📅 {new Date(orchard.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!orchard.isActive}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if(orchard.isActive) navigate(`/orchards/${orchard.id}`);
                      }}
                    >
                      {orchard.isActive ? 'Detayı Görüntüle →' : 'Pasif Bahçe'}
                    </button>
                    {!orchard.isActive ? (
                      <button
                        className="btn btn-primary btn-sm"
                        title="Aktifleştir"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); handleActivate(orchard.id); }}
                      >
                        🚀 Aktif Et
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        title="Pasife Al"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); handleDeactivate(orchard.id, orchard.name); }}
                      >
                        💤 Pasifleştir
                      </button>
                    )}
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}

      {/* Yeni Bahçe Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🌿 Yeni Bahçe Ekle</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Bahçe Adı *</label>
                  <input
                    className="form-input"
                    placeholder="Ör: Kuzey Bahçesi"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Alan (Hektar)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="Ör: 2.5"
                    value={form.areaHectare ?? ''}
                    onChange={(e) => setForm({ ...form, areaHectare: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Konum Seçimi</label>
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </div>

              <div className="form-group">
                <label className="form-label">Adres / Konum</label>
                <input
                  className="form-input"
                  placeholder="Haritadan seçebilir veya elle yazabilirsiniz"
                  value={form.location ?? ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                {form.latitude && (
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>
                    Koordinatlar kaydedildi: {form.latitude.toFixed(6)}, {form.longitude?.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Görsel URL (İsteğe Bağlı)</label>
                <input
                  className="form-input"
                  placeholder="https://... (Fotoğraf linki)"
                  value={form.imageUrl ?? ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">✅ Bahçeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
