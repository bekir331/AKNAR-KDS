import { useEffect, useState } from 'react';
import { getOrchards, getOrchardSummary } from '../api/orchards';
import { getAlerts } from '../api/alerts';
import KpiCard from '../components/KpiCard';
import AlertBadge from '../components/AlertBadge';
import DashboardMap from '../components/DashboardMap';
import type { Orchard, OrchardSummary, Alert } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface OrchardCard {
  orchard: Orchard;
  summary?: OrchardSummary;
}

export default function Dashboard() {
  const [cards, setCards] = useState<OrchardCard[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [orchards, allAlerts] = await Promise.all([getOrchards(), getAlerts()]);
        const summaries = await Promise.all(
          orchards.map(async (o) => {
            try {
              const s = await getOrchardSummary(o.id);
              return { orchard: o, summary: s };
            } catch {
              return { orchard: o };
            }
          })
        );
        setCards(summaries);
        setAlerts(allAlerts);
      } catch {
        toast.error('Dashboard yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  // Global KPI'lar — tüm bahçelerin ortalaması
  const summariesWithReadings = cards.filter((c) => c.summary?.lastReading);
  const avgMoisture = summariesWithReadings.length > 0
    ? summariesWithReadings.reduce((sum, c) => sum + (c.summary!.lastReading!.soilMoisture ?? 0), 0) / summariesWithReadings.length
    : null;
  const avgTemp = summariesWithReadings.length > 0
    ? summariesWithReadings.reduce((sum, c) => sum + (c.summary!.lastReading!.airTemperature ?? 0), 0) / summariesWithReadings.length
    : null;
  const totalUnread = alerts.filter((a) => !a.isRead).length;
  const recentAlerts = alerts.filter((a) => !a.isRead).slice(0, 8);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏠 Dashboard</h1>
          <p className="page-subtitle">Genel sistem durumu ve son veriler</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/predict')}>🔬 Yaprak Tahmin</button>
          <button className="btn btn-primary" onClick={() => navigate('/orchards')}>+ Bahçe Ekle</button>
        </div>
      </div>

      {/* KPI Kartlar */}
      <div className="kpi-grid">
        <KpiCard
          label="Toprak Nemi"
          value={avgMoisture != null ? avgMoisture.toFixed(1) : '—'}
          unit="%"
          icon="💧"
          color="#10b981"
          sub={summariesWithReadings.length > 0 ? `${summariesWithReadings.length} bahçe ortalaması` : 'Sensör verisi yok'}
        />
        <KpiCard
          label="Hava Sıcaklığı"
          value={avgTemp != null ? avgTemp.toFixed(1) : '—'}
          unit="°C"
          icon="🌡️"
          color="#f59e0b"
          sub={summariesWithReadings.length > 0 ? `${summariesWithReadings.length} bahçe ortalaması` : 'Sensör verisi yok'}
        />
        <KpiCard
          label="Aktif Uyarı"
          value={totalUnread}
          icon="🔔"
          color={totalUnread > 0 ? '#ef4444' : '#10b981'}
          sub={totalUnread > 0 ? 'Dikkat gerektiriyor' : 'Sorun yok'}
        />
        <KpiCard
          label="Kayıtlı Bahçe"
          value={cards.length}
          icon="🌿"
          color="#8b5cf6"
          sub="Aktif bahçe sayısı"
        />
      </div>

      {/* Harita Bileşeni */}
      <DashboardMap orchards={cards} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', marginBottom: '24px' }}>
        {/* Bahçe Kartları */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>🌿 Bahçelerim</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orchards')}>Tümünü Gör →</button>
          </div>
          {cards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌿</div>
              <div className="empty-state-title">Henüz bahçe yok</div>
              <div className="empty-state-desc">İlk bahçeni ekleyerek başla</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Bahçe</th>
                    <th>Nem</th>
                    <th>Sıcaklık</th>
                    <th>Uyarı</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(({ orchard, summary }) => (
                    <tr key={orchard.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orchards/${orchard.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={orchard.imageUrl || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=100&q=80'} 
                            alt={orchard.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{orchard.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{orchard.location}</div>
                          </div>
                        </div>
                      </td>
                      <td>{summary?.lastReading?.soilMoisture?.toFixed(1) ?? '—'}%</td>
                      <td>{summary?.lastReading?.airTemperature?.toFixed(1) ?? '—'}°C</td>
                      <td>
                        {(summary?.unreadAlertCount ?? 0) > 0 ? (
                          <span className="badge badge-red">{summary?.unreadAlertCount} uyarı</span>
                        ) : (
                          <span className="badge badge-green">Normal</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/orchards/${orchard.id}`)}>→</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Uyarılar */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>🔔 Son Uyarılar</h3>
            {totalUnread > 0 && <span className="badge badge-red">{totalUnread} yeni</span>}
          </div>
          {recentAlerts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">Okunmamış uyarı yok</div>
              <div className="empty-state-desc">Sistem normal durumda</div>
            </div>
          ) : (
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {recentAlerts.map((a) => <AlertBadge key={a.id} alert={a} />)}
            </div>
          )}
          {alerts.length > 8 && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/alerts')}>
                Tüm Uyarıları Gör
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Son Tahmin — tüm bahçeler arasında en son tahmini göster */}
      {(() => {
        const withPred = cards.filter((c) => c.summary?.lastPrediction);
        const latest = withPred.sort((a, b) =>
          new Date(b.summary!.lastPrediction!.predictedAt).getTime() - new Date(a.summary!.lastPrediction!.predictedAt).getTime()
        )[0];
        const pred = latest?.summary?.lastPrediction;
        if (!pred) return null;
        return (
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🔬 Son ML Tahmini</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {pred.imageUrl ? (
                <img 
                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5139/api').replace(/\/api$/, '')}/${pred.imageUrl.replace(/^\//, '')}`}
                  alt="Tahmin Görseli"
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  background: 'rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                }}>🍃</div>
              )}
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{pred.predictedLabel}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Doğruluk: <strong>%{pred.confidence.toFixed(1)}</strong>
                  {' · '}
                  Risk: <span className={`risk-${pred.riskLevel.toLowerCase()}`}>
                    {pred.riskLevel}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/predict')}>
                Yeni Tahmin →
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
