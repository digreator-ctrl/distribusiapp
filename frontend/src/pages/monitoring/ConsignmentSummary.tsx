import { Store, Package, RefreshCcw, TrendingUp, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ConsignmentSummary = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Monitoring Konsinyasi</h1>
          <p className="text-surface-500">Ringkasan produk yang dititipkan di seluruh toko.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center hover:border-blue-500 transition-colors">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-3"><Store className="h-6 w-6"/></div>
          <p className="text-surface-500 text-sm font-medium mb-1">Toko Aktif</p>
          <h3 className="text-2xl font-bold">142</h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center hover:border-indigo-500 transition-colors">
          <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center mb-3"><Package className="h-6 w-6"/></div>
          <p className="text-surface-500 text-sm font-medium mb-1">Total Dititipkan</p>
          <h3 className="text-2xl font-bold">12,300 <span className="text-xs font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center border-b-4 border-b-green-500 hover:border-green-500 transition-colors">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center mb-3"><TrendingUp className="h-6 w-6"/></div>
          <p className="text-surface-500 text-sm font-medium mb-1">Total Terjual</p>
          <h3 className="text-2xl font-bold">8,450 <span className="text-xs font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center hover:border-amber-500 transition-colors">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center mb-3"><Package className="h-6 w-6"/></div>
          <p className="text-surface-500 text-sm font-medium mb-1">Total Tersisa</p>
          <h3 className="text-2xl font-bold">3,600 <span className="text-xs font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center hover:border-red-500 transition-colors">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center mb-3"><RefreshCcw className="h-6 w-6"/></div>
          <p className="text-surface-500 text-sm font-medium mb-1">Total Retur</p>
          <h3 className="text-2xl font-bold">250 <span className="text-xs font-normal">pcs</span></h3>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-800/50">
          <h3 className="font-bold text-surface-900 dark:text-surface-100">Daftar Toko Konsinyasi</h3>
          <div className="relative w-full sm:w-64 mt-3 sm:mt-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input type="text" placeholder="Cari toko..." className="h-9 w-full rounded-md border border-surface-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,8%)]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-surface-500 uppercase bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Toko & Sales</th>
                <th className="px-4 py-3 font-semibold text-right">Dititipkan</th>
                <th className="px-4 py-3 font-semibold text-right text-green-600 dark:text-green-400">Terjual</th>
                <th className="px-4 py-3 font-semibold text-right">Tersisa</th>
                <th className="px-4 py-3 font-semibold text-right text-red-500">Retur</th>
                <th className="px-4 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {[
                { store: "Toko Makmur", sales: "Budi Santoso", t: 150, j: 120, s: 28, r: 2 },
                { store: "Toko Sejahtera", sales: "Andi Wijaya", t: 100, j: 80, s: 20, r: 0 },
                { store: "Warung Berkah", sales: "Citra Lestari", t: 80, j: 45, s: 30, r: 5 },
                { store: "Toko Budi", sales: "Budi Santoso", t: 200, j: 150, s: 45, r: 5 },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-surface-900 dark:text-surface-100">{item.store}</div>
                    <div className="text-xs text-surface-500">{item.sales}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{item.t}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{item.j}</td>
                  <td className="px-4 py-3 text-right">{item.s}</td>
                  <td className="px-4 py-3 text-right text-red-500">{item.r}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-8 text-primary-600">Detail <ArrowRight className="h-3 w-3 ml-1" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
