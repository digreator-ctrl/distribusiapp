import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, X, Check, ExternalLink, Loader2, Navigation } from "lucide-react";

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialSearchQuery?: string;
  onSelectLocation: (data: { lat: number; lng: number; gmapsUrl: string }) => void;
}

// Custom SVG Pin Icon for Leaflet to avoid broken images with bundlers
const customPinIcon = L.divIcon({
  className: "custom-map-pin",
  html: `<div style="transform: translate(-50%, -100%);">
    <svg width="34" height="44" viewBox="0 0 384 512" fill="#ef4444" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
      <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" fill="#dc2626"/>
      <circle cx="192" cy="192" r="54" fill="#ffffff" />
      <circle cx="192" cy="192" r="30" fill="#dc2626" />
    </svg>
  </div>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

export const MapPickerModal = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialSearchQuery = "",
  onSelectLocation,
}: MapPickerModalProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default coordinate: Jakarta / Indonesia (-6.2088, 106.8456)
  const defaultLat = initialLat ?? -6.2088;
  const defaultLng = initialLng ?? 106.8456;

  const [currentLat, setCurrentLat] = useState<number>(defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(defaultLng);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrentGps, setIsGettingCurrentGps] = useState(false);
  const [addressHint, setAddressHint] = useState<string>("");

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Small timeout to allow container layout to measure properly
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: initialLat && initialLng ? 16 : 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add draggable pin
      const marker = L.marker([defaultLat, defaultLng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      // Handle marker drag
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setCurrentLat(pos.lat);
        setCurrentLng(pos.lng);
      });

      // Handle map click to drop pin
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setCurrentLat(e.latlng.lat);
        setCurrentLng(e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size to ensure tiles render properly
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, defaultLat, defaultLng]);

  // Search location using OpenStreetMap Nominatim
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ", Indonesia"
        )}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setCurrentLat(lat);
          setCurrentLng(lng);
          setAddressHint(data[0].display_name);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
          }
        } else {
          alert("Lokasi tidak ditemukan. Coba ketik nama jalan, kelurahan, atau kota yang lebih spesifik.");
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Get current device location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsGettingCurrentGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingCurrentGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }
      },
      () => {
        setIsGettingCurrentGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm selection: generate Google Maps link and return immediately
  const handleConfirm = () => {
    const latStr = currentLat.toFixed(6);
    const lngStr = currentLng.toFixed(6);
    const gmapsUrl = `https://www.google.com/maps?q=${latStr},${lngStr}`;

    onSelectLocation({
      lat: currentLat,
      lng: currentLng,
      gmapsUrl: gmapsUrl,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Pilih Titik Lokasi Peta</h3>
              <p className="text-[11px] text-muted-foreground">
                Geser pin atau klik di peta untuk menentukan titik toko
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar in Map */}
        <div className="p-3 bg-muted/30 border-b border-border/60 shrink-0">
          <form onSubmit={handleSearchLocation} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari jalan, patokan, atau kelurahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition disabled:opacity-50 shrink-0"
            >
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              <span>Cari</span>
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isGettingCurrentGps}
              title="Arahkan ke lokasi saya sekarang"
              className="px-2.5 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition shrink-0"
            >
              <Navigation size={13} className={isGettingCurrentGps ? "animate-spin text-primary" : "text-primary"} />
            </button>
          </form>
          {addressHint && (
            <p className="text-[10px] text-muted-foreground mt-1.5 truncate px-1 font-medium">
              📍 {addressHint}
            </p>
          )}
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[300px] w-full bg-muted/20">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
          
          {/* Coordinate Badge Overlay on Map */}
          <div className="absolute top-2.5 right-2.5 z-10 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border shadow-sm text-[10px] font-mono font-bold text-foreground pointer-events-none">
            {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-border/80 bg-card flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              window.open(`https://www.google.com/maps?q=${currentLat},${currentLng}`, "_blank");
            }}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-blue-50 transition"
          >
            <ExternalLink size={12} />
            <span>Buka Google Maps</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>Pilih Titik Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
