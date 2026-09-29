import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const ProductCreate = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
          Tambah Produk Baru
        </h1>
        <p className="mt-1 text-surface-500">
          Form placeholder untuk penambahan produk dan varian (Task 3.8)
        </p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Informasi Produk</CardTitle>
           <CardDescription>Bagian ini akan berisi form nama, SKU, kategori, dll.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="p-8 text-center border-2 border-dashed border-surface-200 rounded-lg dark:border-surface-800">
              <p className="text-surface-500">Form UI Placeholder</p>
           </div>
           
           <div className="mt-4 flex justify-end gap-2">
             <Button variant="outline">Batal</Button>
             <Button>Simpan Produk</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};
