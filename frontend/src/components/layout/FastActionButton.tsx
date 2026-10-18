import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, X, Store, ShoppingBag, ArrowLeft,
  Search, ChevronRight, Sparkles, MapPin, AlertCircle
} from "lucide-react";

export const FastActionButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "store_picker">("menu");
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sembunyikan FAB jika sedang berada di dalam proses wizard kunjungan
  const isInsideWizard = pathname.includes("/kunjungan") || pathname.includes("/visit-wizard");

  // Fetch daftar toko saat modal dibuka / berganti ke picker
  useEffect(() => {
    if (isOpen) {
      const fetchStores = async () => {
        setIsLoadingStores(true);
        try {
          const res = await fetch("http://localhost:8787/api/stores");
          if (res.ok) {
            const data = await res.json();
            setStores(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error("Gagal memuat toko:", err);
        } finally {
          setIsLoadingStores(false);
        }
      };
      fetchStores();
    } else {
      // Reset view saat ditutup
      setView("menu");
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter toko berdasarkan query pencarian
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

  // Handler: Toko Baru (Titip Stok Awal)
  const handleSelectNewStore = () => {
    setIsOpen(false);
    navigate("/sales/toko?action=new-store");
  };

  // Handler: Toko Lama terpilih
  const handleSelectExistingStore = (storeId: string) => {
    setIsOpen(false);
    navigate(`/sales/toko/kunjungan/${storeId}`);
  };

  if (isInsideWizard) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) di Thumb Zone Kanan Bawah */}
      <div className="fixed bottom-20 max-w-md w-full pointer-events-none z-30 flex justify-end px-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="pointer-events-auto w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl active:scale-90 transition-all flex items-center justify-center ring-4 ring-white/90 group"
          title="Aksi Cepat Sales"
          aria-label="Aksi Cepat Sales"
        >
          <Plus
            size={28}
            className={`transition-transform duration-300 ${isOpen ? "rotate-45" : "group-hover:scale-110"}`}
          />
        </button>
      </div>

      {/* Modal / Bottom Sheet Aksi Cepat */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop blur */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Action Sheet Container (Mobile Width Aligned) */}
          <div className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl shadow-2xl z-10 p-5 space-y-4 animate-in slide-in-from-bottom duration-250 max-h-[85vh] flex flex-col">
            {/* Pill drag indicator */}
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto shrink-0" />

            {/* VIEW 1: PILIHAN UTAMA AKSI CEPAT */}
            {view === "menu" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      <span>Aksi Cepat Lapangan</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih jenis kunjungan yang sedang Anda lakukan:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-1">
                  {/* OPSI 1: TITIP STOK AWAL (TOKO BARU) */}
                  <button
                    type="button"
                    onClick={handleSelectNewStore}
                    className="w-full text-left p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition active:scale-[0.98] group flex items-start gap-3.5 shadow-2xs"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                      <Store size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-foreground group-hover:text-emerald-700 transition-colors">
                          Titip Stok Awal
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                          Toko Baru
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Daftarkan mitra toko baru di lokasi, lalu langsung titipkan stok produk konsinyasi perdana.
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                  </button>

                  {/* OPSI 2: KUNJUNGAN RUTIN (TOKO LAMA) */}
                  <button
                    type="button"
                    onClick={() => setView("store_picker")}
                    className="w-full text-left p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition active:scale-[0.98] group flex items-start gap-3.5 shadow-2xs"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
                      <ShoppingBag size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          Kunjungan Rutin
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wide">
                          Toko Lama
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Audit sisa stok rak, hitung penjualan otomatis, tagih uang/piutang, & tambah titip stok baru.
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: PILIH MITRA TOKO LAMA UNTUK KUNJUNGAN RUTIN */}
            {view === "store_picker" && (
              <div className="flex flex-col flex-1 min-h-0 space-y-3">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setView("menu")}
                      className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Kembali ke Pilihan Aksi"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">
                        Pilih Toko untuk Dikunjungi
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Pilih mitra toko lama yang akan diaudit hari ini
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Input Cari Toko */}
                <div className="relative shrink-0">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ketik nama toko, pemilik, atau kota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Daftar Toko */}
                <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[380px] space-y-2 pr-0.5">
                  {isLoadingStores ? (
                    <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p>Memuat daftar mitra toko...</p>
                    </div>
                  ) : filteredStores.length === 0 ? (
                    <div className="py-8 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border p-4">
                      <AlertCircle size={28} className="text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Toko tidak ditemukan</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {searchQuery ? "Tidak ada toko yang cocok dengan pencarian Anda." : "Belum ada mitra toko yang terdaftar."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectNewStore}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs active:scale-95 transition"
                      >
                        + Daftarkan Sebagai Toko Baru
                      </button>
                    </div>
                  ) : (
                    filteredStores.map((store) => {
                      const locationText = [store.district, store.city, store.province].filter(Boolean).join(", ") || store.address || "-";
                      const hasDebt = Number(store.total_debt) > 0;

                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleSelectExistingStore(store.id)}
                          className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition active:scale-[0.99] flex items-center justify-between gap-3 group bg-card"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                {store.name}
                              </span>
                              {hasDebt && (
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Ada Piutang" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              PIC: <span className="font-semibold text-foreground/80">{store.owner_name || "-"}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 truncate flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="shrink-0 text-primary/70" />
                              <span>{locationText}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                              Kunjungi
                              <ChevronRight size={13} />
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
