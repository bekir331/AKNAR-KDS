import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Yeşil Bahçe İkonu (Premium görünüm)
const greenIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          <span style="transform: rotate(45deg); font-size: 16px;">🌿</span>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function DashboardMap({ orchards }: { orchards: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();

  // Haritayı SADECE BİR KEZ başlat — orchards bağımlılığı YOK
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const defaultCenter: [number, number] = [36.8841, 30.7056];

    leafletMap.current = L.map(mapRef.current, {
      // Zoom animasyonu sırasında _leaflet_pos hatasını önlemek için
      zoomAnimation: true,
      fadeAnimation: true,
    }).setView(defaultCenter, 6);

    // Uydu + Yer İsimleri (Google Hybrid Görünümü)
    L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Google Maps Hybrid'
    }).addTo(leafletMap.current);

    return () => {
      // Temizleme: haritayı tamamen kaldır
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
      markersRef.current = [];
    };
  }, []); // Boş bağımlılık — sadece mount/unmount'ta çalışır

  // Marker'ları orchards değiştiğinde güncelle (haritayı yeniden oluşturmadan)
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Eski marker'ları temizle
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validOrchards = orchards.filter(o => o.orchard.latitude && o.orchard.longitude);

    if (validOrchards.length === 0) return;

    // Bahçeleri haritaya ekle
    validOrchards.forEach(({ orchard, summary }) => {
      const marker = L.marker([orchard.latitude, orchard.longitude], { icon: greenIcon }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="padding: 10px; font-family: 'Inter', sans-serif; min-width: 150px;">
          <div style="color: #10b981; font-weight: 800; font-size: 14px; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
            🌿 ${orchard.name}
          </div>
          <div style="font-size: 12px; color: #4b5563; line-height: 1.5;">
             💧 Nem: <b>%${summary?.lastReading?.soilMoisture?.toFixed(1) ?? '—'}</b><br/>
             🌡️ Sıcaklık: <b>${summary?.lastReading?.airTemperature?.toFixed(1) ?? '—'}°C</b>
          </div>
          <button id="btn-orchard-${orchard.id}" style="width: 100%; margin-top: 10px; padding: 8px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s;">
            Bahçe Detayına Git →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'custom-popup' });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-orchard-${orchard.id}`);
        if (btn) {
          btn.onclick = () => navigate(`/orchards/${orchard.id}`);
        }
      });

      markersRef.current.push(marker);
    });

    // Tüm bahçeleri kapsayacak şekilde haritayı sığdır
    if (validOrchards.length === 1) {
      map.setView([validOrchards[0].orchard.latitude, validOrchards[0].orchard.longitude], 12);
    } else {
      const group = L.featureGroup(
        validOrchards.map(o => L.marker([o.orchard.latitude, o.orchard.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [orchards, navigate]);

  return (
    <div className="card" style={{ height: '500px', padding: '0', overflow: 'hidden', marginBottom: '24px', position: 'relative', zIndex: 1, borderRadius: '16px', border: '1px solid rgba(16,185,129,0.2)' }}>
      <div style={{ 
        position: 'absolute', 
        top: '15px', 
        left: '50px', 
        zIndex: 1000, 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(4px)',
        padding: '8px 16px', 
        borderRadius: '30px', 
        border: '1px solid #10b981', 
        fontSize: '13px', 
        fontWeight: 700, 
        color: '#064e3b',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '18px' }}>🛰️</span> Aktif Bahçe Lokasyonları
      </div>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
