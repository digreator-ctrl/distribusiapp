import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ConfirmModal } from "../../components/ConfirmModal";

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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "transactions" ? "transactions" : "detail");
  
  // Update state if URL changes
  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "transactions" ? "transactions" : "detail");
  }, [searchParams]);

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
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Hapus Produk Ini?"
        message={`Aksi ini akan menghapus produk ${product.name} beserta seluruh variannya secara permanen dan tidak bisa dikembalikan.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-muted transition mb-3 shadow-sm">
              <span>←</span> Kembali
            </button>
            <h1 className="text-2xl font-black tracking-tight">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {product.category && <span className="text-xs bg-muted border px-3 py-1 rounded-full text-muted-foreground font-medium">{product.category}</span>}
              {product.brand && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{product.brand}</span>}
              {product.supplier_name ? (
                <span 
                  onClick={() => product.supplier_id && navigate(`/suppliers/${product.supplier_id}`)}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-100 transition"
                  title="Klik untuk melihat detail supplier"
                >
                  🏢 Supplier: {product.supplier_name} ↗
                </span>
              ) : (
                <span className="text-xs bg-muted border px-3 py-1 rounded-full text-muted-foreground font-semibold">
                  🏭 Internal (Produksi Sendiri)
                </span>
              )}
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
      
      {/* Tabs Navigation */}
      <div className="flex items-center gap-6 border-b px-2">
        <button 
          onClick={() => setActiveTab('detail')} 
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'detail' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Informasi Detail
        </button>
        <button 
          onClick={() => setActiveTab('transactions')} 
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Riwayat Transaksi Penjualan
        </button>
      </div>

      {activeTab === 'detail' && (
        <div className="space-y-6">
          {/* Harga Dasar */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h2 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-4">Harga Dasar Produk</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Harga Produksi (HPP) - Slate / Amber kontras */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200">
            <div className="mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-md">
                1. Biaya Produksi (HPP)
              </span>
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{formatRp(product.base_production_price)}</p>
            <p className="text-[11px] text-amber-700/80 mt-1 font-medium">Modal dasar / HPP internal</p>
          </div>

          {/* 2. Harga Agen - Biru Royal kontras */}
          <div className="p-5 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 text-blue-950 dark:text-blue-200">
            <div className="mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-md">
                2. Harga Agen / Grosir
              </span>
            </div>
            <p className="text-2xl font-black text-blue-800 dark:text-blue-100">{formatRp(product.base_agent_price)}</p>
            <p className="text-[11px] text-blue-700/80 mt-1 font-medium">Tarif khusus agen & reseller</p>
          </div>

          {/* 3. Harga Sales - Hijau Emerald / Retail kontras */}
          <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-950 dark:text-emerald-200">
            <div className="mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-md">
                3. Harga Sales (Konsinyasi/Toko)
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-100">{formatRp(product.base_sales_price)}</p>
            <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Harga jual ke toko mitra konsinyasi</p>
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
                <div className="flex gap-2 sm:gap-3 text-xs shrink-0">
                  {/* Produksi */}
                  <div className="text-center px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 min-w-[100px]">
                    <p className="text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase">Produksi</p>
                    <p className="font-black mt-0.5 text-amber-900 dark:text-amber-100">
                      {v.override_production_price != null ? formatRp(v.override_production_price) : <span className="text-muted-foreground font-normal italic">= Dasar</span>}
                    </p>
                  </div>

                  {/* Agen */}
                  <div className="text-center px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 min-w-[100px]">
                    <p className="text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">Agen</p>
                    <p className="font-black mt-0.5 text-blue-800 dark:text-blue-100">
                      {v.override_agent_price != null ? formatRp(v.override_agent_price) : <span className="text-muted-foreground font-normal italic">= Dasar</span>}
                    </p>
                  </div>

                  {/* Sales */}
                  <div className="text-center px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 min-w-[100px]">
                    <p className="text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase">Sales</p>
                    <p className="font-black mt-0.5 text-emerald-800 dark:text-emerald-100">
                      {v.override_sales_price != null ? formatRp(v.override_sales_price) : <span className="text-muted-foreground font-normal italic">= Dasar</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Tambahan */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h2 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-3">Informasi Tambahan & Supplier</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Sumber / Supplier</p>
            {product.supplier_name ? (
              <div className="mt-1">
                <button 
                  onClick={() => product.supplier_id && navigate(`/suppliers/${product.supplier_id}`)}
                  className="font-bold text-primary hover:underline text-left flex items-center gap-1"
                >
                  {product.supplier_name} ↗
                </button>
                {(product.supplier_contact || product.supplier_phone) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[product.supplier_contact, product.supplier_phone].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-medium mt-1 text-muted-foreground">Internal (Produksi Sendiri)</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Dibuat pada</p>
            <p className="font-medium mt-1">{product.created_at ? new Date(product.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">ID Produk</p>
            <p className="font-mono font-medium mt-1 text-xs truncate" title={product.id}>{product.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Tenant ID</p>
            <p className="font-mono font-medium mt-1 text-xs">{product.tenant_id}</p>
          </div>
        </div>
      </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <div>
                <h2 className="font-bold text-lg">Riwayat Transaksi Penjualan (Konsinyasi)</h2>
                <p className="text-xs text-muted-foreground mt-1">Daftar distribusi dan penjualan produk ini ke toko mitra.</p>
              </div>
            </div>

            {(!product.transactions || product.transactions.length === 0) ? (
              <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">Belum ada riwayat transaksi untuk produk ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tanggal</th>
                      <th className="px-5 py-3 font-semibold">Varian</th>
                      <th className="px-5 py-3 font-semibold">Toko Mitra</th>
                      <th className="px-5 py-3 font-semibold">Sales</th>
                      <th className="px-5 py-3 font-semibold text-center">Awal</th>
                      <th className="px-5 py-3 font-semibold text-center text-green-600">Laku</th>
                      <th className="px-5 py-3 font-semibold text-center text-red-500">Retur</th>
                      <th className="px-5 py-3 font-semibold text-center">Sisa</th>
                      <th className="px-5 py-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.transactions.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-3 font-medium">
                          {new Date(tx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 font-semibold text-primary">{tx.variant_name || "-"}</td>
                        <td className="px-5 py-3 font-medium">{tx.store_name || "-"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{tx.sales_name || "-"}</td>
                        <td className="px-5 py-3 text-center font-bold">{tx.initial_stock}</td>
                        <td className="px-5 py-3 text-center font-bold text-green-600">{tx.sold_qty}</td>
                        <td className="px-5 py-3 text-center font-bold text-red-500">{tx.return_qty}</td>
                        <td className="px-5 py-3 text-center font-bold">{tx.remaining_qty}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold ${
                            tx.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {tx.status === 'completed' ? 'Selesai' : 'Aktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};
