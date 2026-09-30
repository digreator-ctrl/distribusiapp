import { useState } from "react";
import { Package, Store, UserCheck, LayoutGrid, AlertTriangle, ArrowRight, Download, Search, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const StockSummary = () => {
  const [filter, setFilter] = useState("Semua Lokasi");

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Ringkasan Stok</h1>
          <p className="text-surface-500">Pantau ketersediaan barang di seluruh lokasi dan titik distribusi.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Main Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gudang */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Package className="h-5 w-5" />
            </div>
            <p className="text-surface-500 font-medium mb-1">Stok Gudang Pusat</p>
            <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">45,200 <span className="text-sm font-normal text-surface-500">pcs</span></h3>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer group-hover:underline">
              Lihat Rincian Gudang <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Sales */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500 transition-colors">
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <UserCheck className="h-5 w-5" />
            </div>
            <p className="text-surface-500 font-medium mb-1">Stok Dibawa Sales</p>
            <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">8,450 <span className="text-sm font-normal text-surface-500">pcs</span></h3>
            <div className="mt-4 flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 cursor-pointer group-hover:underline">
              Pantau 24 Sales <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-amber-50 dark:bg-amber-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Toko */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Store className="h-5 w-5" />
            </div>
            <p className="text-surface-500 font-medium mb-1">Stok Titipan Toko</p>
            <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">12,300 <span className="text-sm font-normal text-surface-500">pcs</span></h3>
            <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 cursor-pointer group-hover:underline">
              Tersebar di 142 Toko <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Display */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-purple-500 transition-colors">
          <div className="relative z-10">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <p className="text-surface-500 font-medium mb-1">Stok di Display</p>
            <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">2,150 <span className="text-sm font-normal text-surface-500">pcs</span></h3>
            <div className="mt-4 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 cursor-pointer group-hover:underline">
              Dalam 85 Display <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stok Produk Terbanyak */}
        <div className="lg:col-span-2 bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Ketersediaan per Produk</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  className="h-9 w-full rounded-md border border-surface-200 bg-surface-50 pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800"
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-surface-500 bg-surface-50 dark:bg-surface-800/50 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-semibold">Produk & Varian</th>
                  <th className="px-4 py-3 font-semibold text-right">Gudang</th>
                  <th className="px-4 py-3 font-semibold text-right">Sales</th>
                  <th className="px-4 py-3 font-semibold text-right">Toko</th>
                  <th className="px-4 py-3 rounded-r-lg font-semibold text-right text-primary-600 dark:text-primary-400">Total Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {[
                  { name: "Roti Sisir Mentega", variant: "Original", g: 12500, s: 2450, t: 4500, total: 19450 },
                  { name: "Roti Coklat Lumer", variant: "Coklat", g: 8200, s: 1800, t: 3200, total: 13200 },
                  { name: "Roti Keju Susu", variant: "Keju", g: 7500, s: 1500, t: 2800, total: 11800 },
                  { name: "Kue Sus", variant: "Vanilla", g: 4000, s: 800, t: 1500, total: 6300 },
                  { name: "Donat Gula", variant: "Original", g: 3500, s: 600, t: 1200, total: 5300 },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-surface-900 dark:text-surface-100">{item.name}</div>
                      <div className="text-xs text-surface-500">{item.variant}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-300">{item.g.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-300">{item.s.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-300">{item.t.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-surface-900 dark:text-surface-100">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stok Mendekati Expired (Alert) */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-red-200 dark:border-red-900/50 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Peringatan Kedaluwarsa</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { batch: "BCH-1001", name: "Roti Coklat Lumer", qty: 240, days: 2, loc: "Gudang" },
              { batch: "BCH-1002", name: "Donat Gula", qty: 85, days: 3, loc: "Toko A" },
              { batch: "BCH-0998", name: "Kue Sus", qty: 45, days: 1, loc: "Sales (Budi)" },
            ].map((alert, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 mb-1 inline-block uppercase tracking-wider">Sisa {alert.days} Hari</span>
                    <h4 className="font-semibold text-sm text-surface-900 dark:text-surface-100">{alert.name}</h4>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-surface-900 dark:text-surface-100">{alert.qty} pcs</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-surface-500">
                  <span>Batch: {alert.batch}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {alert.loc}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20">
            Tindak Lanjut Segera
          </Button>
        </div>
      </div>
    </div>
  );
};
