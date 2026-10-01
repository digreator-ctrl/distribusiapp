import { PackageCheck, Camera } from "lucide-react";

export const MobileOpname = () => {
  return (
    <div className="space-y-6">
      <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
        <h2 className="font-bold text-lg mb-1">Opname Konsinyasi</h2>
        <p className="text-sm text-muted-foreground mb-4">Pilih toko yang sedang dikunjungi untuk melakukan pencatatan stok fisik.</p>
        
        <select className="w-full p-3 rounded-xl border border-input bg-background text-sm font-medium mb-4 outline-none focus:ring-2 focus:ring-primary/50">
          <option>Toko Sinar Jaya (Jl. Sudirman)</option>
          <option>Warung Makmur (Jl. Melati)</option>
        </select>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
          <h4 className="text-amber-800 font-bold text-sm mb-2">Peringatan Stok</h4>
          <p className="text-amber-700 text-xs leading-relaxed">Sistem mencatat ada 15 produk kedaluwarsa minggu depan di toko ini. Harap lakukan penarikan (retur).</p>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg text-foreground mb-3">Form Input Stok Fisik</h3>
        <div className="space-y-3">
          {[
            { name: "Kopi Hitam 200g", target: 50, actual: "" },
            { name: "Gula Pasir 1kg", target: 20, actual: "" },
            { name: "Teh Celup Isi 25", target: 100, actual: "" },
          ].map((item, idx) => (
            <div key={idx} className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <PackageCheck size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{item.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Sistem: <span className="font-bold text-foreground">{item.target}</span> pcs</p>
              </div>
              <div className="w-20">
                <input 
                  type="number" 
                  placeholder="Fisik" 
                  className="w-full text-center p-2 rounded-lg border bg-muted/50 font-bold text-sm focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                />
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Camera size={18} /> Simpan & Foto Bukti
        </button>
      </div>
    </div>
  );
};
