import { ArrowDownLeft, ArrowUpRight, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const StockMovements = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Riwayat Mutasi Stok</h1>
          <p className="text-surface-500">Lacak setiap pergerakan barang keluar dan masuk gudang.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
               <input type="text" placeholder="Cari No Referensi atau SKU..." className="h-10 w-full rounded-md border border-surface-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,8%)]" />
             </div>
             <Button variant="outline" className="h-10 px-3">
               <Filter className="h-4 w-4" />
             </Button>
             <Button variant="outline" className="h-10 px-3 hidden md:flex text-surface-600">
               <Calendar className="h-4 w-4 mr-2" /> Bulan Ini
             </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-surface-500 uppercase bg-surface-50 dark:bg-surface-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal & Waktu</th>
                <th className="px-6 py-4 font-semibold">No Referensi</th>
                <th className="px-6 py-4 font-semibold">Jenis Transaksi</th>
                <th className="px-6 py-4 font-semibold">Produk</th>
                <th className="px-6 py-4 font-semibold text-right">Qty</th>
                <th className="px-6 py-4 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {[
                { date: "01 Okt 2023 10:30", ref: "TRX-OUT-001", type: "OUT", typeLabel: "Distribusi ke Sales", product: "Roti Sisir Mentega (BCH-1001)", qty: 500, note: "Dibawa Budi Santoso" },
                { date: "01 Okt 2023 09:15", ref: "TRX-IN-002", type: "IN", typeLabel: "Penerimaan Retur", product: "Donat Gula (BCH-0998)", qty: 15, note: "Retur dari Toko Makmur" },
                { date: "30 Sep 2023 16:45", ref: "TRX-IN-001", type: "IN", typeLabel: "Penerimaan Produksi", product: "Roti Coklat Lumer (BCH-1002)", qty: 2500, note: "Produksi Shift Pagi" },
                { date: "30 Sep 2023 14:20", ref: "TRX-OUT-002", type: "OUT", typeLabel: "Barang Rusak/Expired", product: "Kue Sus Vanilla (-)", qty: 45, note: "Pemusnahan (BAP-092)" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-surface-600 dark:text-surface-300">{item.date}</td>
                  <td className="px-6 py-4 font-mono text-xs text-primary-600 dark:text-primary-400 font-medium">{item.ref}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.type === "IN" ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center dark:bg-green-900/30 dark:text-green-400">
                          <ArrowDownLeft className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center dark:bg-red-900/30 dark:text-red-400">
                          <ArrowUpRight className="h-3 w-3" />
                        </div>
                      )}
                      <span className="font-medium text-surface-900 dark:text-surface-100">{item.typeLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-900 dark:text-surface-100">{item.product}</td>
                  <td className={`px-6 py-4 text-right font-bold ${item.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.type === 'IN' ? '+' : '-'}{item.qty}
                  </td>
                  <td className="px-6 py-4 text-surface-500 text-sm max-w-xs truncate">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
