import { useTable } from "@refinedev/core";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
    setFilters,
  } = useTable({
    resource: "inventory/balances",
    syncWithLocation: false, // Don't sync internal state with URL for this sub-resource
  });

  const balances = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters([
      {
        field: "search",
        operator: "eq",
        value: searchTerm,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Stok Gudang</h1>
          <p className="text-sm text-surface-500">Monitor stok barang di semua lokasi dan batch.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <Input
            placeholder="Cari produk atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </form>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => window.location.href = '/inventory/movements'}>
            Riwayat Mutasi
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Lokasi</th>
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
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                    Tidak ada stok ditemukan.
                  </td>
                </tr>
              ) : (
                balances.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-900 dark:text-surface-100">
                        {item.product_name}
                      </div>
                      {item.variant_name && (
                        <div className="text-xs text-surface-500">{item.variant_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                      {item.product_sku || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-200">
                        {item.batch_number || "Tanpa Batch"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-surface-600 dark:text-surface-400">
                        <MapPin className="mr-1.5 h-4 w-4" />
                        {item.location_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                        {item.quantity}
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
