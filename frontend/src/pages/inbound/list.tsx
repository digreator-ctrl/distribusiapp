import { useState, useEffect, useMemo } from "react";
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

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [sortOption, setSortOption] = useState("date_desc");

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set(batches.map((b: any) => b.supplier_name || "Internal"));
    return ["ALL", ...Array.from(suppliers)];
  }, [batches]);

  // Apply Filter, Search & Sort
  const processedBatches = useMemo(() => {
    let result = [...batches];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b: any) => 
        (b.product_name?.toLowerCase().includes(q) || "") ||
        (b.product_id?.toLowerCase().includes(q) || "") ||
        (b.supplier_name?.toLowerCase().includes(q) || "")
      );
    }

    // Filter Supplier
    if (filterSupplier !== "ALL") {
      result = result.filter((b: any) => (b.supplier_name || "Internal") === filterSupplier);
    }

    // Sort
    result.sort((a: any, b: any) => {
      switch (sortOption) {
        case "date_desc":
          return new Date(b.production_date).getTime() - new Date(a.production_date).getTime();
        case "date_asc":
          return new Date(a.production_date).getTime() - new Date(b.production_date).getTime();
        case "product_asc":
          return (a.product_name || "").localeCompare(b.product_name || "");
        case "product_desc":
          return (b.product_name || "").localeCompare(a.product_name || "");
        case "qty_desc":
          return b.quantity - a.quantity;
        case "qty_asc":
          return a.quantity - b.quantity;
        case "exp_asc":
          return new Date(a.expired_date).getTime() - new Date(b.expired_date).getTime();
        case "exp_desc":
          return new Date(b.expired_date).getTime() - new Date(a.expired_date).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [batches, searchQuery, filterSupplier, sortOption]);

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
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition shrink-0"
        >
          + Catat Stok Masuk
        </button>
      </div>

      {/* Control Bar: Search, Filters, Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text"
          placeholder="Cari produk atau supplier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-md flex-1 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        />
        
        <select 
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        >
          <option value="ALL">Semua Supplier</option>
          {uniqueSuppliers.filter(s => s !== "ALL").map(s => (
            <option key={s as string} value={s as string}>{s as string}</option>
          ))}
        </select>

        <select 
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        >
          <option value="date_desc">Tanggal Masuk (Terbaru)</option>
          <option value="date_asc">Tanggal Masuk (Terlama)</option>
          <option value="product_asc">Nama Produk (A-Z)</option>
          <option value="product_desc">Nama Produk (Z-A)</option>
          <option value="qty_desc">Jumlah (Terbanyak)</option>
          <option value="qty_asc">Jumlah (Sedikit)</option>
          <option value="exp_asc">Kedaluwarsa (Terdekat)</option>
          <option value="exp_desc">Kedaluwarsa (Terjauh)</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API Hono...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal Stok Masuk</th>
                <th className="px-6 py-4 font-semibold">Produk</th>
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold text-right">Jumlah</th>
                <th className="px-6 py-4 font-semibold text-destructive">Kedaluwarsa</th>
              </tr>
            </thead>
            <tbody>
              {processedBatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {batches.length === 0 ? "Belum ada riwayat stok masuk." : "Tidak ada data yang cocok dengan pencarian/filter."}
                  </td>
                </tr>
              ) : (
                processedBatches.map((batch: any) => (
                  <tr 
                    key={batch.id} 
                    onClick={() => navigate(`/inbound_batches/${batch.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium">{new Date(batch.production_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-semibold">{batch.product_name || batch.product_id}</td>
                    <td className="px-6 py-4">
                      {batch.supplier_name ? (
                        <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100">{batch.supplier_name}</span>
                      ) : (
                        <span className="text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full text-xs font-medium border border-border/50">Internal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{new Intl.NumberFormat('id-ID').format(batch.quantity)}</td>
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
