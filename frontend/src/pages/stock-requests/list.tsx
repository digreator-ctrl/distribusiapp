import { formatDate } from "../../utils/date";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  X,
  Plus,
  FileText,
  User,
  Users,
  Store,
  UserCheck,
  Search,
  ArrowRight,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { cache } from "../../utils/cache";

export const StockRequestList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");
  const cachedRequests = cache.get<any[]>("stock_requests_list");
  const [requests, setRequests] = useState<any[]>(() => cachedRequests || []);
  const [isLoading, setIsLoading] = useState(!cachedRequests);

  // Filter Tabs: Rekomendasi (Admin -> Sales/Agen) vs Pengajuan Sales (Sales -> Admin)
  const [filterType, setFilterType] = useState<"recommendation" | "request">("recommendation");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "pending" | "approved" | "rejected">("ALL");
  const [sortOption, setSortOption] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchAllRequests = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/stock-requests`);
        if (res.ok) {
          const json = await res.json();
          const data = Array.isArray(json) ? json : [];
          setRequests(data);
          cache.set("stock_requests_list", data);
        }
      } catch (err) {
        console.error("Gagal memuat data distribusi & approval:", err);
        if (!cachedRequests) setRequests([]);
      } finally {
        setIsLoading(false);
      }
    },
    [cachedRequests]
  );

  useEffect(() => {
    fetchAllRequests(Boolean(cachedRequests));
  }, [fetchAllRequests, cachedRequests]);

  const pendingRecCount = useMemo(() => {
    return requests.filter((r) => r.type === "recommendation" && r.status === "pending").length;
  }, [requests]);

  const pendingReqCount = useMemo(() => {
    return requests.filter((r) => r.type === "request" && r.status === "pending").length;
  }, [requests]);

  const activeFilterCount =
    (statusFilter !== "ALL" ? 1 : 0) +
    (sortOption !== "date_desc" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const filteredAndSortedData = useMemo(() => {
    let result = requests.filter((req) => req.type === filterType);

    if (statusFilter !== "ALL") {
      result = result.filter((req) => req.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (req) =>
          (req.code?.toLowerCase().includes(q) || "") ||
          (req.sales_full_name?.toLowerCase().includes(q) || "") ||
          (req.sales_username?.toLowerCase().includes(q) || "") ||
          (req.agen_name?.toLowerCase().includes(q) || "") ||
          (req.note?.toLowerCase().includes(q) || "")
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "date_desc":
          return new Date(b.distribution_date || b.created_at).getTime() - new Date(a.distribution_date || a.created_at).getTime();
        case "date_asc":
          return new Date(a.distribution_date || a.created_at).getTime() - new Date(b.distribution_date || b.created_at).getTime();
        case "code_asc":
          return (a.code || "").localeCompare(b.code || "");
        case "code_desc":
          return (b.code || "").localeCompare(a.code || "");
        default:
          return 0;
      }
    });

    return result;
  }, [requests, filterType, statusFilter, searchQuery, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortOption("date_desc");
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} />
            <span>Disetujui</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <X size={12} />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} />
            <span>Menunggu</span>
          </span>
        );
    }
  };

  const getDetailPath = (id: string) => `/stock-requests/${id}`;

  return (
    <div className="bg-card p-3.5 sm:p-6 lg:p-8 rounded-2xl border shadow-sm space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">Berhasil</h3>
            <p className="text-sm text-green-700 mt-1">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-green-500 hover:text-green-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* DESKTOP / TABLET HEADER (Katalog pattern) */}
      {/* ============================================================== */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Distribusi & Approval Stok
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              Admin / Owner
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola rekomendasi stok ke Sales & Agen (Distribusi) serta persetujuan pengajuan stok dari Sales (Approval).
          </p>
        </div>
        <button
          onClick={() => navigate("/stock-requests/create")}
          className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold shadow hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Buat Rekomendasi</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MOBILE HEADER */}
      {/* ============================================================== */}
      <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Distribusi & Approval Stok</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {filteredAndSortedData.length}
            </span>
          </h1>
        </div>
        <button
          onClick={() => navigate("/stock-requests/create")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP / TABLET TABS + PENDING BANNER */}
      {/* ============================================================== */}
      <div className="hidden sm:block space-y-3">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl max-w-md w-full border border-border/40">
          <button
            type="button"
            onClick={() => {
              setFilterType("recommendation");
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
            className={`h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              filterType === "recommendation"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Rekomendasi</span>
            {pendingRecCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded-full">
                {pendingRecCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType("request");
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
            className={`h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              filterType === "request"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Pengajuan Sales</span>
            {pendingRecCount > 0 && filterType === "request" && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full animate-pulse">
                {pendingReqCount}
              </span>
            )}
          </button>
        </div>

        {pendingReqCount > 0 && filterType === "request" && (
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Ada <strong>{pendingReqCount} pengajuan stok</strong> dari Sales yang menunggu persetujuan (approval) Anda.
              </span>
            </div>
            <button
              onClick={() => setStatusFilter("pending")}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950 shrink-0"
            >
              Filter Menunggu &rarr;
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* DESKTOP / TABLET CONTROL BAR (Search, Filter Status, Sort) */}
      {/* ============================================================== */}
      <div className="hidden sm:flex gap-3 mb-6">
        <div className="relative lg:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              filterType === "recommendation"
                ? "Cari kode, nama sales, agen..."
                : "Cari kode, nama sales pemohon..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background cursor-pointer"
        >
          <option value="ALL">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>

        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value as any);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background cursor-pointer"
        >
          <option value="date_desc">Tanggal (Terbaru)</option>
          <option value="date_asc">Tanggal (Terlama)</option>
          <option value="code_asc">Kode (A-Z)</option>
          <option value="code_desc">Kode (Z-A)</option>
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
      {/* MOBILE SEARCH + FILTER BAR */}
      {/* ============================================================== */}
      <div className="flex sm:hidden items-center gap-2 mb-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              filterType === "recommendation"
                ? "Cari kode, nama sales, agen..."
                : "Cari kode, nama sales pemohon..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-muted/40 border border-border/80 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

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

      {/* Mobile Expandable Filter & Sort Drawer Panel */}
      {isMobileFilterOpen && (
        <div className="sm:hidden mb-3.5 p-3.5 bg-muted/30 border border-border/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-primary" />
              <span>Opsi Filter &amp; Urutan</span>
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

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Urutkan Berdasarkan
              </label>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="date_desc">Tanggal (Terbaru)</option>
                <option value="date_asc">Tanggal (Terlama)</option>
                <option value="code_asc">Kode (A-Z)</option>
                <option value="code_desc">Kode (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOBILE TABS */}
      {/* ============================================================== */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none -mx-1 px-1">
        {["recommendation", "request"].map((type) => {
          const pending = type === "recommendation" ? pendingRecCount : pendingReqCount;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setFilterType(type as "recommendation" | "request");
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                filterType === type
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {type === "recommendation" ? "Rekomendasi" : "Pengajuan"}
              {pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white font-black text-[9px] rounded-full animate-pulse">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* CONTENT */}
      {/* ============================================================== */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground animate-pulse flex flex-col items-center">
          <FileText size={32} className="mb-2 opacity-25" />
          <p className="text-xs font-medium">Memuat data distribusi & approval...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Single Card Table */}
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Kode & Tanggal</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    {filterType === "recommendation" ? "Tujuan (Sales / Agen)" : "Sales Pemohon"}
                  </th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Prioritas</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Item SKU</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {requests.length === 0
                        ? `Belum ada data ${filterType === "recommendation" ? "rekomendasi" : "pengajuan"}.`
                        : "Tidak ada data yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((req: any) => (
                    <tr
                      key={req.id}
                      onClick={() => navigate(getDetailPath(req.id))}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {req.code}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {req.distribution_date
                            ? formatDate(req.distribution_date)
                            : formatDate(req.created_at)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {filterType === "recommendation" ? (
                          req.agen_name ? (
                            <div className="flex items-center gap-1.5 font-medium text-orange-900">
                              <Store size={13} className="text-orange-600 shrink-0" />
                              <span>Agen: <strong>{req.agen_name}</strong></span>
                            </div>
                          ) : req.sales_full_name ? (
                            <div className="flex items-center gap-1.5 font-medium text-blue-900">
                              <User size={13} className="text-blue-600 shrink-0" />
                              <span>Sales: <strong>{req.sales_full_name}</strong>{req.sales_username ? `(${req.sales_username})` : ""}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-medium text-indigo-900">
                              <Users size={13} className="text-indigo-600 shrink-0" />
                              <span>Semua Sales (Broadcast)</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 font-medium text-purple-900">
                            <UserCheck size={13} className="text-purple-600 shrink-0" />
                            <span>Sales: <strong>{req.sales_full_name || req.sales_username || "Sales"}</strong></span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {req.priority === "urgent" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            Mendesak
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Normal</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="font-semibold text-foreground">{req.item_count} SKU</div>
                        <div className="text-[10px] text-muted-foreground">{req.total_qty} pcs</div>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-primary group-hover:underline text-[11px] inline-flex items-center gap-1">
                          Detail <ArrowRight size={12} />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-3 pt-2">
              <div className="text-center sm:text-left text-xs">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} dari{" "}
                {filteredAndSortedData.length} {filterType === "recommendation" ? "rekomendasi" : "pengajuan"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-2 font-medium text-xs">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
  );
};
