import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getLeafImages, deleteLeafImage } from '../api/leafImages';
import { getOrchards } from '../api/orchards';
import type { LeafImage, Orchard } from '../types';

// API Base URL'i çevre değişkeninden al (/api kısmını düşür)
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5139';

export default function History() {
  const [images, setImages] = useState<LeafImage[]>([]);
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [imgs, orchs] = await Promise.all([getLeafImages(), getOrchards()]);
      setImages(imgs);
      setOrchards(orchs);
    } catch {
      toast.error('Geçmiş analizler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu görseli ve analiz sonucunu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteLeafImage(id);
      toast.success('Analiz kaydı silindi');
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      toast.error('Silme işlemi başarısız oldu');
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📸 Geçmiş Analizler</h1>
          <p className="page-subtitle">Daha önce yüklediğiniz yaprak fotoğrafları ve makine öğrenimi sonuçları</p>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🖼️</div>
            <div className="empty-state-title">Henüz analiz geçmişi yok</div>
            <div className="empty-state-desc">Yaprak Tahmini sayfasından fotoğraf yükleyerek analiz yapabilirsiniz.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {images.map((img) => {
            const orchard = orchards.find(o => o.id === img.orchardId);
            const isHealthy = img.predictedLabel === 'Healthy Leaf';
            
            return (
              <div key={img.id} className="card" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '200px', backgroundColor: '#f0f0f0' }}>
                  <img 
                    src={`${API_BASE_URL}${img.imageUrl}`} 
                    alt="Analiz Edilen Yaprak" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/64748b?text=Görsel+Bulunamadı';
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', top: '12px', right: '12px', 
                    background: 'rgba(0,0,0,0.6)', color: 'white', 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 
                  }}>
                    {new Date(img.uploadedAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Bahçe: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{orchard?.name || 'Bilinmiyor'}</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: isHealthy ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {img.predictedLabel || 'Tahmin Bekleniyor'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div className="badge badge-gray">
                      Güven: %{img.confidence?.toFixed(1) || '0.0'}
                    </div>
                    <div className={`badge ${img.riskLevel === 'Low' ? 'badge-green' : 'badge-red'}`}>
                      Risk: {img.riskLevel === 'Low' ? 'Düşük' : 'Yüksek'}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-sm" 
                      style={{ color: 'var(--color-danger)', border: '1px solid var(--border)' }}
                      onClick={() => handleDelete(img.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
