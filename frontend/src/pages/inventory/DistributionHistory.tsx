import { Search, Filter, Calendar, Truck, ArrowRight, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const DistributionHistory = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Riwayat Distribusi</h1>
          <p className="text-surface-500">Daftar riwayat pengeluaran barang ke Sales dan Agen.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
               <input type="text" placeholder="Cari No Referensi atau Tujuan..." className="h-10 w-full rounded-md border border-surface-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,8%)]" />
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
                <th className="px-6 py-4 font-semibold">Waktu Distribusi</th>
                <th className="px-6 py-4 font-semibold">No Referensi</th>
                <th className="px-6 py-4 font-semibold">Tipe Tujuan</th>
                <th className="px-6 py-4 font-semibold">Nama Tujuan</th>
                <th className="px-6 py-4 font-semibold text-right">Total Item</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {[
                { date: "01 Okt 2023 10:30", ref: "DST-S-001", type: "Sales", target: "Budi Santoso", qty: 450, status: "Selesai" },
                { date: "30 Sep 2023 14:15", ref: "DST-A-002", type: "Agen", target: "Agen Makmur Jaya", qty: 1200, status: "Dikirim" },
                { date: "29 Sep 2023 09:00", ref: "DST-S-002", type: "Sales", target: "Andi Wijaya", qty: 320, status: "Selesai" },
                { date: "28 Sep 2023 16:30", ref: "DST-A-001", type: "Agen", target: "Agen Sinar Harapan", qty: 2500, status: "Selesai" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-surface-600 dark:text-surface-300">{item.date}</td>
                  <td className="px-6 py-4 font-mono text-xs text-primary-600 dark:text-primary-400 font-medium">{item.ref}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.type === "Sales" ? (
                        <UserCheck className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Users className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-medium text-surface-900 dark:text-surface-100">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-900 dark:text-surface-100 font-medium">{item.target}</td>
                  <td className="px-6 py-4 text-right font-bold text-surface-900 dark:text-surface-100">
                    {item.qty} <span className="text-xs font-normal text-surface-500">pcs</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Selesai' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
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
