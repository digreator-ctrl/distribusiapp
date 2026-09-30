import { useTable, useCreate, useDelete } from "@refinedev/core";
import { Plus, Search, Trash2, Store as StoreIcon, MapPin, Navigation, Eye } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Link } from "react-router-dom";

export const StoreList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStore, setNewStore] = useState({ name: "", owner_name: "", phone: "", address: "", type: "retail" });

  const {
    tableQuery: { data, isLoading, refetch },
    currentPage,
    setCurrentPage,
    pageCount,
    setFilters,
  } = useTable({
    resource: "stores",
    syncWithLocation: false,
  });

  const { mutate: deleteStore } = useDelete();
  const { mutate: createStore, isLoading: isCreating } = useCreate();

  const stores = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters([{ field: "search", operator: "eq", value: searchTerm }]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createStore(
      { resource: "stores", values: newStore },
      { 
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewStore({ name: "", owner_name: "", phone: "", address: "", type: "retail" });
          refetch();
        } 
      }
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Daftar Toko</h1>
          <p className="text-sm text-surface-500">Manajemen data toko / outlet konsinyasi.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Toko
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <Input
            placeholder="Cari nama toko..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-surface-500">Memuat data...</div>
        ) : stores.length === 0 ? (
          <div className="col-span-full py-8 text-center text-surface-500">Tidak ada toko ditemukan.</div>
        ) : (
          stores.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-[hsl(224,20%,10%)] p-5 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                    <StoreIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-surface-100 line-clamp-1">{item.name}</h3>
                    <span className="text-xs text-surface-500 font-medium">{item.store_code} • {item.type}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium capitalize ${
                  item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-surface-400" />
                  <span className="line-clamp-2">{item.address || "Alamat belum diatur"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Pemilik:</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100">{item.owner_name || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Telepon:</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100">{item.phone || "-"}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-surface-100 dark:border-surface-800">
                <div className="flex gap-2">
                  <Link to={`/stores/${item.id}`}>
                    <Button variant="outline" size="sm" className="h-8">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Stok
                    </Button>
                  </Link>
                  {item.latitude && item.longitude && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50">
                      <Navigation className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    if (window.confirm("Hapus toko ini?")) {
                      deleteStore({ resource: "stores", id: item.id }, { onSuccess: () => refetch() });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-4 bg-white dark:bg-[hsl(224,20%,10%)] px-4 py-2 rounded-full border border-surface-200 dark:border-surface-800">
            <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
            <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{currentPage} / {pageCount}</span>
            <Button variant="ghost" size="sm" disabled={currentPage === pageCount} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Pendaftaran Toko Baru</h2>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Toko <span className="text-red-500">*</span></label>
                <Input required value={newStore.name} onChange={(e) => setNewStore({...newStore, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Toko</label>
                <select
                  value={newStore.type}
                  onChange={(e) => setNewStore({...newStore, type: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                >
                  <option value="retail">Retail / Eceran</option>
                  <option value="wholesale">Grosir</option>
                  <option value="minimarket">Minimarket</option>
                  <option value="supermarket">Supermarket</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Pemilik</label>
                  <Input value={newStore.owner_name} onChange={(e) => setNewStore({...newStore, owner_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">No. Telepon</label>
                  <Input value={newStore.phone} onChange={(e) => setNewStore({...newStore, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input value={newStore.address} onChange={(e) => setNewStore({...newStore, address: e.target.value})} />
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
