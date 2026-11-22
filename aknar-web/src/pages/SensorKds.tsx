import React, { useState, useEffect, useMemo } from 'react';
import { getOrchards } from '../api/orchards';
import { getSensorKdsReport, getKdsStatus, trainSensorModel, getKdsHistory } from '../api/sensorKds';
import type { Orchard } from '../types';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface KdsHistory {
  id: string;
  date: Date;
  orchardId: number;
  orchardName: string;
  score: number;
  risk: 'DÜŞÜK RİSK' | 'ORTA RİSK' | 'KRİTİK';
  advice: string;
}

export default function SensorKds() {
  const { isAdmin } = useAuth();
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [selectedOrchardId, setSelectedOrchardId] = useState<number | ''>('');
  const [report, setReport] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<KdsHistory[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [orchardsData, statusData, historyData] = await Promise.all([
        getOrchards(),
        getKdsStatus(),
        getKdsHistory()
      ]);
      setOrchards(orchardsData);
      setStatus(statusData);
      setAnalysisHistory(historyData);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu.');
    }
  };

  const selectedOrchard = useMemo(() =>
    orchards.find(o => o.id === selectedOrchardId),
    [orchards, selectedOrchardId]
  );

  const handleAnalyze = async () => {
    if (!selectedOrchardId) return;
    setLoading(true);
    try {
      const data = await getSensorKdsReport(Number(selectedOrchardId));
      setReport(data);
      
      // Geçmişi yenile
      const historyData = await getKdsHistory();
      setAnalysisHistory(historyData);
      
      toast.success('Yapay zeka analizi tamamlandı.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Analiz başarısız.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      const result = await trainSensorModel();
      const m = result.metrics;
      if (m) {
        toast.success(`Model eğitildi!\nBaşarı (R²): %${(m.RSquared * 100).toFixed(1)}\nHata: ${m.RootMeanSquaredError.toFixed(2)}`, { duration: 5000 });
      } else {
        toast.success('Yapay zeka modeli başarıyla güncellendi.');
      }
      loadInitialData();
    } catch (error) {
      toast.error('Eğitim hatası.');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 28px' }}>
      {/* PAGE HEADER */}
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🧠</span>
            <div>
              <h1 className="page-title">Yapay Zeka Karar Destek</h1>
              <p className="page-subtitle">Sensör Verileriyle Akıllı Sulama ve Risk Analizi</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={handleTrain}
              disabled={training}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {training ? '⚙️' : '🔄'} {training ? 'Eğitim...' : 'Modeli Yeniden Eğit'}
            </button>
          )}
        </div>
      </header>

      {/* KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <KpiCard
          label="Son Analiz Skoru"
          value={report?.score ?? '—'}
          unit="%"
          icon="📊"
          color="#3b82f6"
          description={report ? `Risk: ${report.score > 70 ? '🔴 KRİTİK' : report.score > 40 ? '🟡 ORTA' : '🟢 DÜŞÜK'}` : 'Analiz yapılmamış'}
        />
        <KpiCard
          label="Model Durumu"
          value={status?.modelReady ? '✅ Hazır' : '⏳ Hazırlanıyor'}
          unit=""
          icon="🤖"
          color={status?.modelReady ? '#10b981' : '#f59e0b'}
          description={`Acc: ${status?.accuracy ? (status.accuracy * 100).toFixed(1) : '0'}%`}
        />
        <KpiCard
          label="Toplam Analiz"
          value={analysisHistory.length}
          unit="tanesi"
          icon="📈"
          color="#8b5cf6"
          description={`Son 24 saat: ${analysisHistory.filter(a => new Date(a.date).getTime() > Date.now() - 86400000).length}`}
        />
        <KpiCard
          label="Kritik Riskler"
          value={analysisHistory.filter(a => a.risk === 'KRİTİK').length}
          unit="algı"
          icon="🚨"
          color="#ef4444"
          description="Acil müdahale gereken"
        />
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '28px' }}>
        {/* SIDEBAR - Bahçe Seçimi ve Kontrol */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
          <div>
            <label className="form-label">🌾 Bahçe Seçimi</label>
            <select
              className="form-input"
              value={selectedOrchardId}
              onChange={(e) => setSelectedOrchardId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seçiniz...</option>
              {orchards.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {selectedOrchard && (
            <div className="animate-fade-in" style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h4 style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                📍 Bahçe Bilgileri
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ad:</span>
                  <span style={{ fontWeight: '500' }}>{selectedOrchard.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Konum:</span>
                  <span>{selectedOrchard.location || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Alan:</span>
                  <span>{selectedOrchard.areaHectare ? `${selectedOrchard.areaHectare} ha` : '—'}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(16,185,129,0.1)', marginTop: '8px', paddingTop: '8px' }}>
                  <Link
                    to={`/orchards/${selectedOrchard.id}`}
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#10b981',
                      textDecoration: 'none',
                      fontWeight: '600',
                      textAlign: 'center',
                      padding: '6px'
                    }}
                  >
                    → Tam Detaya Git
                  </Link>
                </div>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading || !selectedOrchardId || !status?.modelReady}
            style={{ width: '100%', height: '48px', marginTop: 'auto' }}
          >
            {loading ? '⏳ Analiz Ediliyor...' : '⚡ Analizi Başlat'}
          </button>
        </div>

        {/* MAIN CONTENT - Skor ve Tavsiye */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
          {!report ? (
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Analiz Başlatılmamış</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Bahçe seçerek yapay zeka analizi başlatın
              </p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              {/* Score Circle */}
              <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  border: '8px solid var(--border)',
                  borderTopColor: report.score > 70 ? '#ef4444' : report.score > 40 ? '#f59e0b' : '#10b981',
                  borderRightColor: report.score > 70 ? '#ef4444' : report.score > 40 ? '#f59e0b' : '#10b981',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  position: 'relative',
                  background: 'rgba(0,0,0,0.1)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3) inset'
                }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold' }}>{report.score}%</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>TOPLAM RİSK</span>
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'inline-block',
                  fontWeight: '600',
                  fontSize: '12px',
                  background: report.score > 70 ? 'rgba(239,68,68,0.2)' : report.score > 40 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                  color: report.score > 70 ? '#ef4444' : report.score > 40 ? '#f59e0b' : '#10b981'
                }}>
                  {report.score > 70 ? '🔴 KRİTİK' : report.score > 40 ? '🟡 ORTA RİSK' : '🟢 DÜŞÜK RİSK'}
                </div>
              </div>

              {/* Advice Box */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    background: 'linear-gradient(45deg, #10b981, #3b82f6)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                  }}>
                    ✨ Yapay Zeka Karar Destek Raporu
                  </span>
                </h3>
                <div style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderLeft: `5px solid ${report.score > 70 ? '#ef4444' : report.score > 40 ? '#f59e0b' : '#10b981'}`,
                  lineHeight: '1.7',
                  position: 'relative',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ 
                    fontSize: '15px', 
                    color: '#e2e8f0', 
                    fontFamily: 'inherit'
                  }} className="markdown-body">
                    <ReactMarkdown>{report.advice}</ReactMarkdown>
                  </div>
                  
                  <div style={{ 
                    marginTop: '20px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid rgba(255,255,255,0.05)', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>📊 Kaynak: ML.NET Hibrit Model v2.1</span>
                    <span>🕒 Analiz: {new Date(report.analyzedAt).toLocaleTimeString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SENSOR METRICS */}
      {report && (
        <div className="animate-fade-in" style={{ marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📡 Canlı Sensör Metrikleri
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            <MetricCard
              label="Toprak Nemi"
              value={`${report.reading.soilMoisture}%`}
              icon="💧"
              color="#3b82f6"
              desc="Kök bölgesi nemlilik"
              status={report.reading.soilMoisture > 80 ? 'Yüksek' : report.reading.soilMoisture > 40 ? 'Normal' : 'Düşük'}
            />
            <MetricCard
              label="Hava Sıcaklığı"
              value={`${report.reading.airTemperature}°C`}
              icon="🌡️"
              color="#ef4444"
              desc="Çevredeki ısı seviyesi"
              status={report.reading.airTemperature > 30 ? 'Yüksek' : report.reading.airTemperature > 15 ? 'Normal' : 'Düşük'}
            />
            <MetricCard
              label="Hava Nemi"
              value={`${report.reading.airHumidity}%`}
              icon="☁️"
              color="#10b981"
              desc="Atmosferik nem oranı"
              status={report.reading.airHumidity > 70 ? 'Yüksek' : report.reading.airHumidity > 40 ? 'Normal' : 'Düşük'}
            />
            <MetricCard
              label="Işık Şiddeti"
              value={`${report.reading.lightLevel}`}
              icon="☀️"
              color="#f59e0b"
              desc="Fotosentez potansiyeli"
              status={report.reading.lightLevel > 10000 ? 'Optimal' : report.reading.lightLevel > 5000 ? 'Yeterli' : 'Düşük'}
            />
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {isAdmin && (
        <div className="animate-fade-in" style={{ marginBottom: '28px', padding: '20px', borderRadius: '12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#a78bfa' }}>
            🔧 Admin Kontrol Paneli
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Model Başarısı</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>
                {status?.accuracy ? `${(status.accuracy * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Toplam Analiz</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>
                {status?.totalAnalysis || 0}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Model Versiyon</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>
                v{status?.modelVersion || '1.0'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS HISTORY TABLE */}
      {analysisHistory.length > 0 && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>📋 Analiz Geçmişi</h3>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>📅 Tarih</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>🌾 Bahçe</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Skor</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Risk</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Tavsiye</th>
                </tr>
              </thead>
              <tbody>
                {analysisHistory.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <tr style={{
                      borderBottom: idx < analysisHistory.length - 1 && expandedRow !== item.id ? '1px solid var(--border)' : 'none',
                      background: idx % 2 ? 'rgba(0,0,0,0.1)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                    title="Detayları görmek için tıklayın"
                    >
                      <td style={{ padding: '12px' }}>
                        {new Date(item.date).toLocaleString('tr-TR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px' }}>{item.orchardName}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: item.score > 70 ? '#ef4444' : item.score > 40 ? '#f59e0b' : '#10b981' }}>
                        {item.score}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: item.risk === 'KRİTİK' ? 'rgba(239,68,68,0.2)' : item.risk === 'ORTA RİSK' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                          color: item.risk === 'KRİTİK' ? '#ef4444' : item.risk === 'ORTA RİSK' ? '#f59e0b' : '#10b981'
                        }}>
                          {item.risk}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.advice}
                        <span style={{ fontSize: '10px', marginLeft: '8px', color: '#10b981' }}>{expandedRow === item.id ? '▲ Gizle' : '▼ Oku'}</span>
                      </td>
                    </tr>
                    {expandedRow === item.id && (
                      <tr style={{ 
                        background: idx % 2 ? 'rgba(0,0,0,0.1)' : 'transparent', 
                        borderBottom: idx < analysisHistory.length - 1 ? '1px solid var(--border)' : 'none' 
                      }}>
                        <td colSpan={5} style={{ padding: '0 12px 16px 12px' }}>
                          <div className="animate-fade-in markdown-body" style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            padding: '16px', 
                            borderRadius: '8px', 
                            fontSize: '13px', 
                            lineHeight: '1.6', 
                            color: 'var(--text-primary)', 
                            borderLeft: '4px solid #10b981',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}>
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#10b981' }}>
                              <span>💡</span> Detaylı Tavsiye:
                            </strong>
                            <ReactMarkdown>{item.advice}</ReactMarkdown>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, unit, icon, color, description }: any) {
  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '48px', opacity: 0.08 }}>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px' }}>
            {label}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color, lineHeight: '1' }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      {description && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {description}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, color, desc, status }: any) {
  return (
    <div className="card" style={{
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '64px', opacity: 0.08 }}>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${color}15`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 'bold', color }}>
        {value}
      </div>
      {status && (
        <div style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          background: `${color}20`,
          color: color,
          width: 'fit-content'
        }}>
          {status}
        </div>
      )}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto' }}>
        {desc}
      </div>
    </div>
  );
}
