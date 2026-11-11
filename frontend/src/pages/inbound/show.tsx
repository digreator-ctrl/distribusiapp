import { formatDate, formatDateTime } from "../../utils/date";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";
import { cache } from "../../utils/cache";
const API_URL = API_BASE_URL;

export const InboundShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cachedBatch = id ? cache.get<any>(`inbound_batch_${id}`) : null;
  const [batch, setBatch] = useState<any>(() => cachedBatch || null);
  const [isLoading, setIsLoading] = useState(!cachedBatch);

  useEffect(() => {
    const fetchBatch = async (isBackground = false) => {
      try {
        if (!isBackground) setIsLoading(true);
        const res = await fetch(`${API_URL}/inbound_batches/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil detail stok masuk");
        const data = await res.json();
        setBatch(data);
        if (id) cache.set(`inbound_batch_${id}`, data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatch(Boolean(cachedBatch));
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
    <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Detail Stok Masuk</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm font-mono">{batch.id}</p>
        </div>
        <button 
          onClick={() => navigate("/inbound_batches")} 
          className="w-full sm:w-auto px-4 py-2 border rounded-xl font-medium shadow-xs hover:bg-muted transition text-center text-sm"
        >
          Kembali
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Stok Masuk</h3>
            <p className="font-medium text-lg">{formatDate(batch.production_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Produk</h3>
            <p className="font-medium text-lg text-foreground">{batch.product_name || batch.product_id}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Varian</h3>
            <p className="font-medium text-lg">
              {batch.variant_name ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                  {batch.variant_name}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </p>
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
            <p className="font-medium text-2xl text-primary">{new Intl.NumberFormat("id-ID").format(batch.quantity)} <span className="text-sm font-normal text-muted-foreground">pcs</span></p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Kedaluwarsa</h3>
            <p className="font-medium text-lg text-destructive">{formatDate(batch.expired_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Waktu Pencatatan Sistem</h3>
            <p className="font-medium">{formatDateTime(batch.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
