import { useShow, useCustomMutation } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Truck, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const AgentOrderShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { queryResult } = useShow({
    resource: "agent_orders",
    id,
  });

  const { mutate, isLoading: isUpdating } = useCustomMutation();

  const order = queryResult.data?.data;
  const items = order?.items || [];

  const handleUpdateStatus = (newStatus: string) => {
    if (!window.confirm(`Yakin ingin mengubah status menjadi ${newStatus}?`)) return;

    mutate({
      url: `/api/agent_orders/${id}/status`,
      method: "put",
      values: { status: newStatus },
    }, {
      onSuccess: () => {
        queryResult.refetch();
        alert(`Status berhasil diperbarui menjadi ${newStatus}!`);
      },
      onError: (error) => {
        alert(error?.message || "Gagal memperbarui status");
      }
    });
  };

  if (queryResult.isLoading) return <div className="p-4">Memuat data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/agent-orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pesanan #{order?.order_number}</h1>
            <p className="text-sm text-surface-500">Agen: {order?.agent_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order?.status === 'pending' && (
            <>
              <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleUpdateStatus('cancelled')} disabled={isUpdating}>
                <XCircle className="h-4 w-4 mr-2" /> Batalkan
              </Button>
              <Button onClick={() => handleUpdateStatus('approved')} disabled={isUpdating}>
                <CheckCircle className="h-4 w-4 mr-2" /> Setujui Pesanan
              </Button>
            </>
          )}
          {order?.status === 'approved' && (
            <Button onClick={() => handleUpdateStatus('preparing')} disabled={isUpdating}>
              <Package className="h-4 w-4 mr-2" /> Siapkan Barang
            </Button>
          )}
          {order?.status === 'preparing' && (
            <Button className="bg-primary-600 hover:bg-primary-700 text-white" onClick={() => handleUpdateStatus('shipped')} disabled={isUpdating}>
              <Truck className="h-4 w-4 mr-2" /> Distribusikan Barang
            </Button>
          )}
          {order?.status === 'shipped' && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus('completed')} disabled={isUpdating}>
              <CheckCircle className="h-4 w-4 mr-2" /> Selesai
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Item Pesanan</h2>
              <span className="text-sm text-surface-500">{items.length} macam produk</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3 text-right">Kuantitas</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                  {items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-surface-900 dark:text-surface-100">{item.product_name}</div>
                        {item.variant_name && <div className="text-xs text-surface-500">{item.variant_name}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-surface-500">Rp {item.price?.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right font-semibold">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-200 dark:border-surface-800 pb-2">Ringkasan</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Tanggal Order</span>
                <span className="font-medium">{new Date(order?.order_date).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Status</span>
                <span className={`font-medium capitalize px-2 py-0.5 rounded text-xs ${
                  order?.status === 'completed' || order?.status === 'shipped' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : order?.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {order?.status}
                </span>
              </div>
              {order?.notes && (
                <div className="pt-2 border-t border-surface-200 dark:border-surface-800">
                  <span className="text-surface-500 block mb-1">Catatan:</span>
                  <p className="text-surface-900 dark:text-surface-100 bg-surface-50 dark:bg-[hsl(224,20%,12%)] p-2 rounded">{order.notes}</p>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t border-surface-200 dark:border-surface-800 text-base">
                <span className="font-semibold">Total Nilai</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">Rp {order?.total?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
