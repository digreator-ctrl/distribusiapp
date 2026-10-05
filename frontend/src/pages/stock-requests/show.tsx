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
    <div className="max-w-4xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border font-bold flex items-center gap-2">
              <Package size={18} /> Detail Item (SKU)
            </div>
            
            <div className="divide-y divide-border">
              {request.items.map((item: any, idx: number) => (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0">
                      <span className="font-bold">{idx + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">{item.variant_name} {item.sku ? `(${item.sku})` : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-muted/30 p-3 rounded-xl border border-border/50 self-start md:self-auto">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Diajukan</p>
                      <p className="font-black text-lg">{item.quantity} <span className="text-xs font-normal">pcs</span></p>
                    </div>

                    {request.status === 'pending' && canRespond ? (
                      <div className="border-l pl-6 border-border">
                        <p className="text-[10px] uppercase font-bold text-primary mb-1">Disetujui</p>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity} // Opsional, bisa lebih
                          value={item.approved_quantity !== undefined ? item.approved_quantity : item.quantity}
                          onChange={(e) => handleItemApproveQtyChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 p-1.5 rounded-md border-2 border-primary/30 text-center font-bold focus:border-primary outline-none"
                        />
                      </div>
                    ) : request.status === 'approved' ? (
                      <div className="border-l pl-6 border-border">
                        <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Disetujui</p>
                        <p className="font-black text-lg text-emerald-700">
                          {item.approved_quantity !== null ? item.approved_quantity : item.quantity} <span className="text-xs font-normal">pcs</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-muted/20 border-t border-border flex justify-between font-bold">
              <span>Total Qty Diajukan</span>
              <span className="text-lg">{request.items.reduce((acc: number, val: any) => acc + val.quantity, 0)} pcs</span>
            </div>
          </div>

          {canRespond && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Edit3 size={18} /> Aksi Respons
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-blue-800 mb-2 block">Catatan Respons (Opsional)</label>
                  <textarea
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    placeholder="Alasan disetujui sebagian, ditolak, dsb..."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmAction({ isOpen: true, action: 'approved' })}
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> Setujui Permintaan
                  </button>
                  <button
                    onClick={() => setConfirmAction({ isOpen: true, action: 'rejected' })}
                    disabled={isProcessing}
                    className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} /> Tolak Semuanya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h3 className="font-bold border-b pb-3 mb-4 flex items-center gap-2">
              <User size={18} className="text-muted-foreground" />
              Info Pengaju / Tujuan
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Dokumen dibuat oleh</p>
                <p className="font-medium capitalize">{request.created_by_role || 'Sistem'}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">
                  {request.agen_name ? 'Agen Tujuan' : (request.type === 'request' ? 'Sales Pengaju' : 'Sales Tujuan')}
                </p>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(request.agen_name || request.sales_full_name || request.sales_username || "S")?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{request.agen_name || request.sales_full_name || request.sales_username || "Semua Sales (Broadcast)"}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.agen_name ? 'Toko Mitra (Agen)' : 'Posisi: Sales Lapangan'}
                    </p>
                  </div>
                </div>
              </div>
              
              {request.priority === 'urgent' && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Prioritas Dokumen</p>
                  <span className="inline-flex px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                    Mendesak (Urgent)
                  </span>
                </div>
              )}
            </div>
          </div>

          {(request.note || request.response_note) && (
            <div className="bg-card rounded-2xl border p-5 shadow-sm space-y-4">
              {request.note && (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2">Catatan Pengaju</h3>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm border">
                    {request.note}
                  </div>
                </div>
              )}
              
              {request.response_note && (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2">Catatan Respons</h3>
                  <div className={`p-3 rounded-lg text-sm border ${
                    request.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    {request.response_note}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
