import { useTable } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export const ProductList = () => {
  const [search, setSearch] = useState("");
  
  const { tableQueryResult, current, setCurrent, pageSize, setPageSize, setFilters } = useTable({
    resource: "products",
    pagination: { current: 1, pageSize: 10 },
  });
  
  const { data, isLoading } = tableQueryResult;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setFilters([
      { field: "search", operator: "eq", value }
    ]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            Produk
          </h1>
          <p className="mt-1 text-surface-500">
            Kelola master data produk dan variannya
          </p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
           <CardTitle>Daftar Produk</CardTitle>
           <div className="relative max-w-sm w-full sm:w-auto">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-surface-500" />
             <Input 
                placeholder="Cari nama atau SKU..." 
                className="pl-9" 
                value={search}
                onChange={handleSearch}
             />
           </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-surface-200 dark:border-surface-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-surface-900 dark:bg-surface-800 dark:text-surface-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-surface-500">Memuat data...</td></tr>
                ) : data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-surface-500">
                          <Package className="h-10 w-10 mb-2 opacity-50" />
                          <p>Belum ada data produk</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((product: any) => (
                    <tr key={product.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                            <Package className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-surface-900 dark:text-surface-100">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-500">{product.sku}</td>
                      <td className="px-4 py-3 text-surface-500">{product.category_name || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-surface-500 hover:text-primary-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-surface-500 hover:text-red-600">
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
          
          <div className="mt-4 flex items-center justify-between">
             <span className="text-sm text-surface-500">Total {data?.total || 0} produk</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrent((p) => Math.max(1, p - 1))} disabled={current === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrent((p) => p + 1)} disabled={data?.data?.length < pageSize}>Next</Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
