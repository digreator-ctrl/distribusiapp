import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const InboundShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await fetch(`${API_URL}/inbound_batches/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil detail stok masuk");
        const data = await res.json();
        setBatch(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatch();
  }, [id]);

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat detail stok...</div>;
  }

  if (!batch) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500 font-semibold">Stok masuk tidak ditemukan.</p>
        <button onClick={() => navigate("/inbound_batches")} className="mt-4 px-4 py-2 border rounded hover:bg-muted">Kembali</button>
      </div>
    );
  }

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detail Stok Masuk</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">{batch.id}</p>
        </div>
        <button onClick={() => navigate("/inbound_batches")} className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition">
          Kembali
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Stok Masuk</h3>
            <p className="font-medium text-lg">{new Date(batch.production_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Produk</h3>
            <p className="font-medium text-lg">{batch.product_name || batch.product_id}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Supplier</h3>
            <p className="font-medium">
              {batch.supplier_name ? (
                <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-100">{batch.supplier_name}</span>
              ) : (
                <span className="text-muted-foreground bg-muted/50 px-3 py-1 rounded border border-border/50">Internal</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Jumlah Stok (Qty)</h3>
            <p className="font-medium text-2xl text-primary">{new Intl.NumberFormat("id-ID").format(batch.quantity)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Kedaluwarsa</h3>
            <p className="font-medium text-lg text-destructive">{new Date(batch.expired_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Waktu Pencatatan Sistem</h3>
            <p className="font-medium">{new Date(batch.created_at).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
