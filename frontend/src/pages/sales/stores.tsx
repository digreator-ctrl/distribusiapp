import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Store, Plus, Search,
  CheckCircle2, X,
  Calendar, AlertCircle,
  ArrowUpDown, SlidersHorizontal, RotateCcw,
  RefreshCw, Hourglass, ChevronRight
} from "lucide-react";

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper untuk membaca inisial tab/subtab/sort dari URL, location.state, atau sessionStorage
  const getInitialMainTab = (): "stores" | "schedules" => {
    const qTab = searchParams.get("tab");
    if (qTab === "stores" || qTab === "schedules") return qTab;
    const locTab = location.state?.fromTab;
    if (locTab === "stores" || locTab === "schedules") return locTab;
    const sTab = sessionStorage.getItem("sales_stores_main_tab");
    if (sTab === "stores" || sTab === "schedules") return sTab as any;
    return "stores";
  };

  const getInitialSubTab = (): "recommendation" | "manual" => {
    const qSub = searchParams.get("subtab");
    if (qSub === "recommendation" || qSub === "manual") return qSub;
    const locSub = location.state?.fromSubTab;
    if (locSub === "recommendation" || locSub === "manual") return locSub;
    const sSub = sessionStorage.getItem("sales_stores_sub_tab");
    if (sSub === "recommendation" || sSub === "manual") return sSub as any;
    return "recommendation";
  };

  const getInitialSort = (): "expiry" | "period" => {
    const qSort = searchParams.get("sort");
    if (qSort === "expiry" || qSort === "period") return qSort;
    const locSort = location.state?.fromSort;
    if (locSort === "expiry" || locSort === "period") return locSort;
    const sSort = sessionStorage.getItem("sales_stores_recom_sort");
    if (sSort === "expiry" || sSort === "period") return sSort as any;
    return "expiry";
  };

  // Main Tab: "stores" (Data Toko) vs "schedules" (Jadwal Kunjungan)
  const [mainTab, setMainTabState] = useState<"stores" | "schedules">(getInitialMainTab);

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

  // Sub-Tab Jadwal Kunjungan: "recommendation" (Rekomendasi) | "manual" (Agenda)
  const [scheduleSubTab, setScheduleSubTabState] = useState<"recommendation" | "manual">(getInitialSubTab);
  // Prioritas Pengurutan di Tab Rekomendasi: "expiry" (By Kedaluwarsa) vs "period" (By Periode Bulanan)
  const [recomSortBy, setRecomSortByState] = useState<"expiry" | "period">(getInitialSort);
  // Pengurutan untuk Tab Agenda (Data Toko yang Sudah Dikunjungi / Dititipi)
  const [agendaSortBy, setAgendaSortBy] = useState<"visit_desc" | "visit_asc" | "name_asc" | "name_desc" | "stock_desc" | "stock_asc" | "debt_desc">("visit_desc");

  const setMainTab = (tab: "stores" | "schedules") => {
    setMainTabState(tab);
    sessionStorage.setItem("sales_stores_main_tab", tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  };

  const setScheduleSubTab = (sub: "recommendation" | "manual") => {
    setScheduleSubTabState(sub);
    sessionStorage.setItem("sales_stores_sub_tab", sub);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("subtab", sub);
      return next;
    }, { replace: true });
  };

  const setRecomSortBy = (sort: "expiry" | "period") => {
    setRecomSortByState(sort);
    sessionStorage.setItem("sales_stores_recom_sort", sort);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sort", sort);
      return next;
    }, { replace: true });
  };

  // Sinkronisasi jika parameter URL berubah (misal tombol back browser)
  useEffect(() => {
    const qTab = searchParams.get("tab");
    if (qTab === "stores" || qTab === "schedules") {
      setMainTabState(qTab);
      sessionStorage.setItem("sales_stores_main_tab", qTab);
    }
    const qSub = searchParams.get("subtab");
    if (qSub === "recommendation" || qSub === "manual") {
      setScheduleSubTabState(qSub);
      sessionStorage.setItem("sales_stores_sub_tab", qSub);
    }
    const qSort = searchParams.get("sort");
    if (qSort === "expiry" || qSort === "period") {
      setRecomSortByState(qSort);
      sessionStorage.setItem("sales_stores_recom_sort", qSort);
    }
    const qAction = searchParams.get("action");
    if (qAction === "new-store") {
      navigate("/sales/toko/baru?action=new-store", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleOpenAddModal = () => {
    navigate("/sales/toko/baru");
  };

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

  useEffect(() => {
    fetchStores();
  }, []);







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

  // Data Toko yang Sudah Dikunjungi / Dititipi untuk Tab Agenda
  const agendaStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = stores.filter((s) => {
      // Toko yang sudah pernah dikunjungi (ada last_visit_date / total_visits_count > 0)
      // ATAU sudah dititipi stok konsinyasi (total_remaining_stock > 0)
      const isTarget = Boolean(
        s.last_visit_date ||
        Number(s.total_visits_count) > 0 ||
        Number(s.total_remaining_stock) > 0
      );
      if (!isTarget) return false;

      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.nearest_expiring_product_name?.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      if (agendaSortBy === "visit_desc") {
        const aDate = a.last_visit_date || "";
        const bDate = b.last_visit_date || "";
        if (aDate && bDate) return bDate.localeCompare(aDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (agendaSortBy === "visit_asc") {
        const aDate = a.last_visit_date || "";
        const bDate = b.last_visit_date || "";
        if (aDate && bDate) return aDate.localeCompare(bDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (agendaSortBy === "stock_desc") {
        const diff = (Number(b.total_remaining_stock) || 0) - (Number(a.total_remaining_stock) || 0);
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (agendaSortBy === "stock_asc") {
        const diff = (Number(a.total_remaining_stock) || 0) - (Number(b.total_remaining_stock) || 0);
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (agendaSortBy === "debt_desc") {
        const diff = (Number(b.total_debt) || 0) - (Number(a.total_debt) || 0);
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (agendaSortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return list;
  }, [stores, searchQuery, agendaSortBy]);

  // =========================================================
  // LOGIKA KUNJUNGAN OTOMATIS: PERIODE BULANAN & KEDALUWARSA
  // =========================================================
  // Batas periode kunjungan toko rutin: minimal 1 bulan (30 hari) 1x kunjungan
  const PERIOD_DAYS = 30;

  // Metadata Kunjungan Bulanan per toko (Siklus minimal 1x per 30 hari)
  const getStoreVisitMeta = (s: any) => {
    if (!s.last_visit_date) {
      // Toko belum pernah dikunjungi
      let daysSinceCreated = 0;
      if (s.created_at) {
        const createdDate = new Date(s.created_at);
        const createdMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        const now = new Date();
        const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        daysSinceCreated = Math.max(0, Math.round((nowMidnight.getTime() - createdMidnight.getTime()) / (1000 * 60 * 60 * 24)));
      }
      const isOverdue = daysSinceCreated > PERIOD_DAYS;
      const daysOverdue = isOverdue ? daysSinceCreated - PERIOD_DAYS : 0;
      const daysUntilDue = isOverdue ? 0 : Math.max(0, PERIOD_DAYS - daysSinceCreated);

      return {
        hasVisited: false,
        daysSinceLastVisit: null,
        daysUntilDue,
        isOverdue,
        daysOverdue,
        nextDueDate: null,
        nextDueDateFormatted: isOverdue ? `Terlambat ${daysOverdue} hari` : "Perdana",
        lastVisitFormatted: "Belum pernah",
        status: isOverdue ? ("overdue" as const) : ("perdana" as const),
        statusLabel: isOverdue ? `Terlambat ${daysOverdue} hari` : "Perdana",
        countdownText: isOverdue ? `Terlambat ${daysOverdue} hari` : "Toko Baru",
      };
    }

    const lastVisit = new Date(s.last_visit_date);
    const lastVisitMidnight = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());
    const now = new Date();
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = nowMidnight.getTime() - lastVisitMidnight.getTime();
    const daysSince = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const nextDueDate = new Date(lastVisitMidnight.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const isOverdue = daysSince > PERIOD_DAYS;
    const daysOverdue = isOverdue ? daysSince - PERIOD_DAYS : 0;
    const daysUntilDue = isOverdue ? 0 : Math.max(0, PERIOD_DAYS - daysSince);

    // Ketentuan Pengguna Metode Periode:
    // 21 - 30 hari -> Aman (Hijau)
    // 11 - 20 hari -> Perhatian (Kuning)
    // 1 - 10 hari -> Segera (Merah)
    // Terlambat -> Terlambat X hari (Merah, terus bertambah jika tidak segera dikunjungi)
    let status: "safe" | "warning" | "urgent" | "overdue" = "safe";
    let statusLabel = "Aman";
    let countdownText = "";

    if (isOverdue) {
      status = "overdue";
      statusLabel = `Terlambat ${daysOverdue} hari`;
      countdownText = `Terlambat ${daysOverdue} hari`;
    } else if (daysUntilDue <= 10) {
      status = "urgent";
      statusLabel = "Segera";
      countdownText = daysUntilDue === 0 ? "Jatuh tempo hari ini" : `Kurang ${daysUntilDue} hari`;
    } else if (daysUntilDue <= 20) {
      status = "warning";
      statusLabel = "Perhatian";
      countdownText = `Kurang ${daysUntilDue} hari`;
    } else {
      status = "safe";
      statusLabel = "Aman";
      countdownText = `Kurang ${daysUntilDue} hari`;
    }

    const nextDueDateFormatted = nextDueDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const lastVisitFormatted = lastVisit.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      hasVisited: true,
      daysSinceLastVisit: daysSince,
      isOverdue,
      daysOverdue,
      daysUntilDue,
      nextDueDate,
      nextDueDateFormatted,
      lastVisitFormatted,
      status,
      statusLabel,
      countdownText,
    };
  };

  // Metadata Kedaluwarsa Produk di Toko
  const getStoreExpiryMeta = (s: any) => {
    if (!s.nearest_expired_date) {
      return {
        hasExpiry: false,
        expiredDate: null,
        daysUntilExpired: null,
        formattedDate: "-",
        status: "none" as const,
        statusLabel: "",
        countdownText: "-",
      };
    }

    const expDate = new Date(s.nearest_expired_date);
    const expDay = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
    const now = new Date();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = expDay.getTime() - nowDay.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = expDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Ketentuan Pengguna Metode Kedaluwarsa:
    // > 61 hari -> Aman (Hijau)
    // 31 sampai 60 hari -> Perhatian (Kuning)
    // < 30 hari -> Segera (Merah)
    let status: "safe" | "warning" | "urgent" = "safe";
    let statusLabel = "Aman";

    if (days <= 30) {
      status = "urgent";
      statusLabel = "Segera";
    } else if (days <= 60) {
      status = "warning";
      statusLabel = "Perhatian";
    } else {
      status = "safe";
      statusLabel = "Aman";
    }

    let countdownText = "";
    if (days < 0) {
      countdownText = `Lewat ${Math.abs(days)} hari`;
    } else if (days === 0) {
      countdownText = "Kedaluwarsa hari ini";
    } else {
      countdownText = `Kurang ${days} hari`;
    }

    return {
      hasExpiry: true,
      expiredDate: expDate,
      daysUntilExpired: days,
      formattedDate,
      status,
      statusLabel,
      countdownText,
    };
  };

  // Data Rekomendasi Kunjungan (Urutan By Kedaluwarsa & By Periode Bulanan)
  const recomStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = stores.filter((s) => {
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.nearest_expiring_product_name?.toLowerCase().includes(q) ||
        s.nearest_expiring_variant_name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q)
      );
    });

    if (recomSortBy === "expiry") {
      // Prioritas 1: Tanggal kedaluwarsa terdekat ke hari ini (FEFO)
      // Jika sudah dikunjungi dan produk kedaluwarsa di-update/selesai, otomatis pindah ke urutan kedaluwarsa berikutnya
      list.sort((a, b) => {
        if (a.nearest_expired_date && b.nearest_expired_date) {
          const cmp = a.nearest_expired_date.localeCompare(b.nearest_expired_date);
          if (cmp !== 0) return cmp;
        }
        if (a.nearest_expired_date && !b.nearest_expired_date) return -1;
        if (!a.nearest_expired_date && b.nearest_expired_date) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
    } else {
      // Prioritas 2: Periode Kunjungan Bulanan (Minimal 30 hari / 1 bulan dikunjungi 1x)
      // Toko belum pernah dikunjungi di atas (prioritas utama).
      // Toko yang baru dikunjungi otomatis menunggu antrian 30 hari lagi (pindah ke bawah sesuai siklus)
      list.sort((a, b) => {
        const aMeta = getStoreVisitMeta(a);
        const bMeta = getStoreVisitMeta(b);

        // Toko belum pernah dikunjungi di atas (prioritas utama)
        if (!aMeta.hasVisited && bMeta.hasVisited) return -1;
        if (aMeta.hasVisited && !bMeta.hasVisited) return 1;

        // Keduanya belum pernah dikunjungi: urut nama
        if (!aMeta.hasVisited && !bMeta.hasVisited) {
          return (a.name || "").localeCompare(b.name || "");
        }

        // Keduanya sudah pernah dikunjungi: tanggal jatuh tempo kunjungan terdekat/terlama di atas
        if (aMeta.nextDueDate && bMeta.nextDueDate) {
          const diff = aMeta.nextDueDate.getTime() - bMeta.nextDueDate.getTime();
          if (diff !== 0) return diff;
        }

        return (a.name || "").localeCompare(b.name || "");
      });
    }

    return list;
  }, [stores, searchQuery, recomSortBy]);

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

        {mainTab === "stores" && (
          <button
            onClick={handleOpenAddModal}
            className="bg-primary text-primary-foreground font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Toko</span>
          </button>
        )}
      </div>

      {/* Main Tab Switcher: Warna mencolok dan seragam saat aktif */}
      <div className="flex bg-muted/80 p-1 rounded-2xl border border-border/80 gap-1">
        <button
          type="button"
          onClick={() => setMainTab("stores")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all text-center ${
            mainTab === "stores"
              ? "bg-primary text-primary-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40 font-semibold"
          }`}
        >
          Data Toko
        </button>

        <button
          type="button"
          onClick={() => setMainTab("schedules")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all text-center ${
            mainTab === "schedules"
              ? "bg-primary text-primary-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40 font-semibold"
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
                    onClick={() => navigate(`/sales/toko/${store.id}`, { state: { store, fromTab: "stores" } })}
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
        <div className="space-y-3.5">
          {/* Sub-Tabs: Rekomendasi & Agenda (Warna mencolok & seragam) */}
          <div className="flex bg-muted/80 p-1 rounded-xl border border-border/70 gap-1">
            <button
              onClick={() => {
                setScheduleSubTab("recommendation");
              }}
              className={`flex-1 py-2 rounded-lg text-xs transition-all text-center whitespace-nowrap ${
                scheduleSubTab === "recommendation"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40 font-semibold"
              }`}
            >
              Rekomendasi
            </button>

            <button
              onClick={() => setScheduleSubTab("manual")}
              className={`flex-1 py-2 rounded-lg text-xs transition-all text-center whitespace-nowrap ${
                scheduleSubTab === "manual"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40 font-semibold"
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Search Bar (Universal for schedules) */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                scheduleSubTab === "recommendation"
                  ? "Cari toko, produk kedaluwarsa, atau alamat..."
                  : "Cari agenda kunjungan, toko, catatan..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* ========================================================= */}
          {/* SUB-TAB 1: REKOMENDASI KUNJUNGAN (HASIL MERGER OTOMATIS)  */}
          {/* ========================================================= */}
          {scheduleSubTab === "recommendation" && (
            <div className="space-y-3">
              {/* Switch On/Off Toggle untuk Prioritas Urutan */}
              <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-xl border border-border/70 shadow-2xs">
                <span className="text-xs font-bold text-muted-foreground shrink-0 pl-1">
                  Urutkan Berdasarkan:
                </span>

                {/* Saklar Geser (Segmented Switch Toggle) */}
                <div className="flex bg-muted/80 p-0.5 rounded-lg border border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setRecomSortBy("expiry")}
                    className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      recomSortBy === "expiry"
                        ? "bg-primary text-primary-foreground shadow-2xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    }`}
                  >
                    <Hourglass size={12} className={recomSortBy === "expiry" ? "text-primary-foreground" : "text-muted-foreground"} />
                    <span>Kedaluwarsa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecomSortBy("period")}
                    className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      recomSortBy === "period"
                        ? "bg-primary text-primary-foreground shadow-2xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    }`}
                  >
                    <RefreshCw size={12} className={recomSortBy === "period" ? "text-primary-foreground" : "text-muted-foreground"} />
                    <span>Periode</span>
                  </button>
                </div>
              </div>

              {/* List Toko Rekomendasi Langsung di Bawah Switch */}
              {isLoadingStores ? (
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-20 bg-muted/40 rounded-2xl" />
                  <div className="h-20 bg-muted/40 rounded-2xl" />
                  <div className="h-20 bg-muted/40 rounded-2xl" />
                </div>
              ) : recomStores.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto">
                    <Store size={22} />
                  </div>
                  <p className="font-bold text-xs text-foreground">Tidak Ada Toko Ditemukan</p>
                  <p className="text-[11px] text-muted-foreground">
                    {searchQuery
                      ? "Coba gunakan kata kunci pencarian yang lain."
                      : "Belum ada data mitra toko yang terdaftar."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recomStores.map((store) => {
                    const eMeta = getStoreExpiryMeta(store);
                    const vMeta = getStoreVisitMeta(store);

                    // Format: Nama Produk - Varian - Jumlah Stok
                    const productName = store.nearest_expiring_product_name || "Semua Produk";
                    const variantName = store.nearest_expiring_variant_name || "Standar";
                    const stockQty =
                      store.nearest_expiring_qty !== null && store.nearest_expiring_qty !== undefined
                        ? `${store.nearest_expiring_qty} pcs`
                        : store.total_remaining_stock > 0
                        ? `${store.total_remaining_stock} pcs`
                        : "0 pcs";
                    const productVariantStockText = `${productName} - ${variantName} - ${stockQty}`;

                    return (
                      <div
                        key={store.id}
                        onClick={() => navigate(`/sales/toko/${store.id}`, { state: { store, fromTab: mainTab, fromSubTab: scheduleSubTab, fromSort: recomSortBy, defaultTab: "stock" } })}
                        className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-2xs hover:border-primary/50 active:scale-[0.99] transition-all cursor-pointer space-y-2 group"
                      >
                        {/* Baris 1: Nama Toko pojok kiri atas */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                {store.name}
                              </h3>
                              {recomSortBy === "period" ? (
                                !vMeta.hasVisited ? (
                                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800 text-[10px] font-bold rounded-md shrink-0">
                                    Perdana
                                  </span>
                                ) : vMeta.status === "overdue" ? (
                                  <span className="px-1.5 py-0.5 bg-red-500/10 text-red-600 border border-red-300 dark:border-red-800 text-[10px] font-bold rounded-md shrink-0">
                                    {vMeta.statusLabel}
                                  </span>
                                ) : vMeta.status === "urgent" ? (
                                  <span className="px-1.5 py-0.5 bg-red-500/10 text-red-600 border border-red-300 dark:border-red-800 text-[10px] font-bold rounded-md shrink-0">
                                    Segera
                                  </span>
                                ) : vMeta.status === "warning" ? (
                                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-300 dark:border-amber-800 text-[10px] font-bold rounded-md shrink-0">
                                    Perhatian
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold rounded-md shrink-0">
                                    Aman
                                  </span>
                                )
                              ) : (
                                eMeta.hasExpiry ? (
                                  eMeta.status === "urgent" ? (
                                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-600 border border-red-300 dark:border-red-800 text-[10px] font-bold rounded-md shrink-0">
                                      Segera
                                    </span>
                                  ) : eMeta.status === "warning" ? (
                                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-300 dark:border-amber-800 text-[10px] font-bold rounded-md shrink-0">
                                      Perhatian
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold rounded-md shrink-0">
                                      Aman
                                    </span>
                                  )
                                ) : null
                              )}
                            </div>
                          </div>

                          {/* Pojok Kanan Atas: Hitungan Mundur Kurang Berapa Hari Menuju Kedaluwarsa */}
                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            {recomSortBy === "period" ? (
                              vMeta.isOverdue ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border bg-red-500/10 text-red-600 border-red-300 dark:border-red-800">
                                  Terlambat {vMeta.daysOverdue} hari
                                </span>
                              ) : vMeta.hasVisited ? (
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                    vMeta.status === "urgent"
                                      ? "bg-red-500/10 text-red-600 border-red-300 dark:border-red-800"
                                      : vMeta.status === "warning"
                                      ? "bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-800"
                                      : "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-800"
                                  }`}
                                >
                                  {vMeta.countdownText}
                                </span>
                              ) : null
                            ) : (
                              eMeta.hasExpiry && eMeta.daysUntilExpired !== null ? (
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                    eMeta.status === "urgent"
                                      ? "bg-red-500/10 text-red-600 border-red-300 dark:border-red-800"
                                      : eMeta.status === "warning"
                                      ? "bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-800"
                                      : "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-800"
                                  }`}
                                >
                                  {eMeta.countdownText}
                                </span>
                              ) : null
                            )}

                            <ChevronRight
                              size={16}
                              className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                          </div>
                        </div>

                        {/* Baris 2: Nama Produk - Varian - Jumlah Stok dibawah Nama Toko & Tanggal sejajar disebelah kanan */}
                        <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-border/40">
                          {/* Nama Produk - Varian - Jumlah Stok */}
                          <div className="min-w-0 flex-1 truncate text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {productVariantStockText}
                            </span>
                          </div>

                          {/* Tanggal sejajar disebelah kanan */}
                          <div className="shrink-0 text-right">
                            {recomSortBy === "period" ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  vMeta.isOverdue || vMeta.status === "urgent"
                                    ? "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50"
                                    : vMeta.status === "warning"
                                    ? "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-900/50"
                                    : vMeta.status === "safe"
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-900/50"
                                    : "bg-muted/70 text-muted-foreground border-border/60"
                                }`}
                                title={`Jadwal jatuh tempo kunjungan rutin (siklus 30 hari): ${vMeta.nextDueDateFormatted}`}
                              >
                                <Calendar size={11} className="shrink-0" />
                                <span>{vMeta.hasVisited ? vMeta.nextDueDateFormatted : "Segera"}</span>
                              </span>
                            ) : eMeta.hasExpiry ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  eMeta.status === "urgent"
                                    ? "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50"
                                    : eMeta.status === "warning"
                                    ? "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-900/50"
                                    : "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-900/50"
                                }`}
                              >
                                <Hourglass size={11} className="shrink-0" />
                                <span>{eMeta.formattedDate}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-medium">
                                -
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SUB-TAB 2: AGENDA (TOKO YANG SUDAH DIKUNJUNGI / DITITIPI)  */}
          {/* ========================================================= */}
          {scheduleSubTab === "manual" && (
            <div className="space-y-3">
              {/* Fitur Sort di Bawah Search */}
              <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-xl border border-border/70 shadow-2xs">
                <span className="text-xs font-bold text-muted-foreground shrink-0 pl-1">
                  Urutkan Toko:
                </span>

                <div className="flex items-center gap-1.5 bg-muted/60 border border-border/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground">
                  <ArrowUpDown size={12} className="text-primary shrink-0" />
                  <select
                    value={agendaSortBy}
                    onChange={(e: any) => setAgendaSortBy(e.target.value)}
                    className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="visit_desc">Kunjungan Terbaru</option>
                    <option value="visit_asc">Kunjungan Terlama</option>
                    <option value="name_asc">Nama Toko (A-Z)</option>
                    <option value="name_desc">Nama Toko (Z-A)</option>
                    <option value="stock_desc">Stok Titipan (Terbanyak)</option>
                    <option value="stock_asc">Stok Titipan (Tersedikit)</option>
                    <option value="debt_desc">Piutang Terbesar</option>
                  </select>
                </div>
              </div>

              {/* Daftar Toko yang Sudah Dikunjungi/Dititipi */}
              {isLoadingStores ? (
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-20 bg-muted/40 rounded-2xl" />
                  <div className="h-20 bg-muted/40 rounded-2xl" />
                  <div className="h-20 bg-muted/40 rounded-2xl" />
                </div>
              ) : agendaStores.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-muted/60 rounded-full flex items-center justify-center text-muted-foreground mx-auto">
                    <Store size={22} />
                  </div>
                  <p className="font-bold text-xs text-foreground">Belum Ada Toko yang Dikunjungi/Dititipi</p>
                  <p className="text-[11px] text-muted-foreground">
                    {searchQuery
                      ? "Tidak ada toko yang cocok dengan pencarian Anda."
                      : "Data toko yang telah dikunjungi atau dititipkan stok konsinyasi akan tercatat otomatis di sini."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {agendaStores.map((store) => {
                    const lastVisitDate = store.last_visit_date ? new Date(store.last_visit_date) : null;
                    const lastVisitFormatted = lastVisitDate
                      ? lastVisitDate.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-";

                    const remainingStock = Number(store.total_remaining_stock) || 0;
                    const variantsCount = Number(store.active_variants_count) || 0;
                    const debtAmount = Number(store.total_debt) || 0;
                    const visitsCount = Number(store.total_visits_count) || 0;
                    const storeNameWithCity = store.city ? `${store.name} - ${store.city}` : store.name;

                    return (
                      <div
                        key={store.id}
                        onClick={() =>
                          navigate(`/sales/toko/${store.id}`, {
                            state: { store, fromTab: mainTab, fromSubTab: scheduleSubTab },
                          })
                        }
                        className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-2xs hover:border-primary/50 active:scale-[0.99] transition-all cursor-pointer space-y-2 group"
                      >
                        {/* Baris Atas: Nama Toko - Nama Kota (Kiri Atas) & Tanggal Kunjungan (Kanan Atas) */}
                        <div className="flex items-start justify-between gap-3">
                          {/* Pojok Kiri Atas: Nama Toko - Nama Kota */}
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {storeNameWithCity}
                            </h3>
                            {debtAmount > 0 && (
                              <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[9px] font-black rounded-md shrink-0 border border-red-200 dark:border-red-800">
                                Piutang
                              </span>
                            )}
                          </div>

                          {/* Pojok Kanan Atas: Tanggal Kunjungan */}
                          <div className="shrink-0 text-right">
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted/70 text-foreground border border-border/60"
                              title="Tanggal Kunjungan Terakhir"
                            >
                              <Calendar size={11} className="text-primary shrink-0" />
                              <span>{lastVisitFormatted}</span>
                            </span>
                          </div>
                        </div>

                        {/* Baris Bawah: Jumlah Varian - Jumlah pcs (Kiri Bawah) & Total Kunjungan (Kanan Bawah) */}
                        <div className="flex items-center justify-between gap-3 text-xs pt-1.5 border-t border-border/40">
                          {/* Pojok Kiri Bawah: Jumlah Varian - Jumlah pcs */}
                          <div className="min-w-0 flex-1 truncate text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {variantsCount} Varian - {remainingStock} pcs
                            </span>
                          </div>

                          {/* Pojok Kanan Bawah: Total Kunjungan */}
                          <div className="shrink-0 text-right">
                            <span className="text-[11px] font-semibold text-muted-foreground bg-muted/50 border border-border/50 px-2 py-0.5 rounded-md">
                              {visitsCount} Kunjungan
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}



    </div>
  );
};
