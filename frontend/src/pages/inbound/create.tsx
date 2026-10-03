import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { useInvalidate } from "@refinedev/core";

const API_URL = "http://localhost:8787/api";

export const InboundCreate = () => {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_id: "",
    source_type: "internal",
    quantity: "",
    production_date: new Date().toISOString().split('T')[0],
    expired_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.production_date) newErrors.production_date = "Tanggal Stok Masuk wajib diisi";
    if (!formData.product_id) newErrors.product_id = "Produk wajib dipilih";
    if (!formData.quantity) newErrors.quantity = "Jumlah Stok wajib diisi";
    if (!formData.expired_date) newErrors.expired_date = "Tanggal Kedaluwarsa wajib diisi";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError("Mohon periksa kembali form Anda. Ada kolom wajib yang belum diisi.");
      return;
    }

    setErrors({});
    setGlobalError("");
    setIsSubmitting(true);
    try {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      const sourceType = selectedProduct?.supplier_id ? "rekanan" : "internal";

      const res = await fetch(`${API_URL}/inbound_batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source_type: sourceType,
          quantity: Number(formData.quantity.replace(/\D/g, ""))
        })
      });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      
      invalidate({
        resource: "inbound_batches",
        invalidates: ["list"],
      });
      
      navigate("/inbound_batches", { state: { successMessage: "Berhasil mencatat stok masuk!" } });
    } catch (err) {
      setGlobalError("Terjadi kesalahan saat menyimpan data stok masuk.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      if ('showPicker' in e.currentTarget) {
        (e.currentTarget as any).showPicker();
      }
    } catch (err) {
      // ignore
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

      {globalError && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 shadow-xl max-w-sm w-full">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Terdapat Kesalahan</h3>
            <p className="text-sm text-red-700 mt-1">{globalError}</p>
          </div>
          <button type="button" onClick={() => setGlobalError("")} className="text-red-500 hover:text-red-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1">Tanggal Stok Masuk *</label>
          <input 
            type="date" 
            value={formData.production_date}
            onClick={handleDateClick}
            onChange={e => {
              setFormData({...formData, production_date: e.target.value});
              if (e.target.value) setErrors(prev => ({...prev, production_date: ""}));
            }}
            className={`w-full p-3 rounded-lg border focus:ring-2 outline-none bg-background transition ${
              errors.production_date ? 'border-red-500 focus:ring-red-500/50' : 'focus:ring-primary/50'
            }`}
          />
          {errors.production_date && <p className="text-red-500 text-xs mt-1">{errors.production_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Pilih Produk *</label>
          <select 
            value={formData.product_id}
            onChange={e => {
              setFormData({...formData, product_id: e.target.value});
              if (e.target.value) setErrors(prev => ({...prev, product_id: ""}));
            }}
            className={`w-full p-3 rounded-lg border focus:ring-2 outline-none bg-background transition ${
              errors.product_id ? 'border-red-500 focus:ring-red-500/50' : 'focus:ring-primary/50'
            }`}
          >
            <option value="" disabled>-- Pilih Produk --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.category ? `- ${p.category} ` : ''}- {p.supplier_name || 'Internal'}
              </option>
            ))}
          </select>
          {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Jumlah Stok (Qty) *</label>
          <input 
            type="text" 
            value={formData.quantity}
            onChange={e => {
              const numericValue = e.target.value.replace(/\D/g, "");
              if (!numericValue) {
                setFormData({...formData, quantity: ""});
                return;
              }
              const formattedValue = new Intl.NumberFormat("id-ID").format(Number(numericValue));
              setFormData({...formData, quantity: formattedValue});
              setErrors(prev => ({...prev, quantity: ""}));
            }}
            className={`w-full p-3 rounded-lg border focus:ring-2 outline-none bg-background transition ${
              errors.quantity ? 'border-red-500 focus:ring-red-500/50' : 'focus:ring-primary/50'
            }`}
            placeholder="Contoh: 1.000"
          />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Tanggal Kedaluwarsa *</label>
          <input 
            type="date" 
            value={formData.expired_date}
            onClick={handleDateClick}
            onChange={e => {
              setFormData({...formData, expired_date: e.target.value});
              if (e.target.value) setErrors(prev => ({...prev, expired_date: ""}));
            }}
            className={`w-full p-3 rounded-lg border focus:ring-2 outline-none bg-background transition ${
              errors.expired_date ? 'border-red-500 focus:ring-red-500/50' : 'focus:ring-primary/50'
            }`}
          />
          {errors.expired_date && <p className="text-red-500 text-xs mt-1">{errors.expired_date}</p>}
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

