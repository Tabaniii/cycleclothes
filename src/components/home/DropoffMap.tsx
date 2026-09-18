'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DropoffMap.css';

const JAKARTA = { lat: -6.2146, lng: 106.817 };
const DEFAULT_ZOOM = 14;

type Coords = { lat: number; lng: number };

function Recenter({ coords }: { coords: Coords }) {
  const map = useMap();

  useEffect(() => {
    map.setView([coords.lat, coords.lng], DEFAULT_ZOOM, { animate: true });
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [coords, map]);

  return null;
}

function fallbackMessage(error?: GeolocationPositionError) {
  if (!error) return 'Lokasi tidak bisa dideteksi. Menampilkan peta Jakarta.';
  if (error.code === error.PERMISSION_DENIED) {
    return 'Izin lokasi ditolak. Menampilkan peta Jakarta.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Deteksi lokasi terlalu lama. Menampilkan peta Jakarta.';
  }
  return 'Lokasi tidak tersedia. Menampilkan peta Jakarta.';
}

export default function DropoffMap() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [notice, setNotice] = useState('');

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: 'dropoff-map-marker',
        html: `<span class="dropoff-map-pin" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path fill="#214944" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg></span>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -32],
      }),
    [],
  );

  useEffect(() => {
    function useJakarta(message: string) {
      setCoords(JAKARTA);
      setUsingFallback(true);
      setNotice(message);
    }

    if (typeof window === 'undefined') return;

    if (!window.isSecureContext) {
      useJakarta('Peta butuh koneksi aman (HTTPS). Menampilkan peta Jakarta.');
      return;
    }

    if (!navigator.geolocation) {
      useJakarta('Peramban tidak mendukung deteksi lokasi. Menampilkan peta Jakarta.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setUsingFallback(false);
        setNotice('');
      },
      (error) => useJakarta(fallbackMessage(error)),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60_000,
      },
    );
  }, []);

  return (
    <div id="map" className="dropoff-map absolute inset-0 h-full w-full">
      {coords ? (
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={DEFAULT_ZOOM}
          minZoom={4}
          maxZoom={19}
          zoomSnap={1}
          zoomDelta={1}
          scrollWheelZoom={false}
          className="dropoff-map-canvas"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <Marker position={[coords.lat, coords.lng]} icon={markerIcon}>
            <Popup>{usingFallback ? 'Jakarta (lokasi default)' : 'Lokasi kamu saat ini'}</Popup>
          </Marker>
          <Recenter coords={coords} />
        </MapContainer>
      ) : (
        <p className="flex h-full items-center justify-center text-xs text-brand-green/60">
          Mendeteksi lokasi...
        </p>
      )}

      {notice ? (
        <p className="absolute inset-x-3 top-3 z-20 rounded-full bg-brand-cream/95 px-3 py-2 text-center text-[11px] leading-snug text-brand-green shadow-sm">
          {notice}
        </p>
      ) : null}

      <div className="absolute bottom-4 left-4 z-20 rounded-2xl bg-brand-light-green/92 px-4 py-3 text-brand-green shadow-sm backdrop-blur-sm">
        <p className="flex items-start gap-2 text-sm font-semibold">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          Nearest Drop-off
        </p>
        <p className="mt-1 pl-7 text-xs text-brand-green/80">Central Hall, Sudirman</p>
        <p className="pl-7 text-xs text-brand-green/65">Open until 18:00</p>
      </div>
    </div>
  );
}
