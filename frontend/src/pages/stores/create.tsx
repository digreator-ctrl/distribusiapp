import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, ArrowLeft, Check, AlertCircle, CheckCircle2, X,
  MapPin, ExternalLink
} from "lucide-react";
import {
  PROVINCES_DATA,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  parseGmapsInput,
  type RegionItem,
} from "../../lib/wilayah";
import { SearchableSelect } from "../../components/SearchableSelect";

// Komponen Floating Toast Notification Kustom (Bukan Bawaan Browser)
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4">
      <div
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border text-xs backdrop-blur-md transition-all ${type === "success"
            ? "bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10"
            : "bg-red-50/95 border-red-200 text-red-900 shadow-red-500/10"
          }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
        >
          {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>
        <div className="flex-1 pt-0.5">
          <p className="font-bold text-sm">{type === "success" ? "Berhasil!" : "Wajib Terisi!"}</p>
          <p className="mt-0.5 opacity-90 leading-relaxed font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const StoreCreate = () => {
  const navigate = useNavigate();

  // Basic form states
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [waNumber, setWaNumber] = useState("");
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

  // UI state & validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Restore draft and picked map location on mount
  useEffect(() => {
    // 1. Cek draft formulir
    const rawDraft = sessionStorage.getItem("store_create_draft");
    if (rawDraft) {
      try {
        const d = JSON.parse(rawDraft);
        if (d.name) setName(d.name);
        if (d.ownerName) setOwnerName(d.ownerName);
        if (d.waNumber) setWaNumber(d.waNumber);
        if (d.address) setAddress(d.address);
        if (d.selectedProvinceId) setSelectedProvinceId(d.selectedProvinceId);
        if (d.provinceName) setProvinceName(d.provinceName);
        if (d.selectedRegencyId) setSelectedRegencyId(d.selectedRegencyId);
        if (d.cityName) setCityName(d.cityName);
        if (d.selectedDistrictId) setSelectedDistrictId(d.selectedDistrictId);
        if (d.districtName) setDistrictName(d.districtName);
        if (d.villageName) setVillageName(d.villageName);
        if (d.gmapsInput) setGmapsInput(d.gmapsInput);
        if (d.latitude) setLatitude(d.latitude);
        if (d.longitude) setLongitude(d.longitude);
      } catch (e) {
        console.warn("Restore draft error:", e);
      }
    }

    // 2. Cek apakah ada koordinat baru dari halaman MapPickerPage
    const rawPicked = sessionStorage.getItem("picked_map_location");
    if (rawPicked) {
      try {
        const p = JSON.parse(rawPicked);
        if (p.lat && p.lng) {
          setLatitude(p.lat);
          setLongitude(p.lng);
          setGmapsInput(p.gmapsUrl);
          setToast({
            message: `Titik koordinat berhasil dipilih dari Peta (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})!`,
            type: "success",
          });
        }
      } catch (e) {
        console.warn("Parse picked location error:", e);
      } finally {
        sessionStorage.removeItem("picked_map_location");
      }
    }

    // Event listener jika user membuka peta di tab baru
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
        setToast({
          message: `Titik koordinat berhasil diperbarui dari Peta (${payload.lat.toFixed(5)}, ${payload.lng.toFixed(5)})!`,
          type: "success",
        });
      }
    };

    window.addEventListener("message", handleStorageOrMessage as any);
    window.addEventListener("storage", handleStorageOrMessage as any);

    return () => {
      setErrors({});
      setToast(null);
      window.removeEventListener("message", handleStorageOrMessage as any);
      window.removeEventListener("storage", handleStorageOrMessage as any);
    };
  }, []);

  // Reset form to default normal state
  const resetForm = () => {
    sessionStorage.removeItem("store_create_draft");
    sessionStorage.removeItem("picked_map_location");
    setName("");
    setOwnerName("");
    setWaNumber("");
    setAddress("");
    setGmapsInput("");
    setLatitude(null);
    setLongitude(null);
    setSelectedProvinceId("");
    setProvinceName("");
    setRegencies([]);
    setSelectedRegencyId("");
    setCityName("");
    setDistricts([]);
    setSelectedDistrictId("");
    setDistrictName("");
    setVillages([]);
    setVillageName("");
    setErrors({});
    if (toast?.type === "error") {
      setToast(null);
    }
  };

  const handleCancel = () => {
    resetForm();
    navigate("/stores");
  };



  // WA input handler: hanya angka, maks 15 digit
  const handleWaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 15);
    setWaNumber(numeric);
    if (errors.waNumber && numeric.length >= 11 && numeric.length <= 15) {
      setErrors((prev) => ({ ...prev, waNumber: "" }));
    }
  };

  // Google Maps input handler: auto-parse latitude and longitude
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
      address,
      selectedProvinceId,
      provinceName,
      selectedRegencyId,
      cityName,
      selectedDistrictId,
      districtName,
      villageName,
      gmapsInput,
      latitude,
      longitude,
    };
    sessionStorage.setItem("store_create_draft", JSON.stringify(draft));

    const searchTarget = [address, villageName, districtName, cityName, provinceName]
      .filter(Boolean)
      .join(", ");

    navigate(
      `/map-picker?source=stores-create&returnTo=/stores/create&lat=${latitude ?? ""}&lng=${
        longitude ?? ""
      }&query=${encodeURIComponent(searchTarget)}&storeName=${encodeURIComponent(name)}`
    );
  };

  // 1. Province Select Handler
  const handleProvinceSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedProvinceId("");
      setProvinceName("");
      setSelectedRegencyId("");
      setCityName("");
      setRegencies([]);
      setSelectedDistrictId("");
      setDistrictName("");
      setDistricts([]);
      setVillageName("");
      setVillages([]);
      return;
    }

    setSelectedProvinceId(opt.id);
    setProvinceName(opt.name);
    setErrors((prev) => ({ ...prev, province: "" }));

    // Reset children
    setSelectedRegencyId("");
    setCityName("");
    setRegencies([]);

    setSelectedDistrictId("");
    setDistrictName("");
    setDistricts([]);

    setVillageName("");
    setVillages([]);

    setIsLoadingRegencies(true);
    const data = await fetchRegencies(opt.id);
    setRegencies(data);
    setIsLoadingRegencies(false);
  };

  // 2. Regency/City Select Handler
  const handleRegencySelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedRegencyId("");
      setCityName("");
      setSelectedDistrictId("");
      setDistrictName("");
      setDistricts([]);
      setVillageName("");
      setVillages([]);
      return;
    }

    setSelectedRegencyId(opt.id);
    setCityName(opt.name);
    setErrors((prev) => ({ ...prev, city: "" }));

    // Reset children
    setSelectedDistrictId("");
    setDistrictName("");
    setDistricts([]);

    setVillageName("");
    setVillages([]);

    setIsLoadingDistricts(true);
    const data = await fetchDistricts(opt.id);
    setDistricts(data);
    setIsLoadingDistricts(false);
  };

  // 3. District Select Handler
  const handleDistrictSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedDistrictId("");
      setDistrictName("");
      setVillageName("");
      setVillages([]);
      return;
    }

    setSelectedDistrictId(opt.id);
    setDistrictName(opt.name);
    setErrors((prev) => ({ ...prev, district: "" }));

    // Reset children
    setVillageName("");
    setVillages([]);

    setIsLoadingVillages(true);
    const data = await fetchVillages(opt.id);
    setVillages(data);
    setIsLoadingVillages(false);
  };

  // 4. Village Select Handler
  const handleVillageSelect = (opt: RegionItem | null) => {
    if (!opt) {
      setVillageName("");
      return;
    }
    setVillageName(opt.name);
    setErrors((prev) => ({ ...prev, village: "" }));
  };

  // Form Submit with Rich Validation & Floating Toast
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Nama Toko wajib diisi.";
    }
    if (!ownerName.trim()) {
      newErrors.ownerName = "Nama Pemilik / PIC Toko wajib diisi.";
    }
    if (!waNumber.trim()) {
      newErrors.waNumber = "Nomor WhatsApp wajib diisi.";
    } else if (waNumber.length < 11 || waNumber.length > 15) {
      newErrors.waNumber = "Nomor WhatsApp harus 11 sampai 15 digit angka.";
    }
    if (!selectedProvinceId || !provinceName) {
      newErrors.province = "Provinsi wajib dipilih.";
    }
    if (!selectedRegencyId || !cityName) {
      newErrors.city = "Kabupaten / Kota wajib dipilih.";
    }
    if (!selectedDistrictId || !districtName) {
      newErrors.district = "Kecamatan wajib dipilih.";
    }
    if (!villageName) {
      newErrors.village = "Desa / Kelurahan wajib dipilih.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({
        message: "Kolom yang wajib terisi masih kosong atau belum valid. Silakan lengkapi kolom yang berwarna merah.",
        type: "error",
      });

      // Fokus dan scroll otomatis ke input bermasalah pertama
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8787/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          owner_name: ownerName.trim(),
          wa_number: waNumber.trim(),
          status: "Aktif",
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
        setToast({
          message: `Mitra toko "${name.trim()}" berhasil ditambahkan!`,
          type: "success",
        });

        setTimeout(() => {
          navigate("/stores", {
            state: { successMessage: `Mitra toko "${name.trim()}" berhasil ditambahkan!` },
          });
        }, 1200);
      } else {
        const errJson = await res.json();
        setToast({
          message: errJson.error || "Gagal menambahkan mitra toko.",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error(err);
      setToast({
        message: "Terjadi gangguan koneksi ke server.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Daftar Toko
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Store className="text-primary w-6 h-6" />
              Tambah Mitra Toko Baru
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              Lengkapi formulir di bawah ini untuk mendaftarkan mitra toko ritel baru.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            {/* Baris 1: Nama Toko & PIC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="field-name"
                  className={`font-bold block mb-1 transition ${errors.name ? "text-red-600 font-extrabold" : "text-foreground"
                    }`}
                >
                  Nama Toko <span className="text-red-500">*</span>
                </label>
                <input
                  id="field-name"
                  type="text"
                  placeholder="Contoh: Toko Berkah Mandiri"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-foreground transition focus:outline-none ${errors.name
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                    }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="field-ownerName"
                  className={`font-bold block mb-1 transition ${errors.ownerName ? "text-red-600 font-extrabold" : "text-foreground"
                    }`}
                >
                  Nama Pemilik / PIC Toko <span className="text-red-500">*</span>
                </label>
                <input
                  id="field-ownerName"
                  type="text"
                  placeholder="Contoh: Ibu Hj. Maryati"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: "" }));
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-foreground transition focus:outline-none ${errors.ownerName
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                    }`}
                />
                {errors.ownerName && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    {errors.ownerName}
                  </p>
                )}
              </div>
            </div>

            {/* Baris 2: Nomor WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="field-waNumber"
                  className={`font-bold transition ${errors.waNumber ? "text-red-600 font-extrabold" : "text-foreground"
                    }`}
                >
                  Nomor WhatsApp Toko <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[10px] font-semibold ${waNumber.length >= 11 && waNumber.length <= 15
                      ? "text-emerald-600"
                      : waNumber.length > 0
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                >
                  {waNumber.length} / 15 digit (min. 11)
                </span>
              </div>
              <input
                id="field-waNumber"
                type="text"
                placeholder="Hanya angka, contoh: 081234567890"
                value={waNumber}
                onChange={handleWaChange}
                className={`w-full rounded-xl px-3.5 py-2.5 text-foreground font-mono text-xs transition focus:outline-none ${errors.waNumber
                    ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
                    : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
              />
              {errors.waNumber ? (
                <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.waNumber}
                </p>
              ) : (
                waNumber.length > 0 &&
                waNumber.length < 11 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Nomor WhatsApp minimal 11 digit angka.
                  </p>
                )
              )}
            </div>

            {/* Wilayah Hierarkis: Sekarang Input-able (Searchable Combobox) */}
            <div className="p-4 bg-muted/20 rounded-2xl border border-border/60 space-y-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" />
                <span>Hierarki Wilayah Toko (Bisa Diketik untuk Mencari Cepat)</span>
              </span>

              {/* Susunan Wilayah Menurun ke Bawah */}
              <div className="flex flex-col gap-3.5">
                {/* Searchable Input Provinsi */}
                <SearchableSelect
                  id="field-province"
                  label="Provinsi"
                  required
                  placeholder="Ketik untuk mencari provinsi..."
                  options={PROVINCES_DATA}
                  value={provinceName}
                  onSelect={handleProvinceSelect}
                  hasError={!!errors.province}
                  errorMessage={errors.province}
                />

                {/* Searchable Input Kabupaten / Kota */}
                <SearchableSelect
                  id="field-city"
                  label="Kabupaten / Kota"
                  required
                  placeholder="Ketik untuk mencari kab/kota..."
                  options={regencies}
                  value={cityName}
                  disabled={!selectedProvinceId}
                  disabledPlaceholder="Pilih Provinsi terlebih dahulu"
                  isLoading={isLoadingRegencies}
                  onSelect={handleRegencySelect}
                  hasError={!!errors.city}
                  errorMessage={errors.city}
                />

                {/* Searchable Input Kecamatan */}
                <SearchableSelect
                  id="field-district"
                  label="Kecamatan"
                  required
                  placeholder="Ketik untuk mencari kecamatan..."
                  options={districts}
                  value={districtName}
                  disabled={!selectedRegencyId}
                  disabledPlaceholder="Pilih Kabupaten/Kota terlebih dahulu"
                  isLoading={isLoadingDistricts}
                  onSelect={handleDistrictSelect}
                  hasError={!!errors.district}
                  errorMessage={errors.district}
                />

                {/* Searchable Input Desa / Kelurahan */}
                <SearchableSelect
                  id="field-village"
                  label="Desa / Kelurahan"
                  required
                  placeholder="Ketik untuk mencari desa/kelurahan..."
                  options={villages}
                  value={villageName}
                  disabled={!selectedDistrictId}
                  disabledPlaceholder="Pilih Kecamatan terlebih dahulu"
                  isLoading={isLoadingVillages}
                  onSelect={handleVillageSelect}
                  hasError={!!errors.village}
                  errorMessage={errors.village}
                />
              </div>
            </div>

            {/* Baris 3: Alamat / Patokan */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Alamat / Patokan <span className="text-muted-foreground font-normal">(Opsional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Jl. Merdeka No. 45, samping gapura RW 03, seberang masjid"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Baris 4: Titik Google Maps - Buka Halaman Baru Peta Interaktif */}
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

              {/* Button Memanjang Penuh (Full Width): Pilih pada Peta (Buka Halaman Baru) */}
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
                onClick={handleCancel}
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
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Mitra Toko"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
