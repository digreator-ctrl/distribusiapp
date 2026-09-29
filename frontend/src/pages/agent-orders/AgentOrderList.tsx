import { useTable } from "@refinedev/core";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const AgentOrderList = () => {
  const navigate = useNavigate();

  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
  } = useTable({
    resource: "agent_orders",
    syncWithLocation: false,
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pesanan Agen</h1>
          <p className="text-sm text-surface-500">Kelola riwayat pesanan dan distribusi ke agen.</p>
        </div>
        <Button onClick={() => navigate("/agent-orders/create")}>
          <Plus className="h-4 w-4 mr-2" /> Buat Pesanan
        </Button>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4">Nomor Pesanan</th>
                <th className="px-6 py-4">Agen</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-surface-500">Memuat data...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-surface-500">Tidak ada pesanan.</td>
                </tr>
              ) : (
                orders.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">{item.order_number}</td>
                    <td className="px-6 py-4 text-surface-900 dark:text-surface-100">{item.agent_name}</td>
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                      {new Date(item.order_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-medium">Rp {item.total?.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                        item.status === 'completed' || item.status === 'shipped' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/agent-orders/${item.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setCurrent(current - 1)}>Sebelumnya</Button>
            <span className="text-sm text-surface-600 dark:text-surface-400">Halaman {current} dari {pageCount}</span>
            <Button variant="outline" size="sm" disabled={current === pageCount} onClick={() => setCurrent(current + 1)}>Selanjutnya</Button>
          </div>
        )}
      </div>
    </div>
  );
};
