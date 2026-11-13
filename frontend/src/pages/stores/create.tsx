import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, ArrowLeft, Check, AlertCircle, CheckCircle2, X,
  MapPin, ExternalLink
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import {
  PROVINCES_DATA,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  parseGmapsInput,
  type RegionItem,
} from "../../lib/wilayah";
import { SearchableSelect } from "../../components/SearchableSelect";
import { CategoryCombobox } from "../../components/CategoryCombobox";

// Komponen Floating Toast Notification Kustom
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
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border text-xs sm:text-sm backdrop-blur-md transition-all ${
          type === "success"
            ? "bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10"
            : "bg-red-50/95 border-red-200 text-red-900 shadow-red-500/10"
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          }`}
        >
          {type === "success" ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
        <div className="flex-1 pt-0.5">
          <p className="font-bold text-sm sm:text-base">{type === "success" ? "Berhasil!" : "Wajib Terisi!"}</p>
          <p className="mt-0.5 opacity-90 leading-relaxed font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export const StoreCreate = () => {
  const navigate = useNavigate();

  // Basic form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
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
        if (d.category) setCategory(d.category);
        if (d.ownerName) setOwnerName(d.ownerName);
        if (d.waNumber) setWaNumber(d.waNumber);
        if (d.address) setAddress(d.address);
        if (d.provinceName) setProvinceName(d.provinceName);
        if (d.cityName) setCityName(d.cityName);
        if (d.districtName) setDistrictName(d.districtName);
        if (d.villageName) setVillageName(d.villageName);
        if (d.gmapsInput) setGmapsInput(d.gmapsInput);
        if (d.latitude) setLatitude(d.latitude);
        if (d.longitude) setLongitude(d.longitude);

        // Pulihkan ID provinsi dan cascading regencies/districts/villages
        const provIdToLoad = d.selectedProvinceId || PROVINCES_DATA.find((p) => p.name.toLowerCase() === (d.provinceName || "").toLowerCase())?.id;
        if (provIdToLoad) {
          setSelectedProvinceId(provIdToLoad);
          setIsLoadingRegencies(true);
          fetchRegencies(provIdToLoad)
            .then((regData) => {
              setRegencies(regData);
              const regIdToLoad = d.selectedRegencyId || regData.find((r) => r.name.toLowerCase() === (d.cityName || "").toLowerCase())?.id;
              if (regIdToLoad) {
                setSelectedRegencyId(regIdToLoad);
                setIsLoadingDistricts(true);
                fetchDistricts(regIdToLoad)
                  .then((distData) => {
                    setDistricts(distData);
                    const distIdToLoad = d.selectedDistrictId || distData.find((ds) => ds.name.toLowerCase() === (d.districtName || "").toLowerCase())?.id;
                    if (distIdToLoad) {
                      setSelectedDistrictId(distIdToLoad);
                      setIsLoadingVillages(true);
                      fetchVillages(distIdToLoad)
                        .then((vilData) => setVillages(vilData))
                        .finally(() => setIsLoadingVillages(false));
                    }
                  })
                  .finally(() => setIsLoadingDistricts(false));
              }
            })
            .finally(() => setIsLoadingRegencies(false));
        }
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
    setCategory("");
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
      category,
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

    // Jika provinsi yang dipilih sama persis dengan yang sudah terpilih, jangan reset anak-anaknya
    if (opt.id === selectedProvinceId) {
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
    try {
      const data = await fetchRegencies(opt.id);
      setRegencies(data);
    } catch (err) {
      console.error("Gagal load regencies:", err);
    } finally {
      setIsLoadingRegencies(false);
    }
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

    // Jika kabupaten/kota yang dipilih sama persis, jangan reset kecamatan
    if (opt.id === selectedRegencyId) {
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
    try {
      const data = await fetchDistricts(opt.id);
      setDistricts(data);
    } catch (err) {
      console.error("Gagal load districts:", err);
    } finally {
      setIsLoadingDistricts(false);
    }
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

    // Jika kecamatan yang dipilih sama persis, jangan reset desa/kelurahan
    if (opt.id === selectedDistrictId) {
      return;
    }

    setSelectedDistrictId(opt.id);
    setDistrictName(opt.name);
    setErrors((prev) => ({ ...prev, district: "" }));

    // Reset children
    setVillageName("");
    setVillages([]);

    setIsLoadingVillages(true);
    try {
      const data = await fetchVillages(opt.id);
      setVillages(data);
    } catch (err) {
      console.error("Gagal load villages:", err);
    } finally {
      setIsLoadingVillages(false);
    }
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
      const res = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || null,
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

      {/* Main Container: Luas & Proporsional di Desktop/Tablet (max-w-5xl), Responsif Penuh di Mobile */}
      <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
            <span>Kembali ke Daftar Toko</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-7 lg:p-9 space-y-6 sm:space-y-8">
          <div className="border-b border-border/60 pb-4 sm:pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Store className="text-primary w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
              <span>Tambah Mitra Toko Baru</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-1.5">
              Lengkapi formulir di bawah ini untuk mendaftarkan mitra toko ritel baru ke dalam sistem distribusi.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6 text-xs sm:text-sm">
            {/* Bagian 1: Data Utama Toko (Nama, Kategori, Pemilik/PIC, WhatsApp) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Nama Toko */}
              <div>
                <label
                  htmlFor="field-name"
                  className={`font-bold block mb-1 sm:mb-1.5 transition text-xs sm:text-sm ${
                    errors.name ? "text-red-600 font-extrabold" : "text-foreground"
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
                  className={`w-full rounded-xl px-3.5 py-2.5 sm:py-2.5 text-foreground text-xs sm:text-sm transition focus:outline-none ${
                    errors.name
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] sm:text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Kategori Mitra (Otomatis Dropdown + Ketik Baru) */}
              <div>
                <CategoryCombobox
                  id="field-category"
                  label="Kategori Mitra Toko"
                  value={category}
                  onChange={setCategory}
                  placeholder="Pilih atau ketik kategori toko..."
                />
              </div>

              {/* Nama Pemilik / PIC Toko */}
              <div>
                <label
                  htmlFor="field-ownerName"
                  className={`font-bold block mb-1 sm:mb-1.5 transition text-xs sm:text-sm ${
                    errors.ownerName ? "text-red-600 font-extrabold" : "text-foreground"
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
                  className={`w-full rounded-xl px-3.5 py-2.5 sm:py-2.5 text-foreground text-xs sm:text-sm transition focus:outline-none ${
                    errors.ownerName
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {errors.ownerName && (
                  <p className="text-[11px] sm:text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {errors.ownerName}
                  </p>
                )}
              </div>

              {/* Nomor WhatsApp Toko */}
              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                  <label
                    htmlFor="field-waNumber"
                    className={`font-bold text-xs sm:text-sm transition ${
                      errors.waNumber ? "text-red-600 font-extrabold" : "text-foreground"
                    }`}
                  >
                    Nomor WhatsApp Toko <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold ${
                      waNumber.length >= 11 && waNumber.length <= 15
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
                  className={`w-full rounded-xl px-3.5 py-2.5 sm:py-2.5 text-foreground font-mono text-xs sm:text-sm transition focus:outline-none ${
                    errors.waNumber
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {errors.waNumber ? (
                  <p className="text-[11px] sm:text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {errors.waNumber}
                  </p>
                ) : (
                  waNumber.length > 0 &&
                  waNumber.length < 11 && (
                    <p className="text-[10px] sm:text-[11px] text-amber-600 mt-1 font-medium">
                      Nomor WhatsApp minimal 11 digit angka.
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Bagian 2: Wilayah Hierarkis (Searchable Combobox) - 1 Kolom Mobile, 2 Kolom Tablet & Desktop */}
            <div className="p-4 sm:p-6 bg-muted/20 rounded-2xl border border-border/60 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin size={15} className="text-primary" />
                  <span>Hierarki Wilayah Toko (Bisa Diketik untuk Pencarian Cepat)</span>
                </span>
              </div>

              {/* Grid Wilayah: 1 Kolom di Mobile, 2 Kolom di Tablet & Desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Searchable Input Provinsi */}
                <div className="relative z-30">
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
                </div>

                {/* Searchable Input Kabupaten / Kota */}
                <div className="relative z-30">
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
                </div>

                {/* Searchable Input Kecamatan */}
                <div className="relative z-20">
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
                </div>

                {/* Searchable Input Desa / Kelurahan */}
                <div className="relative z-20">
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
            </div>

            {/* Bagian 3: Alamat Lengkap & Titik Google Maps - 1 Kolom Mobile, 2 Kolom Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Kolom Kiri: Alamat / Patokan */}
              <div className="p-4 sm:p-6 bg-muted/20 rounded-2xl border border-border/60 flex flex-col justify-between space-y-3">
                <div>
                  <label className="font-bold text-foreground text-xs sm:text-sm block mb-1">
                    Alamat Lengkap / Patokan <span className="text-muted-foreground font-normal text-[11px] sm:text-xs">(Opsional)</span>
                  </label>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 leading-relaxed">
                    Nama jalan, nomor bangunan, RT/RW, atau patokan lokasi toko (contoh: seberang masjid, samping pos ronda).
                  </p>
                  <textarea
                    rows={5}
                    placeholder="Contoh: Jl. Merdeka No. 45, samping gapura RW 03, seberang masjid Al-Ikhlas"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 sm:py-3 text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Titik Google Maps */}
              <div className="p-4 sm:p-6 bg-muted/20 rounded-2xl border border-border/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary" />
                      <span>Titik Lokasi Google Maps</span>
                    </label>
                    {latitude !== null && longitude !== null && (
                      <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {latitude.toFixed(5)}, {longitude.toFixed(5)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 leading-relaxed">
                    Pilih titik koordinat di peta agar tim sales dapat bernavigasi langsung ke lokasi toko saat kunjungan.
                  </p>

                  {/* Tombol Pilih pada Peta */}
                  <button
                    type="button"
                    onClick={handleOpenMapPicker}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2 mb-3"
                    title="Buka Halaman Peta Lengkap untuk memilih titik lokasi secara presisi"
                  >
                    <MapPin size={16} />
                    <span>Pilih Titik pada Peta Interaktif</span>
                  </button>

                  {/* Kolom Link / Tempel Koordinat */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Link hasil klik lokasi dari peta (atau tempel link Google Maps)"
                      value={gmapsInput}
                      onChange={(e) => handleGmapsChange(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-mono"
                    />

                    <div className="flex justify-end text-[11px] sm:text-xs px-0.5">
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
                        className="text-[10px] sm:text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                        title="Buka Google Maps di tab baru"
                      >
                        <ExternalLink size={12} />
                        <span>Buka Google Maps Web</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 4: Action Buttons */}
            <div className="pt-4 sm:pt-6 flex items-center justify-end gap-3 sm:gap-4 border-t border-border/60">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-border font-bold text-xs sm:text-sm text-muted-foreground hover:bg-muted transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Check size={16} className="sm:w-5 sm:h-5" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Mitra Toko"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
