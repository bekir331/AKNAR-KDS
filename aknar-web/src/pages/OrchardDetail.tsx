import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrchardById, getOrchardSummary, updateOrchard } from '../api/orchards';
import { getSensorsByOrchard } from '../api/sensors';
import { getAlertsByOrchard } from '../api/alerts';
import { getIrrigationByOrchard, createIrrigationLog } from '../api/irrigation';
import KpiCard from '../components/KpiCard';
import SensorChart from '../components/SensorChart';
import AlertBadge from '../components/AlertBadge';
import LocationPicker from '../components/LocationPicker';
import type { Orchard, OrchardSummary, SensorReading, Alert, IrrigationLog, UpdateOrchardDto } from '../types';
import toast from 'react-hot-toast';

type MetricKey = 'soilMoisture' | 'airTemperature' | 'airHumidity' | 'lightLevel';

const metricOptions: { key: MetricKey; label: string; icon: string }[] = [
  { key: 'soilMoisture', label: 'Toprak Nemi', icon: '💧' },
  { key: 'airTemperature', label: 'Sıcaklık', icon: '🌡️' },
  { key: 'airHumidity', label: 'Hava Nemi', icon: '💨' },
  { key: 'lightLevel', label: 'Işık', icon: '☀️' },
];

export default function OrchardDetail() {
  const { id } = useParams<{ id: string }>();
  const orchardId = Number(id);
  const navigate = useNavigate();

  const [orchard, setOrchard] = useState<Orchard | null>(null);
  const [summary, setSummary] = useState<OrchardSummary | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<IrrigationLog[]>([]);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('soilMoisture');
  const [irrigNote, setIrrigNote] = useState('');
  const [showIrrigModal, setShowIrrigModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [editForm, setEditForm] = useState<UpdateOrchardDto & { latitude?: number; longitude?: number }>({ 
    name: '', 
    areaHectare: undefined, 
    location: '',
    latitude: undefined,
    longitude: undefined,
    imageUrl: undefined
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [o, s, r, a, l] = await Promise.all([
          getOrchardById(orchardId),
          getOrchardSummary(orchardId),
          getSensorsByOrchard(orchardId, 200),
          getAlertsByOrchard(orchardId),
          getIrrigationByOrchard(orchardId),
        ]);
        setOrchard(o);
        setSummary(s);
        setReadings(r);
        setAlerts(a);
        setLogs(l);
      } catch {
        toast.error('Veri yüklenemedi');
        navigate('/orchards');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orchardId]);

  const handleEdit = async () => {
    try {
      await updateOrchard(orchardId, editForm);
      toast.success('Bahçe güncellendi ✅');
      setShowEditModal(false);
      const updated = await getOrchardById(orchardId);
      setOrchard(updated);
    } catch {
      toast.error('Bahçe güncellenemedi');
    }
  };

  const openEditModal = () => {
    if (orchard) {
      setEditForm({ 
        name: orchard.name, 
        areaHectare: orchard.areaHectare, 
        location: orchard.location,
        latitude: orchard.latitude,
        longitude: orchard.longitude,
        imageUrl: orchard.imageUrl
      });
    }
    setShowEditModal(true);
  };

  const handleLocationSelect = (lat: number, lng: number, address: string, area?: number) => {
    setEditForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address || prev.location,
      areaHectare: area || prev.areaHectare
    }));
    setShowLocationPicker(false);
    if (address) {
      toast.success('Konum belirlendi: ' + address.split(',')[0]);
    }
    if (area && area > 0) {
      toast.success(`Alan hesaplandı: ${area} hektar`, { icon: '📐' });
    }
  };

  const handleIrrigate = async () => {
    try {
      await createIrrigationLog({ orchardId, note: irrigNote });
      toast.success('Sulama kaydedildi ✅');
      setShowIrrigModal(false);
      setIrrigNote('');
      const updated = await getIrrigationByOrchard(orchardId);
      setLogs(updated);
    } catch {
      toast.error('Sulama kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="loading-spinner" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  const r = summary?.lastReading;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orchards')} style={{ marginBottom: '12px' }}>
            ← Geri
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            {orchard?.imageUrl ? (
              <img 
                src={orchard.imageUrl} 
                alt={orchard.name} 
                style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
              />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                🌿
              </div>
            )}
            <h1 className="page-title" style={{ margin: 0 }}>{orchard?.name}</h1>
          </div>
          <p className="page-subtitle" style={{ paddingLeft: '64px' }}>
            {orchard?.location && `📍 ${orchard.location}`}
            {orchard?.areaHectare && ` · ${orchard.areaHectare} hektar`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={openEditModal}>
            ✏️ Düzenle
          </button>
          <button className="btn btn-primary" onClick={() => setShowIrrigModal(true)}>
            💧 Sulama Yaptım
          </button>
        </div>
      </div>

      {/* KPI Kartlar */}
      <div className="kpi-grid">
        <KpiCard label="Toprak Nemi" value={r?.soilMoisture?.toFixed(1) ?? '—'} unit="%" icon="💧" color="#10b981" sub="Son ölçüm" />
        <KpiCard label="Hava Sıcaklığı" value={r?.airTemperature?.toFixed(1) ?? '—'} unit="°C" icon="🌡️" color="#f59e0b" sub="Son ölçüm" />
        <KpiCard label="Aktif Uyarı" value={summary?.unreadAlertCount ?? 0} icon="🔔" color="#ef4444" sub="Okunmamış" />
        <KpiCard
          label="Son Tahmin"
          value={summary?.lastPrediction?.predictedLabel ?? '—'}
          icon="🔬"
          color="#8b5cf6"
          sub={summary?.lastPrediction ? `%${summary.lastPrediction.confidence.toFixed(1)} doğruluk` : 'Henüz yok'}
          imageUrl={summary?.lastPrediction?.imageUrl ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5139/api').replace(/\/api$/, '')}/${summary.lastPrediction.imageUrl.replace(/^\//, '')}` : undefined}
        />
      </div>

      {/* Grafik */}
      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>📊 Sensör Grafiği</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {metricOptions.map((m) => (
              <button
                key={m.key}
                className={`btn btn-sm ${activeMetric === m.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMetric(m.key)}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
        <SensorChart readings={readings} metric={activeMetric} />
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Uyarılar */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🔔 Uyarılar</h3>
          {alerts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">Uyarı yok</div>
            </div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {alerts.slice(0, 15).map((a) => (
                <AlertBadge key={a.id} alert={a} />
              ))}
            </div>
          )}
        </div>

        {/* Sulama Geçmişi */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>💧 Sulama Geçmişi</h3>
          {logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-icon">💧</div>
              <div className="empty-state-title">Sulama kaydı yok</div>
            </div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {logs.map((log) => (
                <div key={log.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{log.note || 'Not girilmedi'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(log.loggedAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <span className="badge badge-blue">💧 Sulandı</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Düzenleme Modalı */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✏️ Bahçe Düzenle</h3>
            <div className="form-group">
              <label className="form-label">Bahçe Adı *</label>
              <input
                className="form-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Bahçe adı"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Konum</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    className="form-input"
                    value={editForm.location ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Ör: Mersin - Tarsus"
                  />
                </div>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setShowLocationPicker(true)}
                  style={{ minWidth: '40px', padding: '8px 12px' }}
                >
                  🗺️
                </button>
              </div>
              {editForm.latitude && editForm.longitude && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  📍 {editForm.latitude.toFixed(4)}, {editForm.longitude.toFixed(4)}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Alan (Hektar)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={editForm.areaHectare ?? ''}
                onChange={(e) => setEditForm({ ...editForm, areaHectare: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Ör: 2.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Görsel URL (İsteğe Bağlı)</label>
              <input
                className="form-input"
                value={editForm.imageUrl ?? ''}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                placeholder="https://... (Fotoğraf linki)"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleEdit}>✅ Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Konum Seçici Modalı */}
      {showLocationPicker && (
        <div className="modal-overlay" onClick={() => setShowLocationPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>🗺️ Konum Seç</h3>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowLocationPicker(false)}
                style={{ padding: '4px 8px', minWidth: 'auto' }}
              >
                ✕
              </button>
            </div>
            <div style={{ height: '60vh', overflow: 'hidden' }}>
              <LocationPicker 
                onLocationSelect={handleLocationSelect}
                initialLocation={
                  editForm.latitude && editForm.longitude 
                    ? {
                        latitude: editForm.latitude,
                        longitude: editForm.longitude,
                        name: editForm.location || orchard?.name,
                        areaHectare: editForm.areaHectare
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Sulama Modalı */}
      {showIrrigModal && (
        <div className="modal-overlay" onClick={() => setShowIrrigModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">💧 Sulama Kaydı Ekle</h3>
            <div className="form-group">
              <label className="form-label">Not (isteğe bağlı)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Ör: Damla sulama, 2 saat yapıldı..."
                value={irrigNote}
                onChange={(e) => setIrrigNote(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowIrrigModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleIrrigate}>✅ Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
