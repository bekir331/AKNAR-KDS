import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import ReactMarkdown from 'react-markdown';
import { predictLeaf } from '../api/predictions';
import { getOrchards } from '../api/orchards';
import type { Orchard, MLPrediction } from '../types';
import toast from 'react-hot-toast';
import { getCroppedImg } from '../utils/cropImage';

const riskBadge: Record<string, string> = {
  Low: 'badge-green',
  Medium: 'badge-orange',
  High: 'badge-red',
  Critical: 'badge-red',
};

export default function Predict() {
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [selectedOrchard, setSelectedOrchard] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<MLPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    getOrchards().then(setOrchards).catch(() => {});
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setShowCropModal(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    try {
      if (!preview || !croppedAreaPixels) return;
      const croppedFile = await getCroppedImg(preview, croppedAreaPixels, file?.name ?? 'cropped.jpg');
      setFile(croppedFile);
      setPreview(URL.createObjectURL(croppedFile));
      setShowCropModal(false);
    } catch (e) {
      toast.error('Resim kırpılamadı');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handlePredict = async () => {
    if (!file) { toast.error('Lütfen bir yaprak görseli seçin'); return; }
    if (!selectedOrchard) { toast.error('Lütfen bir bahçe seçin'); return; }

    setLoading(true);
    try {
      const res = await predictLeaf(selectedOrchard, file);
      setResult(res);
      toast.success('Tahmin tamamlandı! 🔬');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; detail?: string } } };
      const msg = axiosErr?.response?.data?.error ?? 'Tahmin yapılamadı';
      const detail = axiosErr?.response?.data?.detail;
      toast.error(msg, { duration: 5000 });
      if (detail) {
        toast(detail, { icon: 'ℹ️', duration: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔬 Yaprak Tahmini</h1>
          <p className="page-subtitle">ML.NET + Gemini AI ile hastalık tespiti</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Sol — Yükleme */}
        <div>
          <div className="card mb-4">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
              1. Bahçe Seç
            </h3>
            <select
              id="orchard-select"
              className="form-select"
              value={selectedOrchard ?? ''}
              onChange={(e) => setSelectedOrchard(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Bahçe seçin...</option>
              {orchards.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="card mb-4">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
              2. Yaprak Görseli Yükle
            </h3>
            <div
              {...getRootProps()}
              id="dropzone"
              style={{
                border: `2px dashed ${isDragActive ? 'var(--color-primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'rgba(16,185,129,0.06)' : 'rgba(13,17,23,0.5)',
                transition: 'var(--transition)',
              }}
            >
              <input {...getInputProps()} />
              {preview && !showCropModal ? (
                <div>
                  <img
                    src={preview}
                    alt="Yüklenen yaprak"
                    style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                  />
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {file?.name} · {((file?.size ?? 0) / 1024).toFixed(1)} KB
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px' }}
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); }}
                  >
                    🗑️ Kaldır
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍃</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {isDragActive ? 'Bırakın!' : 'Yaprak görselini sürükle-bırak veya tıkla'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    JPG, PNG, WebP · Maks 10 MB
                  </div>
                </>
              )}
            </div>

            {/* Crop Modal / Inline Editor */}
            {showCropModal && preview && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: 'rgba(13,17,23,0.8)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}>
                <h4 style={{ marginBottom: '12px', fontSize: '13px', color: '#10b981' }}>✂️ Yaprağı Çerçeveye Sığdırın</h4>
                <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <Cropper
                    image={preview}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 3}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); setShowCropModal(false); }}>İptal</button>
                  <button className="btn btn-secondary" onClick={() => setShowCropModal(false)}>Kırpmadan Kullan</button>
                  <button className="btn btn-primary" onClick={handleCropConfirm}>✅ Kırp ve Onayla</button>
                </div>
              </div>
            )}
          </div>

          <button
            id="predict-btn"
            className="btn btn-primary btn-lg w-full"
            style={{ justifyContent: 'center' }}
            onClick={handlePredict}
            disabled={loading || !file || !selectedOrchard}
          >
            {loading ? (
              <><span className="loading-spinner" style={{ width: '16px', height: '16px' }} /> Analiz ediliyor...</>
            ) : (
              '🔬 Tahmin Yap'
            )}
          </button>
        </div>

        {/* Sağ — Sonuç */}
        <div>
          {result ? (
            <div className="card slide-up" style={{ height: '100%' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)' }}>
                📋 Tahmin Sonucu
              </h3>

              {/* Hastalık Başlığı */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px' }}>🍃</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {result.predictedLabel}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span className={`badge ${riskBadge[result.riskLevel] ?? 'badge-gray'}`}>
                    Risk: {result.riskLevel}
                  </span>
                  <span className="badge badge-purple">
                    %{result.confidence.toFixed(1)} doğruluk
                  </span>
                </div>

                {/* Güven Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Güven Skoru</span>
                    <span>%{result.confidence.toFixed(2)}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${result.confidence}%`,
                        background: result.confidence > 90 ? 'var(--color-primary)' : result.confidence > 70 ? '#f59e0b' : '#ef4444',
                        borderRadius: '3px',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Tanınamadı Uyarısı */}
              {result.predictedLabel === 'Tanınamadı' && (
                <div style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#f59e0b',
                  lineHeight: '1.6',
                }}>
                  ⚠️ Görsel yeterli güvenle sınıflandırılamadı. Lütfen daha net ve yakın çekim bir yaprak fotoğrafı yükleyin.
                </div>
              )}

              {/* Gemini Öneri */}
              {result.geminiRecommendation && result.geminiRecommendation.trim() !== "" && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    🤖 Gemini AI Önerisi
                  </div>
                  <div style={{
                    background: 'rgba(13,17,23,0.6)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.7',
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }} className="markdown-body">
                    <ReactMarkdown>{result.geminiRecommendation}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🔬</div>
                <div className="empty-state-title">Sonuç bekleniyor</div>
                <div className="empty-state-desc">
                  Bahçe ve görsel seçtikten sonra "Tahmin Yap" butonuna tıkla
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
