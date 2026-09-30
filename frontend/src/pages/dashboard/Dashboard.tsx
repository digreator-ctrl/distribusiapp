import { useCustom, useGetIdentity } from "@refinedev/core";
import { 
  Users, Store, ShoppingBag, ArrowRightLeft,
  Package, MapPin, AlertCircle, RefreshCcw
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
  const { data: identity } = useGetIdentity<{ id: string, name: string, role: string, business_id: string }>();
  
  const businessId = localStorage.getItem('businessId');
  
  // If no business yet, redirect to onboarding
  if (!businessId) {
    return <Navigate to="/onboarding" replace />;
  }
  
  const isSales = identity?.role === 'role-sales';

  const { data: dashboardData, isLoading, isError } = useCustom({
    url: isSales ? `/api/dashboard/sales?sales_id=${identity?.id}` : "/api/dashboard/overview",
    method: "get",
    queryOptions: { enabled: !!identity, retry: false }
  });

  const data = dashboardData?.data?.data;

  if (isLoading) return <div className="p-8 text-center text-surface-500">Memuat dashboard...</div>;

  if (isError) return (
    <div className="p-8 text-center text-surface-500">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
      <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Gagal memuat dashboard</h2>
      <p>Pastikan Anda sudah menyelesaikan setup usaha. <Link to="/onboarding" className="text-primary-600 underline">Klik di sini</Link> untuk setup.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Selamat datang, {identity?.name}</h1>
        <p className="text-surface-500">Berikut adalah ringkasan operasional Anda hari ini.</p>
      </div>

      {!isSales ? (
        <>
          {/* Owner/Admin Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-surface-500 mb-1">Total Sales</p>
                  <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">{data?.total_sales || 0}</h3>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-surface-500 mb-1">Total Toko</p>
                  <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">{data?.total_stores || 0}</h3>
                </div>
                <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg">
                  <Store className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-surface-500 mb-1">Konsinyasi Aktif</p>
                  <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-100">{data?.active_consignments || 0}</h3>
                </div>
                <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-surface-500 mb-1">Retur Tertunda</p>
                  <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">{data?.pending_returns || 0}</h3>
                </div>
                <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                  <ArrowRightLeft className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Aksi Cepat</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/sales-visits/create" className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg flex flex-col items-center justify-center text-center hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
                  <MapPin className="h-8 w-8 text-primary-500 mb-2" />
                  <span className="font-medium">Kunjungan Baru</span>
                </Link>
                <Link to="/returns/create" className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg flex flex-col items-center justify-center text-center hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
                  <RefreshCcw className="h-8 w-8 text-red-500 mb-2" />
                  <span className="font-medium">Form Retur</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Sales Dashboard (Fast Action UI) */}
          <div className="space-y-6 animate-fade-in max-w-md mx-auto lg:max-w-none">
            
            <div className="grid grid-cols-2 gap-4">
              <Link to="/sales-visits" className="bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Store className="h-6 w-6" />
                </div>
                <span className="font-semibold text-surface-900 dark:text-surface-100">Toko Hari Ini</span>
                <span className="text-xs text-surface-500">{data?.today_visits?.length || 0} Kunjungan</span>
              </Link>
              
              <Link to="/inventory/my-stock" className="bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Package className="h-6 w-6" />
                </div>
                <span className="font-semibold text-surface-900 dark:text-surface-100">Stok Saya</span>
                <span className="text-xs text-surface-500">{data?.my_stock?.length || 0} Produk</span>
              </Link>
            </div>

            <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-600/20 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-2">Mulai Kunjungan</h2>
                <p className="text-primary-100 text-sm mb-6">Pilih toko dan catat hasil kunjungan Anda hari ini.</p>
                <Link to="/sales-visits/create" className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-full font-bold hover:bg-primary-50 transition-colors shadow-sm">
                  <MapPin className="h-5 w-5" />
                  + Kunjungan
                </Link>
              </div>
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white opacity-10"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-white opacity-10"></div>
            </div>

            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-5 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-surface-500" /> 
                  Kunjungan Terakhir
                </h3>
                <Link to="/sales-visits" className="text-xs font-medium text-primary-600 dark:text-primary-400">Lihat Semua</Link>
              </div>
              
              {data?.today_visits?.length > 0 ? (
                <div className="space-y-3">
                  {data.today_visits.map((visit: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-400">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-surface-900 dark:text-surface-100">{visit.store_name}</div>
                          <div className="text-xs text-surface-500">{new Date(visit.visit_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                        visit.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      )}>
                        {visit.status === 'completed' ? 'Selesai' : 'Proses'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800 text-surface-400 mb-3">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Belum ada kunjungan.</p>
                  <p className="text-xs text-surface-500">Mulai kunjungan pertama Anda hari ini.</p>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};
