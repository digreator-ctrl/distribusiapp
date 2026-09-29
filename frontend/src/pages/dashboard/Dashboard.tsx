import { useCustom, useGetIdentity } from "@refinedev/core";
import { 
  Users, Store, ShoppingBag, ArrowRightLeft,
  Package, MapPin, AlertCircle, RefreshCcw
} from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { data: identity } = useGetIdentity<{ id: string, name: string, role: string, business_id: string }>();
  
  const isSales = identity?.role === 'role-sales';

  const { data: dashboardData, isLoading } = useCustom({
    url: isSales ? `/api/dashboard/sales?sales_id=${identity?.id}` : "/api/dashboard/overview",
    method: "get",
    queryOptions: { enabled: !!identity }
  });

  const data = dashboardData?.data?.data;

  if (isLoading) return <div className="p-8 text-center text-surface-500">Memuat dashboard...</div>;

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
          {/* Sales Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                Stok di Kendaraan Saya
              </h2>
              {data?.my_stock?.length > 0 ? (
                <div className="space-y-3">
                  {data.my_stock.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">{item.total_quantity} item</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-surface-500">
                  Tidak ada stok barang di kendaraan Anda.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary-500" />
                  Kunjungan Hari Ini
                </h2>
                <Link to="/sales-visits/create" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                  + Mulai Kunjungan
                </Link>
              </div>
              {data?.today_visits?.length > 0 ? (
                <div className="space-y-3">
                  {data.today_visits.map((visit: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                      <div>
                        <div className="font-medium">{visit.store_name}</div>
                        <div className="text-xs text-surface-500">{new Date(visit.visit_date).toLocaleTimeString('id-ID')}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-surface-500">
                  Belum ada kunjungan hari ini.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
