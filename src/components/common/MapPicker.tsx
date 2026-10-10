import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

// Fix Leaflet icon paths in Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  locationMethod: 'automatic_gps' | 'manual_map' | 'manual_address';
  onChange: (coords: { lat: number; lng: number; address: string; method: 'automatic_gps' | 'manual_map' | 'manual_address' }) => void;
  height?: string;
  readOnly?: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  address,
  locationMethod,
  onChange,
  height = '320px',
  readOnly = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [locating, setLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string>('');
  const [geocoding, setGeocoding] = useState<boolean>(false);

  // Reverse geocoding helper via OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (err) {
      // quiet fallback
    } finally {
      setGeocoding(false);
    }
    return `Location coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = latitude || 18.9388;
    const initialLng = longitude || 72.8347;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: !readOnly,
    }).addTo(map);

    if (!readOnly) {
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const addr = await reverseGeocode(position.lat, position.lng);
        onChange({
          lat: position.lat,
          lng: position.lng,
          address: addr,
          method: 'manual_map',
        });
      });

      map.on('click', async (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        onChange({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          address: addr,
          method: 'manual_map',
        });
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker when props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
    }
  }, [latitude, longitude]);

  // Request browser location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
        }

        const resolvedAddr = await reverseGeocode(lat, lng);
        onChange({
          lat,
          lng,
          address: resolvedAddr,
          method: 'automatic_gps',
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please click on the map to manually pinpoint the location.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location signal unavailable. Please select the location manually on the map.');
        } else {
          setGeoError('Location request timed out. Please select the location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getMethodBadge = () => {
    if (locationMethod === 'automatic_gps') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2E7D32]">
          <CheckCircle2 className="w-3.5 h-3.5" /> GPS Verified (Browser)
        </span>
      );
    }
    if (locationMethod === 'manual_map') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#252B27]">
          <MapPin className="w-3.5 h-3.5 text-[#285943]" /> Manually Pinpointed on Map
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D97706]">
        <AlertCircle className="w-3.5 h-3.5" /> Approximate Address
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getMethodBadge()}
          <span className="text-xs text-[#69716B]">·</span>
          <span className="text-xs font-mono text-[#69716B] tabular-nums">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#285943] bg-[#285943]/10 hover:bg-[#285943]/15 rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting GPS...' : 'Detect My Location'}</span>
          </button>
        )}
      </div>

      {geoError && (
        <div className="p-2.5 bg-[#C53030]/10 border border-[#C53030]/20 rounded text-xs text-[#C53030] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="w-full rounded-md border border-[#E1E5DF] overflow-hidden shadow-xs relative"
      />

      {/* Street Address Summary */}
      <div className="p-2.5 bg-white border border-[#E1E5DF] rounded-md text-xs text-[#252B27] flex items-start gap-2">
        <MapPin className="w-4 h-4 text-[#285943] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-[11px] text-[#69716B] uppercase tracking-wider">
            {geocoding ? 'Reverse Geocoding Address...' : 'Civic Street Location'}
          </div>
          <div className="leading-snug mt-0.5">{address || 'No specific address selected'}</div>
        </div>
      </div>
    </div>
  );
};
