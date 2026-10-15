import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Plus, Search, MapPin, MessageSquare,
  Clock, CheckCircle2, X,
  Compass, User, Calendar, Trash2, Edit2, AlertCircle,
  ArrowUpDown, SlidersHorizontal, RotateCcw
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
import { MapPickerModal } from "../../components/MapPickerModal";

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
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border text-xs backdrop-blur-md transition-all ${
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

export const SalesStores = () => {
  const navigate = useNavigate();
  const [activeSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  // Main Tab: "stores" (Data Toko) vs "schedules" (Jadwal Kunjungan)
  const [mainTab, setMainTab] = useState<"stores" | "schedules">("stores");

  // Stores State
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort & Filter state untuk Tab Data Toko
  const [storeSortBy, setStoreSortBy] = useState<"name_asc" | "name_desc" | "province" | "city" | "district" | "village">("name_asc");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterDebt, setFilterDebt] = useState<"all" | "has_debt" | "no_debt">("all");

  // Schedules State
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "today" | "upcoming" | "completed">("today");

  // Modal Tambah Toko
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newWa, setNewWa] = useState("");
  const [newGmaps, setNewGmaps] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);

  const [selectedProvId, setSelectedProvId] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [modalRegencies, setModalRegencies] = useState<RegionItem[]>([]);
  const [selectedRegId, setSelectedRegId] = useState("");
  const [newCity, setNewCity] = useState("");
  const [isLoadingModalRegencies, setIsLoadingModalRegencies] = useState(false);

  const [modalDistricts, setModalDistricts] = useState<RegionItem[]>([]);
  const [selectedDistId, setSelectedDistId] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [isLoadingModalDistricts, setIsLoadingModalDistricts] = useState(false);

  const [modalVillages, setModalVillages] = useState<RegionItem[]>([]);
  const [newVillage, setNewVillage] = useState("");
  const [isLoadingModalVillages, setIsLoadingModalVillages] = useState(false);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [addErrors, setAddErrors] = useState<{ [key: string]: string }>({});

  // Reset form tambah toko ke kondisi default normal
  const resetAddForm = () => {
    setNewName("");
    setNewOwner("");
    setNewAddress("");
    setNewWa("");
    setNewGmaps("");
    setNewLat(null);
    setNewLng(null);
    setSelectedProvId("");
    setNewProvince("");
    setSelectedRegId("");
    setNewCity("");
    setSelectedDistId("");
    setNewDistrict("");
    setNewVillage("");
    setModalRegencies([]);
    setModalDistricts([]);
    setModalVillages([]);
    setAddErrors({});
    setFormError("");
    setIsMapModalOpen(false);
    if (toast?.type === "error") {
      setToast(null);
    }
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    setIsAddOpen(true);
  };

  const handleCloseAddModal = () => {
    resetAddForm();
    setIsAddOpen(false);
  };

  // Modal Jadwal Kunjungan (Tambah / Edit)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schedStoreId, setSchedStoreId] = useState("");
  const [schedDate, setSchedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [schedNotes, setSchedNotes] = useState("");
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const [schedError, setSchedError] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchStores = async () => {
    try {
      setIsLoadingStores(true);
      const res = await fetch("http://localhost:8787/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch stores error:", err);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setIsLoadingSchedules(true);
      let url = "http://localhost:8787/api/visit-schedules";
      if (activeSalesId) {
        url += `?sales_id=${activeSalesId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSchedules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch schedules error:", err);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchSchedules();
  }, []);

  const handleSelectFromMap = (data: { lat: number; lng: number; gmapsUrl: string }) => {
    setNewLat(data.lat);
    setNewLng(data.lng);
    setNewGmaps(data.gmapsUrl);
    setToast({
      message: `Titik koordinat berhasil dipilih (${data.lat.toFixed(5)}, ${data.lng.toFixed(5)})!`,
      type: "success",
    });
  };

  const handleModalProvSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedProvId("");
      setNewProvince("");
      setSelectedRegId("");
      setNewCity("");
      setModalRegencies([]);
      setSelectedDistId("");
      setNewDistrict("");
      setModalDistricts([]);
      setNewVillage("");
      setModalVillages([]);
      return;
    }

    setSelectedProvId(opt.id);
    setNewProvince(opt.name);
    setAddErrors((prev) => ({ ...prev, province: "" }));

    setSelectedRegId("");
    setNewCity("");
    setModalRegencies([]);
    setSelectedDistId("");
    setNewDistrict("");
    setModalDistricts([]);
    setNewVillage("");
    setModalVillages([]);

    setIsLoadingModalRegencies(true);
    const data = await fetchRegencies(opt.id);
    setModalRegencies(data);
    setIsLoadingModalRegencies(false);
  };

  const handleModalRegSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedRegId("");
      setNewCity("");
      setSelectedDistId("");
      setNewDistrict("");
      setModalDistricts([]);
      setNewVillage("");
      setModalVillages([]);
      return;
    }

    setSelectedRegId(opt.id);
    setNewCity(opt.name);
    setAddErrors((prev) => ({ ...prev, city: "" }));

    setSelectedDistId("");
    setNewDistrict("");
    setModalDistricts([]);
    setNewVillage("");
    setModalVillages([]);

    setIsLoadingModalDistricts(true);
    const data = await fetchDistricts(opt.id);
    setModalDistricts(data);
    setIsLoadingModalDistricts(false);
  };

  const handleModalDistSelect = async (opt: RegionItem | null) => {
    if (!opt) {
      setSelectedDistId("");
      setNewDistrict("");
      setNewVillage("");
      setModalVillages([]);
      return;
    }

    setSelectedDistId(opt.id);
    setNewDistrict(opt.name);
    setAddErrors((prev) => ({ ...prev, district: "" }));

    setNewVillage("");
    setModalVillages([]);

    setIsLoadingModalVillages(true);
    const data = await fetchVillages(opt.id);
    setModalVillages(data);
    setIsLoadingModalVillages(false);
  };

  const handleModalVillageSelect = (opt: RegionItem | null) => {
    if (!opt) {
      setNewVillage("");
      return;
    }
    setNewVillage(opt.name);
    setAddErrors((prev) => ({ ...prev, village: "" }));
  };

  const handleModalGmapsChange = (val: string) => {
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

  const handleAddStore = async (e: React.FormEvent) => {
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
      setToast({
        message: "Kolom yang wajib terisi masih kosong atau belum valid. Silakan lengkapi kolom yang berwarna merah.",
        type: "error",
      });
      return;
    }

    setAddErrors({});
    setFormError("");
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
        setToast({ message: `Mitra toko "${newName.trim()}" berhasil ditambahkan!`, type: "success" });
        handleCloseAddModal();
        fetchStores();
      } else {
        const err = await res.json();
        setToast({ message: err.error || "Gagal menambahkan toko.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Terjadi gangguan koneksi ke server.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openScheduleModal = (storeId?: string, existing?: any) => {
    if (existing) {
      setEditingScheduleId(existing.id);
      setSchedStoreId(existing.store_id || "");
      setSchedDate(existing.scheduled_date || new Date().toISOString().split("T")[0]);
      setSchedNotes(existing.notes || "");
    } else {
      setEditingScheduleId(null);
      setSchedStoreId(storeId || (stores[0]?.id || ""));
      setSchedDate(new Date().toISOString().split("T")[0]);
      setSchedNotes("");
    }
    setSchedError("");
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedStoreId) {
      setSchedError("Pilih toko yang ingin dikunjungi.");
      return;
    }
    if (!schedDate) {
      setSchedError("Tentukan tanggal kunjungan.");
      return;
    }

    setSchedSubmitting(true);
    setSchedError("");
    try {
      if (editingScheduleId) {
        // Edit Schedule
        const res = await fetch(`http://localhost:8787/api/visit-schedules/${editingScheduleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduled_date: schedDate,
            notes: schedNotes,
          }),
        });
        if (res.ok) {
          setToast({ message: "Jadwal kunjungan berhasil diperbarui!", type: "success" });
          setIsScheduleModalOpen(false);
          fetchSchedules();
        } else {
          const err = await res.json();
          setSchedError(err.error || "Gagal memperbarui jadwal.");
        }
      } else {
        // Create Schedule
        const res = await fetch("http://localhost:8787/api/visit-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: schedStoreId,
            sales_id: activeSalesId || null,
            scheduled_date: schedDate,
            notes: schedNotes,
          }),
        });
        if (res.ok) {
          setToast({ message: "Jadwal kunjungan berhasil dibuat!", type: "success" });
          setIsScheduleModalOpen(false);
          fetchSchedules();
        } else {
          const err = await res.json();
          setSchedError(err.error || "Gagal menambahkan jadwal.");
        }
      }
    } catch (err) {
      console.error(err);
      setSchedError("Terjadi gangguan koneksi.");
    } finally {
      setSchedSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Hapus jadwal kunjungan ini?")) return;
    try {
      const res = await fetch(`http://localhost:8787/api/visit-schedules/${scheduleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToast({ message: "Jadwal kunjungan dihapus.", type: "success" });
        fetchSchedules();
      }
    } catch (err) {
      console.error("Delete schedule error:", err);
    }
  };



  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr + "T00:00:00");
    const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
    return d.toLocaleDateString("id-ID", options);
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const availableProvinces = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      if (s.province?.trim()) set.add(s.province.trim());
    });
    return Array.from(set).sort();
  }, [stores]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      if (s.city?.trim() && (!filterProvince || s.province === filterProvince)) {
        set.add(s.city.trim());
      }
    });
    return Array.from(set).sort();
  }, [stores, filterProvince]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      if (s.district?.trim() && (!filterCity || s.city === filterCity)) {
        set.add(s.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [stores, filterCity]);

  // Filter & Search & Sort logic for Stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.province?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.village?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterProvince && s.province !== filterProvince) return false;
      if (filterCity && s.city !== filterCity) return false;
      if (filterDistrict && s.district !== filterDistrict) return false;

      if (filterDebt === "has_debt" && !(Number(s.total_debt) > 0)) return false;
      if (filterDebt === "no_debt" && Number(s.total_debt) > 0) return false;

      return true;
    }).sort((a, b) => {
      if (storeSortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (storeSortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (storeSortBy === "province") return (a.province || "").localeCompare(b.province || "");
      if (storeSortBy === "city") return (a.city || "").localeCompare(b.city || "");
      if (storeSortBy === "district") return (a.district || "").localeCompare(b.district || "");
      if (storeSortBy === "village") return (a.village || "").localeCompare(b.village || "");
      return 0;
    });
  }, [stores, searchQuery, filterProvince, filterCity, filterDistrict, filterDebt, storeSortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterProvince) count++;
    if (filterCity) count++;
    if (filterDistrict) count++;
    if (filterDebt !== "all") count++;
    return count;
  }, [filterProvince, filterCity, filterDistrict, filterDebt]);

  // Filter & Search logic for Schedules
  const filteredSchedules = schedules.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.store_name?.toLowerCase().includes(q) ||
      s.owner_name?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.notes?.toLowerCase().includes(q);

    if (!matchSearch) return false;

    const sDate = s.scheduled_date ? s.scheduled_date.split("T")[0] : "";
    const isCompleted = s.status === "completed";

    if (scheduleFilter === "today") {
      return sDate === todayStr;
    }
    if (scheduleFilter === "upcoming") {
      return sDate > todayStr && !isCompleted;
    }
    if (scheduleFilter === "completed") {
      return isCompleted;
    }
    return true;
  });

  // Summary counts for Schedules
  const scheduleTodayCount = schedules.filter((s) => (s.scheduled_date?.split("T")[0] === todayStr)).length;
  const scheduleCompletedCount = schedules.filter((s) => s.status === "completed").length;
  const scheduleUpcomingCount = schedules.filter((s) => (s.scheduled_date?.split("T")[0] > todayStr && s.status !== "completed")).length;
  const schedulePendingTodayCount = schedules.filter((s) => (s.scheduled_date?.split("T")[0] === todayStr && s.status !== "completed")).length;

  return (
    <div className="space-y-4 pb-6">
      {/* Floating Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store size={20} className="text-primary" />
            Mitra Toko
          </h1>
          <p className="text-xs text-muted-foreground">
            {mainTab === "stores"
              ? "Kelola data toko konsinyasi & mulai kunjungan"
              : "Jadwal dan rute kunjungan sales ke mitra toko"}
          </p>
        </div>

        {mainTab === "stores" ? (
          <button
            onClick={handleOpenAddModal}
            className="bg-primary text-primary-foreground font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Toko</span>
          </button>
        ) : (
          <button
            onClick={() => openScheduleModal()}
            className="bg-primary text-primary-foreground font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
          >
            <Plus size={16} />
            <span>Jadwalkan</span>
          </button>
        )}
      </div>

      {/* Main Tab Switcher: Tanpa Icon & Tanpa Angka sesuai instruksi */}
      <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/80 gap-1">
        <button
          type="button"
          onClick={() => setMainTab("stores")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
            mainTab === "stores"
              ? "bg-card text-foreground shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          Data Toko
        </button>

        <button
          type="button"
          onClick={() => setMainTab("schedules")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
            mainTab === "schedules"
              ? "bg-card text-foreground shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          Jadwal Kunjungan
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DATA TOKO                                          */}
      {/* ========================================================= */}
      {mainTab === "stores" && (
        <div className="space-y-3">
          {/* Controls: Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama toko, pemilik, atau wilayah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Baris Sort & Filter di Bawah Search */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-2">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground shadow-xs">
                <ArrowUpDown size={13} className="text-primary shrink-0" />
                <select
                  value={storeSortBy}
                  onChange={(e: any) => setStoreSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none w-full cursor-pointer truncate"
                >
                  <option value="name_asc">Nama (A-Z)</option>
                  <option value="name_desc">Nama (Z-A)</option>
                  <option value="province">Provinsi (A-Z)</option>
                  <option value="city">Kota/Kab (A-Z)</option>
                  <option value="district">Kecamatan (A-Z)</option>
                  <option value="village">Desa/Kel (A-Z)</option>
                </select>
              </div>

              {/* Filter Wilayah Button (Membuka Pilihan Float) */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                className={`flex items-center justify-between gap-1.5 border rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-98 shadow-xs ${
                  activeFiltersCount > 0
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                    : "bg-card border-border/80 hover:border-primary/50 text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <SlidersHorizontal size={13} className={activeFiltersCount > 0 ? "text-primary-foreground" : "text-primary"} />
                  <span className="truncate">Filter Wilayah</span>
                </div>
                {activeFiltersCount > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center shrink-0">
                    {activeFiltersCount}
                  </span>
                ) : (
                  <span className="text-[10px] opacity-60">▼</span>
                )}
              </button>
            </div>

            {/* Pilihan Float Filter Wilayah (Tampil melayang tepat di area PWA saat diklik) */}
            {isFilterModalOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsFilterModalOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-card border border-border shadow-2xl rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-primary" />
                      Pilihan Filter Wilayah
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFilterModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:bg-muted"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Provinsi</label>
                      <select
                        value={filterProvince}
                        onChange={(e) => {
                          setFilterProvince(e.target.value);
                          setFilterCity("");
                          setFilterDistrict("");
                        }}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Semua Provinsi</option>
                        {availableProvinces.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Kabupaten / Kota</label>
                      <select
                        value={filterCity}
                        onChange={(e) => {
                          setFilterCity(e.target.value);
                          setFilterDistrict("");
                        }}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Semua Kabupaten / Kota</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Kecamatan</label>
                      <select
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Semua Kecamatan</option>
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Status Piutang</label>
                      <select
                        value={filterDebt}
                        onChange={(e: any) => setFilterDebt(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">Semua Status</option>
                        <option value="has_debt">Ada Piutang</option>
                        <option value="no_debt">Lunas (Tidak Ada Piutang)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterProvince("");
                        setFilterCity("");
                        setFilterDistrict("");
                        setFilterDebt("all");
                      }}
                      className="text-[11px] font-bold text-muted-foreground hover:text-red-500 flex items-center gap-1 transition"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterModalOpen(false)}
                      className="px-4 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-xs active:scale-95 transition"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px]">
              {filterProvince && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  Prov: {filterProvince}
                  <button onClick={() => setFilterProvince("")}><X size={12} /></button>
                </span>
              )}
              {filterCity && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  Kota: {filterCity}
                  <button onClick={() => setFilterCity("")}><X size={12} /></button>
                </span>
              )}
              {filterDistrict && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  Kec: {filterDistrict}
                  <button onClick={() => setFilterDistrict("")}><X size={12} /></button>
                </span>
              )}
              {filterDebt !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  {filterDebt === "has_debt" ? "Ada Piutang" : "Lunas"}
                  <button onClick={() => setFilterDebt("all")}><X size={12} /></button>
                </span>
              )}
              <button
                onClick={() => {
                  setFilterProvince("");
                  setFilterCity("");
                  setFilterDistrict("");
                  setFilterDebt("all");
                }}
                className="text-[10px] text-muted-foreground hover:text-red-500 font-bold ml-1 flex items-center gap-0.5"
              >
                <RotateCcw size={10} />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* Daftar Toko Berupa Card (Bukan Tabel) Sesuai Instruksi Pengguna */}
          {isLoadingStores ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-28 bg-muted/40 rounded-2xl" />
              <div className="h-28 bg-muted/40 rounded-2xl" />
              <div className="h-28 bg-muted/40 rounded-2xl" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
              <Store size={28} className="text-muted-foreground mx-auto" />
              <p className="font-bold text-xs text-foreground">Tidak Ada Toko Ditemukan</p>
              <p className="text-[11px] text-muted-foreground">
                {searchQuery || activeFiltersCount > 0
                  ? "Coba sesuaikan kata kunci pencarian atau filter wilayah."
                  : "Belum ada mitra toko terdaftar. Tambah sekarang."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStores.map((store) => {
                const regionParts = [
                  store.province,
                  store.city,
                  store.district,
                  store.village,
                ].filter(Boolean);
                const regionText = regionParts.length > 0 ? regionParts.join(" - ") : (store.address || "-");

                return (
                  <div
                    key={store.id}
                    onClick={() => navigate(`/sales/toko/${store.id}`)}
                    className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-2xs hover:border-primary/50 active:scale-[0.99] transition-all cursor-pointer group space-y-1.5"
                  >
                    {/* Pojok Kiri Atas: Nama Toko sejajar Pojok Kanan Atas: Nama Owner/PIC */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {store.name}
                        </h3>
                        {Number(store.total_debt) > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Ada Piutang" />
                        )}
                      </div>

                      <span className="text-xs font-semibold text-muted-foreground shrink-0 text-right truncate max-w-[45%]">
                        {store.owner_name || "-"}
                      </span>
                    </div>

                    {/* Tepat Dibawah Nama Toko: Font lebih kecil Provinsi - Kab/Kota - Kecamatan - Desa/Kelurahan */}
                    <p className="text-[11px] text-muted-foreground/85 leading-snug">
                      {regionText}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: JADWAL KUNJUNGAN                                    */}
      {/* ========================================================= */}
      {mainTab === "schedules" && (
        <div className="space-y-3">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-semibold block">Hari Ini</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-foreground">{scheduleTodayCount}</span>
                {schedulePendingTodayCount > 0 && (
                  <span className="text-[10px] text-amber-600 font-bold">({schedulePendingTodayCount} pending)</span>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-semibold block">Mendatang</span>
              <p className="text-lg font-black text-foreground mt-0.5">{scheduleUpcomingCount}</p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-semibold block">Selesai</span>
              <p className="text-lg font-black text-emerald-600 mt-0.5">{scheduleCompletedCount}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari jadwal, nama toko, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Sub-Filter Tabs: Text Only */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setScheduleFilter("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                scheduleFilter === "today"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              Hari Ini ({scheduleTodayCount})
            </button>
            <button
              onClick={() => setScheduleFilter("upcoming")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                scheduleFilter === "upcoming"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              Mendatang ({scheduleUpcomingCount})
            </button>
            <button
              onClick={() => setScheduleFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                scheduleFilter === "completed"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              Selesai ({scheduleCompletedCount})
            </button>
            <button
              onClick={() => setScheduleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                scheduleFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              Semua ({schedules.length})
            </button>
          </div>

          {/* Schedule List */}
          {isLoadingSchedules ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-28 bg-muted/40 rounded-2xl" />
              <div className="h-28 bg-muted/40 rounded-2xl" />
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mx-auto">
                <Calendar size={24} />
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Tidak Ada Jadwal Kunjungan</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {scheduleFilter === "today"
                    ? "Belum ada agenda kunjungan untuk hari ini."
                    : "Tidak ada jadwal dengan filter yang dipilih."}
                </p>
              </div>
              <button
                onClick={() => openScheduleModal()}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs"
              >
                <Plus size={14} />
                <span>Buat Jadwal Baru</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSchedules.map((item) => {
                const sDate = item.scheduled_date ? item.scheduled_date.split("T")[0] : "";
                const isCompleted = item.status === "completed";
                const isToday = sDate === todayStr;
                const isOverdue = sDate < todayStr && !isCompleted;
                const hasDebt = Number(item.total_debt) > 0;
                const remaining = Number(item.total_remaining_stock) || 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-card rounded-2xl border p-3.5 shadow-2xs space-y-3 transition-all ${
                      isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : isOverdue
                        ? "border-red-500/40 bg-red-500/5"
                        : isToday
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-border/80"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-foreground truncate">{item.store_name}</h3>
                          
                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full shrink-0 flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 size={10} />
                              Selesai
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full shrink-0 flex items-center gap-1 border border-red-300">
                              <AlertCircle size={10} />
                              Terlewat
                            </span>
                          ) : isToday ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full shrink-0 flex items-center gap-1 border border-amber-300">
                              <Clock size={10} />
                              Hari Ini
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded-full shrink-0">
                              Mendatang
                            </span>
                          )}

                          {hasDebt && (
                            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] font-black rounded-full shrink-0 border border-red-200">
                              Piutang
                            </span>
                          )}
                        </div>

                        {item.owner_name && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User size={11} className="shrink-0" />
                            <span className="truncate">{item.owner_name}</span>
                          </p>
                        )}

                        {item.address && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="shrink-0 text-primary/70" />
                            <span className="truncate">{item.address}</span>
                          </p>
                        )}
                      </div>

                      {/* Action Icon: Edit or Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isCompleted && (
                          <button
                            onClick={() => openScheduleModal(item.store_id, item)}
                            className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground"
                            title="Ubah Jadwal"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-red-600"
                          title="Hapus Jadwal"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Scheduled Date & Agenda Note */}
                    <div className="bg-muted/40 rounded-xl p-2.5 space-y-1.5 border border-border/40 text-[11px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Calendar size={12} className="text-primary" />
                          {formatScheduleDate(item.scheduled_date)}
                        </span>
                        <span className="text-[10px]">
                          Stok rak: <strong className="text-foreground">{remaining} pcs</strong>
                        </span>
                      </div>

                      {item.notes ? (
                        <p className="text-foreground/90 bg-background/80 p-2 rounded-lg border border-border/50 text-[11px]">
                          <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Agenda / Catatan:</span>
                          {item.notes}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic text-[10px]">
                          Tidak ada catatan agenda khusus.
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {!isCompleted ? (
                        <button
                          onClick={() => navigate(`/sales/toko/kunjungan/${item.store_id}`)}
                          className="flex-1 bg-primary text-primary-foreground font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition shadow-xs"
                        >
                          <Store size={14} />
                          <span>Mulai Kunjungan</span>
                        </button>
                      ) : (
                        <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} />
                          <span>Kunjungan Telah Selesai</span>
                        </div>
                      )}

                      {item.wa_number && (
                        <a
                          href={`https://wa.me/${item.wa_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-95 transition shrink-0"
                          title="Chat WhatsApp"
                        >
                          <MessageSquare size={16} />
                        </a>
                      )}

                      {item.latitude && item.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 transition shrink-0"
                          title="Buka Peta"
                        >
                          <Compass size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL JADWAL KUNJUNGAN (TAMBAH / UBAH)                    */}
      {/* ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                {editingScheduleId ? "Ubah Jadwal Kunjungan" : "Jadwalkan Kunjungan Baru"}
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {schedError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {schedError}
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Pilih Mitra Toko *</label>
                <select
                  disabled={Boolean(editingScheduleId)}
                  value={schedStoreId}
                  onChange={(e) => setSchedStoreId(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  required
                >
                  <option value="" disabled>-- Pilih Toko --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.owner_name ? `(${s.owner_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Tanggal Kunjungan *</label>
                <input
                  type="date"
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Agenda / Catatan Kunjungan</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Tagih piutang nota tempo, bawa sampel varian baru, restock produk..."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={schedSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm active:scale-95 transition disabled:opacity-50"
                >
                  {schedSubmitting ? "Menyimpan..." : editingScheduleId ? "Simpan Perubahan" : "Buat Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER / MODAL TAMBAH TOKO BARU                           */}
      {/* ========================================================= */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAddModal();
          }}
        >
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Store size={18} className="text-primary" />
                Tambah Mitra Toko Baru
              </h3>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStore} noValidate className="space-y-3.5 text-xs">
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
                  className={`w-full rounded-xl px-3 py-2 text-foreground focus:outline-none transition ${
                    addErrors.name
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {addErrors.name && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    {addErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className={`font-bold block mb-1 ${addErrors.owner ? "text-red-600 font-extrabold" : "text-foreground"}`}>
                  Nama Pemilik / PIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Haji Samsul"
                  value={newOwner}
                  onChange={(e) => {
                    setNewOwner(e.target.value);
                    if (addErrors.owner) setAddErrors((prev) => ({ ...prev, owner: "" }));
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-foreground focus:outline-none transition ${
                    addErrors.owner
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {addErrors.owner && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    {addErrors.owner}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-bold ${addErrors.wa ? "text-red-600 font-extrabold" : "text-foreground"}`}>
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-semibold ${
                    newWa.length >= 11 && newWa.length <= 15
                      ? "text-emerald-600"
                      : newWa.length > 0
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}>
                    {newWa.length} / 15 digit (min. 11)
                  </span>
                </div>
                <input
                  type="tel"
                  placeholder="Hanya angka, contoh: 081234567890"
                  value={newWa}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 15);
                    setNewWa(val);
                    if (addErrors.wa && val.length >= 11 && val.length <= 15) {
                      setAddErrors((prev) => ({ ...prev, wa: "" }));
                    }
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono transition ${
                    addErrors.wa
                      ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200"
                      : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {addErrors.wa ? (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    {addErrors.wa}
                  </p>
                ) : (
                  newWa.length > 0 && newWa.length < 11 && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Nomor WhatsApp minimal 11 digit angka.
                    </p>
                  )
                )}
              </div>

              {/* Regional Fields Searchable Inputs */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} className="text-primary" />
                  <span>Wilayah Toko (Bisa Ketik untuk Memilih Cepat)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <SearchableSelect
                    id="modal-province"
                    label="Provinsi"
                    required
                    placeholder="Ketik nama provinsi..."
                    options={PROVINCES_DATA}
                    value={newProvince}
                    onSelect={handleModalProvSelect}
                    hasError={!!addErrors.province}
                    errorMessage={addErrors.province}
                  />

                  <SearchableSelect
                    id="modal-city"
                    label="Kabupaten / Kota"
                    required
                    placeholder="Ketik nama kab/kota..."
                    options={modalRegencies}
                    value={newCity}
                    disabled={!selectedProvId}
                    disabledPlaceholder="Pilih Provinsi terlebih dahulu"
                    isLoading={isLoadingModalRegencies}
                    onSelect={handleModalRegSelect}
                    hasError={!!addErrors.city}
                    errorMessage={addErrors.city}
                  />

                  <SearchableSelect
                    id="modal-district"
                    label="Kecamatan"
                    required
                    placeholder="Ketik nama kecamatan..."
                    options={modalDistricts}
                    value={newDistrict}
                    disabled={!selectedRegId}
                    disabledPlaceholder="Pilih Kab/Kota terlebih dahulu"
                    isLoading={isLoadingModalDistricts}
                    onSelect={handleModalDistSelect}
                    hasError={!!addErrors.district}
                    errorMessage={addErrors.district}
                  />

                  <SearchableSelect
                    id="modal-village"
                    label="Desa / Kelurahan"
                    required
                    placeholder="Ketik nama desa/kelurahan..."
                    options={modalVillages}
                    value={newVillage}
                    disabled={!selectedDistId}
                    disabledPlaceholder="Pilih Kecamatan terlebih dahulu"
                    isLoading={isLoadingModalVillages}
                    onSelect={handleModalVillageSelect}
                    hasError={!!addErrors.village}
                    errorMessage={addErrors.village}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Alamat Lengkap / Patokan</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Kalibaru No. 45, samping kantor pos..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Titik Google Maps Input & Helper (GPS Saya Dihapus, Peta Interaktif) */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <label className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                    <Compass size={13} className="text-primary" />
                    <span>Titik Google Maps</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs hover:opacity-90 active:scale-95 transition"
                    title="Buka peta untuk memilih titik lokasi dan otomatis terinput"
                  >
                    <MapPin size={11} />
                    <span>Peta</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Tempel link Google Maps atau klik Peta di atas"
                  value={newGmaps}
                  onChange={(e) => handleModalGmapsChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-[11px]"
                />

                {newLat !== null && newLng !== null && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200 inline-block">
                    ✓ Koordinat: {newLat.toFixed(5)}, {newLng?.toFixed(5)}
                  </span>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Toko"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={newLat}
        initialLng={newLng}
        initialSearchQuery={[newAddress, newVillage, newDistrict, newCity, newProvince].filter(Boolean).join(", ")}
        onSelectLocation={handleSelectFromMap}
      />
    </div>
  );
};
