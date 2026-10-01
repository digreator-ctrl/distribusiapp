import { Camera, QrCode, AlertTriangle } from "lucide-react";

export const MobileAsset = () => {
  return (
    <div className="space-y-5">
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <QrCode size={32} />
        </div>
        <h2 className="font-bold text-lg mb-1">Pelacakan Aset Display</h2>
        <p className="text-sm text-muted-foreground mb-5 px-4">Pindai kode QR pada rak, chiller, atau materi promosi untuk melapor kondisinya.</p>
        
        <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Camera size={18} /> Pindai QR Aset
        </button>
      </div>

      <div>
        <h3 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
          Aset Butuh Perhatian <span className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full">1</span>
        </h3>
        
        <div className="bg-card border-l-4 border-l-destructive p-4 rounded-r-xl rounded-l-sm shadow-sm">
          <div className="flex gap-3">
            <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-sm">Chiller Minuman (CH-092)</h4>
              <p className="text-xs text-muted-foreground mt-1">Toko Makmur, Jl. Melati 9</p>
              <p className="text-xs font-medium text-destructive mt-2 bg-destructive/10 inline-block px-2 py-1 rounded">Laporan: Lampu Mati</p>
              <div className="mt-3 flex gap-2">
                <button className="text-xs bg-muted font-semibold px-3 py-1.5 rounded hover:bg-muted/80">Tandai Selesai</button>
                <button className="text-xs border font-semibold px-3 py-1.5 rounded hover:bg-muted">Request Teknisi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
