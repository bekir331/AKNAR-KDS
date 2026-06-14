import { useEffect, useState } from 'react';
import { getAlerts, markAlertRead, markAllRead } from '../api/alerts';
import AlertBadge from '../components/AlertBadge';
import type { Alert } from '../types';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'unread' | 'LowMoisture' | 'HighTemperature' | 'LowHumidity' | 'LowLight';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('unread');

  const load = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch {
      toast.error('Uyarılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      toast.success('Tümü okundu işaretlendi ✅');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'all') return true;
    return a.alertType === filter;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'unread', label: `Okunmamış (${unreadCount})` },
    { key: 'all', label: 'Tümü' },
    { key: 'LowMoisture', label: '💧 Düşük Nem' },
    { key: 'HighTemperature', label: '🌡️ Yüksek Sıcaklık' },
    { key: 'LowHumidity', label: '💨 Hava Nemi' },
    { key: 'LowLight', label: '☀️ Işık' },
  ];

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 Uyarılar</h1>
          <p className="page-subtitle">{unreadCount} okunmamış · {alerts.length} toplam uyarı</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAll}>
            ✓ Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {filterButtons.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">
              {filter === 'unread' ? 'Okunmamış uyarı yok' : 'Bu kategoride uyarı yok'}
            </div>
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertBadge key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
          ))
        )}
      </div>
    </div>
  );
}
