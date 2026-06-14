import { useEffect, useState } from 'react';
import { getProducers } from '../api/producers';
import type { Producer } from '../types';
import toast from 'react-hot-toast';

export default function Producers() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducers()
      .then(setProducers)
      .catch(() => toast.error('Üreticiler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Üreticiler</h1>
          <p className="page-subtitle">{producers.length} üretici kayıtlı</p>
        </div>
      </div>

      <div className="card">
        {producers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">Henüz üretici yok</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Üretici</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Adres</th>
                </tr>
              </thead>
              <tbody>
                {producers.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {(p.fullName || 'AK').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.fullName || 'İsimsiz Üretici'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.email || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{p.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
