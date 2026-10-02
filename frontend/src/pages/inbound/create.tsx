import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const InboundCreate = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_id: "",
    source_type: "internal",
    quantity: "",
    production_date: new Date().toISOString().split('T')[0],
    expired_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/inbound_batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity)
        })
      });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      navigate("/inbound_batches");
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data stok masuk.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catat Stok Masuk</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tambahkan stok baru ke dalam gudang utama.</p>
        </div>
        <button onClick={() => navigate("/inbound_batches")} className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition">
          Kembali
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1">Pilih Produk *</label>
          <select 
            required
            value={formData.product_id}
            onChange={e => setFormData({...formData, product_id: e.target.value})}
            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
          >
            <option value="" disabled>-- Pilih Produk --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-semibold mb-1">Sumber Stok</label>
            <select 
              value={formData.source_type}
              onChange={e => setFormData({...formData, source_type: e.target.value})}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
            >
              <option value="internal">Produksi Internal</option>
              <option value="supplier">Supplier Eksternal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Jumlah Masuk (Qty) *</label>
            <input 
              type="number" 
              required
              min="1"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              placeholder="Contoh: 100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-semibold mb-1">Tanggal Produksi *</label>
            <input 
              type="date" 
              required
              value={formData.production_date}
              onChange={e => setFormData({...formData, production_date: e.target.value})}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Tanggal Kedaluwarsa *</label>
            <input 
              type="date" 
              required
              value={formData.expired_date}
              onChange={e => setFormData({...formData, expired_date: e.target.value})}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
            />
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Stok Masuk"}
          </button>
        </div>
      </form>
    </div>
  );
};
