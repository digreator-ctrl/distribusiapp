import { useState } from "react";
import { useCreate, useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, ArrowLeft, Info, AlertTriangle } from "lucide-react";

export const ReturnCreate = () => {
  const navigate = useNavigate();
  const { mutate, isLoading } = useCreate();

  const [sourceType, setSourceType] = useState("store");
  const [sourceId, setSourceId] = useState("");
  const [returnType, setReturnType] = useState("expired");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  
  const [items, setItems] = useState<any[]>([
    { product_id: "", variant_id: "", batch_id: "", quantity: 1, condition: "expired", replacement_quantity: 0 },
  ]);

  const { data: storesData } = useList({ resource: "stores", pagination: { mode: "off" } });
  const { data: salesData } = useList({ resource: "sales", pagination: { mode: "off" } });
  const { data: agentsData } = useList({ resource: "agents", pagination: { mode: "off" } });
  const { data: productsData } = useList({ resource: "products", pagination: { mode: "off" } });
  
  const stores = storesData?.data || [];
  const sales = salesData?.data || [];
  const agents = agentsData?.data || [];
  const products = productsData?.data || [];

  const handleAddItem = () => {
    setItems([...items, { product_id: "", variant_id: "", batch_id: "", quantity: 1, condition: "expired", replacement_quantity: 0 }]);
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
    
    if (!sourceId && sourceType !== 'warehouse') {
      alert("Silakan pilih sumber retur (Toko/Sales/Agen)");
      return;
    }

    mutate(
      {
        resource: "returns",
        values: {
          source_type: sourceType,
          source_id: sourceId || null,
          return_type: returnType,
          return_date: date,
          notes,
          items: items.filter((item) => item.product_id && item.quantity > 0),
        },
      },
      {
        onSuccess: () => {
          navigate("/returns"); 
        },
        onError: (error) => {
          alert(error?.message || "Gagal membuat pengajuan retur");
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/returns")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pengajuan Retur Barang</h1>
          <p className="text-sm text-surface-500">Ajukan pengembalian barang karena rusak, cacat, atau kedaluwarsa.</p>
        </div>
      </div>

      <div className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 p-4 rounded-xl flex gap-3 text-sm border border-yellow-200 dark:border-yellow-800/50">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>Pengajuan retur memerlukan verifikasi/approval. Stok barang belum akan dipotong hingga status retur disetujui dan diselesaikan (Completed) oleh Admin/Gudang.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 border-b border-surface-200 dark:border-surface-800 pb-2">Informasi Retur</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Alasan Retur Utama <span className="text-red-500">*</span></label>
                <select
                  required
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                >
                  <option value="expired">Barang Kedaluwarsa (Expired)</option>
                  <option value="shipping_damage">Kerusakan saat Pengiriman</option>
                  <option value="production_defect">Cacat Produksi / Pabrik</option>
                  <option value="display_damage">Kerusakan Display / Pemakaian</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Pengajuan <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 border-b border-surface-200 dark:border-surface-800 pb-2">Sumber Barang</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Asal Retur <span className="text-red-500">*</span></label>
                <select
                  required
                  value={sourceType}
                  onChange={(e) => { setSourceType(e.target.value); setSourceId(""); }}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                >
                  <option value="store">Dari Toko</option>
                  <option value="sales">Dari Mobil Sales</option>
                  <option value="agent">Dari Agen</option>
                  <option value="warehouse">Internal Gudang</option>
                </select>
              </div>
              
              {sourceType !== 'warehouse' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih {sourceType === 'store' ? 'Toko' : sourceType === 'sales' ? 'Sales' : 'Agen'} <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                  >
                    <option value="">Pilih...</option>
                    {sourceType === 'store' && stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {sourceType === 'sales' && sales.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {sourceType === 'agent' && agents.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Keterangan Tambahan</label>
            <Input
              placeholder="Catatan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Daftar Barang Retur</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-start p-4 bg-surface-50 dark:bg-[hsl(224,20%,12%)] rounded-lg border border-surface-200 dark:border-surface-800">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
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
                    <label className="text-xs font-medium text-red-600 dark:text-red-400">Jml Retur (Tarik) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                      className="border-red-300 focus-visible:ring-red-500 dark:border-red-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Kondisi</label>
                    <select
                      required
                      value={item.condition}
                      onChange={(e) => handleItemChange(index, "condition", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                    >
                      <option value="expired">Kedaluwarsa</option>
                      <option value="damaged">Rusak Fisik / Hancur</option>
                      <option value="defect">Cacat Produksi</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-blue-600 dark:text-blue-400">Ganti Baru (Tukar)</label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={item.replacement_quantity}
                      onChange={(e) => handleItemChange(index, "replacement_quantity", Number(e.target.value))}
                      className="border-blue-300 focus-visible:ring-blue-500 dark:border-blue-800"
                      title="Jumlah barang baru yang diberikan ke pihak yang meretur"
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
          
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/returns")}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary-600 hover:bg-primary-700 text-white">
            {isLoading ? "Mengajukan..." : "Ajukan Retur"}
          </Button>
        </div>
      </form>
    </div>
  );
};
