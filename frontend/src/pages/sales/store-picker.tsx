import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag, X, Search, MapPin, ChevronRight,
  AlertCircle, Plus, Calendar, Package
} from "lucide-react";

export const SalesStorePicker = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:8787/api/stores");
        if (res.ok) {
          const data = await res.json();
          setStores(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Gagal memuat toko:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, []);

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter((s) => {
      return (
        s.name?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
      );
    });
  }, [stores, searchQuery]);

  const handleSelectStore = (storeId: string) => {
    navigate(`/sales/toko/kunjungan/${storeId}`);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header Halaman Tersendiri (Seukuran Mobile) */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <ShoppingBag size={18} className="text-primary" />
            <span>Pilih Toko untuk Dikunjungi</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Pilih mitra toko lama yang akan diaudit hari ini
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/sales/toko")}
          className="p-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
          title="Tutup & Kembali ke Daftar Toko"
        >
          <X size={18} />
        </button>
      </div>

      {/* Input Pencarian Toko */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          autoFocus
          placeholder="Ketik nama toko, pemilik, atau kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Info Jumlah Toko */}
      {!isLoading && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
          <span>Menampilkan {filteredStores.length} mitra toko</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-primary font-semibold hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Daftar Toko */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            <div className="h-20 bg-muted/50 rounded-2xl" />
            <div className="h-20 bg-muted/50 rounded-2xl" />
            <div className="h-20 bg-muted/50 rounded-2xl" />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border p-6">
            <AlertCircle size={32} className="text-muted-foreground mx-auto" />
            <div>
              <p className="text-xs font-bold text-foreground">Toko tidak ditemukan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {searchQuery
                  ? "Tidak ada toko yang cocok dengan pencarian Anda."
                  : "Belum ada mitra toko lama yang terdaftar."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/sales/toko/baru?action=new-store")}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs active:scale-95 transition inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Daftarkan Sebagai Toko Baru</span>
            </button>
          </div>
        ) : (
          filteredStores.map((store) => {
            const locationText = [store.district, store.city].filter(Boolean).join(", ") || store.address || "-";
            const debtAmount = Number(store.total_debt) || 0;
            const remainingStock = Number(store.total_remaining_stock) || 0;
            const lastVisitDate = store.last_visit_date ? new Date(store.last_visit_date) : null;
            const lastVisitFormatted = lastVisitDate
              ? lastVisitDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })
              : null;

            return (
              <div
                key={store.id}
                onClick={() => handleSelectStore(store.id)}
                className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs active:scale-[0.99] transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {store.name}
                      </h3>
                      {debtAmount > 0 && (
                        <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[9px] font-black rounded-md shrink-0 border border-red-200 dark:border-red-800">
                          Piutang
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      PIC: <span className="font-semibold text-foreground/80">{store.owner_name || "-"}</span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>Kunjungi</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin size={11} className="shrink-0 text-primary/70" />
                    <span>{locationText}</span>
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {remainingStock > 0 && (
                      <span className="flex items-center gap-1 text-foreground/80 font-medium">
                        <Package size={11} className="text-muted-foreground" />
                        <span>{remainingStock} pcs</span>
                      </span>
                    )}

                    {lastVisitFormatted && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar size={11} />
                        <span>{lastVisitFormatted}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
