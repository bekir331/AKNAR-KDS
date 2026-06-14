import { useEffect, useState } from 'react';
import { getOrchards } from '../api/orchards';
import { getSensorsByOrchard, getSensorAnalysis } from '../api/sensors';
import SensorChart from '../components/SensorChart';
import type { Orchard, SensorReading } from '../types';
import toast from 'react-hot-toast';

export default function Reports() {
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [selectedOrchardId, setSelectedOrchardId] = useState<number | ''>('');
  const [limit, setLimit] = useState<number>(100);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  const [activeMetric, setActiveMetric] = useState<'soilMoisture' | 'airTemperature' | 'airHumidity' | 'lightLevel'>('soilMoisture');
  const [aiReport, setAiReport] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    getOrchards()
      .then((data) => {
        setOrchards(data);
        if (data.length > 0) {
          setSelectedOrchardId(data[0].id);
        }
      })
      .catch(() => toast.error('Bahçeler yüklenirken hata oluştu'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrchardId === '') return;
    setLoadingData(true);
    getSensorsByOrchard(Number(selectedOrchardId), limit)
      .then(setReadings)
      .catch(() => toast.error('Sensör verileri yüklenemedi'))
      .finally(() => setLoadingData(false));
  }, [selectedOrchardId, limit]);

  const handleAnalyze = async () => {
    if (!selectedOrchardId) return;
    setAiLoading(true);
    setAiReport('');
    try {
      const report = await getSensorAnalysis(Number(selectedOrchardId), limit);
      setAiReport(report);
      toast.success('Yapay zeka analizi tamamlandı');
    } catch {
      toast.error('Analiz edilirken hata oluştu');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">📈 Gelişmiş Sensör Raporları</h1>
          <p className="page-subtitle">Geçmişe dönük iklim ve toprak verilerini inceleyin</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Bahçe Seçimi</label>
            <select 
              className="form-select" 
              value={selectedOrchardId} 
              onChange={(e) => setSelectedOrchardId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seçiniz...</option>
              {orchards.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Veri Limiti</label>
            <select 
              className="form-select" 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={50}>Son 50 Kayıt</option>
              <option value={100}>Son 100 Kayıt</option>
              <option value={200}>Son 200 Kayıt</option>
              <option value={500}>Son 500 Kayıt</option>
            </select>
          </div>
        </div>
      </div>

      {selectedOrchardId === '' ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🌿</div>
            <div className="empty-state-title">Bahçe Seçin</div>
            <div className="empty-state-desc">Raporları görmek için lütfen yukarıdan bir bahçe seçin.</div>
          </div>
        </div>
      ) : loadingData ? (
        <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <div>Veriler yükleniyor...</div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              <button 
                className={`btn btn-sm ${activeMetric === 'soilMoisture' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMetric('soilMoisture')}
              >
                💧 Toprak Nemi
              </button>
              <button 
                className={`btn btn-sm ${activeMetric === 'airTemperature' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMetric('airTemperature')}
              >
                🌡️ Hava Sıcaklığı
              </button>
              <button 
                className={`btn btn-sm ${activeMetric === 'airHumidity' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMetric('airHumidity')}
              >
                ☁️ Hava Nemi
              </button>
              <button 
                className={`btn btn-sm ${activeMetric === 'lightLevel' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMetric('lightLevel')}
              >
                ☀️ Işık Seviyesi
              </button>
            </div>
            
            <SensorChart readings={readings} metric={activeMetric} />
          </div>

          <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <h3 style={{ fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Yapay Zeka Karar Destek Raporu</h3>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleAnalyze} 
                disabled={aiLoading || readings.length === 0}
              >
                {aiLoading ? 'Analiz Ediliyor...' : 'Verileri Analiz Et'}
              </button>
            </div>
            
            {aiReport ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {aiReport}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                Sensör geçmiş verilerinizi Gemini yapay zekasına göndererek sulama, hastalık riski ve genel bahçe sağlığı hakkında tavsiye almak için "Verileri Analiz Et" butonuna tıklayın.
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Ham Veri Tablosu</h3>
            {readings.length === 0 ? (
              <div className="empty-state">Veri bulunamadı</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Tarih / Saat</th>
                      <th>Cihaz ID</th>
                      <th>Toprak Nemi</th>
                      <th>Hava Sıcaklığı</th>
                      <th>Hava Nemi</th>
                      <th>Işık Seviyesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{new Date(r.readAt).toLocaleString('tr-TR')}</td>
                        <td style={{ color: 'var(--text-muted)' }}>#{r.deviceId}</td>
                        <td>{r.soilMoisture != null ? `%${r.soilMoisture.toFixed(1)}` : '-'}</td>
                        <td>{r.airTemperature != null ? `${r.airTemperature.toFixed(1)}°C` : '-'}</td>
                        <td>{r.airHumidity != null ? `%${r.airHumidity.toFixed(1)}` : '-'}</td>
                        <td>{r.lightLevel != null ? `${r.lightLevel} lux` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
