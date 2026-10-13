import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle2, XCircle, Trash2, Edit3, Package, 
  FileText, User, AlertCircle 
} from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";

// Komponen Web Toast Floating Notification
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200 w-[92%] max-w-sm">
      <div className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border-2 backdrop-blur-md ${
        type === "success" 
          ? "bg-emerald-50/95 border-emerald-400 text-emerald-950 ring-4 ring-emerald-500/10" 
          : "bg-red-50/95 border-red-400 text-red-950 ring-4 ring-red-500/10"
      }`}>
        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
          type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
        }`}>
          {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs">
            {type === "success" ? "Berhasil!" : "Peringatan / Kesalahan"}
          </p>
          <p className="text-xs mt-0.5 leading-relaxed font-medium opacity-90">{message}</p>
        </div>
        <button 
          type="button" 
          onClick={onClose} 
          className="p-1 text-muted-foreground hover:text-foreground transition-opacity"
          title="Tutup"
        >
          <XCircle size={18} />
        </button>
      </div>
    </div>
  );
};

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

  // Validasi error state per item dan web toast notification
  const [qtyErrors, setQtyErrors] = useState<{ [itemId: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`http://localhost:8787/api/stock-requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        // Inisialisasi approved_quantity kosong ("") jika status masih pending dan butuh respons pengguna,
        // sehingga kolom Jumlah Diterima belum terisi dan wajib diisi oleh pengguna.
        const isNeedsResponse = data.status === 'pending';
        const formattedItems = (data.items || []).map((i: any) => ({
          ...i,
          approved_quantity: isNeedsResponse
            ? (i.approved_quantity !== null && i.approved_quantity !== undefined ? i.approved_quantity : "")
            : (i.approved_quantity !== null && i.approved_quantity !== undefined ? i.approved_quantity : i.quantity)
        }));
        setRequest({ ...data, items: formattedItems });
        setQtyErrors({});
      } else {
        setToast({ message: "Data dokumen tidak ditemukan", type: "error" });
        setTimeout(() => {
          navigate(isSales ? "/sales/stock-requests" : "/stock-requests");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Gagal memuat data dokumen", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handler perubahan kuantitas yang diterima
  const handleItemApproveQtyChange = (itemId: string, rawVal: string) => {
    const item = request?.items?.find((i: any) => i.id === itemId);
    const maxQty = item?.quantity || 0;

    let parsedVal: string | number = rawVal;
    if (rawVal !== "") {
      const num = parseInt(rawVal, 10);
      parsedVal = isNaN(num) ? "" : num;
    }

    // Validasi real-time saat mengetik
    const newErrors = { ...qtyErrors };
    if (parsedVal === "") {
      newErrors[itemId] = "Jumlah diterima wajib diinput";
    } else if (Number(parsedVal) < 0) {
      newErrors[itemId] = "Jumlah tidak boleh negatif";
    } else if (Number(parsedVal) > maxQty) {
      newErrors[itemId] = `Maksimal ${maxQty} pcs (tidak boleh melebihi rekomendasi)`;
      setToast({
        message: `Kuantitas untuk "${item?.product_name || 'produk'}" tidak boleh melebihi stok rekomendasi (${maxQty} pcs).`,
        type: "error"
      });
    } else {
      delete newErrors[itemId];
    }
    setQtyErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (toast?.type === "error") setToast(null);
    }

    setRequest((prev: any) => ({
      ...prev,
      items: prev.items.map((i: any) => i.id === itemId ? { ...i, approved_quantity: parsedVal } : i)
    }));
  };

  // Validasi sebelum membuka modal konfirmasi Terima Stok
  const handleInitiateApprove = () => {
    if (!request || !request.items) return;

    const errors: { [key: string]: string } = {};
    let hasError = false;

    request.items.forEach((item: any) => {
      const rawVal = item.approved_quantity;
      const maxQty = item.quantity;

      if (rawVal === "" || rawVal === undefined || rawVal === null) {
        errors[item.id] = "Wajib diinput (belum diisi)";
        hasError = true;
      } else {
        const numVal = Number(rawVal);
        if (isNaN(numVal) || numVal < 0) {
          errors[item.id] = "Jumlah harus berupa angka valid";
          hasError = true;
        } else if (numVal > maxQty) {
          errors[item.id] = `Maksimal ${maxQty} pcs (melebihi stok rekomendasi)`;
          hasError = true;
        }
      }
    });

    if (hasError) {
      setQtyErrors(errors);
      setToast({
        message: "Kolom 'Jumlah Diterima' belum diinput atau melebihi stok rekomendasi. Harap lengkapi kolom yang berwarna merah.",
        type: "error"
      });
      return;
    }

    setQtyErrors({});
    setToast(null);
    setConfirmAction({ isOpen: true, action: 'approved' });
  };

  const handleRespond = async (status: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const itemsPayload = status === 'approved'
        ? request.items.map((i: any) => ({
            id: i.id,
            approved_quantity: Number(i.approved_quantity)
          }))
        : request.items.map((i: any) => ({
            id: i.id,
            approved_quantity: 0
          }));

      const res = await fetch(`http://localhost:8787/api/stock-requests/${id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          response_note: responseNote,
          items: itemsPayload
        })
      });

      if (res.ok) {
        setToast({
          message: status === 'approved' 
            ? "Stok rekomendasi berhasil diterima dan dialokasikan ke akun Anda!" 
            : "Rekomendasi stok telah berhasil ditolak.",
          type: "success"
        });
        window.dispatchEvent(new Event("salesChanged"));
        fetchRequest();
      } else {
        const err = await res.json();
        setToast({ message: err.message || "Gagal memproses dokumen", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setToast({ message: "Terjadi kesalahan koneksi.", type: "error" });
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
        setToast({ message: err.message || "Gagal menghapus dokumen", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setToast({ message: "Terjadi kesalahan koneksi.", type: "error" });
    }
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
    <div className={isSales ? "space-y-4 relative" : "max-w-5xl mx-auto space-y-6 relative"}>
      {/* Web Toast Floating Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

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

            <div className="space-y-3">
              {request.items.map((item: any) => {
                const hasError = !!qtyErrors[item.id];
                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-xl border space-y-2 transition-all ${
                      hasError 
                        ? 'bg-red-50/40 border-red-300 ring-1 ring-red-200' 
                        : 'bg-muted/20 border-border/50'
                    }`}
                  >
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
                        <p className="text-[10px] text-muted-foreground">Stok Rekomendasi</p>
                      </div>
                    </div>

                    {item.expired_date && (
                      <div className="text-[10px] text-muted-foreground pt-1.5 border-t border-border/30 flex justify-between">
                        <span>Kedaluwarsa:</span>
                        <span className="font-medium text-foreground">{new Date(item.expired_date).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}

                    {/* Kolom Input Jumlah Diterima (Khusus saat status pending & canRespond) */}
                    {request.status === 'pending' && canRespond && (
                      <div className="pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-foreground">Jumlah Diterima:</span>
                            <span className="text-[10px] text-muted-foreground block">
                              Maks. {item.quantity} pcs
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              placeholder="Isi qty..."
                              title={hasError ? qtyErrors[item.id] : undefined}
                              value={item.approved_quantity !== undefined ? item.approved_quantity : ""}
                              onChange={(e) => handleItemApproveQtyChange(item.id, e.target.value)}
                              className={`w-24 p-1.5 text-center font-bold text-xs rounded-lg border outline-none transition-all ${
                                hasError
                                  ? "border-2 border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400/20"
                                  : "border-primary/40 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground font-medium">pcs</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                  <p className="text-[11px] text-muted-foreground">Input jumlah fisik yang diterima lalu konfirmasi</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="Tulis catatan penerimaan jika diperlukan..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-input text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInitiateApprove}
                  disabled={isProcessing}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  <span>Terima Stok</span>
                </button>
                <button
                  type="button"
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
                className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Batalkan Dokumen
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Bagian 1: Ringkasan Pengajuan */}
              <div className="bg-card rounded-2xl border shadow-sm p-6">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Detail Pemohon & Tujuan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Tipe Pengajuan</span>
                    <span className="font-semibold capitalize">{request.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Tujuan</span>
                    <span className="font-semibold">
                      {request.agen_name ? `Agen: ${request.agen_name}` : `Sales: ${request.sales_full_name || request.sales_username || 'Semua Sales'}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Tgl Distribusi</span>
                    <span className="font-semibold">{request.distribution_date ? new Date(request.distribution_date).toLocaleDateString('id-ID') : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Prioritas</span>
                    <span className="font-semibold capitalize">{request.priority || 'Normal'}</span>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Daftar Item Produk */}
              <div className="bg-card rounded-2xl border shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Package size={18} className="text-primary" />
                    Rincian Item Produk
                  </h3>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Total: {request.items.reduce((acc: number, val: any) => acc + val.quantity, 0)} pcs
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                      <tr>
                        <th className="px-4 py-3">Produk / Varian</th>
                        <th className="px-4 py-3">Kedaluwarsa</th>
                        <th className="px-4 py-3 text-center">Stok Rekomendasi</th>
                        <th className="px-4 py-3 text-center">Jumlah Disetujui/Diterima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {request.items.map((item: any) => {
                        const hasError = !!qtyErrors[item.id];
                        return (
                          <tr key={item.id} className={hasError ? "bg-red-50/30" : ""}>
                            <td className="px-4 py-3">
                              <p className="font-bold text-foreground">{item.product_name}</p>
                              <span className="text-xs text-muted-foreground">{item.variant_name} {item.sku ? `(${item.sku})` : ''}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">
                              {item.quantity} pcs
                            </td>
                            <td className="px-4 py-3 text-center">
                              {request.status === 'pending' && canRespond ? (
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.quantity}
                                    placeholder="Isi qty..."
                                    title={hasError ? qtyErrors[item.id] : undefined}
                                    value={item.approved_quantity !== undefined ? item.approved_quantity : ""}
                                    onChange={(e) => handleItemApproveQtyChange(item.id, e.target.value)}
                                    className={`w-24 p-2 rounded-lg border-2 text-center font-bold outline-none transition-colors mx-auto block ${
                                      hasError
                                        ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400/20"
                                        : "border-primary/30 focus:border-primary"
                                    }`}
                                  />
                                  <span className="text-xs text-muted-foreground">/ {item.quantity} pcs</span>
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
                        );
                      })}
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

              {/* Bagian 4: Aksi Respons (Admin / Desktop) */}
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
                        type="button"
                        onClick={handleInitiateApprove}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        <CheckCircle2 size={18} /> {request.type === 'request' ? 'Setujui Permintaan' : 'Terima Stok'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ isOpen: true, action: 'rejected' })}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        <XCircle size={18} /> Tolak Semuanya
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Konfirmasi */}
      <ConfirmModal 
        isOpen={confirmAction.isOpen}
        title={
          confirmAction.action === 'delete' ? "Batalkan Dokumen" :
          confirmAction.action === 'approved' 
            ? (request.type === 'recommendation' && isSales ? "Konfirmasi Terima Stok" : "Setujui Permintaan") 
            : "Tolak Permintaan"
        }
        message={
          confirmAction.action === 'delete' ? "Anda yakin ingin membatalkan (menghapus) dokumen ini? Tindakan ini tidak dapat dibatalkan." :
          confirmAction.action === 'approved' 
            ? (request.type === 'recommendation' && isSales 
                ? "Anda yakin ingin MENERIMA stok ini? Stok di gudang akan dialokasikan ke Anda sesuai dengan jumlah yang Anda input." 
                : "Anda yakin ingin MENYETUJUI dokumen ini? Stok akan diproses sesuai dengan kuantitas yang disetujui.")
            : "Anda yakin ingin MENOLAK semua permintaan pada dokumen ini?"
        }
        confirmText={
          confirmAction.action === 'delete' ? "Ya, Batalkan" :
          confirmAction.action === 'approved' ? (request.type === 'recommendation' && isSales ? "Ya, Terima Stok" : "Setujui") : "Tolak"
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
