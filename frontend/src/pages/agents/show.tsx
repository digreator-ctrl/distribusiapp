import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Phone, Calendar, FileText, CheckCircle2, XCircle, ArrowLeft, Edit3, Trash2, Package } from "lucide-react";

const API_URL = "http://localhost:8787/api";

// Toast Kustom
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-5">
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm max-w-sm ${
        type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}>
        {type === "success" ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-bold">{type === "success" ? "Berhasil!" : "Gagal!"}</p>
          <p className="text-xs mt-0.5 opacity-90">{message}</p>
        </div>
        <button onClick={onClose} className="text-lg font-bold opacity-50 hover:opacity-100 transition-opacity">×</button>
      </div>
    </div>
  );
};

export const AgentShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userRole = localStorage.getItem("distribusi_role") || "admin";

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`${API_URL}/agents/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil detail agen");
        const data = await res.json();
        setAgent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgent();
  }, [id]);

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "Aktif" ? "Non-Aktif" : "Aktif";
    try {
      const res = await fetch(`${API_URL}/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agent, status: newStatus })
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      setAgent({ ...agent, status: newStatus });
      setToast({ message: `Status agen berhasil diubah menjadi ${newStatus}.`, type: "success" });
    } catch {
      setToast({ message: "Gagal mengubah status agen.", type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/agents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menghapus agen");
      }
      setToast({ message: "Agen berhasil dihapus.", type: "success" });
      setTimeout(() => navigate("/agents"), 1200);
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return <div className="py-10 text-center animate-pulse text-muted-foreground">Memuat detail agen...</div>;
  }

  if (!agent) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-bold">Agen tidak ditemukan.</p>
        <button onClick={() => navigate("/agents")} className="mt-4 px-4 py-2 border rounded shadow-sm hover:bg-muted">
          Kembali ke Daftar Agen
        </button>
      </div>
    );
  }

  const distributions = agent.distributions || [];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Hapus Agen Ini?"
        message={`Aksi ini akan menghapus agen "${agent.name}" secara permanen.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <button 
              onClick={() => navigate("/agents")} 
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-muted transition mb-3 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Agen
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                agent.status === "Aktif" ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                ● {agent.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">Informasi profil agen mitra bisnis dan riwayat alokasi distribusi stok.</p>
          </div>
          <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
            <button 
              onClick={toggleStatus} 
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                agent.status === "Aktif" ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {agent.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
            </button>
            <button 
              onClick={() => navigate(`/agents/${id}/edit`)} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            {userRole === "owner" && (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            )}
          </div>
        </div>

        {/* 1. Informasi Utama */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold border-b pb-2 flex items-center justify-between">
            <span>Informasi Utama</span>
            <span className="text-xs font-mono font-normal text-muted-foreground">ID: {agent.id}</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Nama Toko / Agen</p>
              <p className="font-bold text-lg mt-0.5">{agent.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Terdaftar
              </p>
              <p className="font-medium mt-0.5">
                {agent.created_at ? new Date(agent.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Total Pengiriman Distribusi
              </p>
              <p className="font-bold text-lg text-primary mt-0.5">{distributions.length} Distribusi</p>
            </div>
          </div>
        </div>

        {/* 2. Kontak & Catatan */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Kontak & Catatan Khusus</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Nomor Kontak (HP / Telp)
              </p>
              <p className="font-semibold text-base mt-0.5 font-mono">{agent.contact || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Catatan Tambahan
              </p>
              <p className="font-medium text-sm mt-0.5 text-muted-foreground whitespace-pre-line">
                {agent.notes || "Tidak ada catatan khusus."}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Riwayat Distribusi ke Agen Ini */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h2 className="text-lg font-bold">Riwayat Alokasi Distribusi ({distributions.length})</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Daftar stok yang telah dialokasikan atau dikirim ke agen ini.</p>
            </div>
            <button 
              onClick={() => navigate("/stock-requests/create")}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:opacity-90 transition flex items-center gap-1.5"
            >
              + Alokasi Distribusi Baru
            </button>
          </div>

          {distributions.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
              <p className="text-sm text-muted-foreground">Belum ada riwayat alokasi distribusi untuk agen ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Kode Distribusi</th>
                    <th className="px-5 py-3.5 font-semibold">Tanggal Distribusi</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Jumlah Item</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Total Kuantitas</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist: any) => (
                    <tr 
                      key={dist.id}
                      onClick={() => navigate(`/stock-requests/${dist.id}`)}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-bold text-primary hover:underline">
                        {dist.code}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {dist.distribution_date 
                          ? new Date(dist.distribution_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                          : new Date(dist.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium">
                        {dist.item_count || 0} Item
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold">
                        {Number(dist.total_qty || 0).toLocaleString("id-ID")} pcs
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          dist.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : dist.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {dist.status === 'approved' ? 'Disetujui' : dist.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
