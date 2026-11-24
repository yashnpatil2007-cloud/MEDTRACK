import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, ExternalLink } from 'lucide-react';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
  markerTitle?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onChange,
  height = '280px',
  zoom = 15,
  markerTitle = 'Hospital Location',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom Hospital Marker Icon
      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-pin',
        html: `
          <div style="
            background: #DC2626;
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg); font-weight: 900; font-size: 16px;">+</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([latitude, longitude], {
        icon: hospitalIcon,
        draggable: true,
        title: markerTitle,
      }).addTo(map);

      marker.bindPopup(`<b>${markerTitle}</b><br/>Drag pin or click map to reposition`).openPopup();

      // Drag event
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      // Click map event
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      mapRef.current.setView([latitude, longitude], zoom);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }

    // Leaflet container resize fix
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [latitude, longitude, zoom, markerTitle]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onChange(lat, lng);
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true }
    );
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>Click on map or drag pin to adjust entrance location:</span>
        </span>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleLocateMe}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors"
          >
            <Navigation className="w-3 h-3" />
            <span>Use Current GPS</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors"
            title="Open coordinates in Google Maps in a new tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span>View on Google Maps</span>
          </a>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="rounded-xl border border-slate-300 overflow-hidden shadow-inner relative z-0"
      />

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
        <span>Lat: <b>{latitude}</b>, Lng: <b>{longitude}</b></span>
        <span className="text-[10px] text-slate-400 font-sans">OpenStreetMap & Google Maps Coordinate Aligned</span>
      </div>
    </div>
  );
};
