import { useState } from "react";
import { useCreate, useList } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, ArrowLeft, Info } from "lucide-react";

export const AgentOrderCreate = () => {
  const navigate = useNavigate();
  const { mutate, isLoading } = useCreate();

  const [agentId, setAgentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { product_id: "", variant_id: "", quantity: 1, price: 0 },
  ]);

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

  const handleAddItem = () => {
    setItems([...items, { product_id: "", variant_id: "", quantity: 1, price: 0 }]);
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
        resource: "agent_orders",
        values: {
          agent_id: agentId,
          order_date: date,
          notes,
          items: items.filter((item) => item.product_id && item.quantity > 0),
        },
      },
      {
        onSuccess: () => {
          navigate("/agent-orders"); 
        },
        onError: (error) => {
          alert(error?.message || "Gagal membuat pesanan");
        }
      }
    );
  };

  const totalItemQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agent-orders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Buat Pesanan Agen</h1>
          <p className="text-sm text-surface-500">Catat pesanan barang dari agen.</p>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 p-4 rounded-xl flex gap-3 text-sm border border-blue-200 dark:border-blue-800/50">
        <Info className="h-5 w-5 shrink-0" />
        <p>Pastikan total kuantitas barang memenuhi <strong>Minimum Order Quantity (MOQ)</strong> yang berlaku untuk agen terpilih. Jika tidak, pesanan akan ditolak oleh sistem.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Agen <span className="text-red-500">*</span></label>
              <select
                required
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
              >
                <option value="">Pilih Agen...</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Pesanan <span className="text-red-500">*</span></label>
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
                placeholder="Pesanan reguler..."
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
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-1 sm:col-span-2">
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
                    <label className="text-xs font-medium">Kuantitas <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Harga Satuan</label>
                    <Input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
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
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">Total: Rp {totalAmount.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/agent-orders")}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Buat Pesanan"}
          </Button>
        </div>
      </form>
    </div>
  );
};
