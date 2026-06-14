import { useEffect, useState, useMemo } from 'react';
import { getOrchards, getOrchardSummary } from '../api/orchards';
import { getSensorsByOrchard } from '../api/sensors';
import { askChatbot } from '../api/predictions';
import type { Orchard, OrchardSummary, SensorReading } from '../types';
import toast from 'react-hot-toast';
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
import { MapPin, Ruler, Calendar, Droplets, Thermometer, Wind, Sun, Sparkles } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const metricConfig = {
  soilMoisture: { label: 'Toprak Nemi', colorA: '#10b981', colorB: '#3b82f6', unit: '%' },
  airTemperature: { label: 'Hava Sıcaklığı', colorA: '#f59e0b', colorB: '#ef4444', unit: '°C' },
  airHumidity: { label: 'Hava Nemi', colorA: '#06b6d4', colorB: '#8b5cf6', unit: '%' },
  lightLevel: { label: 'Işık Seviyesi', colorA: '#eab308', colorB: '#ec4899', unit: ' lux' },
};

export default function CompareOrchards() {
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [loading, setLoading] = useState(true);

  const [orchardAId, setOrchardAId] = useState<number | ''>('');
  const [orchardBId, setOrchardBId] = useState<number | ''>('');

  const [summaryA, setSummaryA] = useState<OrchardSummary | null>(null);
  const [summaryB, setSummaryB] = useState<OrchardSummary | null>(null);

  const [readingsA, setReadingsA] = useState<SensorReading[]>([]);
  const [readingsB, setReadingsB] = useState<SensorReading[]>([]);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'soilMoisture' | 'airTemperature' | 'airHumidity' | 'lightLevel'>('soilMoisture');

  const [aiReport, setAiReport] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Load orchards on mount
  useEffect(() => {
    getOrchards()
      .then((data) => {
        const activeOnly = data.filter(o => o.isActive);
        setOrchards(activeOnly);
        if (activeOnly.length >= 2) {
          setOrchardAId(activeOnly[0].id);
          setOrchardBId(activeOnly[1].id);
        } else if (activeOnly.length === 1) {
          setOrchardAId(activeOnly[0].id);
        }
      })
      .catch(() => toast.error('Bahçeler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch details when selectors change
  useEffect(() => {
    if (orchardAId === '' || orchardBId === '') {
      setSummaryA(null);
      setSummaryB(null);
      setReadingsA([]);
      setReadingsB([]);
      setAiReport('');
      return;
    }

    if (orchardAId === orchardBId) {
      toast.error('Lütfen farklı iki bahçe seçin.');
      setOrchardBId('');
      return;
    }

    const loadData = async () => {
      setLoadingDetails(true);
      setAiReport('');
      try {
        const [sumA, sumB, readA, readB] = await Promise.all([
          getOrchardSummary(Number(orchardAId)),
          getOrchardSummary(Number(orchardBId)),
          getSensorsByOrchard(Number(orchardAId), 50),
          getSensorsByOrchard(Number(orchardBId), 50),
        ]);
        setSummaryA(sumA);
        setSummaryB(sumB);
        setReadingsA(readA);
        setReadingsB(readB);
      } catch (err) {
        toast.error('Bahçe verileri yüklenirken hata oluştu.');
      } finally {
        setLoadingDetails(false);
      }
    };

    loadData();
  }, [orchardAId, orchardBId]);

  const orchardA = useMemo(() => orchards.find(o => o.id === orchardAId), [orchards, orchardAId]);
  const orchardB = useMemo(() => orchards.find(o => o.id === orchardBId), [orchards, orchardBId]);

  // Combined Chart Logic
  const chartData = useMemo(() => {
    // Generate chronological labels by combining timestamps and sorting them
    const allReadings = [...readingsA, ...readingsB].sort(
      (a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime()
    );

    // Format to a readable string (e.g. "HH:MM")
    const uniqueTimestamps = Array.from(
      new Set(
        allReadings.map((r) => {
          const d = new Date(r.readAt);
          return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        })
      )
    );

    // Helper map to quickly find readings by formatted timestamp
    const mapReadingsByTime = (readings: SensorReading[]) => {
      const map: Record<string, number> = {};
      readings.forEach((r) => {
        const d = new Date(r.readAt);
        const timeKey = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        const val = r[activeMetric];
        if (val !== undefined && val !== null) {
          map[timeKey] = val;
        }
      });
      return map;
    };

    const mapA = mapReadingsByTime(readingsA);
    const mapB = mapReadingsByTime(readingsB);

    const dataA = uniqueTimestamps.map((t) => mapA[t] ?? null);
    const dataB = uniqueTimestamps.map((t) => mapB[t] ?? null);

    const config = metricConfig[activeMetric];

    return {
      labels: uniqueTimestamps,
      datasets: [
        {
          label: orchardA?.name || 'Bahçe A',
          data: dataA,
          borderColor: config.colorA,
          backgroundColor: `${config.colorA}12`,
          borderWidth: 2,
          pointRadius: uniqueTimestamps.length > 50 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: config.colorA,
          fill: true,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: orchardB?.name || 'Bahçe B',
          data: dataB,
          borderColor: config.colorB,
          backgroundColor: `${config.colorB}12`,
          borderWidth: 2,
          pointRadius: uniqueTimestamps.length > 50 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: config.colorB,
          fill: true,
          tension: 0.3,
          spanGaps: true,
        },
      ],
    };
  }, [readingsA, readingsB, activeMetric, orchardA, orchardB]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#8b949e',
          font: { size: 11, weight: 500 },
        },
      },
      tooltip: {
        backgroundColor: '#161b22',
        borderColor: '#30363d',
        borderWidth: 1,
        titleColor: '#8b949e',
        bodyColor: '#e6edf3',
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '-'}${metricConfig[activeMetric].unit}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(48, 54, 61, 0.3)' },
        ticks: {
          color: '#8b949e',
          font: { size: 9 },
          maxTicksLimit: 10,
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: 'rgba(48, 54, 61, 0.3)' },
        ticks: {
          color: '#8b949e',
          font: { size: 10 },
        },
      },
    },
    interaction: { intersect: false, mode: 'index' as const },
  };

  const handleAiCompare = async () => {
    if (!orchardA || !orchardB) return;
    setAiLoading(true);
    setAiReport('');

    const latestA = summaryA?.lastReading;
    const latestB = summaryB?.lastReading;

    const sensorInfoA = latestA
      ? `Toprak Nemi: %${latestA.soilMoisture ?? '—'}, Sıcaklık: ${latestA.airTemperature ?? '—'}°C, Hava Nemi: %${latestA.airHumidity ?? '—'}, Işık Seviyesi: ${latestA.lightLevel ?? '—'} lux`
      : 'Sensör verisi bulunmuyor';

    const sensorInfoB = latestB
      ? `Toprak Nemi: %${latestB.soilMoisture ?? '—'}, Sıcaklık: ${latestB.airTemperature ?? '—'}°C, Hava Nemi: %${latestB.airHumidity ?? '—'}, Işık Seviyesi: ${latestB.lightLevel ?? '—'} lux`
      : 'Sensör verisi bulunmuyor';

    const message = `Lütfen şu iki narenciye bahçesini yan yana zirai açıdan karşılaştır ve öneriler sun:
1. Bahçe Adı: "${orchardA.name}", Konum: "${orchardA.location || 'Bilinmiyor'}", Alan: "${orchardA.areaHectare ? `${orchardA.areaHectare} ha` : 'Bilinmiyor'}"
   Son Sensör Verileri: ${sensorInfoA}
   Aktif Uyarı Sayısı: ${summaryA?.unreadAlertCount ?? 0}
   
2. Bahçe Adı: "${orchardB.name}", Konum: "${orchardB.location || 'Bilinmiyor'}", Alan: "${orchardB.areaHectare ? `${orchardB.areaHectare} ha` : 'Bilinmiyor'}"
   Son Sensör Verileri: ${sensorInfoB}
   Aktif Uyarı Sayısı: ${summaryB?.unreadAlertCount ?? 0}

Lütfen her iki bahçenin toprak nemlerini, hava sıcaklıklarını ve genel risk durumlarını karşılaştır. Sulama, gübreleme ve hastalık riskleri bazında hangisine öncelik verilmeli ve ne yapılmalı, ziraat mühendisi gözüyle özetle. Yanıtı çok uzun tutmadan başlıklar halinde ver.`;

    const context = `Bahçe Karşılaştırma Modu: ${orchardA.name} vs ${orchardB.name}.`;

    try {
      const result = await askChatbot(message, context);
      setAiReport(result);
      toast.success('Yapay zeka karşılaştırmalı analizi tamamlandı.');
    } catch {
      toast.error('Yapay zekadan karşılaştırma raporu alınamadı.');
    } finally {
      setAiLoading(false);
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

  return (
    <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 10px' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>⚖️</span>
            <div>
              <h1 className="page-title">Bahçe Karşılaştırma</h1>
              <p className="page-subtitle">Bahçelerinizin durumunu, sensör metriklerini ve trendlerini yan yana analiz edin</p>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTORS */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🌾 Karşılaştırılacak Bahçeleri Seçin</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">1. Bahçe</label>
            <select
              className="form-select"
              value={orchardAId}
              onChange={(e) => setOrchardAId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seçiniz...</option>
              {orchards.map((o) => (
                <option key={o.id} value={o.id} disabled={o.id === orchardBId}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">2. Bahçe</label>
            <select
              className="form-select"
              value={orchardBId}
              onChange={(e) => setOrchardBId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seçiniz...</option>
              {orchards.map((o) => (
                <option key={o.id} value={o.id} disabled={o.id === orchardAId}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {orchards.length < 2 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
            <div className="empty-state-title">Yetersiz Bahçe</div>
            <div className="empty-state-desc">
              Karşılaştırma yapabilmek için en az 2 aktif bahçenizin olması gerekmektedir. Lütfen önce yeni bir bahçe ekleyin.
            </div>
          </div>
        </div>
      )}

      {orchardAId !== '' && orchardBId !== '' && orchards.length >= 2 && (
        <>
          {loadingDetails ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
              <div>Bahçe verileri yükleniyor...</div>
            </div>
          ) : (
            <div className="fade-in">
              {/* SIDE BY SIDE METADATA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* ORCHARD A METADATA */}
                <div className="card" style={{ borderLeft: `5px solid ${metricConfig[activeMetric].colorA}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>🌿 {orchardA?.name}</h2>
                    {summaryA?.unreadAlertCount && summaryA.unreadAlertCount > 0 ? (
                      <span className="badge badge-red">{summaryA.unreadAlertCount} Aktif Uyarı</span>
                    ) : (
                      <span className="badge badge-green">Normal Durum</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} className="text-muted" />
                      <span><strong>Konum:</strong> {orchardA?.location || 'Belirtilmemiş'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ruler size={16} className="text-muted" />
                      <span><strong>Alan:</strong> {orchardA?.areaHectare ? `${orchardA.areaHectare} Hektar` : 'Belirtilmemiş'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} className="text-muted" />
                      <span><strong>Oluşturma:</strong> {orchardA?.createdAt ? new Date(orchardA.createdAt).toLocaleDateString('tr-TR') : '—'}</span>
                    </div>
                    {summaryA?.lastIrrigation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>💧</span>
                        <span>
                          <strong>Son Sulama:</strong>{' '}
                          {new Date(summaryA.lastIrrigation.loggedAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ORCHARD B METADATA */}
                <div className="card" style={{ borderLeft: `5px solid ${metricConfig[activeMetric].colorB}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>🌿 {orchardB?.name}</h2>
                    {summaryB?.unreadAlertCount && summaryB.unreadAlertCount > 0 ? (
                      <span className="badge badge-red">{summaryB.unreadAlertCount} Aktif Uyarı</span>
                    ) : (
                      <span className="badge badge-green">Normal Durum</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} className="text-muted" />
                      <span><strong>Konum:</strong> {orchardB?.location || 'Belirtilmemiş'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ruler size={16} className="text-muted" />
                      <span><strong>Alan:</strong> {orchardB?.areaHectare ? `${orchardB.areaHectare} Hektar` : 'Belirtilmemiş'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} className="text-muted" />
                      <span><strong>Oluşturma:</strong> {orchardB?.createdAt ? new Date(orchardB.createdAt).toLocaleDateString('tr-TR') : '—'}</span>
                    </div>
                    {summaryB?.lastIrrigation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>💧</span>
                        <span>
                          <strong>Son Sulama:</strong>{' '}
                          {new Date(summaryB.lastIrrigation.loggedAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LATEST SENSOR READINGS COMPARISON GRID */}
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📡 Güncel Sensör Durumu (Karşılaştırmalı)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* SOIL MOISTURE */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                    <Droplets size={20} />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Toprak Nemi</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardA?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.soilMoisture.colorA }}>
                        {summaryA?.lastReading?.soilMoisture != null ? `%${summaryA.lastReading.soilMoisture.toFixed(1)}` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardB?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.soilMoisture.colorB }}>
                        {summaryB?.lastReading?.soilMoisture != null ? `%${summaryB.lastReading.soilMoisture.toFixed(1)}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TEMPERATURE */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                    <Thermometer size={20} />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Hava Sıcaklığı</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardA?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.airTemperature.colorA }}>
                        {summaryA?.lastReading?.airTemperature != null ? `${summaryA.lastReading.airTemperature.toFixed(1)}°C` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardB?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.airTemperature.colorB }}>
                        {summaryB?.lastReading?.airTemperature != null ? `${summaryB.lastReading.airTemperature.toFixed(1)}°C` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HUMIDITY */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4' }}>
                    <Wind size={20} />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Hava Nemi</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardA?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.airHumidity.colorA }}>
                        {summaryA?.lastReading?.airHumidity != null ? `%${summaryA.lastReading.airHumidity.toFixed(1)}` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardB?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.airHumidity.colorB }}>
                        {summaryB?.lastReading?.airHumidity != null ? `%${summaryB.lastReading.airHumidity.toFixed(1)}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LIGHT LEVEL */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308' }}>
                    <Sun size={20} />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Işık Seviyesi</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardA?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.lightLevel.colorA }}>
                        {summaryA?.lastReading?.lightLevel != null ? `${summaryA.lastReading.lightLevel} lux` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{orchardB?.name}:</span>
                      <span style={{ fontWeight: 700, color: metricConfig.lightLevel.colorB }}>
                        {summaryB?.lastReading?.lightLevel != null ? `${summaryB.lastReading.lightLevel} lux` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HISTORICAL CHART COMPARISON */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600 }}>📈 Tarihsel Sensör Karşılaştırma Grafiği</h3>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    <button
                      className={`btn btn-sm ${activeMetric === 'soilMoisture' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveMetric('soilMoisture')}
                    >
                      Toprak Nemi
                    </button>
                    <button
                      className={`btn btn-sm ${activeMetric === 'airTemperature' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveMetric('airTemperature')}
                    >
                      Sıcaklık
                    </button>
                    <button
                      className={`btn btn-sm ${activeMetric === 'airHumidity' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveMetric('airHumidity')}
                    >
                      Hava Nemi
                    </button>
                    <button
                      className={`btn btn-sm ${activeMetric === 'lightLevel' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveMetric('lightLevel')}
                    >
                      Işık Şiddeti
                    </button>
                  </div>
                </div>

                <div style={{ height: '320px', position: 'relative' }}>
                  {readingsA.length === 0 && readingsB.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                      <div className="empty-state-icon">📊</div>
                      <div className="empty-state-title font-bold">Veri Bulunamadı</div>
                      <div className="empty-state-desc">Her iki bahçeye ait geçmiş sensör verisi yüklenemedi.</div>
                    </div>
                  ) : (
                    <Line data={chartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* GEMINI AI COMPARISON REPORT */}
              <div
                className="card"
                style={{
                  marginBottom: '24px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(59, 130, 246, 0.04))',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🤖</span>
                    <h3 style={{ fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
                      Yapay Zeka Karşılaştırmalı Analizi
                    </h3>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleAiCompare}
                    disabled={aiLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Sparkles size={16} />
                    {aiLoading ? 'Analiz Ediliyor...' : 'Yapay Zeka Analizini Başlat'}
                  </button>
                </div>

                {aiLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Gemini iki bahçenin verilerini karşılaştırıyor ve ziraat mühendisliği tavsiyelerini hazırlıyor...
                    </div>
                  </div>
                ) : aiReport ? (
                  <div
                    className="slide-up"
                    style={{
                      padding: '20px',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.7',
                      fontSize: '14px',
                      color: '#e2e8f0',
                    }}
                  >
                    {aiReport}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13.5px', fontStyle: 'italic' }}>
                    Her iki bahçenizin anlık sensör durumunu, büyüklüğünü ve uyarı sayılarını Gemini yapay zekasına
                    göndererek sulama sırası önceliği, toprak sağlığı ve olası narenciye hastalık riskleri hakkında
                    karşılaştırmalı bir rapor almak için <strong>"Yapay Zeka Analizini Başlat"</strong> butonuna tıklayın.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
