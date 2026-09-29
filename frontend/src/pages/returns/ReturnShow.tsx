import { useShow, useCustomMutation } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, CheckCircle, XCircle, FileText, Package, AlertCircle } from "lucide-react";

export const ReturnShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { queryResult, refetch } = useShow({
    resource: "returns",
    id,
  });

  const { mutate: changeStatus, isLoading: isMutating } = useCustomMutation();

  const returnData = queryResult.data?.data;
  const items = returnData?.items || [];

  const handleStatusChange = (newStatus: string) => {
    let confirmMsg = `Apakah Anda yakin ingin mengubah status retur menjadi ${newStatus.toUpperCase()}?`;
    if (newStatus === 'completed') {
      confirmMsg += "\n\nPERINGATAN: Tindakan ini akan memotong stok secara otomatis (menarik barang rusak dan mengirim barang pengganti jika ada).";
    }
    
    if (!window.confirm(confirmMsg)) return;

    changeStatus({
      url: `/api/returns/${id}/status`,
      method: "put",
      values: { status: newStatus }
    }, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        alert(error?.message || "Gagal mengubah status");
      }
    });
  };

  if (queryResult.isLoading) return <div className="p-4">Memuat data...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'verified':
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_process': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-400';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/returns")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Detail Retur #{returnData?.return_number}</h1>
            <p className="text-sm text-surface-500">Tanggal Pengajuan: {new Date(returnData?.return_date).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
        
        <div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${getStatusColor(returnData?.status)}`}>
            {returnData?.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {returnData?.status === 'pending' && (
        <div className="bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 border border-blue-200 dark:border-blue-800/50">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">Menunggu Verifikasi Admin</h4>
            <p className="text-sm mt-1">Silakan periksa detail retur. Jika valid, Anda dapat memverifikasi atau menyetujuinya.</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleStatusChange('verified')}>
                <CheckCircle className="h-4 w-4 mr-2" /> Verifikasi Dokumen
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleStatusChange('rejected')}>
                <XCircle className="h-4 w-4 mr-2" /> Tolak Retur
              </Button>
            </div>
          </div>
        </div>
      )}

      {['verified', 'approved'].includes(returnData?.status) && (
        <div className="bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-300 p-4 rounded-xl flex items-start gap-3 border border-purple-200 dark:border-purple-800/50">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
          <div>
            <h4 className="font-semibold text-purple-800 dark:text-purple-300">Retur Disetujui</h4>
            <p className="text-sm mt-1">Dokumen telah diverifikasi. Lanjutkan ke proses penerimaan fisik barang ke gudang.</p>
            <div className="mt-3">
              <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => handleStatusChange('in_process')}>
                Mulai Proses Penerimaan Fisik
              </Button>
            </div>
          </div>
        </div>
      )}

      {returnData?.status === 'in_process' && (
        <div className="bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-xl flex items-start gap-3 border border-green-200 dark:border-green-800/50">
          <Package className="h-5 w-5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
          <div>
            <h4 className="font-semibold text-green-800 dark:text-green-300">Proses Finalisasi</h4>
            <p className="text-sm mt-1">Selesaikan retur jika fisik barang sudah diterima di gudang retur (dan barang pengganti sudah disiapkan jika ada).</p>
            <p className="text-xs font-semibold mt-1">Catatan: Menekan tombol Selesai akan secara otomatis memutasi stok sistem.</p>
            <div className="mt-3">
              <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleStatusChange('completed')}>
                <CheckCircle className="h-4 w-4 mr-2" /> Selesaikan & Eksekusi Mutasi Stok
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-200 dark:border-surface-800 pb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-surface-500" /> Detail
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-surface-500">Tipe Retur Utama</span>
                <span className="font-medium text-surface-900 dark:text-surface-100 capitalize">{returnData?.return_type.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-surface-500">Sumber Barang</span>
                <span className="font-medium text-surface-900 dark:text-surface-100 capitalize">{returnData?.source_type}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-surface-500">Tujuan Routing Logistik</span>
                <span className="font-medium text-surface-900 dark:text-surface-100 capitalize">{returnData?.destination_type}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-surface-500">Dibuat Oleh</span>
                <span className="font-medium text-surface-900 dark:text-surface-100">{returnData?.created_by_name || '-'}</span>
              </div>
              {returnData?.notes && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-surface-500">Catatan</span>
                  <span className="text-sm text-surface-700 dark:text-surface-300">{returnData.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-[hsl(224,20%,12%)]">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Item Retur & Penggantian</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white dark:bg-[hsl(224,20%,10%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Kondisi</th>
                    <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Jml Tarik</th>
                    <th className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">Jml Ganti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800 bg-white dark:bg-[hsl(224,20%,10%)]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-surface-500">Tidak ada item dalam dokumen ini.</td>
                    </tr>
                  ) : (
                    items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-surface-900 dark:text-surface-100">{item.product_name}</div>
                          <div className="text-xs text-surface-500">{item.variant_name}</div>
                        </td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400 capitalize">{item.condition}</td>
                        <td className="px-4 py-3 text-center font-bold text-red-600 dark:text-red-400">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {item.replacement_quantity > 0 ? `+${item.replacement_quantity}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
