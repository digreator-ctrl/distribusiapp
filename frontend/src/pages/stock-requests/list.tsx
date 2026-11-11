import { formatDate } from "../../utils/date";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CheckCircle2, X, Plus, FileText, AlertCircle, User, 
  Users, Store, UserCheck, ChevronRight, LayoutGrid, List, 
  Search, ArrowRight, Clock, ShieldCheck
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
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Fetch seluruh data stok request/rekomendasi (Semua Sales & Agen untuk Sisi Owner/Admin)
  const fetchAllRequests = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      // Pada sisi Owner/Admin, muat seluruh data tanpa dibatasi oleh sales_id tertentu
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
  };

  useEffect(() => {
    fetchAllRequests(Boolean(cachedRequests));
  }, []);

  // Hitung jumlah item pending per tab untuk badge notifikasi Admin/Owner
  const pendingRecCount = useMemo(() => {
    return requests.filter(r => r.type === "recommendation" && r.status === "pending").length;
  }, [requests]);

  const pendingReqCount = useMemo(() => {
    return requests.filter(r => r.type === "request" && r.status === "pending").length;
  }, [requests]);

  // Filter data sesuai Tab aktif, Status, dan Pencarian
  const filteredData = useMemo(() => {
    return requests.filter(req => {
      // 1. Filter Tipe Tab
      if (req.type !== filterType) return false;

      // 2. Filter Status
      if (statusFilter !== "ALL" && req.status !== statusFilter) return false;

      // 3. Filter Search (kode, nama sales, username, nama agen, catatan)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = req.code?.toLowerCase().includes(q);
        const matchSales = req.sales_full_name?.toLowerCase().includes(q) || req.sales_username?.toLowerCase().includes(q);
        const matchAgen = req.agen_name?.toLowerCase().includes(q);
        const matchNote = req.note?.toLowerCase().includes(q);
        if (!matchCode && !matchSales && !matchAgen && !matchNote) return false;
      }

      return true;
    });
  }, [requests, filterType, statusFilter, searchQuery]);

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
    <div className="space-y-6">
      {/* Toast Notifikasi Berhasil */}
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

      {/* Header Halaman Sisi Owner & Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
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

      {/* Banner Informasi Persetujuan Pending untuk Admin */}
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

      {/* Navigasi Tab & Toolbar Filter */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4">
        {/* Tab Segmented: Rekomendasi vs Pengajuan Sales */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl max-w-md w-full border border-border/40">
            <button 
              type="button"
              onClick={() => {
                setFilterType("recommendation");
                setStatusFilter("ALL");
              }} 
              className={`h-9 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                filterType === "recommendation" 
                  ? "bg-background text-foreground shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Rekomendasi (Distribusi)</span>
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
              }} 
              className={`h-9 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                filterType === "request" 
                  ? "bg-background text-foreground shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Pengajuan Sales (Approval)</span>
              {pendingReqCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full animate-pulse">
                  {pendingReqCount}
                </span>
              )}
            </button>
          </div>

          {/* Toggle View Mode: Kartu vs Tabel */}
          <div className="flex items-center gap-1 self-end sm:self-auto bg-muted/50 p-1 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "card" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Tabel"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Filter Bar: Pencarian & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={filterType === "recommendation" ? "Cari kode, nama sales, agen..." : "Cari kode, nama sales pemohon..."}
              className="w-full pl-9 pr-3 py-2 text-xs bg-muted/30 border border-border/80 rounded-xl outline-none focus:ring-1 focus:ring-primary focus:bg-background transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium mr-1 shrink-0">Status:</span>
            {[
              { id: "ALL", label: "Semua" },
              { id: "pending", label: "Menunggu" },
              { id: "approved", label: "Disetujui" },
              { id: "rejected", label: "Ditolak" },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                  statusFilter === s.id 
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs" 
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Render Konten: Tampilan Kartu atau Tabel */}
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground animate-pulse flex flex-col items-center">
            <FileText size={32} className="mb-2 opacity-25" />
            <p className="text-xs font-medium">Memuat data distribusi & approval...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-xl border border-dashed border-border/80 p-6">
            <FileText size={40} className="mb-3 opacity-20" />
            <p className="font-semibold text-sm text-foreground">
              Tidak ada data {filterType === "recommendation" ? "rekomendasi" : "pengajuan"} yang sesuai
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
              {searchQuery || statusFilter !== "ALL" 
                ? "Coba ubah kata kunci pencarian atau bersihkan filter status." 
                : filterType === "recommendation" 
                  ? "Belum ada rekomendasi distribusi yang dibuat. Klik 'Buat Rekomendasi' untuk menambahkan." 
                  : "Belum ada pengajuan stok yang diajukan oleh Sales."}
            </p>
          </div>
        ) : viewMode === "card" ? (
          /* TAMPILAN KARTU (MODERN CARD VIEW) DENGAN IDENTITAS SALES YANG JELAS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {filteredData.map((req: any) => (
              <div 
                key={req.id} 
                onClick={() => navigate(getDetailPath(req.id))}
                className="p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer space-y-3 group"
              >
                {/* Baris 1: Kode Dokumen & Status Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{req.code}</span>
                      {req.priority === "urgent" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200" title="Mendesak">
                          <AlertCircle size={11} className="text-red-500 shrink-0" />
                          <span>Mendesak</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {req.distribution_date 
                        ? `Tgl Distribusi: ${formatDate(req.distribution_date)}`
                        : `Tgl Pengajuan: ${formatDate(req.created_at)}`}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Baris 2: Identitas Sales / Agen yang Dituju atau Pengaju */}
                <div className="pt-2 border-t border-border/40">
                  {filterType === "recommendation" ? (
                    /* Tab Rekomendasi: Tampilkan Target Sales / Agen */
                    <div className="flex items-center gap-2 text-xs">
                      {req.agen_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200/70 font-medium">
                          <Store size={13} className="text-orange-600 shrink-0" />
                          <span>Tujuan Agen: <strong className="font-bold text-orange-950">{req.agen_name}</strong></span>
                        </div>
                      ) : req.sales_full_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70 font-medium">
                          <User size={13} className="text-blue-600 shrink-0" />
                          <span>Tujuan Sales: <strong className="font-bold text-blue-950">{req.sales_full_name}</strong> {req.sales_username ? `(${req.sales_username})` : ""}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/70 font-medium">
                          <Users size={13} className="text-indigo-600 shrink-0" />
                          <span>Tujuan: <strong className="font-bold text-indigo-950">Semua Sales (Broadcast)</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Tab Pengajuan Sales: Tampilkan Sales Pemohon */
                    <div className="flex items-center gap-2 text-xs">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/70 font-medium">
                        <UserCheck size={13} className="text-purple-600 shrink-0" />
                        <span>Diajukan oleh Sales: <strong className="font-bold text-purple-950">{req.sales_full_name || req.sales_username || "Sales"}</strong> {req.sales_username ? `(${req.sales_username})` : ""}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Catatan (Jika Ada) */}
                {req.note && (
                  <p className="text-xs text-muted-foreground italic line-clamp-1 bg-muted/20 px-2 py-1 rounded-md">
                    &ldquo;{req.note}&rdquo;
                  </p>
                )}

                {/* Baris 3: Rincian Kuantitas SKU & Aksi Detail */}
                <div className="flex justify-between items-center pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  <div>
                    <span>Total: </span>
                    <strong className="text-foreground font-semibold">{req.item_count || 0} SKU</strong>
                    <span className="text-[11px] ml-1">({req.total_qty || 0} pcs)</span>
                  </div>

                  <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                    Detail <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TAMPILAN TABEL (RESPONSIVE TABLE VIEW) */
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
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
                {filteredData.map((req: any) => (
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
                            <span>Sales: <strong>{req.sales_full_name}</strong> {req.sales_username ? `(${req.sales_username})` : ""}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
