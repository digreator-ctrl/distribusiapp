import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight, CheckCircle2, FileText, Calendar, BoxIcon } from "lucide-react";

export const MobileReceivedStock = () => {
  const navigate = useNavigate();
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeSalesId = localStorage.getItem("distribusi_user_id") || "";

  useEffect(() => {
    const fetchApprovedStock = async () => {
      setIsLoading(true);
      try {
        // Fetch approved stock requests for this sales
        let url = "http://localhost:8787/api/stock-requests?status=approved";
        const params = new URLSearchParams();
        params.append("status", "approved");
        params.append("target_type", "sales");
        if (activeSalesId) {
          params.append("sales_id", activeSalesId);
        }
        url = `http://localhost:8787/api/stock-requests?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          let data = Array.isArray(json) ? json : [];

          // Filter only approved data for this sales
          data = data.filter((req: any) => {
            if (req.status !== "approved") return false;
            if (req.target_type === "agen" || req.agen_name || req.agen_id) return false;
            return req.sales_id === activeSalesId || (!req.sales_id && req.target_type === "sales");
          });

          setReceivedItems(data);
        }
      } catch (err) {
        console.error("Gagal memuat data stok diterima:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovedStock();
  }, [activeSalesId]);

  const getDetailPath = (id: string) => `/sales/stock-requests/${id}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              Stok Diterima
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Data produk dari pengajuan & rekomendasi yang disetujui
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{receivedItems.length}</p>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">Dokumen</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-blue-700">
              {receivedItems.reduce((acc, req) => {
                const totalQty = req.items
                  ? req.items.reduce((sum: number, item: any) => sum + (item.approved_quantity !== null ? item.approved_quantity : item.quantity), 0)
                  : (req.total_qty || 0);
                return acc + totalQty;
              }, 0)}
            </p>
            <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mt-0.5">Total pcs</p>
          </div>
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse flex flex-col items-center">
          <Package size={28} className="mb-2 opacity-20" />
          <p className="text-xs">Memuat data stok diterima...</p>
        </div>
      ) : receivedItems.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-xl border border-dashed border-border/70 p-6">
          <BoxIcon size={40} className="mb-3 opacity-20" />
          <p className="font-semibold text-xs text-foreground">
            Belum ada stok yang diterima
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 text-center max-w-[250px]">
            Data stok akan muncul di sini setelah pengajuan atau rekomendasi stok disetujui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {receivedItems.map((req: any) => (
            <div
              key={req.id}
              onClick={() => navigate(getDetailPath(req.id))}
              className="bg-card p-3.5 rounded-xl border border-border/60 hover:border-emerald-300 active:scale-[0.99] transition-all cursor-pointer shadow-2xs group"
            >
              {/* Top Row: Code + Badge */}
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-foreground group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    {req.code}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar size={10} className="shrink-0" />
                    {req.distribution_date
                      ? new Date(req.distribution_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Disetujui
                </span>
              </div>

              {/* Bottom Row: Item count + Arrow */}
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText size={12} />
                    <span>{req.type === 'request' ? 'Pengajuan' : 'Rekomendasi'}</span>
                  </div>
                  <span className="text-foreground font-semibold">
                    {req.item_count} SKU
                    <span className="text-[11px] font-normal text-muted-foreground ml-1">({req.total_qty} pcs)</span>
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
