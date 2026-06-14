import type { Alert } from '../types';

interface AlertBadgeProps {
  alert: Alert;
  onMarkRead?: (id: number) => void;
}

const alertColors: Record<string, { dot: string; badge: string; label: string }> = {
  LowMoisture: { dot: '#3b82f6', badge: 'badge-blue', label: '💧 Düşük Nem' },
  HighTemperature: { dot: '#f97316', badge: 'badge-orange', label: '🌡️ Yüksek Sıcaklık' },
  LowHumidity: { dot: '#f59e0b', badge: 'badge-orange', label: '💨 Düşük Nem' },
  LowLight: { dot: '#8b5cf6', badge: 'badge-purple', label: '☀️ Düşük Işık' },
};

export function getAlertConfig(alertType: string) {
  return alertColors[alertType] ?? { dot: '#6b7280', badge: 'badge-gray', label: alertType };
}

export default function AlertBadge({ alert, onMarkRead }: AlertBadgeProps) {
  const config = getAlertConfig(alert.alertType);

  return (
    <div className={`alert-item ${alert.isRead ? '' : 'unread'}`} style={{ borderLeftColor: config.dot }}>
      <div className="alert-item-dot" style={{ background: config.dot }} />
      <div className="alert-item-content">
        <div className="alert-item-type" style={{ color: config.dot }}>
          {config.label}
        </div>
        <div className="alert-item-msg">{alert.message}</div>
        <div className="alert-item-time">
          {new Date(alert.createdAt).toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      {!alert.isRead && onMarkRead && (
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onMarkRead(alert.id)}
          title="Okundu işaretle"
        >
          ✓
        </button>
      )}
    </div>
  );
}
