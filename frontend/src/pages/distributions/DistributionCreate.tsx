import { useState } from "react";
import { useCreate, useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, ArrowLeft, Info, PackageOpen } from "lucide-react";

export const DistributionCreate = () => {
  const navigate = useNavigate();
  const { mutate, isLoading } = useCreate();

  const [targetType, setTargetType] = useState("sales");
  const [targetId, setTargetId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { product_id: "", variant_id: "", batch_id: "", quantity: 1 },
  ]);

  const { data: salesData } = useList({
    resource: "sales",
    pagination: { mode: "off" },
  });
  const sales = salesData?.data || [];

  const { data: agentsData } = useList({
    resource: "agents",
    pagination: { mode: "off" },
  });
  const agents = agentsData?.data || [];

  const { data: productsData } = useList({
    resource: "products",
    pagination: { mode: "off" },
  });
  const products = productsData?.data || [];

  // Kita juga bisa fetch batch yang aktif jika perlu.

  const handleAddItem = () => {
    setItems([...items, { product_id: "", variant_id: "", batch_id: "", quantity: 1 }]);
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
        resource: "distributions",
        values: {
          type: targetType,
          target_id: targetId,
          distribution_date: date,
          notes,
          items: items.filter((item) => item.product_id && item.quantity > 0),
        },
      },
      {
        onSuccess: () => {
          navigate("/sales"); 
        },
        onError: (error) => {
          alert(error?.message || "Gagal membuat distribusi");
        }
      }
    );
  };

  const totalItemQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Distribusi Barang</h1>
          <p className="text-sm text-surface-500">Pindahkan stok dari gudang utama ke Sales atau Agen.</p>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 p-4 rounded-xl flex gap-3 text-sm border border-blue-200 dark:border-blue-800/50">
        <PackageOpen className="h-5 w-5 shrink-0" />
        <p>Dokumen distribusi awalnya berstatus <strong>Draft</strong>. Untuk memotong stok gudang, buka detail dokumen di menu yang relevan dan ubah status ke <strong>In Transit</strong> atau <strong>Completed</strong>.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tujuan Distribusi <span className="text-red-500">*</span></label>
              <select
                required
                value={targetType}
                onChange={(e) => { setTargetType(e.target.value); setTargetId(""); }}
                className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
              >
                <option value="sales">Sales (Mobil/Motor)</option>
                <option value="agent">Agen (Mitra)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih {targetType === 'sales' ? 'Sales' : 'Agen'} <span className="text-red-500">*</span></label>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
              >
                <option value="">Pilih...</option>
                {targetType === 'sales' ? (
                  sales.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)
                ) : (
                  agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal <span className="text-red-500">*</span></label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan</label>
              <Input
                placeholder="No. Polisi Kendaraan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Item Barang</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-surface-50 dark:bg-[hsl(224,20%,12%)] rounded-lg border border-surface-200 dark:border-surface-800">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1 sm:col-span-2 md:col-span-1">
                    <label className="text-xs font-medium">Produk <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                    >
                      <option value="">Pilih Produk...</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Batch ID (Opsional)</label>
                    <Input
                      placeholder="Pilih dari stok..."
                      value={item.batch_id}
                      onChange={(e) => handleItemChange(index, "batch_id", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Kuantitas <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-800">
            <div className="text-right">
              <p className="text-sm text-surface-500">Total Kuantitas: <span className="font-semibold text-surface-900 dark:text-surface-100">{totalItemQty}</span></p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/sales")}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Buat Distribusi"}
          </Button>
        </div>
      </form>
    </div>
  );
};
