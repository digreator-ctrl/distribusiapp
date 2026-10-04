import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Package } from "lucide-react";

export const StockRequestCreate = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("distribusi_role") || "admin";
  const isSales = role === "sales";
  
  // Tipe default jika Admin = recommendation, jika Sales = request
  const [type, setType] = useState(isSales ? "request" : "recommendation");
  const [targetType, setTargetType] = useState("sales"); // sales atau agen
  const [note, setNote] = useState("");
  const [salesId, setSalesId] = useState("");
  const [agenId, setAgenId] = useState("");
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState([{ variant_id: "", batch_id: "", quantity: 1 }]);
  
  const [variants, setVariants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch variants
        const resProd = await fetch("http://localhost:8787/api/products");
        if (resProd.ok) {
          const products = await resProd.json();
          let allVariants: any[] = [];
          products.forEach((p: any) => {
            p.variants?.forEach((v: any) => {
              allVariants.push({ ...v, product_id: p.id, product_name: p.name });
            });
          });
          setVariants(allVariants);
        }

        // Fetch batches (inbound)
        const resBatches = await fetch("http://localhost:8787/api/inbound_batches");
        if (resBatches.ok) {
          setBatches(await resBatches.json());
        }

        // Fetch targets if admin
        if (!isSales) {
          const resUsers = await fetch("http://localhost:8787/api/users");
          if (resUsers.ok) {
            const data = await resUsers.json();
            setUsers(data.filter((u: any) => u.role === "sales"));
          }
          
          const resStores = await fetch("http://localhost:8787/api/stores");
          if (resStores.ok) {
            setStores(await resStores.json());
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, [isSales]);

  const handleAddItem = () => {
    setItems([...items, { variant_id: "", batch_id: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Jika ganti variant, reset batch
    if (field === "variant_id") {
      newItems[index].batch_id = "";
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(i => i.variant_id && i.quantity > 0);
    if (validItems.length === 0) {
      alert("Harap tambahkan minimal 1 item dengan kuantitas > 0");
      return;
    }

    if (!isSales && targetType === "agen" && !agenId) {
      alert("Harap pilih Agen (Toko Mitra) tujuan distribusi.");
      return;
    }
    
    if (!isSales && targetType === "sales" && !salesId) {
      alert("Harap pilih Sales tujuan distribusi.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8787/api/stock-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          target_type: isSales ? 'sales' : targetType,
          sales_id: isSales ? undefined : salesId,
          agen_id: agenId,
          distribution_date: distributionDate,
          priority: "normal",
          note,
          created_by_role: role,
          items: validItems
        })
      });

      if (res.ok) {
        const data = await res.json();
        navigate(isSales ? "/sales/stock-requests" : "/stock-requests", {
          state: { successMessage: `Berhasil membuat ${isSales ? "pengajuan" : "distribusi"} stok (${data.code})` }
        });
      } else {
        const err = await res.json();
        alert(err.message || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(isSales ? "/sales/stock-requests" : "/stock-requests")}
          className="p-2.5 bg-background border rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isSales ? "Buat Pengajuan Stok" : "Distribusi"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {isSales ? "Ajukan permintaan stok barang ke Admin Gudang." : "Kirim stok untuk didistribusikan ke Sales atau Agen."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Informasi Umum</h2>
          <div className="flex flex-col gap-5">
            {!isSales && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tujuan Distribusi</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                  >
                    <option value="sales">Sales</option>
                    <option value="agen">Agen</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tanggal Distribusi</label>
                  <input
                    type="date"
                    value={distributionDate}
                    onChange={(e) => setDistributionDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    required
                    className="w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                </div>

                {targetType === "sales" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Pilih Sales Tujuan</label>
                    <select
                      value={salesId}
                      onChange={(e) => setSalesId(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                      <option value="">-- Pilih Sales --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Pilih Agen Tujuan</label>
                    <select
                      value={agenId}
                      onChange={(e) => setAgenId(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                      <option value="">-- Pilih Agen / Mitra --</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.owner_name})</option>
                      ))}
                    </select>
                    <p className="text-xs text-amber-600 font-medium">*Syarat & Ketentuan Agen: Pastikan min. order terpenuhi. Stok otomatis berkurang jika ke Agen.</p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold">Catatan / Keterangan</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Misal: Persiapan event akhir pekan..."
                rows={isSales ? 3 : 2}
                className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/50 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <div>
              <h2 className="text-lg font-bold">Daftar Item Produk</h2>
              <p className="text-xs text-muted-foreground mt-1">Pilih varian lalu pilih tanggal kedaluwarsanya.</p>
            </div>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
            >
              <Plus size={16} /> Tambah Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              // Cari produk id dari variant yang dipilih untuk memfilter batch
              const selectedVariant = variants.find(v => v.id === item.variant_id);
              const availableBatches = selectedVariant 
                ? batches.filter(b => b.product_id === selectedVariant.product_id) 
                : [];

              return (
                <div key={index} className="flex flex-col gap-4 p-4 rounded-xl border bg-muted/20">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="bg-background p-2.5 rounded-lg border text-muted-foreground hidden md:block mt-6">
                      <Package size={20} />
                    </div>
                    
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Produk / Varian</label>
                      <select
                        value={item.variant_id}
                        onChange={(e) => handleItemChange(index, "variant_id", e.target.value)}
                        required
                        className="w-full p-2.5 rounded-lg border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                      >
                        <option value="">-- Pilih Produk --</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>{v.product_name} - {v.name} {v.sku ? `(${v.sku})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Tanggal Kedaluwarsa</label>
                      <select
                        value={item.batch_id}
                        onChange={(e) => handleItemChange(index, "batch_id", e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                        disabled={!item.variant_id}
                      >
                        <option value="">-- Pilih Kedaluwarsa Stok --</option>
                        {availableBatches.map(b => (
                          <option key={b.id} value={b.id}>
                            Stok: {b.quantity} | Exp: {new Date(b.expired_date).toLocaleDateString('id-ID')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Kuantitas (pcs)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                          className="w-full p-2.5 rounded-lg border bg-background text-center font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                        <span className="text-sm font-medium text-muted-foreground md:hidden">pcs</span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex justify-end mt-5">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="p-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition disabled:opacity-30 flex items-center justify-center w-full md:w-auto border md:border-transparent bg-background md:bg-transparent mt-2 md:mt-0"
                      >
                        <Trash2 size={18} className="md:mr-0 mr-2" />
                        <span className="md:hidden font-semibold">Hapus Item</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 z-10 p-4 bg-background/80 backdrop-blur-md rounded-2xl border shadow-lg">
          <button
            type="button"
            onClick={() => navigate(isSales ? "/sales/stock-requests" : "/stock-requests")}
            className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
          >
            <Save size={20} />
            {isLoading ? "Menyimpan..." : "Simpan Dokumen"}
          </button>
        </div>
      </form>
    </div>
  );
};
