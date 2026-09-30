import { CornerUpLeft, PackageX, Truck, CalendarX, LayoutGrid, Search, ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ReturnSummary = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Monitoring Retur</h1>
          <p className="text-surface-500">Ringkasan pengembalian barang berdasarkan penyebab dan sumber.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center border-b-4 border-b-red-500">
          <div className="mx-auto h-10 w-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center mb-2"><CornerUpLeft className="h-5 w-5"/></div>
          <p className="text-surface-500 text-xs font-medium mb-1">Total Retur</p>
          <h3 className="text-xl font-bold">1,450 <span className="text-[10px] font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center mb-2"><PackageX className="h-5 w-5"/></div>
          <p className="text-surface-500 text-xs font-medium mb-1">Cacat Produksi</p>
          <h3 className="text-xl font-bold">120 <span className="text-[10px] font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-2"><Truck className="h-5 w-5"/></div>
          <p className="text-surface-500 text-xs font-medium mb-1">Cacat Pengiriman</p>
          <h3 className="text-xl font-bold">85 <span className="text-[10px] font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center mb-2"><CalendarX className="h-5 w-5"/></div>
          <p className="text-surface-500 text-xs font-medium mb-1">Expired</p>
          <h3 className="text-xl font-bold">1,145 <span className="text-[10px] font-normal">pcs</span></h3>
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center mb-2"><LayoutGrid className="h-5 w-5"/></div>
          <p className="text-surface-500 text-xs font-medium mb-1">Cacat Display</p>
          <h3 className="text-xl font-bold">100 <span className="text-[10px] font-normal">pcs</span></h3>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-800/50">
          <h3 className="font-bold text-surface-900 dark:text-surface-100">Daftar Retur Terbaru</h3>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input type="text" placeholder="Cari retur..." className="h-9 w-full rounded-md border border-surface-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,8%)]" />
            </div>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-surface-500 uppercase bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Nomor & Tanggal</th>
                <th className="px-4 py-3 font-semibold">Sumber</th>
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold text-right">Qty</th>
                <th className="px-4 py-3 font-semibold">Alasan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {[
                { no: "RET-20230929-01", date: "29 Sep 2023", source: "Toko Makmur", product: "Roti Sisir Mentega (BCH-1001)", qty: 5, reason: "Expired", status: "Menunggu" },
                { no: "RET-20230928-02", date: "28 Sep 2023", source: "Agen Jaya", product: "Donat Gula (BCH-1002)", qty: 15, reason: "Cacat Produksi", status: "Selesai" },
                { no: "RET-20230927-01", date: "27 Sep 2023", source: "Sales - Budi", product: "Kue Sus (BCH-0998)", qty: 2, reason: "Cacat Pengiriman", status: "Selesai" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-primary-600 dark:text-primary-400">{item.no}</div>
                    <div className="text-xs text-surface-500">{item.date}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-100">{item.source}</td>
                  <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{item.product}</td>
                  <td className="px-4 py-3 text-right font-bold">{item.qty}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300">
                      {item.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Selesai' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
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
