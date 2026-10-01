import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const SupplierShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`${API_URL}/suppliers/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil detail supplier");
        const data = await res.json();
        setSupplier(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  if (isLoading) {
    return <div className="py-10 text-center animate-pulse">Memuat detail supplier...</div>;
  }

  if (!supplier) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-bold">Supplier tidak ditemukan.</p>
        <button onClick={() => navigate("/suppliers")} className="mt-4 px-4 py-2 border rounded shadow-sm">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detail Supplier</h1>
          <p className="text-muted-foreground mt-1">Informasi lengkap produsen atau supplier.</p>
        </div>
        <button onClick={() => navigate("/suppliers")} className="px-4 py-2 border rounded-md font-medium shadow-sm hover:bg-muted transition">
          Kembali ke Daftar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Informasi Utama</h2>
          
          <div>
            <p className="text-sm text-muted-foreground">Nama Perusahaan / Toko</p>
            <p className="font-semibold text-lg">{supplier.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID Supplier</p>
            <p className="font-mono text-xs">{supplier.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Terdaftar</p>
            <p className="font-medium">{new Date(supplier.created_at).toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Kontak & Alamat</h2>
          
          <div>
            <p className="text-sm text-muted-foreground">Kontak Person (PIC)</p>
            <p className="font-semibold">{supplier.contact_person || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nomor Telepon</p>
            <p className="font-medium">{supplier.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Alamat Lengkap</p>
            <p className="font-medium mt-1">{supplier.address || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
