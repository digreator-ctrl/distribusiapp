import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Trash2, Edit3, Package, FileText, User } from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";

export const StockRequestShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("distribusi_role") || "admin";
  const isSales = role === "sales";
  
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<{isOpen: boolean, action: 'delete' | 'approved' | 'rejected' | null}>({isOpen: false, action: null});

  const fetchRequest = async () => {
    try {
      const res = await fetch(`http://localhost:8787/api/stock-requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      } else {
        alert("Data tidak ditemukan");
        navigate(isSales ? "/sales/stock-requests" : "/stock-requests");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRespond = async (status: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:8787/api/stock-requests/${id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          response_note: responseNote,
          items: request.items.map((i: any) => ({
            id: i.id,
            approved_quantity: i.approved_quantity !== undefined ? i.approved_quantity : i.quantity
          }))
        })
      });

      if (res.ok) {
        alert("Berhasil memproses dokumen");
        fetchRequest();
      } else {
        const err = await res.json();
        alert(err.message || "Gagal memproses dokumen");
      }
    } catch (error) {
      console.error(error);
      alert("Kesalahan koneksi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:8787/api/stock-requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        navigate(isSales ? "/sales/stock-requests" : "/stock-requests", {
          state: { successMessage: "Berhasil membatalkan pengajuan" }
        });
      } else {
        const err = await res.json();
        alert(err.message || "Gagal menghapus");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleItemApproveQtyChange = (itemId: string, val: number) => {
    setRequest((prev: any) => ({
      ...prev,
      items: prev.items.map((i: any) => i.id === itemId ? { ...i, approved_quantity: val } : i)
    }));
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Memuat...</div>;
  if (!request) return null;

  // Logika Siapa yang Boleh Memproses
  // Admin memproses type = request. Sales memproses type = recommendation.
  const canRespond = request.status === 'pending' && (
    (role === 'admin' || role === 'owner') && request.type === 'request' ||
    role === 'sales' && request.type === 'recommendation'
  );

  // Yang membuat boleh menghapus (Admin bisa membatalkan rekomendasinya sendiri, Sales membatalkan pengajuannya sendiri)
  const canDelete = request.status === 'pending' && (
    (role === 'admin' || role === 'owner') && request.type === 'recommendation' ||
    role === 'sales' && request.type === 'request'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(isSales ? "/sales/stock-requests" : "/stock-requests")}
            className="p-2.5 bg-background border rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{request.code}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {request.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <FileText size={14} /> 
              {request.type === 'request' ? 'Pengajuan dari Sales' : 'Rekomendasi dari Admin'}
              <span className="opacity-50">•</span>
              {new Date(request.created_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {canDelete && (
          <button 
            onClick={() => setConfirmAction({ isOpen: true, action: 'delete' })}
            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} /> Batalkan Dokumen
          </button>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmAction.isOpen}
        title={
          confirmAction.action === 'delete' ? "Batalkan Dokumen" :
          confirmAction.action === 'approved' ? "Setujui Permintaan" : "Tolak Permintaan"
        }
        message={
          confirmAction.action === 'delete' ? "Anda yakin ingin membatalkan (menghapus) dokumen ini? Tindakan ini tidak dapat dibatalkan." :
          confirmAction.action === 'approved' ? "Anda yakin ingin MENYETUJUI dokumen ini? Stok akan diproses sesuai dengan kuantitas yang disetujui." :
          "Anda yakin ingin MENOLAK semua permintaan pada dokumen ini?"
        }
        confirmText={
          confirmAction.action === 'delete' ? "Ya, Batalkan" :
          confirmAction.action === 'approved' ? "Setujui" : "Tolak"
        }
        isDestructive={confirmAction.action === 'delete' || confirmAction.action === 'rejected'}
        onConfirm={() => {
          if (confirmAction.action === 'delete') handleDelete();
          else if (confirmAction.action) handleRespond(confirmAction.action);
        }}
        onCancel={() => setConfirmAction({ isOpen: false, action: null })}
      />

      <div className="flex flex-col gap-8">
        
        {/* Bagian 1: Info Dokumen & Tujuan */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8 relative overflow-hidden">
          {/* Ornamen Latar Belakang */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <User size={200} />
          </div>

          <h3 className="font-bold border-b pb-4 mb-6 flex items-center gap-3 text-lg">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <User size={20} />
            </div>
            Informasi Distribusi & Tujuan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pembuat Dokumen</p>
              <p className="font-medium capitalize text-base">{request.created_by_role || 'Sistem'}</p>
            </div>
            
            <div className="space-y-1 lg:col-span-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                {request.agen_name ? 'Agen' : (request.type === 'request' ? 'Sales Pengaju' : 'Sales Tujuan')}
              </p>
                <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {(request.agen_name || request.sales_full_name || request.sales_username || "S")?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-base">{request.agen_name || request.sales_full_name || request.sales_username || "Semua Sales (Broadcast)"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 2: Detail Item (SKU) */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 bg-muted/20 border-b border-border flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-3 text-lg">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Package size={20} />
              </div>
              Daftar Barang (SKU)
            </h3>
            <div className="text-sm font-bold bg-background px-4 py-2 rounded-lg border shadow-sm">
              Total: {request.items.reduce((acc: number, val: any) => acc + val.quantity, 0)} pcs
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold w-12 text-center">No</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Nama Produk & Kategori</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Varian (SKU)</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Kedaluarsa</th>
                  <th className="px-6 py-4 font-semibold text-center whitespace-nowrap w-40">Kuantitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {request.items.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4 text-center text-muted-foreground font-medium">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground text-base">{item.product_name}</span>
                        {item.product_category && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                            {item.product_category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{item.variant_name}</span>
                        {item.sku && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded inline-block w-max">SKU: {item.sku}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {request.status === 'pending' && canRespond ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.approved_quantity !== undefined ? item.approved_quantity : item.quantity}
                            onChange={(e) => handleItemApproveQtyChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 p-2 rounded-lg border-2 border-primary/30 text-center font-bold focus:border-primary outline-none transition-colors mx-auto block"
                          />
                          <span className="text-xs text-muted-foreground">pcs</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-lg text-foreground">
                            {request.status === 'approved' 
                              ? (item.approved_quantity !== null ? item.approved_quantity : item.quantity)
                              : item.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">pcs</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bagian 3: Catatan (Jika Ada) */}
        {(request.note || request.response_note) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {request.note && (
              <div className="bg-card rounded-2xl border shadow-sm p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Catatan Pengaju</h3>
                <div className="p-4 bg-muted/30 rounded-xl text-base border-l-4 border-l-slate-400">
                  {request.note}
                </div>
              </div>
            )}
            
            {request.response_note && (
              <div className="bg-card rounded-2xl border shadow-sm p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Catatan Respons</h3>
                <div className={`p-4 rounded-xl text-base border-l-4 ${
                  request.status === 'approved' ? 'bg-emerald-50 border-l-emerald-500' : 'bg-red-50 border-l-red-500'
                }`}>
                  {request.response_note}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bagian 4: Aksi Respons (Admin/Pihak Terkait) */}
        {canRespond && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-3 text-xl border-b border-blue-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
                <Edit3 size={24} />
              </div>
              Berikan Tindakan (Respons)
            </h3>
            
            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3 block">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="Ketik alasan jika disetujui sebagian, ditolak, atau pesan lainnya..."
                  rows={3}
                  className="w-full p-4 rounded-2xl border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none resize-none bg-white text-base transition-all"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => setConfirmAction({ isOpen: true, action: 'approved' })}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                >
                  <CheckCircle2 size={24} /> Setujui Permintaan
                </button>
                <button
                  onClick={() => setConfirmAction({ isOpen: true, action: 'rejected' })}
                  disabled={isProcessing}
                  className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-4 px-6 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                >
                  <XCircle size={24} /> Tolak Semuanya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
