import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getDiseases } from '../api/diseases';
import type { DiseaseRecommendation } from '../types';
import { Search, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DiseaseGuide() {
  const [diseases, setDiseases] = useState<DiseaseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getDiseases()
      .then((data) => setDiseases(data))
      .catch(() => toast.error('Hastalık rehberi yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  const filteredDiseases = diseases.filter((d) => 
    d.diseaseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <BookOpen className="text-primary" size={28} /> Hastalık Rehberi
          </h1>
          <p className="page-subtitle">Narenciye hastalıkları, tedavi yöntemleri ve koruyucu önlemler ansiklopedisi</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Hastalık veya belirti ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {filteredDiseases.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Search className="empty-state-icon" size={48} />
            <div className="empty-state-title">Sonuç Bulunamadı</div>
            <div className="empty-state-desc">"{searchTerm}" ile eşleşen bir hastalık bulunmuyor.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredDiseases.map((disease) => {
            const isHealthy = disease.diseaseName.toLowerCase() === 'healthy leaf' || disease.diseaseName.toLowerCase().includes('sağlıklı');
            
            return (
              <div key={disease.id} className="card" style={{ borderLeft: `4px solid ${isHealthy ? 'var(--color-success)' : disease.riskLevel === 'High' ? 'var(--color-danger)' : 'var(--color-warning)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)' }}>
                      {disease.diseaseName}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isHealthy && (
                        <span className={`badge ${disease.riskLevel === 'High' ? 'badge-red' : 'badge-orange'}`}>
                          Risk: {disease.riskLevel === 'High' ? 'Yüksek' : 'Orta'}
                        </span>
                      )}
                      {disease.seasonWarning && (
                        <span className="badge badge-gray">
                          Mevsim: {disease.seasonWarning}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  {disease.description}
                </div>

                {!isHealthy && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={16} /> Koruyucu Önlemler
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                        {disease.prevention}
                      </p>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Tedavi Yöntemi
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                        {disease.treatment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
