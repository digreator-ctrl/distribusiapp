import { useState } from "react";
import { Package, Truck, History, Search, ArrowRight } from "lucide-react";

export const MyStock = () => {
  const [activeTab, setActiveTab] = useState("current");

  return (
    <div className="space-y-4 pb-24 md:pb-8 max-w-md mx-auto md:max-w-3xl">
      {/* Header Mobile Style */}
      <div className="bg-primary-600 text-white p-6 -mx-4 -mt-4 md:rounded-b-3xl md:mx-0 shadow-md">
        <h1 className="text-2xl font-bold mb-1">Stok Saya</h1>
        <p className="text-primary-100 text-sm">Barang di kendaraan Anda saat ini.</p>
        
        <div className="flex bg-white/20 p-4 rounded-xl mt-6 items-center justify-between">
          <div>
            <p className="text-primary-100 text-xs font-medium mb-1">Total Tersisa</p>
            <h3 className="text-2xl font-bold">1,450 <span className="text-sm font-normal text-primary-200">pcs</span></h3>
          </div>
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
            <Truck className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg mx-4 md:mx-0 mt-6">
         <button 
           onClick={() => setActiveTab('current')} 
           className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'current' ? 'bg-white dark:bg-surface-900 shadow-sm text-primary-600 dark:text-primary-400' : 'text-surface-500'}`}
         >
           Stok Saat Ini
         </button>
         <button 
           onClick={() => setActiveTab('history')} 
           className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-surface-900 shadow-sm text-primary-600 dark:text-primary-400' : 'text-surface-500'}`}
         >
           Riwayat Terima
         </button>
      </div>

      {activeTab === 'current' ? (
        <div className="px-4 md:px-0 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
             <input type="text" placeholder="Cari produk di mobil..." className="h-12 w-full rounded-xl border border-surface-200 bg-white pl-11 pr-4 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,10%)] text-surface-900 dark:text-surface-100" />
          </div>

          <div className="space-y-3">
            {[
              { name: "Roti Sisir Mentega", variant: "Original", qty: 350, sold: 150 },
              { name: "Roti Coklat Lumer", variant: "Coklat", qty: 120, sold: 80 },
              { name: "Kue Sus Vanilla", variant: "Vanilla", qty: 85, sold: 15 },
              { name: "Donat Gula", variant: "Original", qty: 210, sold: 40 },
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-[hsl(224,20%,10%)] border border-surface-200 dark:border-surface-800 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover:border-primary-500 transition-colors">
                 <div className="h-14 w-14 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800">
                   <Package className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-surface-900 dark:text-surface-100">{item.name}</h4>
                   <p className="text-xs text-surface-500 mb-2">{item.variant}</p>
                   
                   <div className="flex justify-between items-end">
                     <div>
                       <div className="text-[10px] text-surface-500 font-semibold uppercase tracking-wider mb-0.5">Sisa Stok</div>
                       <div className="font-bold text-lg text-primary-600 dark:text-primary-400">{item.qty}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-[10px] text-surface-500 font-semibold uppercase tracking-wider mb-0.5">Terjual Hari Ini</div>
                       <div className="font-bold text-green-600 dark:text-green-400">{item.sold}</div>
                     </div>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-0 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {[
            { date: "Hari Ini, 07:30", ref: "DST-S-045", items: 500 },
            { date: "Kemarin, 07:15", ref: "DST-S-040", items: 450 },
            { date: "29 Sep 2023, 07:45", ref: "DST-S-032", items: 600 },
          ].map((item, idx) => (
             <div key={idx} className="bg-white dark:bg-[hsl(224,20%,10%)] border border-surface-200 dark:border-surface-800 p-4 rounded-xl shadow-sm flex items-center justify-between hover:border-blue-500 transition-colors cursor-pointer">
               <div className="flex gap-4 items-center">
                 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                   <History className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="font-semibold text-surface-900 dark:text-surface-100">{item.date}</p>
                   <p className="text-xs font-mono text-surface-500">{item.ref}</p>
                 </div>
               </div>
               <div className="text-right flex items-center gap-2">
                 <div>
                   <p className="text-xs text-surface-500">Diterima</p>
                   <p className="font-bold text-surface-900 dark:text-surface-100">+{item.items}</p>
                 </div>
                 <ArrowRight className="h-4 w-4 text-surface-300 ml-1" />
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};
