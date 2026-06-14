import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Cpu, Power, Trash2, Plus, Wifi, WifiOff } from 'lucide-react';
import { getDevices, createDevice, toggleDevice, deleteDevice } from '../api/devices';
import { getOrchards } from '../api/orchards';
import type { Device, Orchard } from '../types';

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [selectedOrchard, setSelectedOrchard] = useState<number | ''>('');
  const [deviceCode, setDeviceCode] = useState('');
  const [model, setModel] = useState('');

  const loadData = async () => {
    try {
      const [devs, orchs] = await Promise.all([getDevices(), getOrchards()]);
      setDevices(devs);
      setOrchards(orchs);
    } catch {
      toast.error('Cihazlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrchard || !deviceCode) {
      toast.error('Lütfen bahçe seçin ve cihaz kodunu girin');
      return;
    }

    try {
      await createDevice({
        orchardId: Number(selectedOrchard),
        deviceCode,
        model
      });
      toast.success('Cihaz eklendi');
      setIsAdding(false);
      setDeviceCode('');
      setModel('');
      loadData();
    } catch {
      toast.error('Cihaz eklenemedi');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleDevice(id);
      toast.success('Cihaz durumu güncellendi');
      loadData();
    } catch {
      toast.error('Cihaz durumu güncellenemedi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Cihazı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDevice(id);
      toast.success('Cihaz silindi');
      loadData();
    } catch {
      toast.error('Cihaz silinemedi');
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /><span>Yükleniyor...</span></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Cpu className="text-primary" size={28} /> IoT Cihaz Yönetimi
          </h1>
          <p className="page-subtitle">Bahçelerinizdeki sensör ve kontrol cihazlarını yönetin</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setIsAdding(true)}>
          <Plus size={16} /> Yeni Cihaz Ekle
        </button>
      </div>

      {isAdding && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Yeni Cihaz Tanımla</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Bahçe</label>
              <select className="form-select" value={selectedOrchard} onChange={(e) => setSelectedOrchard(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Seçiniz...</option>
                {orchards.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cihaz Kodu (MAC/ID)</label>
              <input className="form-input" placeholder="Örn: ESP-001" value={deviceCode} onChange={(e) => setDeviceCode(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Model (Opsiyonel)</label>
              <input className="form-input" placeholder="Örn: NodeMCU v3" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">Kaydet</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>İptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        {devices.length === 0 ? (
          <div className="empty-state">
            <Cpu className="empty-state-icon" size={48} />
            <div className="empty-state-title">Kayıtlı cihaz yok</div>
            <div className="empty-state-desc">Henüz sisteminize tanımlanmış bir IoT cihazı bulunmuyor.</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th>Cihaz Bilgisi</th>
                  <th>Bahçe</th>
                  <th>Bağlantı Durumu</th>
                  <th>Cihaz Durumu</th>
                  <th style={{ textAlign: 'right' }}>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => {
                  const orchard = orchards.find((o) => o.id === device.orchardId);
                  
                  // Eğer son görülme zamanı 10 dakikadan eskiyse offline say
                  const isOnline = device.lastSeen && new Date().getTime() - new Date(device.lastSeen).getTime() < 10 * 60 * 1000;

                  return (
                    <tr key={device.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td style={{ borderRadius: '8px 0 0 8px' }}>
                        <div style={{ fontWeight: 600 }}>{device.deviceCode}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{device.model || 'Bilinmeyen Model'}</div>
                      </td>
                      <td>{orchard?.name || 'Bilinmiyor'}</td>
                      <td>
                        {isOnline ? (
                          <span className="badge badge-green flex items-center gap-1" style={{ width: 'fit-content' }}>
                            <Wifi size={12} /> Çevrimiçi
                          </span>
                        ) : (
                          <span className="badge badge-gray flex items-center gap-1" style={{ width: 'fit-content' }}>
                            <WifiOff size={12} /> Çevrimdışı
                          </span>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Son Görülme: {device.lastSeen ? new Date(device.lastSeen).toLocaleString('tr-TR') : 'Hiç'}
                        </div>
                      </td>
                      <td>
                        {device.isActive ? (
                          <span className="badge badge-blue">Aktif (Çalışıyor)</span>
                        ) : (
                          <span className="badge badge-gray">Pasif (Kapalı)</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', borderRadius: '0 8px 8px 0' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className={`btn btn-sm ${device.isActive ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggle(device.id)}
                            title={device.isActive ? 'Cihazı Kapat' : 'Cihazı Aç'}
                          >
                            <Power size={14} /> {device.isActive ? 'Kapat' : 'Aç'}
                          </button>
                          <button 
                            className="btn btn-sm" 
                            style={{ color: 'var(--color-danger)', border: '1px solid var(--border)' }}
                            onClick={() => handleDelete(device.id)}
                            title="Cihazı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
