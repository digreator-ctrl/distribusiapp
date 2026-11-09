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
  CheckCircle2,
  Plus,
  ChevronRight
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
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Top Header Card (Lebih Ramping & Kompak di Mobile) */}
      <div className="bg-card p-3.5 sm:p-5 lg:p-6 rounded-2xl border shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 truncate max-w-[150px] sm:max-w-none">
                <Building2 size={11} className="shrink-0" />
                <span className="truncate">{tenantName}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <ShieldCheck size={11} className="shrink-0" />
                <span>{role === "owner" ? "Owner Usaha" : "Admin Gudang"}</span>
              </span>
            </div>
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Hai, {userName}! 👋
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
              Pantau performa rantai pasok dan operasional distribusi Anda secara real-time.
            </p>
          </div>

          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border rounded-xl transition-all disabled:opacity-50 shrink-0"
            title="Perbarui data"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-primary" : ""} />
            <span className="hidden sm:inline">Perbarui</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
          <span className="truncate mr-2">{error}</span>
          <button 
            onClick={fetchSummary}
            className="text-xs font-bold underline hover:no-underline shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 2. Ringkasan Keuangan (Bulan Ini) - Khusus Owner */}
      {role === "owner" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/25 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                <DollarSign size={16} />
              </div>
              <h3 className="text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm tracking-wide">
                Pendapatan Bersih (Bulan Ini)
              </h3>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 shrink-0">
              Setoran Konsinyasi
            </span>
          </div>
          
          <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
              {loading ? "Rp ..." : formatRupiah(data.monthly_revenue)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Total pembayaran yang telah diterima & terkonfirmasi bulan ini
            </p>
          </div>
        </div>
      )}

      {/* 3. Akses Cepat / Quick Actions Bar (Sangat efisien untuk mobile/tablet) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground px-1">
          Aksi Cepat
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Link
            to="/products/create"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-card border border-border/70 hover:border-primary/40 hover:bg-muted/30 transition-all active:scale-[0.98] shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">+ Produk Baru</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block truncate">Katalog produk</p>
            </div>
          </Link>

          <Link
            to="/inbound_batches/create"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-card border border-border/70 hover:border-blue-500/40 hover:bg-muted/30 transition-all active:scale-[0.98] shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowDownToLine size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">+ Stok Masuk</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block truncate">Batch gudang</p>
            </div>
          </Link>

          <Link
            to="/stock-requests/create"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-card border border-border/70 hover:border-emerald-500/40 hover:bg-muted/30 transition-all active:scale-[0.98] shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Truck size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">+ Distribusi</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block truncate">Kirim ke sales</p>
            </div>
          </Link>

          <Link
            to="/stores/create"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-card border border-border/70 hover:border-amber-500/40 hover:bg-muted/30 transition-all active:scale-[0.98] shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Store size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">+ Mitra Toko</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block truncate">Titip konsinyasi</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Ringkasan Operasional (2 Kolom di Mobile, 3 di Tablet, 5 di Desktop) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground px-1">
          Ringkasan Operasional
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {/* Card 1: Produk Aktif */}
          <Link
            to="/products"
            className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-primary/50 transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate mr-1">
                Katalog Produk
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Package size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                {loading ? "..." : formatNumber(data.total_products)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">
                Item aktif
              </p>
            </div>
          </Link>

          {/* Card 2: Stok Masuk Hari Ini */}
          <Link
            to="/inbound_batches"
            className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-blue-500/50 transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate mr-1">
                Stok Masuk
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ArrowDownToLine size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className="text-lg sm:text-2xl font-black text-blue-600 tracking-tight">
                {loading ? "..." : formatNumber(data.inbound_today_qty)}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">pcs</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">
                Masuk hari ini
              </p>
            </div>
          </Link>

          {/* Card 3: Distribusi & Approval */}
          <Link
            to="/stock-requests"
            className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-emerald-500/50 transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate mr-1">
                Distribusi
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Truck size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tight">
                {loading ? "..." : formatNumber(data.active_deliveries)}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">tugas</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">
                Pending & jalan
              </p>
            </div>
          </Link>

          {/* Card 4: Mitra Toko */}
          <Link
            to="/stores"
            className="p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-amber-500/50 transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate mr-1">
                Mitra Toko
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Store size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                {loading ? "..." : formatNumber(data.total_stores)}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">toko</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">
                Konsinyasi
              </p>
            </div>
          </Link>

          {/* Card 5: Tim Sales (Pada mobile col-span-2 agar simetris & hemat tempat) */}
          <Link
            to="/users"
            className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs hover:border-indigo-500/50 transition-all active:scale-[0.98] flex sm:flex-col items-center sm:items-stretch justify-between group"
          >
            <div className="flex items-center justify-between sm:w-full">
              <div className="flex items-center gap-2 sm:gap-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 sm:hidden group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users size={15} />
                </div>
                <div>
                  <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Tim Sales Lapangan
                  </span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">
                    Sales aktif bertugas
                  </span>
                </div>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 text-indigo-600 hidden sm:flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users size={15} />
              </div>
            </div>

            <div className="mt-0 sm:mt-3 text-right sm:text-left flex items-center sm:block gap-2">
              <p className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                {loading ? "..." : formatNumber(data.total_sales)}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">orang</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5 hidden sm:block">
                Bertugas
              </p>
              <ChevronRight size={15} className="text-muted-foreground sm:hidden" />
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Panduan Langkah Awal untuk Usaha Baru (Jika belum ada data produk & toko) */}
      {isBrandNewBusiness && !loading && (
        <div className="mt-6 bg-card border border-primary/20 rounded-2xl p-4 sm:p-6 shadow-2xs">
          <div className="flex items-start gap-3 mb-4 sm:mb-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Mulai Mengatur Usaha Anda: {tenantName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Akun usaha Anda masih baru. Ikuti 4 langkah ini untuk memulai operasional:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Step 1: Produk */}
            <div className="p-3 sm:p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                  Langkah 1
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-foreground mt-1.5">Daftarkan Produk</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tambahkan produk konsinyasi beserta varian ukuran/rasa dan harga.
                </p>
              </div>
              <Link
                to="/products/create"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <span>Tambah Produk</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Step 2: Inbound */}
            <div className="p-3 sm:p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Langkah 2
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-foreground mt-1.5">Catat Stok Masuk</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Input kuantitas stok masuk gudang untuk batch produksi baru.
                </p>
              </div>
              <Link
                to="/inbound_batches/create"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                <span>Input Inbound</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Step 3: Toko */}
            <div className="p-3 sm:p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Langkah 3
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-foreground mt-1.5">Daftarkan Mitra Toko</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Masukkan data toko mitra tempat menitipkan barang konsinyasi.
                </p>
              </div>
              <Link
                to="/stores/create"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline"
              >
                <span>Tambah Toko</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Step 4: Tim Sales */}
            <div className="p-3 sm:p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Langkah 4
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-foreground mt-1.5">Buat Akun Sales</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Buat akun untuk sales lapangan yang bertugas mengantar dan menagih.
                </p>
              </div>
              <Link
                to="/users/create"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
              >
                <span>Tambah Sales</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
