import { useTable } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Tags } from "lucide-react";

export const CategoryList = () => {
  const { tableQuery } = useTable({ resource: "product_categories" });
  const { data, isLoading } = tableQuery;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            Kategori Produk
          </h1>
          <p className="mt-1 text-surface-500">Kelola master data kategori</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <p className="text-surface-500">Memuat...</p>
          ) : (
             <ul className="space-y-2">
               {data?.data?.length === 0 && <p className="text-surface-500">Belum ada kategori</p>}
               {data?.data?.map(c => (
                 <li key={c.id} className="flex items-center gap-3 p-3 border border-surface-200 rounded-lg dark:border-surface-800">
                    <Tags className="h-5 w-5 text-primary-500" />
                    <span className="font-medium text-surface-900 dark:text-surface-100">{c.name}</span>
                 </li>
               ))}
             </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
