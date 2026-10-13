import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, ChevronRight, CheckCircle2, FileText, Calendar, 
  BoxIcon, Clock, AlertCircle, ArrowRight
} from "lucide-react";

export const MobileReceivedStock = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [approvedItems, setApprovedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSalesId, setActiveSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  const fetchData = async (salesId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch pending recommendations for this sales (Rekomendasi dari Admin yang perlu diterima)
      let pendingUrl = "http://localhost:8787/api/stock-requests?type=recommendation&status=pending&target_type=sales";
      if (salesId) {
        pendingUrl += `&sales_id=${salesId}`;
      }
      const resPending = await fetch(pendingUrl);
      if (resPending.ok) {
        const jsonPending = await resPending.json();
        let dataPending = Array.isArray(jsonPending) ? jsonPending : [];
        dataPending = dataPending.filter((req: any) => {
          if (req.target_type === "agen" || req.agen_name || req.agen_id) return false;
          return req.sales_id === salesId || (!req.sales_id && req.target_type === "sales");
        });
        setPendingItems(dataPending);

        // Jika tidak ada pending, otomatis buka tab approved
        if (dataPending.length === 0) {
          setActiveTab("approved");
        } else {
          setActiveTab("pending");
        }
      }

      // 2. Fetch approved stock requests
      let approvedUrl = "http://localhost:8787/api/stock-requests?status=approved&target_type=sales";
      if (salesId) {
        approvedUrl += `&sales_id=${salesId}`;
      }
      const resApproved = await fetch(approvedUrl);
      if (resApproved.ok) {
        const jsonApproved = await resApproved.json();
        let dataApproved = Array.isArray(jsonApproved) ? jsonApproved : [];
        dataApproved = dataApproved.filter((req: any) => {
          if (req.target_type === "agen" || req.agen_name || req.agen_id) return false;
          return req.sales_id === salesId || (!req.sales_id && req.target_type === "sales");
        });
        setApprovedItems(dataApproved);
      }
    } catch (err) {
      console.error("Gagal memuat data stok masuk:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeSalesId);

    const handleSalesChanged = () => {
      const newId = localStorage.getItem("distribusi_user_id") || "";
      setActiveSalesId(newId);
      fetchData(newId);
    };

    window.addEventListener("salesChanged", handleSalesChanged);
    return () => window.removeEventListener("salesChanged", handleSalesChanged);
  }, [activeSalesId]);



  const getDetailPath = (id: string) => `/sales/stock-requests/${id}`;

  const currentList = activeTab === "pending" ? pendingItems : approvedItems;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              Stok Masuk
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Distribusi stok dari Admin & pengajuan Anda
            </p>
          </div>
        </div>

        {/* Tab Switcher Presisi */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 mt-3">
          <button
            onClick={() => setActiveTab("pending")}
            className={`h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={13} className={pendingItems.length > 0 ? "text-amber-500" : ""} />
            <span>Perlu Diterima</span>
            {pendingItems.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white font-bold text-[10px] rounded-full">
                {pendingItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "approved"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Sudah Diterima</span>
            <span className="text-[10px] text-muted-foreground">({approvedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Konten Daftar Stok */}
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse flex flex-col items-center">
          <Package size={28} className="mb-2 opacity-20" />
          <p className="text-xs">Memuat data stok masuk...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-xl border border-dashed border-border/70 p-6">
          <BoxIcon size={40} className="mb-3 opacity-20" />
          <p className="font-semibold text-xs text-foreground">
            {activeTab === "pending"
              ? "Tidak ada rekomendasi stok yang menunggu"
              : "Belum ada riwayat stok yang diterima"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 text-center max-w-[250px]">
            {activeTab === "pending"
              ? "Semua rekomendasi distribusi dari Admin telah Anda konfirmasi atau belum dikirimkan."
              : "Data stok akan muncul di sini setelah Anda menerima rekomendasi atau pengajuan disetujui."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((req: any) => (
            <div
              key={req.id}
              onClick={() => navigate(getDetailPath(req.id))}
              className={`bg-card p-4 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
                activeTab === "pending"
                  ? "border-amber-200/80 hover:border-amber-400 bg-amber-50/10"
                  : "border-border/60 hover:border-emerald-300"
              }`}
            >
              {/* Header Kartu: Kode & Badge */}
              <div className="flex justify-between items-start gap-2 mb-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {req.code}
                    {req.priority === "urgent" && (
                      <span title="Mendesak">
                        <AlertCircle size={13} className="text-red-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar size={11} className="shrink-0" />
                    {req.distribution_date
                      ? `Tgl Distribusi: ${new Date(req.distribution_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {activeTab === "pending" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Perlu Diterima
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Disetujui
                  </span>
                )}
              </div>

              {/* Detail Ringkasan Item */}
              <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg text-xs mb-3">
                <span className="text-muted-foreground">Alokasi Stok Admin:</span>
                <span className="font-bold text-foreground">
                  {req.item_count} SKU <span className="font-normal text-muted-foreground">({req.total_qty} pcs)</span>
                </span>
              </div>

              {/* Action Footer */}
              {activeTab === "pending" ? (
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => navigate(getDetailPath(req.id))}
                    className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 size={13} />
                    <span>Input Jumlah & Terima Stok</span>
                  </button>
                  <button
                    onClick={() => navigate(getDetailPath(req.id))}
                    className="h-8 px-3 border border-border bg-background hover:bg-muted text-xs font-semibold rounded-lg transition text-muted-foreground flex items-center gap-1"
                  >
                    <span>Detail</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {req.type === "request" ? "Pengajuan Saya" : "Rekomendasi Admin"}
                  </span>
                  <div className="flex items-center gap-1 text-primary font-medium group-hover:underline">
                    <span>Lihat Rincian</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
