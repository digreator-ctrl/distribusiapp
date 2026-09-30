import { useTable, useCreate, useDelete } from "@refinedev/core";
import { Plus, Search, Trash2, LayoutGrid, Eye } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Link } from "react-router-dom";

export const DisplayList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDisplay, setNewDisplay] = useState({ name: "", type: "", capacity: 0, condition: "good" });

  const {
    tableQuery: { data, isLoading, refetch },
    currentPage,
    setCurrentPage,
    pageCount,
    setFilters,
  } = useTable({
    resource: "displays",
    syncWithLocation: false,
  });

  const { mutate: deleteDisplay } = useDelete();
  const { mutate: createDisplay, isLoading: isCreating } = useCreate();

  const displays = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters([{ field: "search", operator: "eq", value: searchTerm }]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDisplay(
      { resource: "displays", values: newDisplay },
      { 
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewDisplay({ name: "", type: "", capacity: 0, condition: "good" });
          refetch();
        } 
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Daftar Display & Wadah</h1>
          <p className="text-sm text-surface-500">Kelola inventaris wadah/showcase dan lokasinya.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Display
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <Input
            placeholder="Cari kode atau nama display..."
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
                <th className="px-6 py-4">Display</th>
                <th className="px-6 py-4">Tipe & Kapasitas</th>
                <th className="px-6 py-4">Kondisi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Memuat data...</td>
                </tr>
              ) : displays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Tidak ada display ditemukan.</td>
                </tr>
              ) : (
                displays.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                          <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-medium text-surface-900 dark:text-surface-100">{item.name}</span>
                          <div className="text-xs text-surface-500">{item.display_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                      {item.type || "-"} / {item.capacity ? `${item.capacity} item` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                        item.condition === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                        item.status === 'available' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                        item.status === 'in_use' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/displays/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" /> Detail
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => {
                            if (window.confirm("Hapus display ini?")) {
                              deleteDisplay({ resource: "displays", id: item.id }, { onSuccess: () => refetch() });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Tambah Display Baru</h2>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Display <span className="text-red-500">*</span></label>
                <Input required value={newDisplay.name} onChange={(e) => setNewDisplay({...newDisplay, name: e.target.value})} placeholder="Contoh: Showcase Chiller 2 Pintu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe / Jenis</label>
                  <Input value={newDisplay.type} onChange={(e) => setNewDisplay({...newDisplay, type: e.target.value})} placeholder="Contoh: Rak, Kulkas" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kapasitas</label>
                  <Input type="number" value={newDisplay.capacity} onChange={(e) => setNewDisplay({...newDisplay, capacity: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kondisi</label>
                <select
                  value={newDisplay.condition}
                  onChange={(e) => setNewDisplay({...newDisplay, condition: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                >
                  <option value="good">Baik (Good)</option>
                  <option value="fair">Cukup (Fair)</option>
                  <option value="damaged">Rusak (Damaged)</option>
                  <option value="broken">Hancur (Broken)</option>
                </select>
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
