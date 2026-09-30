import { useTable, useCreate, useDelete } from "@refinedev/core";
import { Plus, Search, Trash2, UserCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Link } from "react-router-dom";

export const SalesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSales, setNewSales] = useState({ name: "", phone: "", area: "", sales_code: "" });

  const {
    tableQuery: { data, isLoading, refetch },
    currentPage,
    setCurrentPage,
    pageCount,
    setFilters,
  } = useTable({
    resource: "sales",
    syncWithLocation: false,
  });

  const { mutate: deleteSales } = useDelete();
  const { mutate: createSales, isLoading: isCreating } = useCreate();

  const sales = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters([{ field: "search", operator: "eq", value: searchTerm }]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSales(
      { resource: "sales", values: newSales },
      { 
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewSales({ name: "", phone: "", area: "", sales_code: "" });
          refetch();
        } 
      }
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Daftar Sales</h1>
          <p className="text-sm text-surface-500">Kelola tenaga penjual dan area kerjanya.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/distributions/create">
            <Button variant="outline">
              Distribusi Barang
            </Button>
          </Link>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Sales
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <Input
            placeholder="Cari nama atau kode sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </form>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Sales</th>
                <th className="px-6 py-4">Area / Kontak</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Memuat data...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Tidak ada sales ditemukan.</td>
                </tr>
              ) : (
                sales.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">{item.sales_code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full text-primary-600 dark:text-primary-400">
                          <UserCircle className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-surface-900 dark:text-surface-100">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-surface-900 dark:text-surface-100">
                        <MapPin className="h-3 w-3 text-surface-400" /> {item.area || "-"}
                      </div>
                      <div className="text-xs text-surface-500 mt-1">{item.phone || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                        item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => {
                          if (window.confirm("Hapus sales ini?")) {
                            deleteSales({ resource: "sales", id: item.id }, { onSuccess: () => refetch() });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Sebelumnya</Button>
            <span className="text-sm text-surface-600 dark:text-surface-400">Halaman {currentPage} dari {pageCount}</span>
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setCurrentPage(currentPage + 1)}>Selanjutnya</Button>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Tambah Sales Baru</h2>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Sales <span className="text-red-500">*</span></label>
                <Input required value={newSales.name} onChange={(e) => setNewSales({...newSales, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Area Kerja</label>
                <Input placeholder="Contoh: Jakarta Selatan" value={newSales.area} onChange={(e) => setNewSales({...newSales, area: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. Telepon</label>
                <Input value={newSales.phone} onChange={(e) => setNewSales({...newSales, phone: e.target.value})} />
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isCreating}>{isCreating ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
