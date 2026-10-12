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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Disetujui</span>;
      case "rejected":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Ditolak</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Menunggu</span>;
    }
  };

  return (
    <div className={isSales ? "space-y-4" : "max-w-5xl mx-auto space-y-6"}>
      {/* SISI SALES (MOBILE) */}
      {isSales ? (
        <>
          {/* Header Mobile Ringkas */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                onClick={() => navigate("/sales/stock-requests")}
                className="p-2 bg-background border border-border rounded-xl hover:bg-muted transition-colors shrink-0"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-foreground truncate">{request.code}</h1>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {request.type === 'request' ? 'Pengajuan Saya' : 'Rekomendasi Admin'} • {new Date(request.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {canDelete && (
              <button 
                onClick={() => setConfirmAction({ isOpen: true, action: 'delete' })}
                className="h-8 px-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Trash2 size={13} />
                <span>Batal</span>
              </button>
            )}
          </div>

          {/* Info Ringkasan Dokumen */}
          <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-primary" />
                Informasi Dokumen
              </h3>
              <span className="text-xs text-muted-foreground">
                {request.distribution_date ? `Tgl: ${new Date(request.distribution_date).toLocaleDateString('id-ID')}` : '-'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-muted/20 rounded-xl border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tipe Dokumen</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {request.type === 'request' ? 'Pengajuan Stok' : 'Rekomendasi Stok'}
                </p>
              </div>
              <div className="p-2.5 bg-muted/20 rounded-xl border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pembuat</p>
                <p className="font-semibold text-foreground mt-0.5 capitalize">
                  {request.created_by_role === 'owner' ? 'Owner / Pusat' : request.created_by_role === 'admin' ? 'Admin Gudang' : 'Sales'}
                </p>
              </div>
            </div>
          </div>

          {/* Daftar Produk (SKU) Mobile Card */}
          <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package size={14} className="text-primary" />
                Daftar Produk ({request.items.length} SKU)
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-lg">
                Total: {request.items.reduce((acc: number, val: any) => acc + val.quantity, 0)} pcs
              </span>
            </div>

            <div className="space-y-2.5">
              {request.items.map((item: any) => (
                <div key={item.id} className="p-3 bg-muted/20 border border-border/50 rounded-xl space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-foreground truncate">{item.product_name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{item.variant_name}</span>
                        {item.sku && <span>• SKU: {item.sku}</span>}
                        {item.product_category && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">
                            {item.product_category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-foreground">
                        {request.status === 'approved' 
                          ? (item.approved_quantity !== null ? item.approved_quantity : item.quantity)
                          : item.quantity} pcs
                      </span>
                      <p className="text-[10px] text-muted-foreground">Kuantitas</p>
                    </div>
                  </div>

                  {item.expired_date && (
                    <div className="text-[10px] text-muted-foreground pt-1.5 border-t border-border/30 flex justify-between">
                      <span>Kedaluwarsa:</span>
                      <span className="font-medium text-foreground">{new Date(item.expired_date).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}

                  {request.status === 'pending' && canRespond && (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Jumlah Diterima:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.approved_quantity !== undefined ? item.approved_quantity : item.quantity}
                          onChange={(e) => handleItemApproveQtyChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 p-1 text-center font-bold text-xs rounded-lg border border-primary/40 bg-background focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-xs text-muted-foreground">pcs</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Catatan (Jika ada) */}
          {(request.note || request.response_note) && (
            <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Catatan</h3>
              {request.note && (
                <div className="p-2.5 bg-muted/20 rounded-xl border border-border/40 text-xs">
                  <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Catatan Pengaju:</span>
                  <p className="text-foreground mt-0.5">{request.note}</p>
                </div>
              )}
              {request.response_note && (
                <div className={`p-2.5 rounded-xl border text-xs ${
                  request.status === 'approved' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-red-50/70 border-red-200 text-red-900'
                }`}>
                  <span className="font-semibold block text-[10px] uppercase">Catatan Respons:</span>
                  <p className="mt-0.5">{request.response_note}</p>
                </div>
              )}
            </div>
          )}

          {/* Tindakan Respons untuk Sales */}
          {canRespond && (
            <div className="bg-card rounded-2xl border border-primary/20 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-border/50">
                <div className="bg-primary/10 p-1.5 rounded-lg text-primary shrink-0">
                  <Edit3 size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-foreground">Tanggapi Rekomendasi</h3>
                  <p className="text-[11px] text-muted-foreground">Terima atau tolak alokasi stok dari Admin</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="Tulis catatan jika diperlukan..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-input text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setConfirmAction({ isOpen: true, action: 'approved' })}
                  disabled={isProcessing}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  <span>Terima Stok</span>
                </button>
                <button
                  onClick={() => setConfirmAction({ isOpen: true, action: 'rejected' })}
                  disabled={isProcessing}
                  className="h-10 bg-background border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle size={15} />
                  <span>Tolak</span>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* SISI DESKTOP (ADMIN / OWNER) */
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/stock-requests")}
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

          <div className="flex flex-col gap-6">
            {/* Bagian 1: Info Dokumen & Tujuan */}
            <div className="bg-card rounded-2xl border shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <User size={200} />
              </div>

              <h3 className="font-bold border-b pb-4 mb-6 flex items-center gap-3 text-lg">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <User size={20} />
                </div>
                Informasi Distribusi & Tujuan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pembuat Dokumen</p>
                  <p className="font-medium capitalize text-base">{request.created_by_role || 'Sistem'}</p>
                </div>
                
                <div className="space-y-1 lg:col-span-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    {request.agen_name ? 'Agen' : (request.type === 'request' ? 'Sales Pengaju' : 'Sales Tujuan')}
                  </p>
                  <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                      {(request.agen_name || request.sales_full_name || request.sales_username || "S")?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{request.agen_name || request.sales_full_name || request.sales_username || "Semua Sales (Broadcast)"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: Detail Item (SKU) */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-5 bg-muted/20 border-b border-border flex items-center justify-between">
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
                      <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Kedaluwarsa</th>
                      <th className="px-6 py-4 font-semibold text-center whitespace-nowrap w-40">Kuantitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {request.items.map((item: any, idx: number) => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4 text-center text-muted-foreground font-medium">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground">{item.product_name}</span>
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
                              <span className="font-bold text-base text-foreground">
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

            {/* Bagian 3: Catatan */}
            {(request.note || request.response_note) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {request.note && (
                  <div className="bg-card rounded-2xl border shadow-sm p-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Catatan Pengaju</h3>
                    <div className="p-4 bg-muted/30 rounded-xl text-sm border-l-4 border-l-slate-400">
                      {request.note}
                    </div>
                  </div>
                )}
                
                {request.response_note && (
                  <div className="bg-card rounded-2xl border shadow-sm p-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Catatan Respons</h3>
                    <div className={`p-4 rounded-xl text-sm border-l-4 ${
                      request.status === 'approved' ? 'bg-emerald-50 border-l-emerald-500' : 'bg-red-50 border-l-red-500'
                    }`}>
                      {request.response_note}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bagian 4: Aksi Respons (Admin) */}
            {canRespond && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-3 text-lg border-b border-blue-100 pb-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
                    <Edit3 size={20} />
                  </div>
                  Berikan Tindakan (Respons)
                </h3>
                
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">Catatan Tambahan (Opsional)</label>
                    <textarea
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      placeholder="Ketik catatan tambahan..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-blue-200 focus:border-blue-400 outline-none resize-none bg-white text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setConfirmAction({ isOpen: true, action: 'approved' })}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 size={18} /> Setujui Permintaan
                    </button>
                    <button
                      onClick={() => setConfirmAction({ isOpen: true, action: 'rejected' })}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <XCircle size={18} /> Tolak Semuanya
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Konfirmasi */}
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
    </div>
  );
};
