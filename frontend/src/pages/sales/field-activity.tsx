import { useState } from "react";
import { MapPin, Navigation, Store, PackageCheck, Camera, ClipboardCheck } from "lucide-react";

export const MobileFieldActivity = () => {
  const [activeTab, setActiveTab] = useState<"kunjungan" | "opname">("kunjungan");

  const stores = [
    { id: 1, name: "Toko Sinar Jaya", address: "Jl. Sudirman No. 45", status: "pending", distance: "0.8 km" },
    { id: 2, name: "Minimarket Berkah", address: "Jl. Diponegoro 12", status: "visited", distance: "1.2 km" },
    { id: 3, name: "Warung Makmur", address: "Jl. Melati 9", status: "pending", distance: "2.5 km" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
        <button 
          onClick={() => setActiveTab("kunjungan")} 
          className={`h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "kunjungan" 
              ? "bg-background text-foreground shadow-xs font-bold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin size={14} />
          <span>Kunjungan</span>
        </button>
        <button 
          onClick={() => setActiveTab("opname")} 
          className={`h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "opname" 
              ? "bg-background text-foreground shadow-xs font-bold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardCheck size={14} />
          <span>Opname Konsinyasi</span>
        </button>
      </div>

      {/* ===== TAB: KUNJUNGAN ===== */}
      {activeTab === "kunjungan" && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-500 to-primary p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-medium mb-1">Rute Hari Ini</p>
              <h2 className="text-2xl font-black">1 / 8 Toko</h2>
              <p className="text-sm mt-2 flex items-center gap-1 opacity-90"><MapPin size={14} /> Area: Jakarta Selatan</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
              <Navigation size={120} />
            </div>
          </div>

          {/* Store List */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-sm text-foreground">Daftar Kunjungan</h3>
              <button className="text-primary text-xs font-semibold hover:underline">Lihat Peta</button>
            </div>
            
            <div className="space-y-2.5">
              {stores.map(store => (
                <div key={store.id} className={`p-3.5 rounded-xl border flex gap-3 bg-card shadow-sm transition-all active:scale-[0.98] ${store.status === 'visited' ? 'opacity-60 grayscale-[0.5]' : 'border-primary/20'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${store.status === 'visited' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <Store size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs leading-tight truncate">{store.name}</h4>
                      <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0">{store.distance}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{store.address}</p>
                    <div className="mt-2.5 flex gap-2">
                      {store.status === 'pending' ? (
                        <button className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg shadow-sm">Check-in</button>
                      ) : (
                        <div className="flex-1 bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-1">
                          ✓ Selesai
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: OPNAME KONSINYASI ===== */}
      {activeTab === "opname" && (
        <div className="space-y-4">
          {/* Opname Header */}
          <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
            <h2 className="font-bold text-sm mb-1">Opname Konsinyasi</h2>
            <p className="text-xs text-muted-foreground mb-3">Pilih toko yang sedang dikunjungi untuk melakukan pencatatan stok fisik.</p>
            
            <select className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-medium mb-3 outline-none focus:ring-2 focus:ring-primary/50">
              <option>Toko Sinar Jaya (Jl. Sudirman)</option>
              <option>Warung Makmur (Jl. Melati)</option>
            </select>
            
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <h4 className="text-amber-800 font-bold text-xs mb-1">Peringatan Stok</h4>
              <p className="text-amber-700 text-[11px] leading-relaxed">Sistem mencatat ada 15 produk kedaluwarsa minggu depan di toko ini. Harap lakukan penarikan (retur).</p>
            </div>
          </div>

          {/* Form Input Stok Fisik */}
          <div>
            <h3 className="font-bold text-sm text-foreground mb-3">Form Input Stok Fisik</h3>
            <div className="space-y-2.5">
              {[
                { name: "Kopi Hitam 200g", target: 50, actual: "" },
                { name: "Gula Pasir 1kg", target: 20, actual: "" },
                { name: "Teh Celup Isi 25", target: 100, actual: "" },
              ].map((item, idx) => (
                <div key={idx} className="bg-card p-3.5 rounded-xl border shadow-sm flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg text-primary shrink-0">
                    <PackageCheck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs truncate">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Sistem: <span className="font-bold text-foreground">{item.target}</span> pcs</p>
                  </div>
                  <div className="w-16 shrink-0">
                    <input 
                      type="number" 
                      placeholder="Fisik" 
                      className="w-full text-center p-2 rounded-lg border bg-muted/50 font-bold text-xs focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs active:scale-[0.98] transition">
              <Camera size={16} /> Simpan & Foto Bukti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
