import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, X, Plus, FileText, Send, Inbox, AlertCircle } from "lucide-react";

export const StockRequestList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("distribusi_role") || "admin";
  const isSales = role === "sales";
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState(isSales ? "request" : "recommendation");

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        let url = "http://localhost:8787/api/stock-requests";
        const params = new URLSearchParams();
        if (filterType) params.append("type", filterType);
        // Jika role sales, idealnya kirim sales_id. Untuk mockup kita tidak set parameter 
        // sehingga mengambil semua, atau kita bisa tambahkan logika jika backend butuh.
        
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setRequests(Array.isArray(json) ? json : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [filterType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Disetujui</span>;
      case "rejected": return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Ditolak</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Menunggu</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "recommendation") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1"><Inbox size={12}/> Rekomendasi (Admin)</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Send size={12}/> Pengajuan (Sales)</span>;
  };

  const createPath = isSales ? "/sales/stock-requests/create" : "/stock-requests/create";
  const getDetailPath = (id: string) => isSales ? `/sales/stock-requests/${id}` : `/stock-requests/${id}`;

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 shadow-sm mb-6">
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

      <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {isSales ? "Request & Rekomendasi Stok" : "Distribusi & Approval Stok"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {isSales 
                ? "Kelola pengajuan stok ke Admin atau lihat rekomendasi dari Admin." 
                : "Kelola rekomendasi stok ke Sales (Distribusi) atau setujui pengajuan (Approval)."}
            </p>
          </div>
          <button 
            onClick={() => navigate(createPath)}
            className="w-full md:w-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            {isSales ? "Buat Pengajuan Stok" : "Distribusi"}
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilterType("recommendation")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${filterType === "recommendation" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {isSales ? "Rekomendasi (Admin)" : "Distribusi"}
          </button>
          <button onClick={() => setFilterType("request")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${filterType === "request" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {isSales ? "Pengajuan (Sales)" : "Approval Stok"}
          </button>
        </div>
      
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground animate-pulse flex flex-col items-center">
            <FileText size={32} className="mb-3 opacity-20" />
            <p>Memuat data...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center bg-muted/20 rounded-xl border border-dashed border-border">
            <FileText size={48} className="mb-3 opacity-20" />
            <p className="font-medium text-foreground">Belum ada data pengajuan/rekomendasi.</p>
            <p className="text-sm mt-1">Klik tombol tambah untuk membuat baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req: any) => (
              <div 
                key={req.id} 
                onClick={() => navigate(getDetailPath(req.id))}
                className="bg-background border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer hover:border-primary/30 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{req.code}</h3>
                    {getTypeBadge(req.type)}
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div className="text-sm bg-muted/50 p-3 rounded-lg border border-border/50">
                    <p className="text-muted-foreground text-xs mb-1">Ditujukan / Dari:</p>
                    <p className="font-semibold text-foreground">
                      {req.sales_full_name || req.sales_username || "Semua Sales (Broadcast)"}
                    </p>
                  </div>
                  
                  <div className="flex gap-4 text-sm px-1">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Item</p>
                      <p className="font-bold">{req.item_count} SKU</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total Qty</p>
                      <p className="font-bold">{req.total_qty} pcs</p>
                    </div>
                  </div>
                </div>

                {req.priority === "urgent" && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-auto">
                    <AlertCircle size={14} /> Mendesak
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50 flex justify-between">
                  <span>{new Date(req.created_at).toLocaleDateString('id-ID')}</span>
                  <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Lihat Detail →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
