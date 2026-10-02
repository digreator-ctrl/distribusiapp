import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

export const SupplierEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    address: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`${API_URL}/suppliers/${id}`);
        if (!res.ok) throw new Error("Supplier tidak ditemukan");
        const data = await res.json();
        setFormData({
          name: data.name || "",
          contact_person: data.contact_person || "",
          phone: data.phone || "",
          address: data.address || ""
        });
      } catch (err: any) {
        setToast({ message: err.message, type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  // Hanya perbolehkan input angka pada kolom nomor HP
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, phone: numericOnly }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    // Validasi field wajib
    if (!formData.name.trim()) {
      newErrors.name = "Nama Perusahaan / Toko wajib diisi!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({
        message: "Mohon lengkapi semua kolom wajib yang ditandai warna merah sebelum menyimpan.",
        type: "error"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Gagal menyimpan data supplier");

      setToast({ message: "Data supplier berhasil diperbarui.", type: "success" });
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || "Terjadi kesalahan saat menyimpan data supplier.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center animate-pulse">Memuat data supplier...</div>;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-card p-8 rounded-2xl border shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Supplier</h1>
            <p className="text-muted-foreground mt-1 text-sm">Ubah data profil supplier atau mitra Anda.</p>
          </div>
          <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition">
            Batal
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-1 ${errors.name ? "text-red-600" : ""}`}>
              Nama Perusahaan / Toko <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => {
                  const updated = { ...prev };
                  delete updated.name;
                  return updated;
                });
              }}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none ${
                errors.name 
                  ? "border-red-500 bg-red-50/70 focus:border-red-500 focus:ring-red-200" 
                  : "border-border bg-background"
              }`}
              placeholder="Misal: PT Sentosa Jaya"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                <span>⚠️</span> {errors.name}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Nama Kontak (PIC)</label>
              <input 
                type="text" 
                value={formData.contact_person}
                onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                placeholder="Misal: Budi"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Nomor Telepon / HP</label>
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
                placeholder="Misal: 08123456789 (Hanya angka)"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Hanya menerima karakter angka</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Alamat Lengkap</label>
            <textarea 
              rows={3}
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background resize-none"
              placeholder="Jalan, Kota..."
            />
          </div>

          <div className="pt-6 border-t flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
