import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, X, Store, ShoppingBag, ChevronRight, Sparkles
} from "lucide-react";

export const FastActionButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  // Sembunyikan FAB jika sedang berada di dalam proses wizard kunjungan atau halaman form/picker
  const isInsideWizard =
    pathname.includes("/kunjungan") ||
    pathname.includes("/visit-wizard") ||
    pathname.includes("/toko/baru") ||
    pathname.includes("/pilih-kunjungan");

  // Handler: Toko Baru (Titip Stok Awal) -> Buka halaman tersendiri seukuran mobile
  const handleSelectNewStore = () => {
    setIsOpen(false);
    navigate("/sales/toko/baru?action=new-store");
  };

  // Handler: Toko Lama (Kunjungan Rutin) -> Buka halaman tersendiri seukuran mobile
  const handleSelectExistingStore = () => {
    setIsOpen(false);
    navigate("/sales/toko/pilih-kunjungan");
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

      {/* Modal / Bottom Sheet Pilihan Aksi Cepat */}
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
                {/* OPSI 1: TITIP STOK AWAL (TOKO BARU) -> MEMBUKA HALAMAN SENDIRI */}
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

                {/* OPSI 2: KUNJUNGAN RUTIN (TOKO LAMA) -> MEMBUKA HALAMAN SENDIRI */}
                <button
                  type="button"
                  onClick={handleSelectExistingStore}
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
          </div>
        </div>
      )}
    </>
  );
};
