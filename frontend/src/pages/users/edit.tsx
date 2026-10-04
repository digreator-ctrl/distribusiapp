import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Save, Eye, EyeOff } from "lucide-react";

const API_URL = "http://localhost:8787/api";

// Toast Kustom
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm max-w-sm ${
        type === "success" 
          ? "bg-green-50 border-green-200 text-green-800" 
          : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <span className="text-lg mt-0.5">{type === "success" ? "✅" : "❌"}</span>
        <div className="flex-1">
          <p className="font-bold">{type === "success" ? "Berhasil!" : "Gagal Validasi!"}</p>
          <p className="text-xs mt-0.5 opacity-80">{message}</p>
        </div>
        <button onClick={onClose} className="text-lg font-bold opacity-50 hover:opacity-100">×</button>
      </div>
    </div>
  );
};

export const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    password: "", // Opsional saat edit
    role: "admin",
    full_name: "",
    place_of_birth: "",
    date_of_birth: "",
    gender: "L",
    address: "",
    phone: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        setFormData({
          username: data.username || "",
          password: "",
          role: data.role || "admin",
          full_name: data.full_name || "",
          place_of_birth: data.place_of_birth || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "L",
          address: data.address || "",
          phone: data.phone || ""
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleNextStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nama Lengkap wajib diisi!";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: "Silakan lengkapi kolom yang ditandai merah pada Data Pribadi.", type: "error" });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username wajib diisi!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: "Silakan lengkapi kolom yang ditandai merah pada Data Akun.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Jika password kosong, jangan kirim supaya tidak menimpa password lama
      const payload = { ...formData };
      if (!payload.password) {
        delete (payload as any).password;
      }

      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan perubahan pengguna");

      navigate(`/users/${id}`, { state: { successMessage: `Pengguna ${formData.username} berhasil diperbarui.` } });
    } catch (err: any) {
      setToast({ message: err.message || "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card p-8 rounded-2xl border shadow-sm text-center">Memuat data...</div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-card p-8 rounded-2xl border shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Pengguna</h1>
            <p className="text-muted-foreground mt-1 text-sm">Langkah {step} dari 2</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate(`/users/${id}`)}
            className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition"
          >
            Batal
          </button>
        </div>

        {/* Indikator Step */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-bold text-lg text-primary mb-2">Data Pribadi</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nama Lengkap <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, full_name: e.target.value }));
                    if (errors.full_name) setErrors(prev => ({ ...prev, full_name: "" }));
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${
                    errors.full_name ? "border-red-500 focus:ring-red-500/20 bg-red-50/50" : "focus:ring-primary/20"
                  }`}
                  placeholder="Sesuai nama KTP"
                />
                {errors.full_name && <p className="text-xs text-red-500 font-medium">{errors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Tempat Lahir</label>
                <input 
                  type="text" 
                  value={formData.place_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, place_of_birth: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Kota/Kabupaten"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Tanggal Lahir</label>
                <input 
                  type="date" 
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Jenis Kelamin</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Nomor Telepon/HP</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Alamat Lengkap</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
                  placeholder="Alamat domisili saat ini"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2"
                >
                  Lanjut ke Data Akun <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="font-bold text-lg text-primary mb-2">Data Akun Sistem</h3>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Username <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, username: e.target.value }));
                    if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${
                    errors.username ? "border-red-500 focus:ring-red-500/20 bg-red-50/50" : "focus:ring-primary/20"
                  }`}
                  placeholder="Masukkan username unik"
                />
                {errors.username && <p className="text-xs text-red-500 font-medium">{errors.username}</p>}
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-semibold">Ganti Password (Opsional)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 pr-10 border rounded-lg focus:ring-2 outline-none transition-all focus:ring-primary/20"
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Role / Hak Akses <span className="text-red-500">*</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="owner">Owner (Pemilik)</option>
                  <option value="admin">Admin Gudang</option>
                  <option value="sales">Sales Lapangan</option>
                </select>
              </div>

              <div className="pt-6 flex justify-between">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border rounded-lg font-bold shadow-sm hover:bg-muted transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Menyimpan..." : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};
