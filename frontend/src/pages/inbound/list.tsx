import { formatDate } from "../../utils/date";
import {
  useState,
  useEffect,
  useMemo,
  useCallback } from "react";
import { useNavigate,
  useLocation } from "react-router-dom";
import { 
  CheckCircle2,
  X,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowDownToLine,
  Building2,
  Warehouse,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3 shadow-xl max-w-sm w-full">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-green-800">Berhasil</h3>
        <p className="text-sm text-green-700 mt-1">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="text-green-500 hover:text-green-700 transition">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export const InboundList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");

  // Hapus state dari history agar tidak muncul lagi saat di-refresh
  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inbound_batches`);
      if (res.ok) {
        const json = await res.json();
        setBatches(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error("Gagal mengambil data stok masuk:", err);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Filter, Search, Sort, Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [filterVariant, setFilterVariant] = useState("ALL");
  const [sortOption, setSortOption] = useState("date_desc");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set(batches.map((b: any) => b.supplier_name || "Internal"));
    return ["ALL", ...Array.from(suppliers).sort()];
  }, [batches]);

  // Get unique variants for filter dropdown
  const uniqueVariants = useMemo(() => {
    const variants = new Set(
      batches
        .map((b: any) => b.variant_name)
        .filter((v: any) => Boolean(v && typeof v === "string" && v.trim()))
    );
    return ["ALL", ...Array.from(variants).sort()];
  }, [batches]);

  // Active filter count for badge and reset indicator
  const activeFilterCount = 
    (filterSupplier !== "ALL" ? 1 : 0) + 
    (filterVariant !== "ALL" ? 1 : 0) + 
    (sortOption !== "date_desc" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Apply Filter, Search & Sort
  const processedBatches = useMemo(() => {
    let result = [...batches];

    // Search: mencakup Nama Produk, Varian, ID Produk, dan Supplier
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b: any) => 
        (b.product_name?.toLowerCase().includes(q) || "") ||
        (b.variant_name?.toLowerCase().includes(q) || "") ||
        (b.product_id?.toLowerCase().includes(q) || "") ||
        (b.supplier_name?.toLowerCase().includes(q) || "")
      );
    }

    // Filter Supplier
    if (filterSupplier !== "ALL") {
      result = result.filter((b: any) => (b.supplier_name || "Internal") === filterSupplier);
    }

    // Filter Varian
    if (filterVariant !== "ALL") {
      result = result.filter((b: any) => (b.variant_name || "") === filterVariant);
    }

    // Sort
    result.sort((a: any, b: any) => {
      switch (sortOption) {
        case "date_desc":
          return new Date(b.production_date).getTime() - new Date(a.production_date).getTime();
        case "date_asc":
          return new Date(a.production_date).getTime() - new Date(b.production_date).getTime();
        case "product_asc":
          return (a.product_name || "").localeCompare(b.product_name || "");
        case "product_desc":
          return (b.product_name || "").localeCompare(a.product_name || "");
        case "variant_asc":
          return (a.variant_name || "").localeCompare(b.variant_name || "");
        case "variant_desc":
          return (b.variant_name || "").localeCompare(a.variant_name || "");
        case "supplier_asc":
          return (a.supplier_name || "Internal").localeCompare(b.supplier_name || "Internal");
        case "supplier_desc":
          return (b.supplier_name || "Internal").localeCompare(a.supplier_name || "Internal");
        case "qty_desc":
          return (Number(b.quantity) || 0) - (Number(a.quantity) || 0);
        case "qty_asc":
          return (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
        case "exp_asc":
          return new Date(a.expired_date).getTime() - new Date(b.expired_date).getTime();
        case "exp_desc":
          return new Date(b.expired_date).getTime() - new Date(a.expired_date).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [batches, searchQuery, filterSupplier, filterVariant, sortOption]);

  // Handler klik header kolom tabel untuk sorting cepat
  const handleSortClick = (column: "date" | "product" | "variant" | "supplier" | "qty" | "exp") => {
    setCurrentPage(1);
    switch (column) {
      case "date":
        setSortOption(prev => prev === "date_desc" ? "date_asc" : "date_desc");
        break;
      case "product":
        setSortOption(prev => prev === "product_asc" ? "product_desc" : "product_asc");
        break;
      case "variant":
        setSortOption(prev => prev === "variant_asc" ? "variant_desc" : "variant_asc");
        break;
      case "supplier":
        setSortOption(prev => prev === "supplier_asc" ? "supplier_desc" : "supplier_asc");
        break;
      case "qty":
        setSortOption(prev => prev === "qty_desc" ? "qty_asc" : "qty_desc");
        break;
      case "exp":
        setSortOption(prev => prev === "exp_asc" ? "exp_desc" : "exp_asc");
        break;
    }
  };

  const renderSortIcon = (column: "date" | "product" | "variant" | "supplier" | "qty" | "exp") => {
    const isCurrent = sortOption.startsWith(column);
    if (!isCurrent) {
      return <ArrowUpDown size={13} className="text-muted-foreground/35 group-hover:text-foreground transition-colors shrink-0" />;
    }
    if (sortOption.endsWith("_asc")) {
      return <ArrowUp size={13} className="text-primary font-bold shrink-0" />;
    }
    return <ArrowDown size={13} className="text-primary font-bold shrink-0" />;
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterSupplier("ALL");
    setFilterVariant("ALL");
    setSortOption("date_desc");
    setCurrentPage(1);
  };

  // Pagination Logic
  const totalPages = Math.ceil(processedBatches.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedBatches = processedBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {successMsg && <Toast message={successMsg} onClose={() => setSuccessMsg("")} />}
      <div className="bg-card p-3.5 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
        {/* ============================================================== */}
        {/* 1. HEADER & CONTROLS UNTUK DESKTOP / TABLET                    */}
        {/* ============================================================== */}
        <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Stok Masuk (Inbound)</h1>
            <p className="text-sm text-muted-foreground mt-1">Pencatatan batch produk masuk dari internal atau rekanan.</p>
          </div>
          <button 
            onClick={() => navigate("/inbound_batches/create")}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xs hover:opacity-90 transition shrink-0 text-center text-sm"
          >
            + Catat Stok Masuk
          </button>
        </div>

        {/* Desktop / Tablet Control Bar: Search, Filters, Sort */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:flex lg:items-center gap-3 mb-6">
          <div className="relative lg:flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Cari produk, varian, atau supplier..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-8 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <select 
            value={filterSupplier}
            onChange={(e) => { setFilterSupplier(e.target.value); setCurrentPage(1); }}
            className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background cursor-pointer"
          >
            <option value="ALL">Semua Supplier</option>
            {uniqueSuppliers.filter(s => s !== "ALL").map(s => (
              <option key={s as string} value={s as string}>{s as string}</option>
            ))}
          </select>

          <select 
            value={filterVariant}
            onChange={(e) => { setFilterVariant(e.target.value); setCurrentPage(1); }}
            className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background cursor-pointer"
          >
            <option value="ALL">Semua Varian</option>
            {uniqueVariants.filter(v => v !== "ALL").map(v => (
              <option key={v as string} value={v as string}>{v as string}</option>
            ))}
          </select>

          <select 
            value={sortOption}
            onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
            className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background cursor-pointer"
          >
            <option value="date_desc">Tanggal Masuk (Terbaru)</option>
            <option value="date_asc">Tanggal Masuk (Terlama)</option>
            <option value="product_asc">Nama Produk (A-Z)</option>
            <option value="product_desc">Nama Produk (Z-A)</option>
            <option value="variant_asc">Nama Varian (A-Z)</option>
            <option value="variant_desc">Nama Varian (Z-A)</option>
            <option value="supplier_asc">Supplier (A-Z)</option>
            <option value="supplier_desc">Supplier (Z-A)</option>
            <option value="qty_desc">Jumlah (Terbanyak)</option>
            <option value="qty_asc">Jumlah (Sedikit)</option>
            <option value="exp_asc">Kedaluwarsa (Terdekat)</option>
            <option value="exp_desc">Kedaluwarsa (Terjauh)</option>
          </select>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. HEADER & CONTROLS KHUSUS MOBILE                             */}
        {/* ============================================================== */}
        {/* Mobile Top Header: Judul + Counter + Tombol Tambah Kompak */}
        <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Stok Masuk</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {processedBatches.length}
              </span>
            </h1>
          </div>
          <button 
            onClick={() => navigate("/inbound_batches/create")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0"
          >
            <Plus size={14} />
            <span>Catat Masuk</span>
          </button>
        </div>

        {/* Mobile Search & Filter Bar */}
        <div className="flex sm:hidden items-center gap-2 mb-2.5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Cari produk, varian, atau supplier..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-muted/40 border border-border/80 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tombol Buka Panel Filter & Urutkan */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className={`p-2 rounded-xl border flex items-center justify-center shrink-0 transition-all active:scale-95 relative ${
              activeFilterCount > 0 || isMobileFilterOpen
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card border-border/80 text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Filter dan Urutkan"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && !isMobileFilterOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Horizontal Scrolling Supplier Chips */}
        <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => { setFilterSupplier("ALL"); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
              filterSupplier === "ALL"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            Semua Supplier
          </button>
          {uniqueSuppliers.filter(s => s !== "ALL").map(s => (
            <button
              key={s as string}
              type="button"
              onClick={() => { setFilterSupplier(s as string); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                filterSupplier === s
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {s as string}
            </button>
          ))}
        </div>

        {/* Mobile Expandable Filter & Sort Drawer Panel */}
        {isMobileFilterOpen && (
          <div className="sm:hidden mb-3.5 p-3.5 bg-muted/30 border border-border/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-primary" />
                <span>Opsi Urutan &amp; Filter</span>
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-destructive hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Filter Varian
              </label>
              <select 
                value={filterVariant}
                onChange={(e) => { setFilterVariant(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="ALL">Semua Varian</option>
                {uniqueVariants.filter(v => v !== "ALL").map(v => (
                  <option key={v as string} value={v as string}>{v as string}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Urutkan Berdasarkan
              </label>
              <select 
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="date_desc">Tanggal Masuk (Terbaru)</option>
                <option value="date_asc">Tanggal Masuk (Terlama)</option>
                <option value="product_asc">Nama Produk (A-Z)</option>
                <option value="product_desc">Nama Produk (Z-A)</option>
                <option value="variant_asc">Nama Varian (A-Z)</option>
                <option value="variant_desc">Nama Varian (Z-A)</option>
                <option value="supplier_asc">Supplier (A-Z)</option>
                <option value="supplier_desc">Supplier (Z-A)</option>
                <option value="qty_desc">Jumlah (Terbanyak)</option>
                <option value="qty_asc">Jumlah (Sedikit)</option>
                <option value="exp_asc">Kedaluwarsa (Terdekat)</option>
                <option value="exp_desc">Kedaluwarsa (Terjauh)</option>
              </select>
            </div>
          </div>
        )}
        
        {/* ============================================================== */}
        {/* 3. KONTEN DAFTAR STOK MASUK (DESKTOP TABEL vs MOBILE CARDS)    */}
        {/* ============================================================== */}
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground animate-pulse text-sm">Memuat data stok masuk...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* A. TAMPILAN KHUSUS MOBILE: KARTU LIST STOK MASUK */}
            <div className="sm:hidden space-y-2.5">
              {paginatedBatches.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                  <ArrowDownToLine className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-semibold">
                    {batches.length === 0 
                      ? "Belum ada riwayat stok masuk." 
                      : "Tidak ada data yang cocok dengan pencarian/filter."}
                  </p>
                </div>
              ) : (
                paginatedBatches.map((batch: any) => (
                  <div
                    key={batch.id}
                    onClick={() => navigate(`/inbound_batches/${batch.id}`)}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group hover:border-primary/50"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Baris 1: Nama Produk & Jumlah Masuk */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {batch.product_name || batch.product_id}
                        </h3>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/60 shrink-0">
                          +{Number(batch.quantity).toLocaleString("id-ID")} pcs
                        </span>
                      </div>

                      {/* Baris 2: Varian jika ada */}
                      {batch.variant_name && (
                        <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                          Varian: <span className="text-foreground font-semibold bg-muted px-1.5 py-0.5 rounded">{batch.variant_name}</span>
                        </p>
                      )}

                      {/* Baris 3: Tanggal Masuk, Supplier, Expired */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {batch.supplier_name ? (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 truncate max-w-[130px]">
                            <Building2 size={11} className="inline mr-1 text-blue-600 shrink-0" />{batch.supplier_name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            <Warehouse size={11} className="inline mr-1 text-muted-foreground shrink-0" />Internal
                          </span>
                        )}

                        <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md font-medium">
                          <Calendar size={11} className="inline mr-1 text-muted-foreground shrink-0" />{formatDate(batch.production_date)}
                        </span>

                        {batch.expired_date && (
                          <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">
                            <Clock size={11} className="inline mr-1 text-destructive shrink-0" />Exp: {formatDate(batch.expired_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron Right */}
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))
              )}
            </div>

            {/* B. TAMPILAN DESKTOP & TABLET: TABEL DENGAN KOLOM VARIAN TERPISAH & SORTING */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                  <tr>
                    <th 
                      onClick={() => handleSortClick("date")}
                      className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-foreground group transition-colors"
                      title="Klik untuk mengurutkan berdasarkan Tanggal Masuk"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tanggal Stok Masuk</span>
                        {renderSortIcon("date")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortClick("product")}
                      className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-foreground group transition-colors"
                      title="Klik untuk mengurutkan berdasarkan Produk"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Produk</span>
                        {renderSortIcon("product")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortClick("variant")}
                      className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-foreground group transition-colors"
                      title="Klik untuk mengurutkan berdasarkan Varian"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Varian</span>
                        {renderSortIcon("variant")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortClick("supplier")}
                      className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-foreground group transition-colors"
                      title="Klik untuk mengurutkan berdasarkan Supplier"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Supplier</span>
                        {renderSortIcon("supplier")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortClick("qty")}
                      className="px-6 py-4 font-semibold text-right cursor-pointer select-none hover:text-foreground group transition-colors"
                      title="Klik untuk mengurutkan berdasarkan Jumlah"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Jumlah</span>
                        {renderSortIcon("qty")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortClick("exp")}
                      className="px-6 py-4 font-semibold text-destructive cursor-pointer select-none hover:text-destructive/80 group transition-colors"
                      title="Klik untuk mengurutkan berdasarkan Kedaluwarsa"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Kedaluwarsa</span>
                        {renderSortIcon("exp")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        {batches.length === 0 ? "Belum ada riwayat stok masuk." : "Tidak ada data yang cocok dengan pencarian/filter."}
                      </td>
                    </tr>
                  ) : (
                    paginatedBatches.map((batch: any) => (
                      <tr 
                        key={batch.id} 
                        onClick={() => navigate(`/inbound_batches/${batch.id}`)}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-medium whitespace-nowrap">{formatDate(batch.production_date)}</td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {batch.product_name || batch.product_id}
                        </td>
                        <td className="px-6 py-4">
                          {batch.variant_name ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                              {batch.variant_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {batch.supplier_name ? (
                            <span className="text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200/60">{batch.supplier_name}</span>
                          ) : (
                            <span className="text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full text-xs font-medium border border-border/50">Internal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-foreground whitespace-nowrap">
                          {new Intl.NumberFormat('id-ID').format(batch.quantity)} <span className="text-xs font-normal text-muted-foreground">pcs</span>
                        </td>
                        <td className="px-6 py-4 text-destructive font-medium whitespace-nowrap">{formatDate(batch.expired_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* C. PAGINATION CONTROLS (RESPONSIF MOBILE & DESKTOP) */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-3 pt-2">
                <div className="text-center sm:text-left text-xs">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedBatches.length)} dari {processedBatches.length} batch
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs"
                  >
                    Sebelumnya
                  </button>
                  <div className="flex items-center px-2 font-medium text-xs">
                    {currentPage} / {totalPages}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
