import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { SensorReading } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface SensorChartProps {
  readings: SensorReading[];
  metric?: 'soilMoisture' | 'airTemperature' | 'airHumidity' | 'lightLevel';
}

const metricConfig = {
  soilMoisture: { label: 'Toprak Nemi (%)', color: '#10b981', unit: '%' },
  airTemperature: { label: 'Hava Sıcaklığı (°C)', color: '#f59e0b', unit: '°C' },
  airHumidity: { label: 'Hava Nemi (%)', color: '#3b82f6', unit: '%' },
  lightLevel: { label: 'Işık Seviyesi (lux)', color: '#8b5cf6', unit: ' lux' },
};

export default function SensorChart({ readings, metric = 'soilMoisture' }: SensorChartProps) {
  const sorted = [...readings].sort((a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime());
  const config = metricConfig[metric];

  const labels = sorted.map((r) => {
    const d = new Date(r.readAt);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  const data = sorted.map((r) => r[metric] ?? null);

  const chartData = {
    labels,
    datasets: [
      {
        label: config.label,
        data,
        borderColor: config.color,
        backgroundColor: `${config.color}18`,
        borderWidth: 2,
        pointRadius: sorted.length > 50 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: config.color,
        fill: true,
        tension: 0.4,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161b22',
        borderColor: '#30363d',
        borderWidth: 1,
        titleColor: '#8b949e',
        bodyColor: '#e6edf3',
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y?.toFixed(1) ?? '-'}${config.unit}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(48, 54, 61, 0.5)' },
        ticks: {
          color: '#8b949e',
          font: { size: 10 },
          maxTicksLimit: 12,
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: 'rgba(48, 54, 61, 0.5)' },
        ticks: { color: '#8b949e', font: { size: 10 } },
      },
    },
    interaction: { intersect: false, mode: 'index' as const },
  };

  if (readings.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">Henüz sensör verisi yok</div>
        <div className="empty-state-desc">IoT cihazı bağlandığında veriler burada görünecek</div>
      </div>
    );
  }

  return (
    <div style={{ height: '280px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
