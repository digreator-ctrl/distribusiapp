import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Package, 
  ArrowDownToLine, 
  Truck, 
  Store, 
  Users, 
  DollarSign, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

interface DashboardData {
  total_products: number;
  inbound_today_qty: number;
  active_deliveries: number;
  monthly_revenue: number;
  total_stores: number;
  total_sales: number;
}

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData>({
    total_products: 0,
    inbound_today_qty: 0,
    active_deliveries: 0,
    monthly_revenue: 0,
    total_stores: 0,
    total_sales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = localStorage.getItem("distribusi_role") || "admin";
  const tenantName = localStorage.getItem("distribusi_tenant_name") || "Distribusi SaaS";
  const [userName, setUserName] = useState(() => localStorage.getItem("distribusi_user_name") || "Owner");

  useEffect(() => {
    const handleProfile = (e: any) => {
      if (e?.detail?.name) setUserName(e?.detail?.name);
    };
    window.addEventListener("userProfileUpdated", handleProfile);
    return () => window.removeEventListener("userProfileUpdated", handleProfile);
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard-summary`);
      if (!res.ok) {
        throw new Error(`Gagal memuat ringkasan dashboard (Status: ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error("Dashboard summary fetch error:", err);
      setError(err.message || "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("id-ID").format(val || 0);
  };

  const isBrandNewBusiness = data.total_products === 0 && data.total_stores === 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Building2 size={12} />
                {tenantName}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <ShieldCheck size={12} />
                {role === "owner" ? "Owner Usaha" : "Admin Gudang"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Dashboard {role === "owner" ? "Owner" : "Admin Gudang"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selamat datang, <strong className="text-foreground font-semibold">{userName}</strong>! Pantau performa rantai pasok dan distribusi secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border rounded-xl transition-all disabled:opacity-50"
              title="Perbarui data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
              <span>Perbarui Data</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={fetchSummary}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Ringkasan Keuangan (Khusus Owner) */}
        {role === "owner" && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/25 md:col-span-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                  <DollarSign size={18} />
                </div>
                <h3 className="text-purple-700 dark:text-purple-300 font-bold text-sm tracking-wide">
                  Ringkasan Keuangan (Bulan Ini)
                </h3>
              </div>
              <span className="text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 w-fit">
                Hak Akses: Eksekutif / Owner
              </span>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <p className="text-3xl md:text-4xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
                {loading ? "Rp ..." : formatRupiah(data.monthly_revenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total pembayaran setoran konsinyasi yang diterima bulan ini
              </p>
            </div>
          </div>
        )}

        {/* 1. Total Produk Aktif */}
        <div className="p-5 rounded-2xl bg-card border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Produk Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-foreground">
              {loading ? "..." : formatNumber(data.total_products)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Item dalam katalog penjualan</p>
          </div>
        </div>

        {/* 2. Stok Masuk Hari Ini */}
        <div className="p-5 rounded-2xl bg-card border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stok Masuk (Hari Ini)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ArrowDownToLine size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-blue-600">
              {loading ? "..." : `${formatNumber(data.inbound_today_qty)} `}
              <span className="text-sm font-normal text-muted-foreground">pcs</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Total unit masuk ke gudang hari ini</p>
          </div>
        </div>

        {/* 3. Pengiriman Berjalan */}
        <div className="p-5 rounded-2xl bg-card border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permintaan & Pengiriman</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-emerald-600">
              {loading ? "..." : `${formatNumber(data.active_deliveries)} `}
              <span className="text-sm font-normal text-muted-foreground">rute/tugas</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Status pending & dalam distribusi</p>
          </div>
        </div>

        {/* 4. Mitra Toko */}
        <div className="p-5 rounded-2xl bg-card border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mitra Toko Terdaftar</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Store size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-foreground">
              {loading ? "..." : `${formatNumber(data.total_stores)} `}
              <span className="text-sm font-normal text-muted-foreground">toko</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Jaringan toko mitra konsinyasi</p>
          </div>
        </div>

        {/* 5. Tim Sales */}
        <div className="p-5 rounded-2xl bg-card border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tim Sales Lapangan</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-foreground">
              {loading ? "..." : `${formatNumber(data.total_sales)} `}
              <span className="text-sm font-normal text-muted-foreground">orang</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Sales yang aktif bertugas</p>
          </div>
        </div>
      </div>

      {/* Panduan Langkah Awal untuk Usaha Baru (Jika belum ada data produk & toko) */}
      {isBrandNewBusiness && !loading && (
        <div className="mt-8 bg-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary mt-1">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Mulai Mengatur Usaha Anda: {tenantName}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Akun usaha Anda masih bersih dan siap digunakan. Ikuti langkah-langkah berikut untuk memulai operasional:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Produk */}
            <div className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                  Langkah 1
                </span>
                <h4 className="font-bold text-sm text-foreground mt-2">Daftarkan Produk</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Tambahkan produk konsinyasi beserta varian ukuran/rasa dan harga.
                </p>
              </div>
              <Link
                to="/products/create"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <span>Tambah Produk</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Step 2: Inbound */}
            <div className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Langkah 2
                </span>
                <h4 className="font-bold text-sm text-foreground mt-2">Catat Stok Masuk</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Input kuantitas stok masuk gudang untuk batch produksi baru.
                </p>
              </div>
              <Link
                to="/inbound_batches/create"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                <span>Input Inbound</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Step 3: Toko */}
            <div className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Langkah 3
                </span>
                <h4 className="font-bold text-sm text-foreground mt-2">Daftarkan Mitra Toko</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Masukkan data toko / warung mitra tempat menitipkan barang konsinyasi.
                </p>
              </div>
              <Link
                to="/stores/create"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline"
              >
                <span>Tambah Toko</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Step 4: Tim Sales */}
            <div className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Langkah 4
                </span>
                <h4 className="font-bold text-sm text-foreground mt-2">Buat Akun Sales</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Buat akun untuk sales lapangan yang bertugas mengantar dan menagih.
                </p>
              </div>
              <Link
                to="/users/create"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <span>Tambah Sales</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
