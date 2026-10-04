import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, CheckCircle2, XCircle } from "lucide-react";

// Komponen Notifikasi Float Kustom
const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-5">
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm max-w-sm ${
        type === "success" 
          ? "bg-green-50 border-green-200 text-green-800" 
          : "bg-red-50 border-red-200 text-red-800"
      }`}>
        {type === "success" ? (
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-bold">{type === "success" ? "Berhasil!" : "Gagal Validasi!"}</p>
          <p className="text-xs mt-1 opacity-90 leading-relaxed">{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-lg opacity-50 hover:opacity-100 transition-opacity">×</button>
      </div>
    </div>
  );
};

export const AgentCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    status: "Aktif",
    notes: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Manual
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Nama Agen wajib diisi!";
    if (!formData.contact.trim()) newErrors.contact = "Kontak wajib diisi!";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: "Terdapat kolom wajib yang belum terisi. Silakan periksa kembali form Anda.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:8787/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan agen baru");

      navigate("/agents", { state: { successMessage: `Agen ${formData.name} berhasil ditambahkan.` } });
    } catch (err: any) {
      setToast({ message: err.message || "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-card p-8 rounded-2xl border shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tambah Agen Baru</h1>
            <p className="text-muted-foreground mt-1 text-sm">Formulir pendaftaran agen distribusi.</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate("/agents")}
            className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition"
          >
            Batal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full" noValidate>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nama Agen <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${
                  errors.name ? "border-red-500 focus:ring-red-500/20 bg-red-50/50" : "focus:ring-primary/20"
                }`}
                placeholder="Contoh: Toko Berkah"
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Kontak (No HP / Telp) <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                value={formData.contact}
                onChange={(e) => {
                  // Hanya izinkan angka
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setFormData(prev => ({ ...prev, contact: val }));
                  if (errors.contact) setErrors(prev => ({ ...prev, contact: "" }));
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${
                  errors.contact ? "border-red-500 focus:ring-red-500/20 bg-red-50/50" : "focus:ring-primary/20"
                }`}
                placeholder="Contoh: 081234567890"
              />
              {errors.contact && <p className="text-xs text-red-500 font-medium">{errors.contact}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Status <span className="text-red-500">*</span></label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Catatan</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
                placeholder="Tambahkan catatan khusus tentang agen ini (opsional)"
              />
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Menyimpan..." : <><Save className="w-4 h-4" /> Simpan Agen</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
