interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  sub?: string;
  color?: string;
  imageUrl?: string;
}

export default function KpiCard({ label, value, unit, icon, sub, color = 'var(--color-primary)', imageUrl }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color } as React.CSSProperties}>
      {imageUrl ? (
        <div className="kpi-icon" style={{ padding: 0, background: 'transparent', overflow: 'hidden' }}>
          <img 
            src={imageUrl} 
            alt={label} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
          />
        </div>
      ) : (
        <div className="kpi-icon" style={{ background: `${color}18` }}>
          <span style={{ fontSize: '22px' }}>{icon}</span>
        </div>
      )}
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {value}
          {unit && <span className="kpi-unit">{unit}</span>}
        </div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
