import { Package, Search, Filter, AlertCircle, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const InventoryDashboard = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Stok Gudang Pusat</h1>
          <p className="text-surface-500">Kelola ketersediaan barang dan batch di gudang utama.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none h-10 text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:border-primary-800 dark:hover:bg-primary-900/40">
            <ArrowUpRight className="h-4 w-4 mr-2" /> Terima Barang
          </Button>
          <Button className="flex-1 sm:flex-none h-10">
            <ArrowDownRight className="h-4 w-4 mr-2" /> Mutasi Keluar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex items-center gap-4 hover:border-blue-500 transition-colors">
          <div className="h-14 w-14 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <p className="text-surface-500 font-medium text-sm">Total Produk Unik</p>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-100">124</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex items-center gap-4 hover:border-indigo-500 transition-colors">
          <div className="h-14 w-14 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <p className="text-surface-500 font-medium text-sm">Total Item Gudang</p>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-100">45,200</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10 shadow-sm flex items-center gap-4 hover:border-red-500 transition-colors">
          <div className="h-14 w-14 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 flex items-center justify-center">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-red-600 dark:text-red-400 font-medium text-sm">Stok Kritis / Habis</p>
            <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">8 Produk</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
               <input type="text" placeholder="Cari SKU atau Produk..." className="h-10 w-full rounded-md border border-surface-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,8%)]" />
             </div>
             <Button variant="outline" className="h-10 px-3">
               <Filter className="h-4 w-4" />
             </Button>
          </div>
          <Button variant="ghost" className="text-primary-600 hidden sm:flex">
             <History className="h-4 w-4 mr-2" /> Riwayat Mutasi
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-surface-500 uppercase bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">SKU & Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Batch Terlama</th>
                <th className="px-6 py-4 font-semibold text-right">Jumlah Stok</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {[
                { sku: "RT-001", name: "Roti Sisir Mentega (Original)", cat: "Roti Manis", batch: "BCH-1001", qty: 12500, status: "Aman" },
                { sku: "RT-002", name: "Roti Coklat Lumer", cat: "Roti Manis", batch: "BCH-1002", qty: 8200, status: "Aman" },
                { sku: "DN-001", name: "Donat Gula", cat: "Donat", batch: "BCH-0998", qty: 120, status: "Kritis" },
                { sku: "KS-001", name: "Kue Sus Vanilla", cat: "Kue Basah", batch: "-", qty: 0, status: "Habis" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-surface-500 mb-1">{item.sku}</div>
                    <div className="font-bold text-surface-900 dark:text-surface-100">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-surface-600 dark:text-surface-300">{item.cat}</td>
                  <td className="px-6 py-4 font-mono text-xs text-surface-500">{item.batch}</td>
                  <td className={`px-6 py-4 text-right font-bold text-lg ${item.qty === 0 ? 'text-red-500' : 'text-surface-900 dark:text-surface-100'}`}>
                    {item.qty.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Aman' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.status === 'Kritis' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {item.status}
                    </span>
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
