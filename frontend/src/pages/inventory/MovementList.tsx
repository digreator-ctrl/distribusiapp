import { useTable } from "@refinedev/core";
import { ArrowRightLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const MovementList = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
  } = useTable({
    resource: "inventory/movements",
    syncWithLocation: false,
  });

  const movements = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/inventory'}>
          <ArrowRightLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Mutasi Stok</h1>
          <p className="text-sm text-surface-500">Riwayat pergerakan stok keluar masuk barang.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4">Waktu & Tipe</th>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Pergerakan</th>
                <th className="px-6 py-4">Pelaku</th>
                <th className="px-6 py-4 text-right">Kuantitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                    Memuat data...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                    Tidak ada riwayat pergerakan stok.
                  </td>
                </tr>
              ) : (
                movements.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center text-surface-900 dark:text-surface-100 mb-1">
                        <Calendar className="mr-1.5 h-4 w-4 text-surface-400" />
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-200 capitalize">
                        {item.type} • {item.reference_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-900 dark:text-surface-100">
                        {item.product_name}
                      </div>
                      {item.variant_name && (
                        <div className="text-xs text-surface-500">{item.variant_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                        <span className="truncate max-w-[100px]">{item.from_location || "Luar"}</span>
                        <ArrowRightLeft className="h-4 w-4 text-surface-400 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{item.to_location || "Luar"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-surface-600 dark:text-surface-400">
                        <User className="mr-1.5 h-4 w-4" />
                        {item.actor_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border ${
                        item.type === 'IN' 
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' 
                          : item.type === 'OUT'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
                      }`}>
                        {item.type === 'IN' ? '+' : item.type === 'OUT' ? '-' : ''}{item.quantity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 1}
              onClick={() => setCurrent(current - 1)}
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-surface-600 dark:text-surface-400">
              Halaman {current} dari {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current === pageCount}
              onClick={() => setCurrent(current + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
