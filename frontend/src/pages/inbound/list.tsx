import { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3 shadow-xl max-w-sm w-full">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-green-800">Berhasil</h3>
        <p className="text-sm text-green-700 mt-1">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="text-green-500 hover:text-green-700 transition">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export const InboundList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");

  // Hapus state dari history agar tidak muncul lagi saat di-refresh
  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const listResult = useList({
    resource: "inbound_batches",
  }) as any;
  
  const data = listResult.data || listResult.query?.data;
  const isLoading = listResult.isLoading ?? listResult.query?.isLoading;

  const batches = data?.data ?? [];

  return (
    <>
      {successMsg && <Toast message={successMsg} onClose={() => setSuccessMsg("")} />}
      <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Masuk (Inbound)</h1>
          <p className="text-muted-foreground mt-1">Pencatatan batch produk masuk dari internal atau rekanan.</p>
        </div>
        <button 
          onClick={() => navigate("/inbound_batches/create")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition"
        >
          + Catat Stok Masuk
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API Hono...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">ID Batch</th>
                <th className="px-6 py-4 font-semibold">Produk</th>
                <th className="px-6 py-4 font-semibold">Sumber</th>
                <th className="px-6 py-4 font-semibold text-right">Jumlah</th>
                <th className="px-6 py-4 font-semibold">Tgl Produksi</th>
                <th className="px-6 py-4 font-semibold text-destructive">Kedaluwarsa</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada riwayat stok masuk.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{batch.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-semibold">{batch.product_name || batch.product_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${batch.source_type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {batch.source_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{batch.quantity}</td>
                    <td className="px-6 py-4">{new Date(batch.production_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-destructive font-medium">{new Date(batch.expired_date).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
};
