import { useTable } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Truck } from "lucide-react";

export const SupplierList = () => {
  const { tableQueryResult } = useTable({ resource: "suppliers" });
  const { data, isLoading } = tableQueryResult;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            Rekanan / Supplier
          </h1>
          <p className="mt-1 text-surface-500">Kelola master data rekanan</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Tambah Rekanan
        </Button>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Daftar Rekanan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <p className="text-surface-500">Memuat...</p>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {data?.data?.length === 0 && <p className="text-surface-500">Belum ada rekanan</p>}
               {data?.data?.map(s => (
                 <div key={s.id} className="p-4 border border-surface-200 rounded-lg dark:border-surface-800 flex gap-4">
                    <div className="h-10 w-10 shrink-0 bg-sage-100 text-sage-600 rounded-lg flex items-center justify-center">
                       <Truck className="h-5 w-5" />
                    </div>
                    <div>
                       <h3 className="font-medium text-surface-900 dark:text-surface-100">{s.name}</h3>
                       <p className="text-sm text-surface-500">{s.contact_person || '-'}</p>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
