import { useState } from "react";
import { useShow, useCustomMutation, useList } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, LayoutGrid, MapPin, Navigation, Tag, LogOut, Download } from "lucide-react";

export const DisplayShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { queryResult, refetch } = useShow({
    resource: "displays",
    id,
  });

  const { mutate: customMutate, isLoading: isMutating } = useCustomMutation();

  const display = queryResult.data?.data;
  const assignment = display?.active_assignment;
  const items = display?.items || [];

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetType, setTargetType] = useState("store");
  const [targetId, setTargetId] = useState("");

  const { data: salesData } = useList({ resource: "sales", pagination: { mode: "off" } });
  const { data: storesData } = useList({ resource: "stores", pagination: { mode: "off" } });
  
  const salesList = salesData?.data || [];
  const storeList = storesData?.data || [];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    customMutate({
      url: `/api/displays/${id}/assign`,
      method: "post",
      values: {
        sales_id: targetType === "sales" ? targetId : null,
        store_id: targetType === "store" ? targetId : null,
      }
    }, {
      onSuccess: () => {
        setIsAssignModalOpen(false);
        setTargetId("");
        refetch();
      }
    });
  };

  const handleRelease = () => {
    if (!window.confirm("Tarik kembali display ini ke gudang/available?")) return;
    
    customMutate({
      url: `/api/displays/${id}/release`,
      method: "post",
      values: {}
    }, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  if (queryResult.isLoading) return <div className="p-4">Memuat data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/displays")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{display?.name}</h1>
          <p className="text-sm text-surface-500">Kode: {display?.display_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-200 dark:border-surface-800 pb-2">Informasi Display</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-surface-500">Tipe / Jenis</span>
                <span className="font-medium text-surface-900 dark:text-surface-100">{display?.type || "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-surface-500">Kapasitas</span>
                <span className="font-medium text-surface-900 dark:text-surface-100">{display?.capacity ? `${display.capacity} item` : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-surface-500">Kondisi Fisik</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                  display?.condition === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {display?.condition}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-surface-500">Status Tersedia</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                  display?.status === 'available' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                  display?.status === 'in_use' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {display?.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-200 dark:border-surface-800 pb-2">Penempatan Aktif</h2>
            
            {assignment ? (
              <div className="space-y-4">
                <div className="bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-300 p-4 rounded-lg flex gap-3">
                  <MapPin className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-500 dark:text-purple-400 mb-1">
                      Saat ini di {assignment.store_id ? 'Toko' : 'Sales'}
                    </p>
                    <p className="font-bold">{assignment.store_id ? assignment.store_name : assignment.sales_name}</p>
                    <p className="text-xs mt-1 opacity-80">Sejak: {new Date(assignment.assigned_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="w-full bg-surface-100 text-surface-800 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    <Navigation className="h-4 w-4 mr-2" /> Pindah Lokasi
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={handleRelease}
                    disabled={isMutating}
                  >
                    <Download className="h-4 w-4 mr-2" /> Tarik Display
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <LayoutGrid className="h-10 w-10 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                <p className="text-sm text-surface-500 mb-4">Display ini sedang tidak digunakan (berada di gudang).</p>
                <Button onClick={() => setIsAssignModalOpen(true)} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" /> Tugaskan / Kirim
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-[hsl(224,20%,12%)]">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Produk Dalam Display</h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white dark:bg-[hsl(224,20%,10%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Varian</th>
                    <th className="px-4 py-3 text-right">Kuantitas Standar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800 bg-white dark:bg-[hsl(224,20%,10%)]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-surface-500">Belum ada daftar produk untuk wadah ini.</td>
                    </tr>
                  ) : (
                    items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                        <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-100">{item.product_name}</td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{item.variant_name}</td>
                        <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {assignment ? "Pindah Lokasi Display" : "Penempatan Display Baru"}
              </h2>
            </div>
            <form onSubmit={handleAssign} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempatkan di</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={targetType === 'store'} onChange={() => { setTargetType('store'); setTargetId(""); }} /> Toko
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={targetType === 'sales'} onChange={() => { setTargetType('sales'); setTargetId(""); }} /> Sales (Mobil)
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih {targetType === 'store' ? 'Toko' : 'Sales'}</label>
                <select
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                >
                  <option value="">Pilih...</option>
                  {targetType === 'store' 
                    ? storeList.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.address}</option>)
                    : salesList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isMutating}>{isMutating ? "Menyimpan..." : "Simpan & Tempatkan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
