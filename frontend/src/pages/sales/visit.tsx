import { MapPin, Navigation, Store } from "lucide-react";

export const MobileVisit = () => {
  const stores = [
    { id: 1, name: "Toko Sinar Jaya", address: "Jl. Sudirman No. 45", status: "pending", distance: "0.8 km" },
    { id: 2, name: "Minimarket Berkah", address: "Jl. Diponegoro 12", status: "visited", distance: "1.2 km" },
    { id: 3, name: "Warung Makmur", address: "Jl. Melati 9", status: "pending", distance: "2.5 km" },
  ];

  return (
    <div className="space-y-6">
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

      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-lg text-foreground">Daftar Kunjungan</h3>
          <button className="text-primary text-sm font-semibold hover:underline">Lihat Peta</button>
        </div>
        
        <div className="space-y-3">
          {stores.map(store => (
            <div key={store.id} className={`p-4 rounded-xl border flex gap-4 bg-card shadow-sm transition-all active:scale-[0.98] ${store.status === 'visited' ? 'opacity-60 grayscale-[0.5]' : 'border-primary/20'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${store.status === 'visited' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <Store size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm leading-tight">{store.name}</h4>
                  <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{store.distance}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{store.address}</p>
                <div className="mt-3 flex gap-2">
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
  );
};
