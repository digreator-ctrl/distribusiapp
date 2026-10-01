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

export const ProductShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userRole = localStorage.getItem("distribusi_role") || "admin";

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      if (!res.ok) throw new Error("Produk tidak ditemukan");
      const data = await res.json();
      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const toggleStatus = async () => {
    if (!product) return;
    const newStatus = product.is_active ? 0 : 1;
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, is_active: newStatus, variants: undefined })
      });
      setProduct({ ...product, is_active: newStatus });
      setToast({ message: `Produk berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}.`, type: "success" });
    } catch {
      setToast({ message: "Gagal mengubah status produk.", type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      setToast({ message: "Produk dan seluruh variannya telah dihapus.", type: "success" });
      setTimeout(() => navigate("/products"), 1500);
    } catch {
      setToast({ message: "Gagal menghapus produk.", type: "error" });
    }
    setShowDeleteConfirm(false);
  };

  const formatRp = (val: number | null | undefined) => {
    if (val == null) return "-";
    return "Rp " + val.toLocaleString("id-ID");
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Memuat detail produk...</div>;
  if (error) return <div className="py-20 text-center text-red-500 font-semibold">{error}</div>;
  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border p-6 space-y-4 text-center">
            <div className="text-4xl">🗑️</div>
            <h3 className="font-bold text-lg">Hapus Produk Ini?</h3>
            <p className="text-sm text-muted-foreground">Aksi ini akan menghapus produk <strong>{product.name}</strong> beserta seluruh variannya secara permanen dan tidak bisa dikembalikan.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 border rounded-xl font-bold text-sm hover:bg-muted">Batal</button>
              <button onClick={handleDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700">Ya, Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <button onClick={() => navigate("/products")} className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-muted transition mb-3 shadow-sm">
              <span>←</span> Kembali ke Katalog
            </button>
            <h1 className="text-2xl font-black tracking-tight">{product.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {product.category && <span className="text-xs bg-muted border px-3 py-1 rounded-full text-muted-foreground font-medium">{product.category}</span>}
              {product.brand && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{product.brand}</span>}
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${product.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                {product.is_active ? "● Aktif" : "● Nonaktif"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono">ID: {product.id}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={toggleStatus} className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${product.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
              {product.is_active ? "Nonaktifkan" : "Aktifkan"}
            </button>
            <button onClick={() => navigate(`/products/${id}/edit`)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow hover:bg-primary/90 transition">
              Edit Produk
            </button>
            {userRole === "owner" && (
              <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700 transition">
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Harga Dasar */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h2 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-4">Harga Dasar Produk</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Harga Produksi (HPP)</p>
            <p className="text-xl font-black">{formatRp(product.base_production_price)}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-primary font-semibold mb-1">Harga Sales</p>
            <p className="text-xl font-black text-primary">{formatRp(product.base_sales_price)}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-600 font-semibold mb-1">Harga Agen</p>
            <p className="text-xl font-black text-blue-700">{formatRp(product.base_agent_price)}</p>
          </div>
        </div>
      </div>

      {/* Daftar Varian */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm uppercase text-muted-foreground tracking-wider">Varian Produk ({product.variants?.length || 0})</h2>
        </div>
        {(!product.variants || product.variants.length === 0) ? (
          <div className="text-center py-8 bg-muted/20 border border-dashed rounded-xl">
            <p className="text-sm text-muted-foreground">Produk ini tidak memiliki varian. Menggunakan Harga Dasar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {product.variants.map((v: any) => (
              <div key={v.id} className="p-4 bg-background rounded-xl border flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{v.name}</p>
                  {v.sku && <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {v.sku}</p>}
                </div>
                <div className="flex gap-4 text-xs shrink-0">
                  <div className="text-center px-3">
                    <p className="text-muted-foreground font-semibold">Produksi</p>
                    <p className="font-bold mt-0.5">{v.override_production_price != null ? formatRp(v.override_production_price) : <span className="text-muted-foreground italic">= Dasar</span>}</p>
                  </div>
                  <div className="text-center px-3 border-x">
                    <p className="text-primary font-semibold">Sales</p>
                    <p className="font-bold mt-0.5 text-primary">{v.override_sales_price != null ? formatRp(v.override_sales_price) : <span className="text-muted-foreground italic">= Dasar</span>}</p>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-blue-600 font-semibold">Agen</p>
                    <p className="font-bold mt-0.5 text-blue-700">{v.override_agent_price != null ? formatRp(v.override_agent_price) : <span className="text-muted-foreground italic">= Dasar</span>}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Tambahan */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h2 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-3">Informasi Lainnya</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Dibuat pada</p>
            <p className="font-medium mt-0.5">{product.created_at ? new Date(product.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Tenant ID</p>
            <p className="font-mono font-medium mt-0.5 text-xs">{product.tenant_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
