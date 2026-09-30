import { useTable } from "@refinedev/core";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const SalesVisitList = () => {
  const navigate = useNavigate();

  const {
    tableQuery: { data, isLoading },
    currentPage,
    setCurrentPage,
    pageCount,
  } = useTable({
    resource: "sales_visits",
    syncWithLocation: false,
  });

  const visits = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Riwayat Kunjungan</h1>
          <p className="text-sm text-surface-500">Pantau aktivitas sales mengunjungi toko dan mutasi barang.</p>
        </div>
        <Button onClick={() => navigate("/sales-visits/create")} className="bg-primary-600 hover:bg-primary-700 text-white">
          <MapPin className="h-4 w-4 mr-2" /> Mulai Kunjungan (Check-in)
        </Button>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Toko</th>
                <th className="px-6 py-4">Sales</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Memuat data...</td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Belum ada riwayat kunjungan.</td>
                </tr>
              ) : (
                visits.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-900 dark:text-surface-100">{new Date(item.visit_date).toLocaleDateString('id-ID')}</div>
                      <div className="text-xs text-surface-500">{item.visit_time || "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">{item.store_name}</td>
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400">{item.sales_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                        item.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : item.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'in_progress' ? (
                        <Link to={`/sales-visits/${item.id}/edit`}>
                          <Button variant="default" size="sm">Lanjutkan</Button>
                        </Link>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="h-4 w-4 mr-2" /> Selesai
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Sebelumnya</Button>
            <span className="text-sm text-surface-600 dark:text-surface-400">Halaman {currentPage} dari {pageCount}</span>
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setCurrentPage(currentPage + 1)}>Selanjutnya</Button>
          </div>
        )}
      </div>
    </div>
  );
};
