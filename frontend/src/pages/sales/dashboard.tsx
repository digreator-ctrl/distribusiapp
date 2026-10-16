import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Store, Package,
  ChevronRight, TrendingUp, MapPin, Briefcase, Bell
} from "lucide-react";

export const SalesDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSalesId, setActiveSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  const fetchDashboard = async (salesId: string) => {
    if (!salesId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8787/api/sales-dashboard/${salesId}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(activeSalesId);

    const handleSalesChanged = () => {
      const newId = localStorage.getItem("distribusi_user_id") || "";
      setActiveSalesId(newId);
    };
    window.addEventListener("salesChanged", handleSalesChanged);
    return () => window.removeEventListener("salesChanged", handleSalesChanged);
  }, [activeSalesId]);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted/40 rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 bg-muted/40 rounded-xl" />
          <div className="h-20 bg-muted/40 rounded-xl" />
          <div className="h-20 bg-muted/40 rounded-xl" />
        </div>
        <div className="h-24 bg-muted/40 rounded-2xl" />
        <div className="h-40 bg-muted/40 rounded-2xl" />
      </div>
    );
  }

  const d = dashboard || {
    today_visits: 0, today_payment: 0, today_sold_items: 0,
    total_partner_stores: 0, holding_stock: 0, pending_recommendations: 0,
    pending_stores: []
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Hero / Performa Hari Ini */}
      <div className="bg-gradient-to-br from-primary via-primary to-blue-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-white/80" />
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
              Performa Hari Ini
            </span>
          </div>
          <h2 className="text-3xl font-black leading-tight">
            {formatRupiah(d.today_payment)}
          </h2>
          <p className="text-white/70 text-xs mt-1">Total uang diterima dari kunjungan</p>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/15">
            <div>
              <p className="text-2xl font-black">{d.today_visits}</p>
              <p className="text-white/60 text-[10px] font-semibold">Toko Dikunjungi</p>
            </div>
            <div>
              <p className="text-2xl font-black">{d.today_sold_items}</p>
              <p className="text-white/60 text-[10px] font-semibold">Item Terjual</p>
            </div>
            <div>
              <p className="text-2xl font-black">{d.holding_stock}</p>
              <p className="text-white/60 text-[10px] font-semibold">Stok di Tangan</p>
            </div>
          </div>
        </div>
        <Home size={120} className="absolute -right-4 -bottom-4 opacity-10" />
      </div>

      {/* Notifikasi Rekomendasi Pending */}
      {d.pending_recommendations > 0 && (
        <button
          onClick={() => navigate("/sales/stock")}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition shadow-xs"
        >
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs text-amber-950">
              {d.pending_recommendations} Rekomendasi Stok Menunggu
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Admin merekomendasikan stok untuk Anda. Ketuk untuk review.
            </p>
          </div>
          <ChevronRight size={16} className="text-amber-400 shrink-0" />
        </button>
      )}

      {/* Aksi Cepat */}
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 px-0.5">
          Aksi Cepat
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => navigate("/sales/stock")}
            className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col items-center justify-center gap-2 active:scale-[0.97] transition-all hover:border-primary/30 group"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
            <span className="text-xs font-bold text-foreground">Ambil Stok</span>
            <span className="text-[10px] text-muted-foreground -mt-1">Ajukan / Terima stok</span>
          </button>

          <button
            onClick={() => navigate("/sales/toko")}
            className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col items-center justify-center gap-2 active:scale-[0.97] transition-all hover:border-primary/30 group"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Store size={24} />
            </div>
            <span className="text-xs font-bold text-foreground">Kunjungi Toko</span>
            <span className="text-[10px] text-muted-foreground -mt-1">Mulai kunjungan toko</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Store size={14} />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Toko Mitra</span>
          </div>
          <p className="text-2xl font-black text-foreground">{d.total_partner_stores}</p>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Briefcase size={14} />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stok Dibawa</span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {d.holding_stock} <span className="text-xs font-semibold text-muted-foreground">pcs</span>
          </p>
        </div>
      </div>

      {/* Tugas Tertunda - Toko yang Belum Dikunjungi */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Toko Belum Dikunjungi
          </h3>
          {d.pending_stores.length > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {d.pending_stores.length} toko
            </span>
          )}
        </div>

        {d.pending_stores.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
              <TrendingUp size={20} />
            </div>
            <p className="text-xs font-bold text-emerald-800">Semua Toko Sudah Dikunjungi! 🎉</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Atau belum ada toko mitra yang terdaftar. Tambah toko baru di menu Toko.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {d.pending_stores.slice(0, 5).map((store: any) => (
              <button
                key={store.id}
                onClick={() => navigate(`/sales/toko/${store.id}`, { state: { store } })}
                className="w-full bg-card px-3.5 py-3 rounded-xl border border-border/70 shadow-2xs flex items-center gap-3 active:scale-[0.98] transition-all text-left group"
              >
                <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <Store size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                    {store.name}
                  </h4>
                  {store.address && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </p>
                  )}
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-primary shrink-0" />
              </button>
            ))}

            {d.pending_stores.length > 5 && (
              <button
                onClick={() => navigate("/sales/toko")}
                className="w-full text-center text-xs font-semibold text-primary py-2 hover:underline"
              >
                Lihat semua {d.pending_stores.length} toko →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
