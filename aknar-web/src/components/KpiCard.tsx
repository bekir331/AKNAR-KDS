interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  sub?: string;
  color?: string;
}

export default function KpiCard({ label, value, unit, icon, sub, color = 'var(--color-primary)' }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color } as React.CSSProperties}>
      <div className="kpi-icon" style={{ background: `${color}18` }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
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
