import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export const SupplierShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userRole = localStorage.getItem("distribusi_role") || "admin";

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`${API_URL}/suppliers/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil detail supplier");
        const data = await res.json();
        setSupplier(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  const toggleStatus = async () => {
    if (!supplier) return;
    const newStatus = supplier.is_active === 0 ? 1 : 0;
    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...supplier, is_active: newStatus, products: undefined })
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      setSupplier({ ...supplier, is_active: newStatus });
      setToast({ message: `Supplier berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}.`, type: "success" });
    } catch {
      setToast({ message: "Gagal mengubah status supplier.", type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menghapus");
      }
      setToast({ message: "Supplier berhasil dihapus.", type: "success" });
      setTimeout(() => navigate("/suppliers"), 1500);
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return <div className="py-10 text-center animate-pulse">Memuat detail supplier...</div>;
  }

  if (!supplier) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-bold">Supplier tidak ditemukan.</p>
        <button onClick={() => navigate("/suppliers")} className="mt-4 px-4 py-2 border rounded shadow-sm">Kembali</button>
      </div>
    );
  }

  const formatRp = (val: number | null | undefined) => {
    if (val == null) return "-";
    return "Rp " + val.toLocaleString("id-ID");
  };

  const products = supplier.products || [];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Hapus Supplier Ini?"
        message={`Aksi ini akan menghapus supplier ${supplier.name} secara permanen dan tidak bisa dikembalikan.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <button 
            onClick={() => navigate("/suppliers")} 
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-muted transition mb-3 shadow-sm"
          >
            ← Kembali ke Daftar Supplier
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
              supplier.is_active !== 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-600 border-red-200'
            }`}>
              {supplier.is_active !== 0 ? "● Aktif" : "● Nonaktif"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Informasi profil supplier dan katalog produk yang dipasok.</p>
        </div>
        <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
          <button onClick={toggleStatus} className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${supplier.is_active !== 0 ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
            {supplier.is_active !== 0 ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <button onClick={() => navigate(`/suppliers/${id}/edit`)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow hover:bg-primary/90 transition">
            Edit
          </button>
          {userRole === "owner" && (
            <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700 transition">
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* 1. Informasi Utama (Atas) */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-lg font-bold border-b pb-2 flex items-center justify-between">
          <span>Informasi Utama</span>
          <span className="text-xs font-mono font-normal text-muted-foreground">ID: {supplier.id}</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Nama Perusahaan / Toko</p>
            <p className="font-bold text-lg mt-0.5">{supplier.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Tanggal Terdaftar</p>
            <p className="font-medium mt-0.5">
              {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total Produk Terdaftar</p>
            <p className="font-bold text-lg text-primary mt-0.5">{products.length} Produk</p>
          </div>
        </div>
      </div>

      {/* 2. Kontak & Alamat (Bawahnya Informasi Utama) */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-lg font-bold border-b pb-2">Kontak & Alamat</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Kontak Person (PIC)</p>
            <p className="font-semibold text-base mt-0.5">{supplier.contact_person || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Nomor Telepon / HP</p>
            <p className="font-medium text-base mt-0.5 font-mono">{supplier.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Alamat Lengkap</p>
            <p className="font-medium text-sm mt-0.5">{supplier.address || "-"}</p>
          </div>
        </div>
      </div>

      {/* 3. Daftar Produk yang Disuplai */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-lg font-bold">Produk Terkait ({products.length})</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Daftar produk yang disuplai oleh mitra ini.</p>
          </div>
          <button 
            onClick={() => navigate("/products/create", { state: { supplierId: supplier.id, returnTo: `/suppliers/${supplier.id}` } })}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:opacity-90 transition"
          >
            + Tambah Produk Baru
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
            <p className="text-sm text-muted-foreground">Belum ada produk yang terhubung dengan supplier ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Nama Produk</th>
                  <th className="px-5 py-3.5 font-semibold">Kategori</th>
                  <th className="px-5 py-3.5 font-semibold">Merek</th>
                  <th className="px-5 py-3.5 font-semibold text-amber-800">Biaya Produksi (HPP)</th>
                  <th className="px-5 py-3.5 font-semibold text-blue-700">Harga Agen</th>
                  <th className="px-5 py-3.5 font-semibold text-emerald-700">Harga Sales</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Varian</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr 
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}?tab=transactions`)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-bold text-primary hover:underline">
                      {p.name}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{p.category || "-"}</td>
                    <td className="px-5 py-3.5 font-medium">{p.brand || "-"}</td>
                    <td className="px-5 py-3.5 font-bold text-amber-900">{formatRp(p.base_production_price)}</td>
                    <td className="px-5 py-3.5 font-bold text-blue-800">{formatRp(p.base_agent_price)}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-800">{formatRp(p.base_sales_price)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {p.variant_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        p.is_active == null || p.is_active 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-600"
                      }`}>
                        {p.is_active == null || p.is_active ? "Aktif" : "Nonaktif"}
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
    </>
  );
};
