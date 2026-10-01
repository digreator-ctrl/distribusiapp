import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

// ============================================================
// Komponen Toast Kustom (Bawaan Web, bukan alert bawaan browser)
// ============================================================
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm max-w-sm ${
        type === "success" 
          ? "bg-green-50 border-green-200 text-green-800" 
          : "bg-red-50 border-red-200 text-red-800"
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

export const ProductCreate = () => {
  const navigate = useNavigate();

  // State produk yang sudah ada (untuk autocomplete Kategori & Merk)
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [existingBrands, setExistingBrands] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then((data: any[]) => {
        setExistingCategories(Array.from(new Set(data.map(p => p.category).filter(Boolean))));
        setExistingBrands(Array.from(new Set(data.map(p => p.brand).filter(Boolean))));
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({ 
    name: "", 
    category: "",
    brand: "",
    base_production_price: "", 
    base_sales_price: "", 
    base_agent_price: "",
    variants: [] as any[]
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    prices?: string;
    variants?: {[key: number]: string};
  }>({});

  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    
    // Validasi Manual Inline
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = "Nama Produk Induk wajib diisi!";
    if (!formData.base_production_price || !formData.base_sales_price || !formData.base_agent_price) {
      newErrors.prices = "Semua Harga Dasar (Produksi, Sales, Agen) wajib diisi!";
    }
    
    const variantErrors: {[key: number]: string} = {};
    for (let i = 0; i < formData.variants.length; i++) {
      if (!formData.variants[i].name.trim()) {
        variantErrors[i] = "Nama Varian wajib diisi!";
      }
    }
    if (Object.keys(variantErrors).length > 0) newErrors.variants = variantErrors;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Map variants
    const mappedVariants = formData.variants.map(v => ({
      name: v.name,
      sku: v.sku,
      override_production_price: v.override_production_price ? Number(v.override_production_price) : null,
      override_sales_price: v.override_sales_price ? Number(v.override_sales_price) : null,
      override_agent_price: v.override_agent_price ? Number(v.override_agent_price) : null,
    }));

    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          brand: formData.brand,
          base_production_price: Number(formData.base_production_price),
          base_sales_price: Number(formData.base_sales_price),
          base_agent_price: Number(formData.base_agent_price),
          variants: mappedVariants
        })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setToast({ message: "Data produk beserta variannya telah tersimpan ke dalam sistem.", type: "success" });
      
      // Tunggu sebentar agar user bisa melihat toast, lalu redirect
      setTimeout(() => {
        navigate("/products");
      }, 1500);
    } catch (err: any) {
      setToast({ message: `Gagal menyimpan: ${err.message}`, type: "error" });
    } finally {
      setIsCreating(false);
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
    if (field.includes('price')) {
      newVariants[index][field] = value.replace(/\D/g, "");
    } else {
      newVariants[index][field] = value;
    }
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm max-w-3xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Produk Baru</h1>
          <p className="text-muted-foreground mt-1 text-sm">Masukkan informasi dasar produk beserta varian (jika ada).</p>
        </div>
        <button 
          onClick={() => navigate("/products")}
          className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition"
        >
          Kembali
        </button>
      </div>
      
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Bagian Informasi Dasar */}
        <div className="space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-1 ${errors.name ? 'text-red-600' : ''}`}>
              Nama Produk Induk <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: undefined});
              }}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none ${errors.name ? 'border-red-500 bg-red-50' : 'bg-background'}`} 
              placeholder="Contoh: Kopi Kapsul Premium"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><span>⚠️</span> {errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Kategori Produk</label>
              <input 
                type="text" 
                list="category-options"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                placeholder="Misal: Minuman, Makanan Ringan"
              />
              <datalist id="category-options">
                {existingCategories.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Merek (Brand)</label>
              <input 
                type="text" 
                list="brand-options"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                placeholder="Misal: Nescafe, Indomie"
              />
              <datalist id="brand-options">
                {existingBrands.map((brand, idx) => (
                  <option key={idx} value={brand} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div className="bg-muted/30 p-5 rounded-xl border space-y-4">
            <h4 className="font-semibold text-sm">Harga Dasar Produk</h4>
            <p className="text-xs text-muted-foreground -mt-2 mb-3">Harga ini akan digunakan sebagai harga utama jika varian tidak menentukan harga khususnya sendiri.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${errors.prices ? 'text-red-600' : ''}`}>
                  Harga Produksi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium text-sm ${errors.prices ? 'text-red-600' : 'text-muted-foreground'}`}>Rp</span>
                  <input 
                    type="text" 
                    value={formatPrice(formData.base_production_price)}
                    onChange={(e) => handlePriceChange('base_production_price', e.target.value)}
                    className={`w-full pl-9 p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-primary/50 outline-none ${errors.prices ? 'border-red-500 bg-red-50' : 'bg-background'}`} 
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${errors.prices ? 'text-red-600' : ''}`}>
                  Harga Sales <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium text-sm ${errors.prices ? 'text-red-600' : 'text-muted-foreground'}`}>Rp</span>
                  <input 
                    type="text" 
                    value={formatPrice(formData.base_sales_price)}
                    onChange={(e) => handlePriceChange('base_sales_price', e.target.value)}
                    className={`w-full pl-9 p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-primary/50 outline-none ${errors.prices ? 'border-red-500 bg-red-50' : 'bg-background'}`} 
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${errors.prices ? 'text-red-600' : ''}`}>
                  Harga Agen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium text-sm ${errors.prices ? 'text-red-600' : 'text-muted-foreground'}`}>Rp</span>
                  <input 
                    type="text" 
                    value={formatPrice(formData.base_agent_price)}
                    onChange={(e) => handlePriceChange('base_agent_price', e.target.value)}
                    className={`w-full pl-9 p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-primary/50 outline-none ${errors.prices ? 'border-red-500 bg-red-50' : 'bg-background'}`} 
                  />
                </div>
              </div>
            </div>
            {errors.prices && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><span>⚠️</span> {errors.prices}</p>}
          </div>
        </div>

        {/* Bagian Varian */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold text-base">Varian Produk</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Tambahkan varian ukuran, rasa, atau kemasan yang berbeda.</p>
            </div>
            <button type="button" onClick={addVariant} className="text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold hover:bg-primary/20 transition">
              + Tambah Varian
            </button>
          </div>
          
          <div className="space-y-5">
            {formData.variants.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">Tidak ada varian. Produk ini akan menggunakan Harga Dasar saja.</p>
              </div>
            ) : (
              formData.variants.map((v, idx) => (
                <div key={idx} className="bg-background p-5 rounded-xl border shadow-sm relative">
                  <div className="absolute top-0 right-0 bg-red-50 hover:bg-red-100 rounded-bl-xl rounded-tr-xl border-b border-l transition">
                    <button type="button" onClick={() => {
                      const newV = [...formData.variants]; newV.splice(idx, 1); setFormData({...formData, variants: newV});
                    }} className="px-3 py-1.5 text-red-600 font-bold text-xs">Hapus Varian ✕</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-16 mb-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${errors.variants?.[idx] ? 'text-red-600' : ''}`}>
                        Nama Varian <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={v.name} 
                        onChange={(e) => {
                          updateVariant(idx, 'name', e.target.value);
                          if (errors.variants?.[idx]) {
                            const newVarErrs = {...errors.variants};
                            delete newVarErrs[idx];
                            setErrors({...errors, variants: Object.keys(newVarErrs).length ? newVarErrs : undefined});
                          }
                        }} 
                        className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none ${errors.variants?.[idx] ? 'border-red-500 bg-red-50' : ''}`} 
                        placeholder="Misal: Kemasan 500gr" 
                      />
                      {errors.variants?.[idx] && <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1"><span>⚠️</span> {errors.variants[idx]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">SKU (Kode Barcode)</label>
                      <input type="text" value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} className="w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Opsional" />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <p className="text-[11px] font-semibold text-blue-800 mb-3 uppercase tracking-wider">Harga Khusus Varian (Override)</p>
                    <p className="text-xs text-blue-600/70 -mt-2 mb-3">Kosongkan kolom di bawah ini jika harga varian ini SAMA dengan Harga Dasar Induk.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Harga Produksi (Khusus)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">Rp</span>
                          <input type="text" value={formatPrice(v.override_production_price)} onChange={(e) => updateVariant(idx, 'override_production_price', e.target.value)} className="w-full pl-8 p-2 rounded border text-sm" placeholder="Sesuai Harga Dasar" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Harga Sales (Khusus)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">Rp</span>
                          <input type="text" value={formatPrice(v.override_sales_price)} onChange={(e) => updateVariant(idx, 'override_sales_price', e.target.value)} className="w-full pl-8 p-2 rounded border text-sm" placeholder="Sesuai Harga Dasar" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Harga Agen (Khusus)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">Rp</span>
                          <input type="text" value={formatPrice(v.override_agent_price)} onChange={(e) => updateVariant(idx, 'override_agent_price', e.target.value)} className="w-full pl-8 p-2 rounded border text-sm" placeholder="Sesuai Harga Dasar" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="pt-6 border-t flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => navigate("/products")}
            className="px-6 py-3 border rounded-xl hover:bg-muted font-bold text-sm"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isCreating}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isCreating ? "Menyimpan Data..." : "Simpan Produk & Varian"}
          </button>
        </div>
      </form>
    </div>
  );
};
