import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const SupplierCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      navigate("/suppliers");
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data supplier.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Supplier</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tambahkan data mitra pembuat produk atau penyuplai.</p>
        </div>
        <button onClick={() => navigate("/suppliers")} className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition">
          Kembali
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1">Nama Perusahaan / Toko *</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
            placeholder="Misal: PT Sentosa Jaya"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-semibold mb-1">Nama Kontak (PIC)</label>
            <input 
              type="text" 
              value={formData.contact_person}
              onChange={e => setFormData({...formData, contact_person: e.target.value})}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              placeholder="Misal: Budi"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Nomor Telepon</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              placeholder="Misal: 08123456789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Alamat Lengkap</label>
          <textarea 
            rows={3}
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/50 outline-none bg-background resize-none"
            placeholder="Jalan, Kota..."
          />
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Data Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
};
