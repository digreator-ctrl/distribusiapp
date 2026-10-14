import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { 
  Package, Calendar, 
  Clock, AlertCircle, ArrowDownLeft, ArrowUpRight,
  Briefcase, Store, Plus, Trash2, X, ChevronRight, Inbox, Send
} from "lucide-react";

// In-memory cache to prevent layout shift & data flash when navigating back from detail pages
let stockCache: {
  salesId: string;
  recommendations: any[];
  requests: any[];
  consignments: any[];
  holdingInventory: any[];
  stores: any[];
} | null = null;

export const invalidateStockCache = () => {
  stockCache = null;
};

export const MobileReceivedStock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const paramTab = (searchParams.get("tab") as "masuk" | "dibawa" | "keluar") || (location.state as any)?.tab;
  const paramSubTab = (searchParams.get("subTab") as "recommendation" | "request") || (location.state as any)?.subTab;

  const [activeTab, setActiveTab] = useState<"masuk" | "dibawa" | "keluar">(paramTab || "masuk");
  const [subTab, setSubTab] = useState<"recommendation" | "request">(paramSubTab || "recommendation");

  useEffect(() => {
    const t = (searchParams.get("tab") as "masuk" | "dibawa" | "keluar") || (location.state as any)?.tab;
    const s = (searchParams.get("subTab") as "recommendation" | "request") || (location.state as any)?.subTab;
    if (t) setActiveTab(t);
    if (s) setSubTab(s);
  }, [searchParams, location.state]);

  const currentSalesId = localStorage.getItem("distribusi_user_id") || "";
  const hasValidCache = stockCache !== null && stockCache.salesId === currentSalesId;
  
  // Data State with Cache fallback to eliminate flicker/falsy empty states
  const [recommendations, setRecommendations] = useState<any[]>(() => hasValidCache ? stockCache!.recommendations : []);
  const [requests, setRequests] = useState<any[]>(() => hasValidCache ? stockCache!.requests : []);
  const [consignments, setConsignments] = useState<any[]>(() => hasValidCache ? stockCache!.consignments : []);
  const [holdingInventory, setHoldingInventory] = useState<any[]>(() => hasValidCache ? stockCache!.holdingInventory : []);
  const [stores, setStores] = useState<any[]>(() => hasValidCache ? stockCache!.stores : []);
  const [isLoading, setIsLoading] = useState(() => !hasValidCache);

  // Modal Titip Stok (Stok Keluar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStoreId, setFormStoreId] = useState("");
  const [formVariantId, setFormVariantId] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [activeSalesId, setActiveSalesId] = useState<string>(currentSalesId);

  const fetchData = async (salesId: string) => {
    const hasCache = stockCache !== null && stockCache.salesId === salesId;
    if (!hasCache && recommendations.length === 0 && requests.length === 0 && holdingInventory.length === 0) {
      setIsLoading(true);
    }
    try {
      let recs: any[] = [];
      let reqs: any[] = [];
      let newCons: any[] = [];
      let newHolding: any[] = [];
      let allDestinations: any[] = [];

      // 1. Fetch seluruh pengajuan & rekomendasi stok untuk sales ini
      let srUrl = "http://localhost:8787/api/stock-requests?target_type=sales";
      if (salesId) srUrl += `&sales_id=${salesId}`;
      const resSr = await fetch(srUrl);
      if (resSr.ok) {
        const jsonSr = await resSr.json();
        let data = Array.isArray(jsonSr) ? jsonSr : [];
        // Filter client-side untuk memisahkan data agen
        data = data.filter((req: any) => {
          if (req.target_type === "agen" || req.agen_name || req.agen_id) return false;
          return req.sales_id === salesId || (!req.sales_id && req.target_type === "sales");
        });
        
        recs = data.filter((r: any) => r.type === "recommendation");
        reqs = data.filter((r: any) => r.type === "request");
        setRecommendations(recs);
        setRequests(reqs);
      }

      // 2. Fetch consignments / titipan toko (Stok Keluar)
      let consUrl = "http://localhost:8787/api/consignments";
      if (salesId) consUrl += `?sales_id=${salesId}`;
      const resCons = await fetch(consUrl);
      if (resCons.ok) {
        const json = await resCons.json();
        newCons = Array.isArray(json) ? json : [];
        setConsignments(newCons);
      }

      // 3. Fetch sales inventory (Stok yang Dibawa Sales)
      if (salesId) {
        const resInv = await fetch(`http://localhost:8787/api/sales-inventory/${salesId}`);
        if (resInv.ok) {
          const json = await resInv.json();
          newHolding = Array.isArray(json) ? json : [];
          setHoldingInventory(newHolding);
        }
      }

      // 4. Fetch Toko & Agen untuk dropdown penitipan
      const [resAgents, resStores] = await Promise.all([
        fetch("http://localhost:8787/api/agents"),
        fetch("http://localhost:8787/api/stores")
      ]);
      if (resAgents.ok) {
        const agents = await resAgents.json();
        if (Array.isArray(agents)) {
          allDestinations.push(...agents.map(a => ({ id: a.id, name: `${a.name} (Agen/Toko Mitra)` })));
        }
      }
      if (resStores.ok) {
        const storesData = await resStores.json();
        if (Array.isArray(storesData)) {
          allDestinations.push(...storesData.map(s => ({ id: s.id, name: `${s.name} (Toko)` })));
        }
      }
      setStores(allDestinations);

      // Simpan ke cache agar navigasi bolak-balik tidak berkedip
      stockCache = {
        salesId,
        recommendations: recs,
        requests: reqs,
        consignments: newCons,
        holdingInventory: newHolding,
        stores: allDestinations,
      };

    } catch (err) {
      console.error("Gagal memuat data stok:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeSalesId);

    const handleSalesChanged = () => {
      const newId = localStorage.getItem("distribusi_user_id") || "";
      if (newId !== activeSalesId) {
        stockCache = null;
        setActiveSalesId(newId);
      }
    };

    const handleSync = () => {
      if (activeSalesId) {
        fetchData(activeSalesId);
      }
    };

    // Auto-update otomatis setiap 15 detik di latar belakang tanpa reload/kedip
    const intervalId = setInterval(handleSync, 15000);

    window.addEventListener("salesChanged", handleSalesChanged);
    window.addEventListener("focus", handleSync);
    window.addEventListener("stockUpdated", handleSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("salesChanged", handleSalesChanged);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("stockUpdated", handleSync);
    };
  }, [activeSalesId]);

  // Handle Submit Form Titip Stok ke Toko
  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStoreId) {
      setFormError("Pilih Toko / Agen tujuan.");
      return;
    }
    if (!formVariantId) {
      setFormError("Pilih produk varian yang dititipkan.");
      return;
    }
    const qty = Number(formQty);
    if (isNaN(qty) || qty <= 0) {
      setFormError("Jumlah titip harus lebih dari 0.");
      return;
    }

    const selectedItem = holdingInventory.find(i => i.variant_id === formVariantId);
    const maxHolding = selectedItem ? selectedItem.current_holding : 0;
    if (qty > maxHolding) {
      setFormError(`Jumlah melebihi stok yang dibawa (${maxHolding} pcs).`);
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8787/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_id: activeSalesId,
          store_id: formStoreId,
          variant_id: formVariantId,
          quantity: qty
        })
      });

      if (res.ok) {
        setToast({ message: "Berhasil mencatat stok keluar ke toko!", type: "success" });
        setIsModalOpen(false);
        setFormStoreId("");
        setFormVariantId("");
        setFormQty("");
        fetchData(activeSalesId);
        setActiveTab("keluar");
      } else {
        const err = await res.json();
        setFormError(err.message || "Gagal menyimpan data.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Hapus Titipan Konsinyasi
  const handleDeleteConsignment = async (id: string) => {
    if (!window.confirm("Batalkan pencatatan titip stok ini? Stok akan kembali ke stok yang dibawa sales.")) return;
    try {
      const res = await fetch(`http://localhost:8787/api/consignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ message: "Pencatatan titip stok berhasil dibatalkan.", type: "success" });
        fetchData(activeSalesId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Kalkulasi Ringkasan
  const pendingRecs = recommendations.filter(r => r.status === "pending");
  const approvedRecs = recommendations.filter(r => r.status === "approved");
  const approvedReqs = requests.filter(r => r.status === "approved");
  
  const totalApprovedInboundQty = [...approvedRecs, ...approvedReqs].reduce((sum, r) => sum + (Number(r.total_qty) || 0), 0);
  const totalOutboundQty = consignments.reduce((acc, curr) => acc + (Number(curr.initial_stock) || 0), 0);
  const totalHoldingQty = holdingInventory.reduce((acc, curr) => acc + (Number(curr.current_holding) || 0), 0);

  const getDetailPath = (id: string, sTab?: string) => `/sales/stock-requests/${id}?from=stock&subTab=${sTab || subTab}`;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Disetujui</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Ditolak</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Menunggu</span>;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header Info */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Package size={20} className="text-primary" />
          Stok
        </h1>
        <p className="text-xs text-muted-foreground">
          Ambil stok, stok di tangan & rekap keluar
        </p>
      </div>

      {/* 3 Tab Switcher Presisi: 1. Ambil Stok, 2. Stok di Tangan, 3. Rekap Keluar */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
        {/* Tab 1: Ambil Stok (Stok Masuk) */}
        <button
          onClick={() => setActiveTab("masuk")}
          className={`h-9 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "masuk"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowDownLeft size={13} className="text-emerald-500 shrink-0" />
          <span className="truncate">Ambil Stok</span>
          {pendingRecs.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          )}
        </button>

        {/* Tab 2: Stok di Tangan (Aktif) */}
        <button
          onClick={() => setActiveTab("dibawa")}
          className={`h-9 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "dibawa"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase size={13} className="text-amber-500 shrink-0" />
          <span className="truncate">Stok di Tangan</span>
        </button>

        {/* Tab 3: Rekap Keluar */}
        <button
          onClick={() => setActiveTab("keluar")}
          className={`h-9 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === "keluar"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowUpRight size={13} className="text-blue-500 shrink-0" />
          <span className="truncate">Rekap Keluar</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STOK MASUK (Rekomendasi Admin & Pengajuan Sales)   */}
      {/* ========================================================= */}
      {activeTab === "masuk" && (
        <div className="space-y-3">
          {/* Sub-Tab Switcher: Rekomendasi vs Pengajuan Saya */}
          <div className="flex items-center justify-between gap-2">
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted/70 rounded-xl border border-border/50 flex-1 max-w-[280px]">
              <button
                onClick={() => setSubTab("recommendation")}
                className={`h-8 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subTab === "recommendation"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Inbox size={12} className={pendingRecs.length > 0 ? "text-amber-500" : ""} />
                <span>Rekomendasi</span>
                {pendingRecs.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white font-black text-[9px] rounded-full">
                    {pendingRecs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSubTab("request")}
                className={`h-8 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  subTab === "request"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Send size={12} />
                <span>Pengajuan Saya</span>
              </button>
            </div>

            {/* Tombol Ajukan Stok Baru (Khusus Sub-Tab Pengajuan) */}
            {subTab === "request" && (
              <button
                onClick={() => navigate("/sales/stock-requests/create")}
                className="h-8 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1 shrink-0"
              >
                <Plus size={13} />
                <span>Ajukan</span>
              </button>
            )}
          </div>

          {/* Banner Notifikasi jika ada rekomendasi pending */}
          {subTab === "recommendation" && pendingRecs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Clock size={15} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-amber-950 truncate">
                    {pendingRecs.length} Rekomendasi Menunggu
                  </p>
                  <p className="text-[11px] text-amber-800 truncate">
                    Konfirmasi penerimaan stok dari Admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(getDetailPath(pendingRecs[0].id))}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
              >
                Terima
              </button>
            </div>
          )}

          {/* Ringkasan Ringkas Stok Masuk Approved */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-semibold">Total Masuk Disetujui:</span>
            <span className="font-black text-emerald-950 text-sm">
              {totalApprovedInboundQty.toLocaleString('id-ID')} <span className="text-xs font-semibold text-emerald-700">pcs</span>
              <span className="text-[11px] font-normal text-muted-foreground ml-1.5">
                ({approvedRecs.length + approvedReqs.length} transaksi)
              </span>
            </span>
          </div>

          {/* Konten Sub-Tab 1: Rekomendasi Admin */}
          {subTab === "recommendation" && (
            <div>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground animate-pulse flex flex-col items-center">
                  <Package size={24} className="mb-2 opacity-20" />
                  <p className="text-xs">Memuat rekomendasi stok...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-2xl border border-dashed border-border/70 p-6">
                  <Package size={32} className="mb-2 opacity-20" />
                  <p className="font-semibold text-xs text-foreground">Belum ada rekomendasi dari Admin</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 text-center">
                    Rekomendasi alokasi stok dari admin gudang akan muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendations.map((req: any) => (
                    <div
                      key={req.id}
                      onClick={() => navigate(getDetailPath(req.id))}
                      className="bg-card px-3.5 py-2.5 rounded-xl border border-border/70 hover:border-emerald-400 active:scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {req.code}
                          </span>
                          {req.priority === "urgent" && (
                            <span title="Mendesak"><AlertCircle size={12} className="text-red-500 shrink-0" /></span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar size={11} className="shrink-0 opacity-70" />
                          <span>
                            {req.distribution_date
                              ? new Date(req.distribution_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-black text-foreground block leading-tight">
                            {Number(req.total_qty || 0).toLocaleString('id-ID')} <span className="text-[10px] font-semibold text-muted-foreground">pcs</span>
                          </span>
                          <div className="mt-0.5">{renderStatusBadge(req.status)}</div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Konten Sub-Tab 2: Pengajuan Saya */}
          {subTab === "request" && (
            <div>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground animate-pulse flex flex-col items-center">
                  <Send size={24} className="mb-2 opacity-20" />
                  <p className="text-xs">Memuat pengajuan stok...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-2xl border border-dashed border-border/70 p-6">
                  <Send size={32} className="mb-2 opacity-20" />
                  <p className="font-semibold text-xs text-foreground">Belum ada pengajuan stok</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 text-center">
                    Tekan tombol &quot;Ajukan&quot; di atas untuk mengajukan alokasi stok baru ke Admin.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map((req: any) => (
                    <div
                      key={req.id}
                      onClick={() => navigate(getDetailPath(req.id))}
                      className="bg-card px-3.5 py-2.5 rounded-xl border border-border/70 hover:border-emerald-400 active:scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {req.code}
                          </span>
                          {req.priority === "urgent" && (
                            <span title="Mendesak"><AlertCircle size={12} className="text-red-500 shrink-0" /></span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar size={11} className="shrink-0 opacity-70" />
                          <span>
                            {req.distribution_date
                              ? new Date(req.distribution_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-black text-foreground block leading-tight">
                            {Number(req.total_qty || 0).toLocaleString('id-ID')} <span className="text-[10px] font-semibold text-muted-foreground">pcs</span>
                          </span>
                          <div className="mt-0.5">{renderStatusBadge(req.status)}</div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: STOK KELUAR (Stok yang Dititipkan Sales ke Toko)     */}
      {/* ========================================================= */}
      {activeTab === "keluar" && (
        <div className="space-y-3.5">
          {/* Tombol Utama & Ringkasan */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Dititipkan
              </p>
              <p className="text-xl font-black text-foreground">
                {totalOutboundQty.toLocaleString('id-ID')} <span className="text-xs font-semibold text-muted-foreground">pcs</span>
              </p>
            </div>

            <button
              onClick={() => {
                setFormError("");
                setIsModalOpen(true);
              }}
              className="h-9 px-3.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Plus size={15} />
              <span>Titip Stok ke Toko</span>
            </button>
          </div>

          {/* Daftar Stok Keluar (Konsinyasi Toko) */}
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground animate-pulse flex flex-col items-center">
              <Store size={28} className="mb-2 opacity-20" />
              <p className="text-xs">Memuat data stok keluar...</p>
            </div>
          ) : consignments.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-2xl border border-dashed border-border/70 p-6">
              <Store size={36} className="mb-2 opacity-20" />
              <p className="font-semibold text-xs text-foreground">Belum ada stok yang dititipkan ke toko</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 text-center max-w-[260px]">
                Tekan tombol &quot;Titip Stok ke Toko&quot; di atas saat Anda menitipkan barang konsinyasi ke toko mitra.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {consignments.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-2xs space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground flex items-center gap-1.5 truncate">
                        <Store size={13} className="text-primary shrink-0" />
                        <span className="truncate">{c.store_name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar size={11} className="shrink-0" />
                        {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Dititipkan
                      </span>
                      <button
                        onClick={() => handleDeleteConsignment(c.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition"
                        title="Batalkan Titip"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-foreground leading-tight">{c.product_name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.variant_name} {c.sku ? `(${c.sku})` : ''}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-primary">
                        {c.initial_stock}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground ml-1">pcs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STOK DIBAWA SALES (Saldo Fisik di Tangan Sales)     */}
      {/* ========================================================= */}
      {activeTab === "dibawa" && (
        <div className="space-y-3.5">
          {/* Card Ringkasan Saldo Fisik */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-amber-100 text-[11px] font-bold uppercase tracking-wider">
                Stok yang Sedang Dibawa Sales
              </p>
              <h2 className="text-3xl font-black mt-1">
                {isLoading && holdingInventory.length === 0 ? (
                  <span className="inline-block w-28 h-8 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  <>{totalHoldingQty.toLocaleString('id-ID')} <span className="text-sm font-semibold opacity-90">pcs</span></>
                )}
              </h2>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/20 text-xs">
                <div>
                  <span className="text-amber-100 text-[10px] block">Diterima (Masuk):</span>
                  <span className="font-bold">
                    {isLoading && holdingInventory.length === 0 ? "-" : `${totalApprovedInboundQty.toLocaleString('id-ID')} pcs`}
                  </span>
                </div>
                <div>
                  <span className="text-amber-100 text-[10px] block">Dititip ke Toko:</span>
                  <span className="font-bold">
                    {isLoading && holdingInventory.length === 0 ? "-" : `${totalOutboundQty.toLocaleString('id-ID')} pcs`}
                  </span>
                </div>
              </div>
            </div>
            <Briefcase size={110} className="absolute -right-4 -bottom-4 opacity-15" />
          </div>

          {/* Section List Produk yang Sedang Dibawa */}
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Rincian Per Produk ({holdingInventory.length} SKU)
            </h3>
            <span className="text-[11px] text-muted-foreground">Belum dititipkan</span>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground animate-pulse flex flex-col items-center">
              <Briefcase size={28} className="mb-2 opacity-20" />
              <p className="text-xs">Menghitung stok yang Anda bawa...</p>
            </div>
          ) : holdingInventory.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-2xl border border-dashed border-border/70 p-6">
              <Briefcase size={36} className="mb-2 opacity-20" />
              <p className="font-semibold text-xs text-foreground">Tidak ada stok yang sedang dibawa</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 text-center max-w-[260px]">
                Semua stok telah dititipkan ke toko, atau belum ada stok masuk yang disetujui.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {holdingInventory.map((item: any) => {
                const isOutOfStock = item.current_holding <= 0;
                return (
                  <div
                    key={item.variant_id}
                    onClick={() => navigate(`/sales/stock/product/${item.variant_id}`, { state: { item } })}
                    className="bg-card px-3.5 py-3 rounded-xl border border-border/70 hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {item.variant_name} {item.sku ? `• ${item.sku}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-foreground block leading-tight">
                          {item.current_holding} <span className="text-[10px] font-semibold text-muted-foreground">pcs</span>
                        </span>
                        <span className={`text-[9px] font-bold ${
                          isOutOfStock
                            ? "text-muted-foreground"
                            : item.current_holding < 10
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}>
                          {isOutOfStock ? "Habis" : item.current_holding < 10 ? "Menipis" : "Tersedia"}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FORM TITIP STOK KE TOKO (STOK KELUAR)               */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-foreground">Titip Stok ke Toko</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateConsignment} className="space-y-3.5">
              {/* Dropdown Toko / Agen Tujuan */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Toko / Agen Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formStoreId}
                  onChange={(e) => setFormStoreId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 outline-none"
                  required
                >
                  <option value="" disabled>-- Pilih Toko atau Agen --</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown Produk Varian yang Sedang Dibawa */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Produk Varian yang Dititipkan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formVariantId}
                  onChange={(e) => setFormVariantId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/40 outline-none"
                  required
                >
                  <option value="" disabled>-- Pilih Produk Varian --</option>
                  {holdingInventory
                    .filter(i => i.current_holding > 0)
                    .map(i => (
                      <option key={i.variant_id} value={i.variant_id}>
                        {i.product_name} - {i.variant_name} (Sisa Dibawa: {i.current_holding} pcs)
                      </option>
                    ))}
                </select>
                {holdingInventory.filter(i => i.current_holding > 0).length === 0 && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    *Anda belum memiliki saldo stok yang sedang dibawa.
                  </p>
                )}
              </div>

              {/* Kuantitas Titip */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Jumlah yang Dititipkan (pcs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs font-bold text-center focus:ring-2 focus:ring-primary/40 outline-none"
                  required
                />
              </div>

              {/* Tombol Simpan */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border font-semibold text-xs text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Penitipan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
