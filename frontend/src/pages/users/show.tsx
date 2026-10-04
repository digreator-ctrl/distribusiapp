import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User as UserIcon, ArrowLeft, Shield, MapPin, Phone, Calendar, Hash, Edit3, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";

const API_URL = "http://localhost:8787/api";

export const UserShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = localStorage.getItem("distribusi_role") || "admin";
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil detail pengguna");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus pengguna");
      navigate("/users", { state: { successMessage: `Pengguna ${user.username} berhasil dihapus.` } });
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card p-8 rounded-2xl border shadow-sm h-64 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse font-medium">Memuat data pengguna...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-card p-8 rounded-2xl border shadow-sm text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Pengguna Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">Data pengguna dengan ID tersebut tidak ada atau telah dihapus.</p>
        <button onClick={() => navigate("/users")} className="px-4 py-2 border rounded-lg hover:bg-muted font-medium">
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
        <button 
          onClick={() => navigate("/users")}
          className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserIcon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.full_name || user.username}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground font-medium">@{user.username}</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
              user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
              'bg-sky-100 text-sky-800'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(`/users/${id}/edit`)}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Pengguna
          </button>
          
          {role === 'owner' && (
            <button 
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        title="Konfirmasi Hapus Pengguna"
        message={`Anda yakin ingin menghapus pengguna ${user.full_name || user.username}? Tindakan ini akan menghapus data secara permanen dan tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Data Sistem */}
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Data Akun Sistem
          </h3>
          
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">ID Pengguna (Sistem)</p>
              <p className="font-mono text-sm font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Terdaftar Pada</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Status Akses (RBAC)</p>
              <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Data Pribadi KTP */}
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Data Profil Pribadi
          </h3>
          
          <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Tempat, Tanggal Lahir</p>
                <p className="font-medium">
                  {!user.place_of_birth && !user.date_of_birth ? '-' : `${user.place_of_birth || '-'} ${user.date_of_birth ? `, ${new Date(user.date_of_birth).toLocaleDateString('id-ID')}` : ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Jenis Kelamin</p>
                <p className="font-medium">
                  {user.gender === 'L' ? 'Laki-Laki' : user.gender === 'P' ? 'Perempuan' : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Nomor Telepon/HP</p>
                <p className="font-medium">{user.phone || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Alamat Lengkap</p>
                <p className="font-medium whitespace-pre-wrap leading-relaxed">{user.address || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
