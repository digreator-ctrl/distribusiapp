import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Package, UserCheck, Users, Search, Truck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const DistributeForm = () => {
  const location = useLocation();
  const isSales = location.pathname.includes("/sales");
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Distribusi ke {isSales ? "Sales" : "Agen"}
        </h1>
        <p className="text-surface-500">
          Proses pengeluaran barang dari gudang utama menuju {isSales ? "kendaraan/stok sales di lapangan" : "lokasi agen distributor"}.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 py-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>1</div>
          <span className="font-medium text-sm hidden sm:block">Pilih {isSales ? "Sales" : "Agen"}</span>
        </div>
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-800'}`}></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>2</div>
          <span className="font-medium text-sm hidden sm:block">Pilih Produk</span>
        </div>
        <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-800'}`}></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>3</div>
          <span className="font-medium text-sm hidden sm:block">Konfirmasi</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Pilih {isSales ? "Sales" : "Agen"} Tujuan</h2>
            
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
               <input type="text" placeholder={`Cari nama ${isSales ? 'sales' : 'agen'}...`} className="h-12 w-full rounded-xl border border-surface-200 bg-surface-50 pl-11 pr-4 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-[hsl(224,20%,8%)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: isSales ? "Budi Santoso" : "Agen Makmur Jaya", area: "Jakarta Selatan", status: "Aktif", stock: 1250 },
                { name: isSales ? "Andi Wijaya" : "Agen Sinar Harapan", area: "Jakarta Barat", status: "Aktif", stock: 840 },
                { name: isSales ? "Citra Lestari" : "Agen Berkah Makmur", area: "Tangerang", status: "Aktif", stock: 2100 },
                { name: isSales ? "Dewi Susanti" : "Agen Sentosa", area: "Depok", status: "Aktif", stock: 520 },
              ].map((item, idx) => (
                <div key={idx} onClick={() => setStep(2)} className="cursor-pointer border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex gap-4 items-center hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all">
                  <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center shrink-0">
                    {isSales ? <UserCheck className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-surface-900 dark:text-surface-100">{item.name}</h4>
                    <p className="text-sm text-surface-500">{item.area}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-surface-500">Stok saat ini</div>
                    <div className="font-semibold text-surface-900 dark:text-surface-100">{item.stock} pcs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Pilih Produk & Kuantitas</h2>
              <div className="px-3 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg text-sm font-medium flex items-center gap-2">
                Tujuan: {isSales ? "Budi Santoso" : "Agen Makmur Jaya"}
              </div>
            </div>

            <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Produk</th>
                    <th className="px-4 py-3 font-semibold text-center">Stok Gudang</th>
                    <th className="px-4 py-3 font-semibold text-center">Kuantitas Kirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {[
                    { name: "Roti Sisir Mentega", variant: "Original", stock: 12500, val: 500 },
                    { name: "Roti Coklat Lumer", variant: "Coklat", stock: 8200, val: 200 },
                    { name: "Donat Gula", variant: "Original", stock: 3500, val: 0 },
                    { name: "Kue Sus Vanilla", variant: "Vanilla", stock: 4000, val: 0 },
                  ].map((p, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-surface-900 dark:text-surface-100">{p.name}</div>
                        <div className="text-xs text-surface-500">{p.variant}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded font-medium">
                          {p.stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button className="h-8 w-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800">-</button>
                          <input type="number" value={p.val} className="h-8 w-20 text-center rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent font-semibold" />
                          <button className="h-8 w-8 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800">+</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
              <Button onClick={() => setStep(3)}>Lanjut Konfirmasi <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2 mb-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">Konfirmasi Distribusi</h2>
              <p className="text-surface-500">Pastikan data barang yang akan dikeluarkan dari gudang sudah benar.</p>
            </div>

            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                   <p className="text-sm text-surface-500 mb-1">Tujuan Distribusi</p>
                   <p className="font-bold text-surface-900 dark:text-surface-100">{isSales ? "Budi Santoso (Sales)" : "Agen Makmur Jaya"}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm text-surface-500 mb-1">Tanggal</p>
                   <p className="font-bold text-surface-900 dark:text-surface-100">01 Okt 2023</p>
                 </div>
               </div>
               
               <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
                 <p className="text-sm font-semibold mb-3">Rincian Barang</p>
                 <div className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                     <span>Roti Sisir Mentega (Original)</span>
                     <span className="font-bold">500 pcs</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span>Roti Coklat Lumer (Coklat)</span>
                     <span className="font-bold">200 pcs</span>
                   </div>
                 </div>
                 <div className="border-t border-surface-200 dark:border-surface-700 pt-3 mt-3 flex justify-between items-center">
                   <span className="font-bold text-surface-900 dark:text-surface-100">Total Pengeluaran</span>
                   <span className="font-bold text-lg text-primary-600 dark:text-primary-400">700 pcs</span>
                 </div>
               </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Kembali Edit</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Proses Distribusi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
