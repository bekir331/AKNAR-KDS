import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// İkon düzeltmesi
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string, area?: number) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    name?: string;
    polygonCoordinates?: Array<[number, number]>; // Polygon sınırları
    areaHectare?: number;
  };
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  const initialMarkerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const defaultCenter: [number, number] = initialLocation 
      ? [initialLocation.latitude, initialLocation.longitude]
      : [36.8841, 30.7056]; // Antalya civarı
    leafletMap.current = L.map(mapRef.current).setView(defaultCenter, initialLocation ? 15 : 10);

    // Uydu + Yer İsimleri (Google Hybrid Görünümü)
    L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains:['mt0','mt1','mt2','mt3'],
      attribution: 'Google Maps Hybrid'
    }).addTo(leafletMap.current);

    // Mevcut konumu göster (varsa)
    if (initialLocation) {
      // Eğer polygon sınırları varsa, kırmızı taralı alan olarak göster
      if (initialLocation.polygonCoordinates && initialLocation.polygonCoordinates.length > 0) {
        const polygon = L.polygon(initialLocation.polygonCoordinates, {
          color: '#cc0000',
          weight: 3,
          opacity: 1,
          fillColor: '#ff4444',
          fillOpacity: 0.6
        })
          .bindPopup(`📍 <strong>Mevcut Bahçe Sınırları</strong><br>${initialLocation.name || 'Bahçe'}<br>Alan: ${initialLocation.areaHectare || '--'} hektar`)
          .addTo(leafletMap.current)
          .openPopup();
        
        initialMarkerRef.current = polygon;
        
        // Polygon'ın merkezine yakınlaş
        const bounds = polygon.getBounds();
        leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (initialLocation.areaHectare && initialLocation.areaHectare > 0) {
        // Polygon yoksa ama alan bilgisi varsa, merkez etrafında daire göster
        const areaSqMeters = initialLocation.areaHectare * 10000; // Hektar → m²
        const radiusMeters = Math.sqrt(areaSqMeters / Math.PI);
        
        // Leaflet'te metre → lat/lng dönüşümü (yaklaşık)
        // const latPerMeter = 1 / 111320;
        // const radiusLat = radiusMeters * latPerMeter;
        
        const circle = L.circle(
          [initialLocation.latitude, initialLocation.longitude],
          {
            radius: radiusMeters, // Leaflet metre kabul ediyor
            color: '#cc0000',
            weight: 3,
            opacity: 1,
            fillColor: '#ff4444',
            fillOpacity: 0.6
          }
        )
          .bindPopup(`📍 <strong>Tahmini Bahçe Alanı</strong><br>${initialLocation.name || 'Bahçe'}<br>Alan: ${initialLocation.areaHectare} hektar`)
          .addTo(leafletMap.current)
          .openPopup();
        
        initialMarkerRef.current = circle;
      } else {
        // Polygon ve alan yoksa, merkez noktayı marker olarak göster
        const marker = L.marker([initialLocation.latitude, initialLocation.longitude], { icon })
          .bindPopup(`📍 <strong>Mevcut Konum</strong><br>${initialLocation.name || 'Bahçe'}`)
          .addTo(leafletMap.current)
          .openPopup();
        initialMarkerRef.current = marker;
      }
    }

    // Geoman Çizim Araçlarını Etkinleştir
    (leafletMap.current as any).pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawCircleMarker: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
    });

    // Çizim bittiğinde tetiklenir
    leafletMap.current.on('pm:create', async (e: any) => {
      const layer = e.layer;
      
      // Eski layer'ı ve initial marker'ı kaldır
      if (layerRef.current) {
        layerRef.current.remove();
      }
      if (initialMarkerRef.current) {
        initialMarkerRef.current.remove();
      }
      
      // Çizilen şeklin stilini ayarla
      if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
        layer.setStyle({
          color: '#cc0000',           // Çerçeve rengi (kırmızı)
          weight: 3,                  // Çerçeve kalınlığı
          opacity: 1,                 // Çerçeve şeffaflığı
          fillColor: '#ff4444',       // İç rengi (net kırmızı)
          fillOpacity: 0.6            // İç şeffaflığı (%60)
        });
      }
      
      layerRef.current = layer;

      let lat = 0;
      let lng = 0;
      let areaHectare = 0;

      const calculateArea = (latlngs: any[]) => {
        let total = 0;
        const RADIUS = 6378137; // Dünya yarıçapı (metre)
        for (let i = 0; i < latlngs.length; i++) {
          const p1 = latlngs[i];
          const p2 = latlngs[(i + 1) % latlngs.length];
          total += (p2.lng - p1.lng) * Math.PI / 180 * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
        }
        return Math.abs(total * RADIUS * RADIUS / 2.0);
      };

      if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
        const latlngs = layer.getLatLngs()[0];
        const areaSqMeters = calculateArea(latlngs);
        areaHectare = Number((areaSqMeters / 10000).toFixed(2));
        
        const center = layer.getBounds().getCenter();
        lat = center.lat;
        lng = center.lng;
      } else if (e.shape === 'Marker') {
        const latlng = layer.getLatLng();
        lat = latlng.lat;
        lng = latlng.lng;
      }

      // Adres bilgisini al (Reverse Geocoding)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        const address = data.display_name.split(',').slice(0, 3).join(',').trim();
        onLocationSelect(lat, lng, address, areaHectare);
      } catch (error) {
        onLocationSelect(lat, lng, "", areaHectare);
      }
    });

    // Layer düzenlendiğinde tetiklenir (edit mode)
    leafletMap.current.on('pm:update', async (e: any) => {
      const layer = e.layer;
      
      // Initial marker'ı kaldır
      if (initialMarkerRef.current) {
        initialMarkerRef.current.remove();
      }

      // Düzenlenen layer'ın stilini güncelle
      if (layer.setStyle) {
        layer.setStyle({
          color: '#cc0000',
          weight: 3,
          opacity: 1,
          fillColor: '#ff4444',
          fillOpacity: 0.6
        });
      }

      let lat = 0;
      let lng = 0;
      let areaHectare = 0;

      const calculateArea = (latlngs: any[]) => {
        let total = 0;
        const RADIUS = 6378137;
        for (let i = 0; i < latlngs.length; i++) {
          const p1 = latlngs[i];
          const p2 = latlngs[(i + 1) % latlngs.length];
          total += (p2.lng - p1.lng) * Math.PI / 180 * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
        }
        return Math.abs(total * RADIUS * RADIUS / 2.0);
      };

      if (layer.getLatLngs) {
        const latlngs = layer.getLatLngs();
        if (Array.isArray(latlngs[0])) {
          const areaSqMeters = calculateArea(latlngs[0]);
          areaHectare = Number((areaSqMeters / 10000).toFixed(2));
          const center = layer.getBounds().getCenter();
          lat = center.lat;
          lng = center.lng;
        }
      } else {
        const latlng = layer.getLatLng();
        lat = latlng.lat;
        lng = latlng.lng;
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        const address = data.display_name.split(',').slice(0, 3).join(',').trim();
        onLocationSelect(lat, lng, address, areaHectare);
      } catch (error) {
        onLocationSelect(lat, lng, "", areaHectare);
      }
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [onLocationSelect]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div 
        ref={mapRef} 
        style={{ 
          height: '350px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          border: '2px solid var(--color-primary)',
          boxShadow: 'var(--shadow-lg)'
        }} 
      />
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', fontWeight: 500 }}>
        📐 <span style={{color: 'var(--color-primary)'}}>Poligon</span> aracını seçerek bahçenizin sınırlarını çizebilirsiniz.
      </div>
    </div>
  );
}
