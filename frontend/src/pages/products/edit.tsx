import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

// Toast Kustom
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm max-w-sm ${
        type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <span className="text-lg mt-0.5">{type === "success" ? "✅" : "❌"}</span>
        <div className="flex-1">
          <p className="font-bold">{type === "success" ? "Berhasil!" : "Gagal!"}</p>
          <p className="text-xs mt-0.5 opacity-80">{message}</p>
        </div>
        <button onClick={onClose} className="text-lg font-bold opacity-50 hover:opacity-100">×</button>
      </div>
    </div>
  );
};

export const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    supplier_id: "",
    category: "",
    brand: "",
    base_production_price: "",
    base_sales_price: "",
    base_agent_price: "",
    is_active: 1,
    variants: [] as any[]
  });

  const [errors, setErrors] = useState<{
    name?: string;
    prices?: string;
    variants?: { [key: number]: string };
  }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Autocomplete data & Suppliers
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Fetch existing product data
  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      if (!res.ok) throw new Error("Produk tidak ditemukan");
      const data = await res.json();
      setFormData({
        name: data.name || "",
        supplier_id: data.supplier_id || "",
        category: data.category || "",
        brand: data.brand || "",
        base_production_price: String(data.base_production_price || ""),
        base_sales_price: String(data.base_sales_price || ""),
        base_agent_price: String(data.base_agent_price || ""),
        is_active: data.is_active ?? 1,
        variants: (data.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name || "",
          sku: v.sku || "",
          override_production_price: v.override_production_price != null ? String(v.override_production_price) : "",
          override_sales_price: v.override_sales_price != null ? String(v.override_sales_price) : "",
          override_agent_price: v.override_agent_price != null ? String(v.override_agent_price) : "",
        }))
      });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  // Fetch autocomplete & suppliers
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then((data: any[]) => {
        setExistingCategories(Array.from(new Set(data.map(p => p.category).filter(Boolean))));
        setExistingBrands(Array.from(new Set(data.map(p => p.brand).filter(Boolean))));
      })
      .catch(() => {});

    fetch(`${API_URL}/suppliers`)
      .then(r => r.json())
      .then((data: any[]) => {
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const handlePriceChange = (field: string, value: string) => {
    const rawValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [field]: rawValue });
    if (errors.prices) setErrors({ ...errors, prices: undefined });
  };

  const formatPrice = (value: string) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(Number(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = "Nama Produk Induk wajib diisi!";
    if (!formData.base_production_price || !formData.base_sales_price || !formData.base_agent_price) {
      newErrors.prices = "Semua Harga Dasar (Produksi, Sales, Agen) wajib diisi!";
    }
    const variantErrors: { [key: number]: string } = {};
    for (let i = 0; i < formData.variants.length; i++) {
      if (!formData.variants[i].name.trim()) variantErrors[i] = "Nama Varian wajib diisi!";
    }
    if (Object.keys(variantErrors).length > 0) newErrors.variants = variantErrors;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          supplier_id: formData.supplier_id || null,
          category: formData.category,
          brand: formData.brand,
          base_production_price: Number(formData.base_production_price),
          base_sales_price: Number(formData.base_sales_price),
          base_agent_price: Number(formData.base_agent_price),
          is_active: formData.is_active,
        })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setToast({ message: "Data produk berhasil diperbarui.", type: "success" });
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      setToast({ message: `Gagal menyimpan: ${err.message}`, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", sku: "", override_production_price: "", override_sales_price: "", override_agent_price: "" }]
    });
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    if (field.includes("price")) {
      newVariants[index][field] = value.replace(/\D/g, "");
    } else {
      newVariants[index][field] = value;
    }
    setFormData({ ...formData, variants: newVariants });
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Memuat data produk untuk diedit...</div>;

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm max-w-3xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Produk</h1>
          <p className="text-muted-foreground mt-1 text-sm">Perbarui informasi produk <strong>{formData.name}</strong>.</p>
        </div>
        <button
          onClick={() => navigate(`/products/${id}`)}
          className="px-5 py-2.5 border rounded-xl font-bold text-sm shadow-sm hover:bg-muted transition"
        >
          ← Kembali ke Detail
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Informasi Dasar */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-1 ${errors.name ? "text-red-600" : ""}`}>
                Nama Produk Induk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none ${errors.name ? "border-red-500 bg-red-50" : "bg-background"}`}
                placeholder="Contoh: Kopi Kapsul Premium"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><span>⚠️</span> {errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Supplier (Asal Produk)
              </label>
              <select 
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              >
                <option value="">Produksi Internal Sendiri</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Kategori Produk</label>
              <input type="text" list="cat-opt-edit" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Misal: Minuman" />
              <datalist id="cat-opt-edit">{existingCategories.map((c, i) => <option key={i} value={c} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Merek (Brand)</label>
              <input type="text" list="brand-opt-edit" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Misal: Nescafe" />
              <datalist id="brand-opt-edit">{existingBrands.map((b, i) => <option key={i} value={b} />)}</datalist>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border">
            <label className="text-sm font-semibold">Status Produk:</label>
            <button type="button" onClick={() => setFormData({ ...formData, is_active: formData.is_active ? 0 : 1 })}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${formData.is_active ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-600 border border-red-200"}`}>
              {formData.is_active ? "● Aktif" : "● Nonaktif"}
            </button>
            <span className="text-xs text-muted-foreground">(klik untuk mengubah)</span>
          </div>

          {/* Harga Dasar */}
          <div className="bg-muted/30 p-5 rounded-xl border space-y-4">
            <h4 className="font-semibold text-sm">Harga Dasar Produk</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["base_production_price", "base_agent_price", "base_sales_price"] as const).map((field) => {
                const labels: Record<string, string> = { base_production_price: "Harga Produksi", base_agent_price: "Harga Agen", base_sales_price: "Harga Sales" };
                return (
                  <div key={field}>
                    <label className={`block text-xs font-semibold mb-1 ${errors.prices ? "text-red-600" : ""}`}>{labels[field]} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium text-sm ${errors.prices ? "text-red-600" : "text-muted-foreground"}`}>Rp</span>
                      <input type="text" value={formatPrice(formData[field])} onChange={(e) => handlePriceChange(field, e.target.value)}
                        className={`w-full pl-9 p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-primary/50 outline-none ${errors.prices ? "border-red-500 bg-red-50" : "bg-background"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.prices && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><span>⚠️</span> {errors.prices}</p>}
          </div>
        </div>

        {/* Varian */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold text-base">Varian Produk</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Kelola varian ukuran, rasa, atau kemasan.</p>
            </div>
            <button type="button" onClick={addVariant} className="text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold hover:bg-primary/20 transition">+ Tambah Varian</button>
          </div>

          <div className="space-y-5">
            {formData.variants.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">Tidak ada varian.</p>
              </div>
            ) : (
              formData.variants.map((v, idx) => (
                <div key={idx} className="bg-background p-5 rounded-xl border shadow-sm relative">
                  <div className="absolute top-0 right-0 bg-red-50 hover:bg-red-100 rounded-bl-xl rounded-tr-xl border-b border-l transition">
                    <button type="button" onClick={() => { const nv = [...formData.variants]; nv.splice(idx, 1); setFormData({ ...formData, variants: nv }); }} className="px-3 py-1.5 text-red-600 font-bold text-xs">Hapus ✕</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-16 mb-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${errors.variants?.[idx] ? "text-red-600" : ""}`}>Nama Varian <span className="text-red-500">*</span></label>
                      <input type="text" value={v.name} onChange={(e) => { updateVariant(idx, "name", e.target.value); if (errors.variants?.[idx]) { const ne = { ...errors.variants }; delete ne[idx]; setErrors({ ...errors, variants: Object.keys(ne).length ? ne : undefined }); } }}
                        className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none ${errors.variants?.[idx] ? "border-red-500 bg-red-50" : ""}`} placeholder="Misal: 500gr" />
                      {errors.variants?.[idx] && <p className="text-red-500 text-xs mt-1.5 font-bold"><span>⚠️</span> {errors.variants[idx]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">SKU</label>
                      <input type="text" value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} className="w-full p-2.5 rounded-lg border outline-none" placeholder="Opsional" />
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <p className="text-[11px] font-semibold text-blue-800 mb-3 uppercase tracking-wider">Harga Khusus Varian (Override)</p>
                    <p className="text-xs text-blue-600/70 -mt-2 mb-3">Kosongkan jika sama dengan Harga Dasar.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(["override_production_price", "override_agent_price", "override_sales_price"] as const).map((pf) => {
                        const pl: Record<string, string> = { override_production_price: "Produksi", override_agent_price: "Agen", override_sales_price: "Sales" };
                        return (
                          <div key={pf}>
                            <label className="block text-xs font-semibold mb-1">{pl[pf]} (Khusus)</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">Rp</span>
                              <input type="text" value={formatPrice(v[pf])} onChange={(e) => updateVariant(idx, pf, e.target.value)} className="w-full pl-8 p-2 rounded border text-sm" placeholder="= Dasar" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end gap-4">
          <button type="button" onClick={() => navigate(`/products/${id}`)} className="px-6 py-3 border rounded-xl hover:bg-muted font-bold text-sm">Batal</button>
          <button type="submit" disabled={isSaving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition active:scale-[0.98] disabled:opacity-50">
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
};
