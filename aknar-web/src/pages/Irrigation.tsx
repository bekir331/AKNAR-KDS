import { useEffect, useState } from 'react';
import { getIrrigationLogs, createIrrigationLog, deleteIrrigationLog } from '../api/irrigation';
import { getOrchards } from '../api/orchards';
import type { IrrigationLog, Orchard } from '../types';
import toast from 'react-hot-toast';

export default function Irrigation() {
  const [logs, setLogs] = useState<IrrigationLog[]>([]);
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [selectedOrchard, setSelectedOrchard] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [l, o] = await Promise.all([getIrrigationLogs(), getOrchards()]);
      setLogs(l);
      setOrchards(o);
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrchard) { toast.error('Bahçe seçin'); return; }
    try {
      await createIrrigationLog({ orchardId: selectedOrchard, note });
      toast.success('Sulama kaydedildi ✅');
      setShowModal(false);
      setNote('');
      setSelectedOrchard(null);
      load();
    } catch {
      toast.error('Kayıt oluşturulamadı');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu sulama kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await deleteIrrigationLog(id);
      toast.success('Sulama kaydı silindi');
      load();
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  };

  const orchardName = (id: number) => orchards.find((o) => o.id === id)?.name ?? `Bahçe #${id}`;

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">💧 Sulama Kayıtları</h1>
          <p className="page-subtitle">{logs.length} kayıt</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Sulama Yaptım
        </button>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💧</div>
            <div className="empty-state-title">Henüz sulama kaydı yok</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bahçe</th>
                  <th>Not</th>
                  <th>Tarih</th>
                  <th style={{ textAlign: 'right' }}>Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🌿</span>
                        <span style={{ fontWeight: 600 }}>{orchardName(log.orchardId)}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.note || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(log.loggedAt).toLocaleString('tr-TR')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm"
                        style={{ color: 'var(--color-danger)', border: '1px solid var(--border)' }}
                        onClick={() => handleDelete(log.id)}
                      >
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">💧 Sulama Kaydı Ekle</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Bahçe *</label>
                <select
                  className="form-select"
                  value={selectedOrchard ?? ''}
                  onChange={(e) => setSelectedOrchard(e.target.value ? Number(e.target.value) : null)}
                  required
                >
                  <option value="">Bahçe seçin...</option>
                  {orchards.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Not</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ör: Damla sulama, 2 saat yapıldı..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">✅ Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
