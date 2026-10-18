import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Store, ArrowLeft, Check, AlertCircle,
  MapPin, ExternalLink, Loader2
} from "lucide-react";
import {
  PROVINCES_DATA,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  parseGmapsInput,
  type RegionItem,
} from "../../lib/wilayah";

export const StoreEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const userRole = (localStorage.getItem("distribusi_role") || "admin").toLowerCase();
  useEffect(() => {
    if (userRole !== "owner") {
      alert("Akses ditolak: Hanya Owner yang memiliki izin mengubah data toko (CRUD). Admin dan Sales hanya memiliki izin Create & Read (CR).");
      navigate(userRole === "sales" ? "/sales/toko" : "/stores", { replace: true });
    }
  }, [userRole, navigate]);

  // Basic form states
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [address, setAddress] = useState("");
  const [gmapsInput, setGmapsInput] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Region cascade states
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [provinceName, setProvinceName] = useState("");

  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [cityName, setCityName] = useState("");
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);

  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [villages, setVillages] = useState<RegionItem[]>([]);
  const [villageName, setVillageName] = useState("");
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:8787/api/stores/${id}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setOwnerName(data.owner_name || "");
          setWaNumber(data.wa_number ? String(data.wa_number).replace(/\D/g, "") : "");
          setStatus(data.status || "Aktif");
          setAddress(data.address || "");
          setProvinceName(data.province || "");
          setCityName(data.city || "");
          setDistrictName(data.district || "");
          setVillageName(data.village || "");

          if (data.latitude && data.longitude) {
            setLatitude(data.latitude);
            setLongitude(data.longitude);
            setGmapsInput(`${data.latitude}, ${data.longitude}`);
          }

          // Match Province ID
          const prov = PROVINCES_DATA.find((p) => p.name.toLowerCase() === (data.province || "").toLowerCase());
          if (prov) {
            setSelectedProvinceId(prov.id);
            const regList = await fetchRegencies(prov.id);
            setRegencies(regList);

            const reg = regList.find((r) => r.name.toLowerCase() === (data.city || "").toLowerCase());
            if (reg) {
              setSelectedRegencyId(reg.id);
              const distList = await fetchDistricts(reg.id);
              setDistricts(distList);

              const dist = distList.find((d) => d.name.toLowerCase() === (data.district || "").toLowerCase());
              if (dist) {
                setSelectedDistrictId(dist.id);
                const vilList = await fetchVillages(dist.id);
                setVillages(vilList);
              }
            }
          }
        } else {
          setError("Toko tidak ditemukan.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data toko.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStore();

    // Cek draf dan koordinat baru yang dipilih dari MapPickerPage
    const rawDraft = sessionStorage.getItem("stores_edit_draft_" + id);
    if (rawDraft) {
      try {
        const d = JSON.parse(rawDraft);
        if (d.name) setName(d.name);
        if (d.ownerName) setOwnerName(d.ownerName);
        if (d.waNumber) setWaNumber(d.waNumber);
        if (d.status) setStatus(d.status);
        if (d.address) setAddress(d.address);
        if (d.provinceName) setProvinceName(d.provinceName);
        if (d.cityName) setCityName(d.cityName);
        if (d.districtName) setDistrictName(d.districtName);
        if (d.villageName) setVillageName(d.villageName);
        if (d.gmapsInput) setGmapsInput(d.gmapsInput);
        if (d.latitude) setLatitude(d.latitude);
        if (d.longitude) setLongitude(d.longitude);
      } catch (e) {
        console.warn("Restore edit draft error:", e);
      }
    }

    const rawPicked = sessionStorage.getItem("picked_map_location");
    if (rawPicked) {
      try {
        const p = JSON.parse(rawPicked);
        if (p.lat && p.lng) {
          setLatitude(p.lat);
          setLongitude(p.lng);
          setGmapsInput(p.gmapsUrl);
        }
      } catch (e) {
        console.warn("Parse picked location error:", e);
      } finally {
        sessionStorage.removeItem("picked_map_location");
        sessionStorage.removeItem("stores_edit_draft_" + id);
      }
    }

    const handleStorageOrMessage = (event: StorageEvent | MessageEvent) => {
      let payload = null;
      if ("data" in event && event.data?.type === "MAP_LOCATION_PICKED") {
        payload = event.data.payload;
      } else if ("key" in event && event.key === "picked_map_location_event" && event.newValue) {
        try {
          payload = JSON.parse(event.newValue);
        } catch {
          // ignore
        }
      }
      if (payload && payload.lat && payload.lng) {
        setLatitude(payload.lat);
        setLongitude(payload.lng);
        setGmapsInput(payload.gmapsUrl);
      }
    };

    window.addEventListener("message", handleStorageOrMessage as any);
    window.addEventListener("storage", handleStorageOrMessage as any);

    return () => {
      window.removeEventListener("message", handleStorageOrMessage as any);
      window.removeEventListener("storage", handleStorageOrMessage as any);
    };
  }, [id]);

  const handleWaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 15);
    setWaNumber(numeric);
  };

  const handleGmapsChange = (val: string) => {
    setGmapsInput(val);
    const parsed = parseGmapsInput(val);
    if (parsed.lat !== null && parsed.lng !== null) {
      setLatitude(parsed.lat);
      setLongitude(parsed.lng);
    } else {
      setLatitude(null);
      setLongitude(null);
    }
  };

  // Buka Halaman Peta Baru (Fullscreen & Powerful)
  const handleOpenMapPicker = () => {
    const draft = {
      name,
      ownerName,
      waNumber,
      status,
      address,
      selectedProvinceId,
      provinceName,
      selectedRegencyId,
      cityName,
      selectedDistrictId,
      districtName,
      villageName,
      latitude,
      longitude,
      gmapsInput,
    };
    sessionStorage.setItem("stores_edit_draft_" + id, JSON.stringify(draft));

    const searchTarget = [address, villageName, districtName, cityName, provinceName]
      .filter(Boolean)
      .join(", ");

    navigate(
      `/map-picker?source=stores-edit&returnTo=/stores/${id}/edit&lat=${latitude ?? ""}&lng=${
        longitude ?? ""
      }&query=${encodeURIComponent(searchTarget)}&storeName=${encodeURIComponent(name)}`
    );
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    setSelectedProvinceId(provId);

    const found = PROVINCES_DATA.find((p) => p.id === provId);
    setProvinceName(found ? found.name : "");

    setSelectedRegencyId("");
    setCityName("");
    setRegencies([]);

    setSelectedDistrictId("");
    setDistrictName("");
    setDistricts([]);

    setVillageName("");
    setVillages([]);

    if (provId) {
      setIsLoadingRegencies(true);
      const data = await fetchRegencies(provId);
      setRegencies(data);
      setIsLoadingRegencies(false);
    }
  };

  const handleRegencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegencyId(regId);

    const found = regencies.find((r) => r.id === regId);
    setCityName(found ? found.name : "");

    setSelectedDistrictId("");
    setDistrictName("");
    setDistricts([]);

    setVillageName("");
    setVillages([]);

    if (regId) {
      setIsLoadingDistricts(true);
      const data = await fetchDistricts(regId);
      setDistricts(data);
      setIsLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    setSelectedDistrictId(distId);

    const found = districts.find((d) => d.id === distId);
    setDistrictName(found ? found.name : "");

    setVillageName("");
    setVillages([]);

    if (distId) {
      setIsLoadingVillages(true);
      const data = await fetchVillages(distId);
      setVillages(data);
      setIsLoadingVillages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama Toko wajib diisi.");
      return;
    }
    if (!ownerName.trim()) {
      setError("Nama Pemilik / PIC Toko wajib diisi.");
      return;
    }
    if (!waNumber.trim()) {
      setError("Nomor WhatsApp wajib diisi.");
      return;
    }
    if (waNumber.length < 11 || waNumber.length > 15) {
      setError("Nomor WhatsApp harus berupa angka dengan panjang 11 sampai 15 digit.");
      return;
    }
    if (!provinceName) {
      setError("Provinsi wajib dipilih.");
      return;
    }
    if (!cityName) {
      setError("Kabupaten / Kota wajib dipilih.");
      return;
    }
    if (!districtName) {
      setError("Kecamatan wajib dipilih.");
      return;
    }
    if (!villageName) {
      setError("Desa / Kelurahan wajib dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`http://localhost:8787/api/stores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          owner_name: ownerName.trim(),
          wa_number: waNumber.trim(),
          status: status,
          province: provinceName,
          city: cityName,
          district: districtName,
          village: villageName,
          address: address.trim(),
          latitude: latitude,
          longitude: longitude,
        }),
      });

      if (res.ok) {
        navigate(`/stores/${id}`, {
          state: { successMessage: `Data mitra toko "${name.trim()}" berhasil diperbarui!` },
        });
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Gagal memperbarui data toko.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground animate-pulse text-sm">
        Memuat form edit toko...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/stores/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Detail Toko</span>
        </button>
      </div>

      <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store className="text-primary w-6 h-6" />
            Edit Mitra Toko
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Perbarui data profil, alamat, kontak, status, dan titik koordinat toko.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Baris 1: Nama Toko & PIC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-foreground block mb-1">
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">
                Nama Pemilik / PIC Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Baris 2: Kontak WA & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">
                  Nomor WhatsApp Toko <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] font-semibold ${waNumber.length >= 11 && waNumber.length <= 15
                    ? "text-emerald-600"
                    : waNumber.length > 0
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}>
                  {waNumber.length} / 15 digit (min. 11)
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="Hanya angka, contoh: 081234567890"
                value={waNumber}
                onChange={handleWaChange}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">
                Status Mitra
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>

          {/* Wilayah Hierarkis Dropdown */}
          <div className="p-4 bg-muted/20 rounded-2xl border border-border/60 space-y-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" />
              <span>Hierarki Wilayah Toko (Wajib Diisi Lengkap)</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Dropdown Provinsi */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedProvinceId}
                  onChange={handleProvinceChange}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Pilih Provinsi (Urut Abjad) --</option>
                  {PROVINCES_DATA.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Kabupaten / Kota */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-foreground">
                    Kabupaten / Kota <span className="text-red-500">*</span>
                  </label>
                  {isLoadingRegencies && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Memuat...
                    </span>
                  )}
                </div>
                <select
                  required
                  disabled={!selectedProvinceId || isLoadingRegencies}
                  value={selectedRegencyId}
                  onChange={handleRegencyChange}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedProvinceId
                      ? "Pilih Provinsi terlebih dahulu"
                      : "-- Pilih Kabupaten / Kota (Urut Abjad) --"}
                  </option>
                  {regencies.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Kecamatan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-foreground">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  {isLoadingDistricts && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Memuat...
                    </span>
                  )}
                </div>
                <select
                  required
                  disabled={!selectedRegencyId || isLoadingDistricts}
                  value={selectedDistrictId}
                  onChange={handleDistrictChange}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedRegencyId
                      ? "Pilih Kabupaten/Kota terlebih dahulu"
                      : "-- Pilih Kecamatan (Urut Abjad) --"}
                  </option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Desa / Kelurahan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-foreground">
                    Desa / Kelurahan <span className="text-red-500">*</span>
                  </label>
                  {isLoadingVillages && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Memuat...
                    </span>
                  )}
                </div>
                <select
                  required
                  disabled={!selectedDistrictId || isLoadingVillages}
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedDistrictId
                      ? "Pilih Kecamatan terlebih dahulu"
                      : "-- Pilih Desa / Kelurahan (Urut Abjad) --"}
                  </option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="font-bold text-foreground block mb-1">
              Alamat Lengkap / Patokan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Jl. Margonda Raya No. 102, sebelah Alfamart..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Titik Google Maps - Buka Halaman Baru Peta Interaktif */}
          <div className="p-4 bg-muted/20 rounded-2xl border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" />
                <span>Titik Lokasi Google Maps</span>
              </label>
              {latitude !== null && longitude !== null && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Koordinat: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              )}
            </div>

            {/* Button Memanjang Penuh (Full Width): Buka Halaman Peta */}
            <button
              type="button"
              onClick={handleOpenMapPicker}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2"
              title="Buka Halaman Peta Lengkap untuk memilih titik lokasi secara presisi"
            >
              <MapPin size={15} />
              <span>Pilih pada Peta</span>
            </button>

            {/* Kolom di Bawah Button: Memanjang untuk Link Hasil Klik Lokasi dari Peta */}
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Link hasil klik lokasi dari peta (atau tempel link Google Maps di sini)"
                value={gmapsInput}
                onChange={(e) => handleGmapsChange(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-mono"
              />

              <div className="flex justify-end text-[11px] px-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const searchTarget = [address, villageName, districtName, cityName, provinceName]
                      .filter(Boolean)
                      .join(", ");
                    const url = gmapsInput || (searchTarget
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTarget)}`
                      : "https://www.google.com/maps");
                    window.open(url, "_blank");
                  }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  title="Buka Google Maps di tab baru"
                >
                  <ExternalLink size={11} />
                  <span>Buka Google Maps Web</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => navigate(`/stores/${id}`)}
              className="px-5 py-2.5 rounded-xl border border-border font-bold text-muted-foreground hover:bg-muted transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black shadow hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
