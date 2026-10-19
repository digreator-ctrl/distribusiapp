import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Store, X, MapPin, AlertCircle, RefreshCw
} from "lucide-react";
import {
  PROVINCES_DATA,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  parseGmapsInput,
  type RegionItem
} from "../../lib/wilayah";
import { SearchableSelect } from "../../components/SearchableSelect";

export const SalesStoreCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newWa, setNewWa] = useState("");
  const [newGmaps, setNewGmaps] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);

  const [selectedProvId, setSelectedProvId] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [selectedRegId, setSelectedRegId] = useState("");
  const [newCity, setNewCity] = useState("");
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);

  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [selectedDistId, setSelectedDistId] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [villages, setVillages] = useState<RegionItem[]>([]);
  const [newVillage, setNewVillage] = useState("");
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addErrors, setAddErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Auto-dismiss floating toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Restore draft and picked location from Map Picker
  useEffect(() => {
    const rawDraft = sessionStorage.getItem("sales_store_draft");
    if (rawDraft) {
      try {
        const d = JSON.parse(rawDraft);
        if (d.newName) setNewName(d.newName);
        if (d.newOwner) setNewOwner(d.newOwner);
        if (d.newAddress) setNewAddress(d.newAddress);
        if (d.newWa) setNewWa(d.newWa);
        if (d.selectedProvId) setSelectedProvId(d.selectedProvId);
        if (d.newProvince) setNewProvince(d.newProvince);
        if (d.selectedRegId) setSelectedRegId(d.selectedRegId);
        if (d.newCity) setNewCity(d.newCity);
        if (d.selectedDistId) setSelectedDistId(d.selectedDistId);
        if (d.newDistrict) setNewDistrict(d.newDistrict);
        if (d.newVillage) setNewVillage(d.newVillage);
        if (d.newGmaps) setNewGmaps(d.newGmaps);
        if (d.newLat) setNewLat(d.newLat);
        if (d.newLng) setNewLng(d.newLng);

        // Fetch dependent regions if IDs exist
        if (d.selectedProvId) {
          fetchRegencies(d.selectedProvId).then(setRegencies);
        }
        if (d.selectedRegId) {
          fetchDistricts(d.selectedRegId).then(setDistricts);
        }
        if (d.selectedDistId) {
          fetchVillages(d.selectedDistId).then(setVillages);
        }
      } catch (e) {
        console.warn("Restore sales draft error:", e);
      }
    }

    const rawPicked = sessionStorage.getItem("picked_map_location");
    if (rawPicked) {
      try {
        const p = JSON.parse(rawPicked);
        if (p.lat && p.lng) {
          setNewLat(p.lat);
          setNewLng(p.lng);
          setNewGmaps(p.gmapsUrl);
          setToastMessage({
            text: `Titik koordinat berhasil dipilih dari Peta (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})!`,
            type: "success",
          });
        }
      } catch (e) {
        console.warn("Parse picked location error:", e);
      } finally {
        sessionStorage.removeItem("picked_map_location");
        sessionStorage.removeItem("sales_store_draft");
      }
    }
  }, []);

  const handleProvSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedProvId("");
      setNewProvince("");
      setSelectedRegId("");
      setNewCity("");
      setRegencies([]);
      setSelectedDistId("");
      setNewDistrict("");
      setDistricts([]);
      setNewVillage("");
      setVillages([]);
      return;
    }

    setSelectedProvId(opt.id);
    setNewProvince(opt.name);
    setAddErrors((prev) => ({ ...prev, province: "" }));

    setSelectedRegId("");
    setNewCity("");
    setRegencies([]);
    setSelectedDistId("");
    setNewDistrict("");
    setDistricts([]);
    setNewVillage("");
    setVillages([]);

    setIsLoadingRegencies(true);
    const data = await fetchRegencies(opt.id);
    setRegencies(data);
    setIsLoadingRegencies(false);
  };

  const handleRegSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedRegId("");
      setNewCity("");
      setSelectedDistId("");
      setNewDistrict("");
      setDistricts([]);
      setNewVillage("");
      setVillages([]);
      return;
    }

    setSelectedRegId(opt.id);
    setNewCity(opt.name);
    setAddErrors((prev) => ({ ...prev, city: "" }));

    setSelectedDistId("");
    setNewDistrict("");
    setDistricts([]);
    setNewVillage("");
    setVillages([]);

    setIsLoadingDistricts(true);
    const data = await fetchDistricts(opt.id);
    setDistricts(data);
    setIsLoadingDistricts(false);
  };

  const handleDistSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedDistId("");
      setNewDistrict("");
      setNewVillage("");
      setVillages([]);
      return;
    }

    setSelectedDistId(opt.id);
    setNewDistrict(opt.name);
    setAddErrors((prev) => ({ ...prev, district: "" }));

    setNewVillage("");
    setVillages([]);

    setIsLoadingVillages(true);
    const data = await fetchVillages(opt.id);
    setVillages(data);
    setIsLoadingVillages(false);
  };

  const handleVillageSelect = (opt: RegionItem | null) => {
    if (!opt) {
      setNewVillage("");
      return;
    }
    setNewVillage(opt.name);
    setAddErrors((prev) => ({ ...prev, village: "" }));
  };

  const handleGmapsChange = (val: string) => {
    setNewGmaps(val);
    const parsed = parseGmapsInput(val);
    if (parsed.lat !== null && parsed.lng !== null) {
      setNewLat(parsed.lat);
      setNewLng(parsed.lng);
    } else {
      setNewLat(null);
      setNewLng(null);
    }
  };

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setNewLat(lat);
        setNewLng(lng);
        setNewGmaps(`https://www.google.com/maps?q=${lat},${lng}`);
        setToastMessage({
          text: `Lokasi GPS berhasil diambil (${lat.toFixed(5)}, ${lng.toFixed(5)})!`,
          type: "success",
        });
      },
      (err) => {
        alert("Gagal membaca koordinat GPS: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenMapPicker = () => {
    const draft = {
      newName,
      newOwner,
      newAddress,
      newWa,
      newGmaps,
      newLat,
      newLng,
      selectedProvId,
      newProvince,
      selectedRegId,
      newCity,
      selectedDistId,
      newDistrict,
      newVillage,
    };
    sessionStorage.setItem("sales_store_draft", JSON.stringify(draft));

    const searchTarget = [newAddress, newVillage, newDistrict, newCity, newProvince]
      .filter(Boolean)
      .join(", ");

    navigate(
      `/map-picker?source=sales-stores&returnTo=/sales/toko/baru&lat=${newLat ?? ""}&lng=${
        newLng ?? ""
      }&query=${encodeURIComponent(searchTarget)}&storeName=${encodeURIComponent(newName)}`
    );
  };

  const handleClose = () => {
    sessionStorage.removeItem("sales_store_draft");
    sessionStorage.removeItem("picked_map_location");
    navigate("/sales/toko");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!newName.trim()) {
      newErrors.name = "Nama Toko wajib diisi.";
    }
    if (!newOwner.trim()) {
      newErrors.owner = "Nama Pemilik / PIC Toko wajib diisi.";
    }
    if (!newWa.trim()) {
      newErrors.wa = "Nomor WhatsApp wajib diisi.";
    } else if (newWa.length < 11 || newWa.length > 15) {
      newErrors.wa = "Nomor WhatsApp harus 11 sampai 15 digit angka.";
    }
    if (!selectedProvId || !newProvince) {
      newErrors.province = "Provinsi wajib dipilih.";
    }
    if (!selectedRegId || !newCity) {
      newErrors.city = "Kabupaten / Kota wajib dipilih.";
    }
    if (!selectedDistId || !newDistrict) {
      newErrors.district = "Kecamatan wajib dipilih.";
    }
    if (!newVillage) {
      newErrors.village = "Desa / Kelurahan wajib dipilih.";
    }

    if (Object.keys(newErrors).length > 0) {
      setAddErrors(newErrors);
      setToastMessage({
        text: "Kolom yang wajib terisi masih kosong atau belum valid. Silakan lengkapi kolom yang berwarna merah.",
        type: "error",
      });
      return;
    }

    setAddErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8787/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          owner_name: newOwner.trim(),
          address: newAddress.trim(),
          province: newProvince.trim(),
          city: newCity.trim(),
          district: newDistrict.trim(),
          village: newVillage.trim(),
          wa_number: newWa.trim(),
          latitude: newLat,
          longitude: newLng,
        }),
      });

      if (res.ok) {
        const createdStore = await res.json();
        sessionStorage.removeItem("sales_store_draft");
        sessionStorage.removeItem("picked_map_location");

        setToastMessage({
          text: `Mitra toko "${newName.trim()}" berhasil ditambahkan! Mengalihkan ke titip stok awal...`,
          type: "success"
        });

        setTimeout(() => {
          if (createdStore?.id) {
            navigate(`/sales/toko/kunjungan/${createdStore.id}?mode=perdana`, { replace: true });
          } else {
            navigate("/sales/toko", { replace: true });
          }
        }, 800);
      } else {
        const err = await res.json();
        setToastMessage({ text: err.error || "Gagal menambahkan toko.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToastMessage({ text: "Terjadi gangguan koneksi ke server.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFastActionNewStore = searchParams.get("action") === "new-store" || true;

  return (
    <div className="space-y-4 pb-8">
      {/* Floating Toast Notification (Posisi melayang agar tidak merubah layout & posisi kolom input) */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xl backdrop-blur-md border ${
              toastMessage.type === "success"
                ? "bg-emerald-600/95 text-white border-emerald-400/40 shadow-emerald-900/30"
                : "bg-red-600/95 text-white border-red-400/40 shadow-red-900/30"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <AlertCircle size={18} className="shrink-0 text-white" />
              <span className="leading-snug">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white transition shrink-0"
              title="Tutup Notifikasi"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header Halaman Tersendiri (Seukuran Mobile) */}
      {/* Sesuai Permintaan: Hanya 1 button tanda silang (X) di pojok kanan, tanda panah dihapus */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Store size={18} className="text-primary" />
            <span>
              {isFastActionNewStore
                ? "Daftar Mitra & Titip Stok Awal"
                : "Tambah Mitra Toko Baru"}
            </span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isFastActionNewStore
              ? "Langkah 1: Profil Toko → Langkah 2: Titip Stok Konsinyasi"
              : "Formulir Pendaftaran Mitra Toko Baru"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
          title="Tutup & Kembali ke Daftar Toko"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Tambah Toko */}
      <form id="add-store-form" onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
        <div>
          <label className={`font-bold block mb-1 ${addErrors.name ? "text-red-600 font-extrabold" : "text-foreground"}`}>
            Nama Toko <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Toko Berkah Jaya"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (addErrors.name) setAddErrors((prev) => ({ ...prev, name: "" }));
            }}
            className={`w-full rounded-xl px-3 py-2.5 text-foreground focus:outline-none transition ${
              addErrors.name
                ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200"
                : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
            }`}
          />
        </div>

        <div>
          <label className={`font-bold block mb-1 ${addErrors.owner ? "text-red-600 font-extrabold" : "text-foreground"}`}>
            Nama Pemilik / PIC Toko <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: H. Ahmad Subarjo"
            value={newOwner}
            onChange={(e) => {
              setNewOwner(e.target.value);
              if (addErrors.owner) setAddErrors((prev) => ({ ...prev, owner: "" }));
            }}
            className={`w-full rounded-xl px-3 py-2.5 text-foreground focus:outline-none transition ${
              addErrors.owner
                ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200"
                : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
            }`}
          />
        </div>

        <div>
          <label className={`font-bold block mb-1 ${addErrors.wa ? "text-red-600 font-extrabold" : "text-foreground"}`}>
            Nomor WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={15}
            placeholder="08123456789 (Hanya angka)"
            value={newWa}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, "");
              setNewWa(onlyNums);
              if (addErrors.wa) setAddErrors((prev) => ({ ...prev, wa: "" }));
            }}
            className={`w-full rounded-xl px-3 py-2.5 text-foreground focus:outline-none transition ${
              addErrors.wa
                ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200"
                : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
            }`}
          />
        </div>

        {/* Wilayah Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchableSelect
            id="field-province"
            label="Provinsi"
            required
            placeholder="Ketik untuk mencari provinsi..."
            options={PROVINCES_DATA}
            value={newProvince}
            onSelect={handleProvSelect}
            hasError={!!addErrors.province}
          />

          <SearchableSelect
            id="field-city"
            label="Kabupaten / Kota"
            required
            placeholder="Ketik untuk mencari kab/kota..."
            options={regencies}
            value={newCity}
            disabled={!selectedProvId}
            disabledPlaceholder="Pilih Provinsi terlebih dahulu"
            isLoading={isLoadingRegencies}
            onSelect={handleRegSelect}
            hasError={!!addErrors.city}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchableSelect
            id="field-district"
            label="Kecamatan"
            required
            placeholder="Ketik untuk mencari kecamatan..."
            options={districts}
            value={newDistrict}
            disabled={!selectedRegId}
            disabledPlaceholder="Pilih Kabupaten/Kota terlebih dahulu"
            isLoading={isLoadingDistricts}
            onSelect={handleDistSelect}
            hasError={!!addErrors.district}
          />

          <SearchableSelect
            id="field-village"
            label="Desa / Kelurahan"
            required
            placeholder="Ketik untuk mencari desa/kelurahan..."
            options={villages}
            value={newVillage}
            disabled={!selectedDistId}
            disabledPlaceholder="Pilih Kecamatan terlebih dahulu"
            isLoading={isLoadingVillages}
            onSelect={handleVillageSelect}
            hasError={!!addErrors.village}
          />
        </div>

        <div>
          <label className="font-bold text-foreground block mb-1">Alamat Lengkap</label>
          <textarea
            rows={2}
            placeholder="Jalan, nomor ruko/rumah, patokan lokasi..."
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Titik Lokasi Peta / GPS */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="font-bold text-foreground block">
            Titik Koordinat Lokasi (Peta & GPS)
          </label>
          <p className="text-[11px] text-muted-foreground">
            Bantu navigasi tim sales dengan titik maps yang akurat.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGetGps}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-muted hover:bg-muted/80 text-foreground transition flex items-center justify-center gap-1.5 border border-border"
            >
              <MapPin size={14} className="text-emerald-600" />
              <span>Ambil GPS Saat Ini</span>
            </button>
            <button
              type="button"
              onClick={handleOpenMapPicker}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <MapPin size={14} />
              <span>Pilih pada Peta</span>
            </button>
          </div>

          <div>
            <input
              type="text"
              placeholder="Link hasil klik lokasi peta / Google Maps"
              value={newGmaps}
              onChange={(e) => handleGmapsChange(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-[11px]"
            />
          </div>

          {newLat !== null && newLng !== null && (
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>✓ Koordinat: {newLat.toFixed(5)}, {newLng.toFixed(5)}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="w-1/3 py-3 rounded-xl border border-border font-bold text-xs text-muted-foreground hover:bg-muted active:scale-95 transition text-center"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Menyimpan Toko...</span>
              </>
            ) : (
              <span>Simpan & Lanjut Titip Stok Konsinyasi</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
