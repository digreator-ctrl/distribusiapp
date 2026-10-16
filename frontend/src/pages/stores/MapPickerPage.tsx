import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, Search, Check, ExternalLink, Loader2,
  Navigation, Layers, MapPin, Compass
} from "lucide-react";

// Custom SVG Pin Icon for Leaflet
const customPinIcon = L.divIcon({
  className: "custom-map-pin",
  html: `<div style="transform: translate(-50%, -100%);">
    <svg width="38" height="50" viewBox="0 0 384 512" fill="#ef4444" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
      <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" fill="#dc2626"/>
      <circle cx="192" cy="192" r="54" fill="#ffffff" />
      <circle cx="192" cy="192" r="30" fill="#dc2626" />
    </svg>
  </div>`,
  iconSize: [38, 50],
  iconAnchor: [19, 50],
});

export const MapPickerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const source = searchParams.get("source") || location.state?.source || "stores-create";
  const returnTo = searchParams.get("returnTo") || location.state?.returnTo || "/stores/create";
  const storeName = searchParams.get("storeName") || location.state?.storeName || "";
  const initialQueryParam = searchParams.get("query") || location.state?.query || "";
  const latParam = searchParams.get("lat") || location.state?.lat;
  const lngParam = searchParams.get("lng") || location.state?.lng;

  // Default coordinate: Jakarta / Indonesia (-6.2088, 106.8456)
  const parsedLat = latParam ? parseFloat(latParam) : null;
  const parsedLng = lngParam ? parseFloat(lngParam) : null;
  const defaultLat = !isNaN(parsedLat as number) && parsedLat !== null ? (parsedLat as number) : -6.2088;
  const defaultLng = !isNaN(parsedLng as number) && parsedLng !== null ? (parsedLng as number) : 106.8456;

  const [currentLat, setCurrentLat] = useState<number>(defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(defaultLng);
  const [searchQuery, setSearchQuery] = useState(initialQueryParam);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrentGps, setIsGettingCurrentGps] = useState(false);
  const [addressHint, setAddressHint] = useState<string>("");
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Reverse geocoding helper (find place name from coordinates)
  const fetchAddressHint = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setAddressHint(data.display_name);
        }
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const hasCustomCoords = parsedLat !== null && parsedLng !== null;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: hasCustomCoords ? 17 : 13,
      zoomControl: false,
    });

    // Custom Zoom control position bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initial Tile Layer
    const tileUrl =
      mapType === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: mapType === "satellite" ? "Tiles &copy; Esri" : "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Draggable Marker
    const marker = L.marker([defaultLat, defaultLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCurrentLat(pos.lat);
      setCurrentLng(pos.lng);
      fetchAddressHint(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setCurrentLat(e.latlng.lat);
      setCurrentLng(e.latlng.lng);
      fetchAddressHint(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Fetch initial address hint
    fetchAddressHint(defaultLat, defaultLng);

    // If initial query provided and no coordinate, search once
    if (!hasCustomCoords && initialQueryParam.trim()) {
      handleSearchLocation(undefined, initialQueryParam.trim(), map, marker);
    }

    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Layer change (Standard vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl =
      mapType === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const newLayer = L.tileLayer(tileUrl, {
      attribution: mapType === "satellite" ? "Tiles &copy; Esri" : "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [mapType]);

  // Search location using OpenStreetMap Nominatim
  const handleSearchLocation = async (
    e?: React.FormEvent,
    overrideQuery?: string,
    existingMap?: L.Map,
    existingMarker?: L.Marker
  ) => {
    if (e) e.preventDefault();
    const q = (overrideQuery ?? searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q + ", Indonesia"
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

          const targetMap = existingMap || mapInstanceRef.current;
          const targetMarker = existingMarker || markerRef.current;

          if (targetMap && targetMarker) {
            targetMap.setView([lat, lng], 17);
            targetMarker.setLatLng([lat, lng]);
          }
        } else {
          alert("Lokasi tidak ditemukan. Coba ketik nama jalan, desa, kecamatan, atau kota yang lebih spesifik.");
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Get current device GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }
    setIsGettingCurrentGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingCurrentGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 18);
          markerRef.current.setLatLng([lat, lng]);
        }
        fetchAddressHint(lat, lng);
      },
      (err) => {
        setIsGettingCurrentGps(false);
        alert(`Gagal mendeteksi lokasi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm and Return with Chosen Coordinates
  const handleConfirmLocation = () => {
    const latStr = currentLat.toFixed(6);
    const lngStr = currentLng.toFixed(6);
    const gmapsUrl = `https://www.google.com/maps?q=${latStr},${lngStr}`;

    const payload = {
      lat: currentLat,
      lng: currentLng,
      gmapsUrl,
      addressHint,
      timestamp: Date.now(),
    };

    // Store in sessionStorage & localStorage for communication across tabs/pages
    sessionStorage.setItem("picked_map_location", JSON.stringify(payload));
    try {
      localStorage.setItem("picked_map_location_event", JSON.stringify(payload));
    } catch {
      // ignore
    }

    // If opened in popup / new tab with window.opener
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: "MAP_LOCATION_PICKED", payload }, "*");
        window.close();
        return;
      } catch (e) {
        console.warn("Could not postMessage to opener:", e);
      }
    }

    // Navigate back to the caller page
    navigate(returnTo, {
      state: {
        pickedLocation: payload,
        fromMapPicker: true,
        source,
      },
      replace: true,
    });
  };

  const handleCancel = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-muted/40 flex justify-center overflow-hidden">
      <div className="w-full max-w-md mx-auto h-screen flex flex-col bg-background shadow-2xl border-x border-border relative overflow-hidden">
        {/* 1. Header Bar: Native Mobile PWA Header */}
        <header className="bg-primary text-primary-foreground px-3.5 py-2.5 shrink-0 flex items-center justify-between gap-2 shadow-md z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 rounded-lg text-primary-foreground hover:bg-black/10 transition flex items-center"
              title="Kembali ke formulir"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 shrink-0 text-primary-foreground" />
                <span>Pilih Titik Lokasi Peta</span>
              </h1>
              {storeName ? (
                <p className="text-[10px] text-primary-foreground/80 truncate">
                  Untuk: <strong>{storeName}</strong>
                </p>
              ) : (
                <p className="text-[10px] text-primary-foreground/80">Mode PWA Sales</p>
              )}
            </div>
          </div>

          {/* Action Controls in Header */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Layer Switcher (Peta vs Satelit) */}
            <button
              type="button"
              onClick={() => setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                mapType === "satellite"
                  ? "bg-amber-400 text-amber-950 border-amber-300"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/20"
              }`}
              title="Ganti tampilan citra satelit atau jalan"
            >
              <Layers size={12} />
              <span>{mapType === "satellite" ? "Satelit" : "Peta"}</span>
            </button>

            {/* Quick Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmLocation}
              className="px-3 py-1 bg-white text-primary text-xs font-black rounded-lg shadow hover:bg-white/90 active:scale-95 transition flex items-center gap-1"
            >
              <Check size={14} />
              <span>Gunakan</span>
            </button>
          </div>
        </header>

        {/* 2. Search & GPS Control Bar */}
        <div className="bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 shrink-0 z-20">
          <form onSubmit={(e) => handleSearchLocation(e)} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari jalan, desa, patokan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition disabled:opacity-50 shrink-0"
              title="Cari Lokasi"
            >
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            </button>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isGettingCurrentGps}
              className="px-2.5 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition shrink-0"
              title="Arahkan langsung ke lokasi GPS saya sekarang"
            >
              <Navigation size={13} className={isGettingCurrentGps ? "animate-spin text-primary" : "text-primary"} />
            </button>
          </form>
        </div>

        {/* 3. Main Fullscreen Map Viewport inside PWA shell */}
        <div className="relative flex-1 w-full h-full bg-muted/20 overflow-hidden">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

          {/* Floating Instruction Banner at Top Center */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-[90%]">
            <div className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border shadow-md text-center">
              <p className="text-[11px] font-semibold text-foreground flex items-center justify-center gap-1">
                <Compass size={13} className="text-primary animate-pulse shrink-0" />
                <span className="truncate">Geser pin atau klik peta untuk menentukan titik toko</span>
              </p>
            </div>
          </div>

          {/* Floating Bottom Card: Address Preview & Confirmation */}
          <div className="absolute bottom-7 left-3.5 right-3.5 z-10 animate-in slide-in-from-bottom-3">
            <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Titik Terpilih
                  </span>
                  <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight mt-0.5">
                    {addressHint || "Arahkan pin atau klik peta untuk mendapatkan informasi alamat presisi."}
                  </p>
                </div>

                <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg shrink-0 text-right font-mono text-[10px] font-bold">
                  {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    window.open(`https://www.google.com/maps?q=${currentLat},${currentLng}`, "_blank");
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                  title="Cek di Google Maps resmi"
                >
                  <ExternalLink size={11} />
                  <span>Google Maps Web</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow hover:bg-primary/90 active:scale-95 transition flex items-center gap-1"
                >
                  <Check size={14} />
                  <span>Gunakan Titik Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
