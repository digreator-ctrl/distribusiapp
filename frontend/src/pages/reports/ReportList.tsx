import { useState } from "react";
import { useCustom } from "@refinedev/core";
import { 
  BarChart3, FileText, Package, RefreshCcw, 
  Download, Filter, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ReportList = () => {
  const [activeTab, setActiveTab] = useState("sales");

  // Fetch all report data
  const { data: salesData, isLoading: loadingSales } = useCustom({ url: "/api/reports/sales-performance", method: "get", queryOptions: { enabled: activeTab === 'sales' } });
  const { data: stockData, isLoading: loadingStock } = useCustom({ url: "/api/reports/stock-locations", method: "get", queryOptions: { enabled: activeTab === 'stock' } });
  const { data: expiredData, isLoading: loadingExpired } = useCustom({ url: "/api/reports/products/expired", method: "get", queryOptions: { enabled: activeTab === 'expired' } });
  const { data: returnsData, isLoading: loadingReturns } = useCustom({ url: "/api/reports/returns-summary", method: "get", queryOptions: { enabled: activeTab === 'returns' } });

  const renderSalesTable = () => {
    if (loadingSales) return <div className="p-8 text-center text-surface-500">Memuat laporan penjualan...</div>;
    const items = salesData?.data?.data || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
            <tr>
              <th className="px-6 py-4">Nama Sales</th>
              <th className="px-6 py-4">Produk</th>
              <th className="px-6 py-4 text-right">Total Terjual (Kuantitas)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
            {items.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center">Data tidak ditemukan.</td></tr>
            ) : (
              items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)]">
                  <td className="px-6 py-4 font-medium">{item.sales_name}</td>
                  <td className="px-6 py-4">{item.product_name}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary-600 dark:text-primary-400">{item.total_sold}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStockTable = () => {
    if (loadingStock) return <div className="p-8 text-center text-surface-500">Memuat laporan stok...</div>;
    const items = stockData?.data?.data || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
            <tr>
              <th className="px-6 py-4">Tipe Lokasi</th>
              <th className="px-6 py-4">Nama Lokasi</th>
              <th className="px-6 py-4">Produk</th>
              <th className="px-6 py-4 text-right">Sisa Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
            {items.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center">Data tidak ditemukan.</td></tr>
            ) : (
              items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)]">
                  <td className="px-6 py-4 capitalize">{item.location_type}</td>
                  <td className="px-6 py-4 font-medium">{item.location_name}</td>
                  <td className="px-6 py-4">{item.product_name}</td>
                  <td className="px-6 py-4 text-right font-bold">{item.total_quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExpiredTable = () => {
    if (loadingExpired) return <div className="p-8 text-center text-surface-500">Memuat laporan expired...</div>;
    const items = expiredData?.data?.data || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
            <tr>
              <th className="px-6 py-4">Produk & Varian</th>
              <th className="px-6 py-4">Batch & Expired</th>
              <th className="px-6 py-4">Lokasi Saat Ini</th>
              <th className="px-6 py-4 text-right">Kuantitas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
            {items.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center">Data tidak ditemukan atau tidak ada barang expired terdekat.</td></tr>
            ) : (
              items.map((item: any, i: number) => {
                const isExpired = new Date(item.expiry_date) < new Date();
                return (
                  <tr key={i} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)]">
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-surface-500">{item.variant_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs">{item.batch_number}</div>
                      <div className={`text-xs font-semibold mt-1 ${isExpired ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {new Date(item.expiry_date).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.location_name}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">{item.quantity}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReturnsTable = () => {
    if (loadingReturns) return <div className="p-8 text-center text-surface-500">Memuat laporan retur...</div>;
    const items = returnsData?.data?.data || [];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
            <tr>
              <th className="px-6 py-4">Tipe Kerusakan (Retur)</th>
              <th className="px-6 py-4">Produk</th>
              <th className="px-6 py-4 text-right">Total Diretur (Kuantitas)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
            {items.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center">Data tidak ditemukan.</td></tr>
            ) : (
              items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)]">
                  <td className="px-6 py-4 font-medium capitalize">{item.return_type.replace('_', ' ')}</td>
                  <td className="px-6 py-4">{item.product_name}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">{item.total_returned}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Laporan & Analitik</h1>
          <p className="text-sm text-surface-500">Pantau performa bisnis, stok, dan mutasi barang.</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-surface-200 dark:border-surface-800">
          <button 
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'sales' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => setActiveTab('sales')}
          >
            <BarChart3 className="h-4 w-4" /> Performa Penjualan
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'stock' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => setActiveTab('stock')}
          >
            <Package className="h-4 w-4" /> Stok per Lokasi
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'expired' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => setActiveTab('expired')}
          >
            <AlertTriangle className="h-4 w-4" /> Peringatan Kedaluwarsa
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'returns' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => setActiveTab('returns')}
          >
            <RefreshCcw className="h-4 w-4" /> Rekapitulasi Retur
          </button>
        </div>
        
        <div className="p-4 bg-surface-50 dark:bg-[hsl(224,20%,12%)] border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
          <span className="text-sm text-surface-500">Menampilkan data real-time hingga hari ini.</span>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter Lanjutan
          </Button>
        </div>

        <div>
          {activeTab === 'sales' && renderSalesTable()}
          {activeTab === 'stock' && renderStockTable()}
          {activeTab === 'expired' && renderExpiredTable()}
          {activeTab === 'returns' && renderReturnsTable()}
        </div>
      </div>
    </div>
  );
};
