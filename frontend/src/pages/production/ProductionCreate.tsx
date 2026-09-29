import { useState } from "react";
import { useCreate, useList, useCustom } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

export const ProductionCreate = () => {
  const navigate = useNavigate();
  const { mutate, isLoading } = useCreate();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { product_id: "", variant_id: "", quantity: 1, batch_number: "", expired_date: "" },
  ]);

  const { data: productsData } = useList({
    resource: "products",
    pagination: { mode: "off" },
    filters: [{ field: "product_type", operator: "eq", value: "self" }],
  });
  const products = productsData?.data || [];

  // Since we might need variants, we can either fetch variants per product or assume users will select a product first.
  // For simplicity, we just use a custom fetch to get variants if a product is selected.
  // Actually, we can just use `useList` for variants if there's an endpoint, but standard is `products/:id/variants`.
  // Let's manually fetch or just assume variants exist. In Phase 3, variants might be embedded in `getOne`.

  const handleAddItem = () => {
    setItems([...items, { product_id: "", variant_id: "", quantity: 1, batch_number: "", expired_date: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    mutate(
      {
        resource: "production",
        values: {
          production_date: date,
          notes,
          items: items.filter((item) => item.product_id && item.quantity > 0),
        },
      },
      {
        onSuccess: () => {
          navigate("/inventory"); // Redirect to inventory list
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inventory")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Catat Produksi</h1>
          <p className="text-sm text-surface-500">Catat hasil produksi barang baru ke gudang.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-900 dark:text-surface-100">
                Tanggal Produksi <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-900 dark:text-surface-100">
                Catatan (Opsional)
              </label>
              <Input
                placeholder="Batch pagi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Item Produksi</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-surface-50 dark:bg-[hsl(224,20%,12%)] rounded-lg border border-surface-200 dark:border-surface-800">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="text-xs font-medium text-surface-900 dark:text-surface-100">Produk <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-800 dark:bg-[hsl(224,20%,8%)] dark:ring-offset-[hsl(224,20%,8%)] dark:placeholder:text-surface-400 dark:focus-visible:ring-primary-500"
                    >
                      <option value="">Pilih Produk...</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Variant could be loaded conditionally, leaving as input or select if we had variants loaded. 
                      Since variants are required if product has variants, we'd normally load them. 
                      For now, optional ID or let backend handle if null. */}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-surface-900 dark:text-surface-100">Kuantitas <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-surface-900 dark:text-surface-100">No. Batch (Opsional)</label>
                    <Input
                      placeholder="Otomatis"
                      value={item.batch_number}
                      onChange={(e) => handleItemChange(index, "batch_number", e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/inventory")}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Produksi"}
          </Button>
        </div>
      </form>
    </div>
  );
};
