import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Package, CheckCircle2, XCircle, FileText } from "lucide-react";

// Komponen Floating Toast Notification
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
          {type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
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

export const StockRequestCreate = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("distribusi_role") || "admin";
  const isSales = role === "sales";
  
  // Tipe default jika Admin = recommendation, jika Sales = request
  const type = isSales ? "request" : "recommendation";
  const [targetType, setTargetType] = useState("sales"); // sales atau agen
  const [note, setNote] = useState("");
  const [salesId, setSalesId] = useState("");
  const [agenId, setAgenId] = useState("");
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState<any[]>([{ variant_id: "", batch_id: "", quantity: "" }]);
  
  const [variants, setVariants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
          
          const resAgents = await fetch("http://localhost:8787/api/agents");
          if (resAgents.ok) {
            setAgents(await resAgents.json());
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, [isSales]);

  const handleAddItem = () => {
    setItems([...items, { variant_id: "", batch_id: "", quantity: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    // Hapus error yang terkait dengan index ini
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`item_${index}_`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Jika ganti variant, reset batch
    if (field === "variant_id") {
      newItems[index].batch_id = "";
    }
    setItems(newItems);
    
    // Clear specific error on change
    if (errors[`item_${index}_${field}`] || errors[`item_${index}_stock`]) {
      const newErrors = { ...errors };
      delete newErrors[`item_${index}_${field}`];
      delete newErrors[`item_${index}_stock`];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};

    // Validasi Umum
    if (!isSales && targetType === "agen" && !agenId) {
      newErrors.agenId = "Agen (Toko Mitra) tujuan wajib dipilih";
    }
    
    if (!isSales && targetType === "sales" && !salesId) {
      newErrors.salesId = "Sales tujuan wajib dipilih (atau pilih Semua Sales)";
    }

    if (!distributionDate) {
      newErrors.distributionDate = "Tanggal distribusi wajib diisi";
    }

    // Validasi Items
    let hasValidItemCount = false;
    items.forEach((item, index) => {
      const qty = Number(item.quantity);
      
      if (!item.variant_id) newErrors[`item_${index}_variant_id`] = "Produk wajib dipilih";
      if (!item.batch_id) newErrors[`item_${index}_batch_id`] = "Batch wajib dipilih";
      if (qty <= 0) newErrors[`item_${index}_quantity`] = "Kuantitas harus > 0";
      
      // Validasi Stok
      if (item.batch_id && qty > 0) {
        const selectedBatch = batches.find(b => b.id === item.batch_id);
        const availStock = selectedBatch ? (selectedBatch.current_quantity !== undefined ? selectedBatch.current_quantity : selectedBatch.quantity) : 0;
        if (selectedBatch && qty > availStock) {
          newErrors[`item_${index}_stock`] = `Kuantitas (${qty}) melebihi sisa stok yang tersedia (${availStock} pcs)`;
        }
      }

      if (item.variant_id && item.batch_id && qty > 0 && !newErrors[`item_${index}_stock`]) {
        hasValidItemCount = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: "Silakan periksa kembali isian form yang ditandai merah.", type: "error" });
      return;
    }

    if (!hasValidItemCount) {
      setToast({ message: "Harap tambahkan minimal 1 item yang valid.", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const validItems = items.map(i => ({ ...i, quantity: Number(i.quantity) }));
      
      const res = await fetch("http://localhost:8787/api/stock-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          target_type: isSales ? 'sales' : targetType,
          sales_id: isSales ? (localStorage.getItem("distribusi_user_id") || undefined) : (targetType === 'sales' ? (salesId === 'all' ? undefined : salesId) : undefined),
          agen_id: !isSales && targetType === 'agen' ? agenId : undefined,
          distribution_date: distributionDate,
          priority: "normal",
          note,
          created_by_role: role,
          items: validItems
        })
      });

      if (res.ok) {
        const data = await res.json();
        setToast({ message: `Berhasil membuat ${isSales ? "pengajuan" : "distribusi"} stok (${data.code})`, type: "success" });
        setTimeout(() => {
          navigate(isSales ? "/sales/stock?tab=masuk&subTab=request" : "/stock-requests", {
            state: { tab: "masuk", subTab: "request" }
          });
        }, 1500);
      } else {
        const err = await res.json();
        setToast({ message: err.message || "Terjadi kesalahan dari server.", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setToast({ message: "Terjadi kesalahan koneksi.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const totalItemQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* TAMPILAN SISI SALES (MOBILE-FIRST PRESISI) */}
      {isSales ? (
        <div className="space-y-3.5 pb-2">
          {/* Header Mobile Ringkas */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                type="button"
                onClick={() => navigate("/sales/stock?tab=masuk&subTab=request", { state: { tab: "masuk", subTab: "request" } })}
                className="p-2 bg-background border border-border rounded-xl hover:bg-muted transition-colors shrink-0"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-tight text-foreground truncate">
                  Buat Pengajuan Stok
                </h1>
                <p className="text-[11px] text-muted-foreground truncate">
                  Ajukan alokasi stok produk ke Admin Gudang
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* Card Informasi Pengajuan & Catatan */}
            <div className="bg-card rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText size={14} className="text-primary" />
                  Informasi Pengajuan
                </h3>
                <span className="text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
                  {new Date(distributionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Catatan / Kebutuhan</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Misal: Persiapan display event akhir pekan di toko..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/40 outline-none resize-none transition-colors"
                />
              </div>
            </div>

            {/* Section Daftar Item Produk */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-primary" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Daftar Item ({items.length})
                  </h3>
                  {totalItemQty > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-md">
                      {totalItemQty.toLocaleString('id-ID')} pcs
                    </span>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="h-7 px-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95"
                >
                  <Plus size={14} /> Tambah Item
                </button>
              </div>

              {/* List Kartu Item Produk */}
              <div className="space-y-2.5">
                {items.map((item, index) => {
                  const selectedVariant = variants.find(v => v.id === item.variant_id);
                  const availableBatches = selectedVariant 
                    ? batches.filter(b => {
                        const matchVariant = b.variant_id ? b.variant_id === selectedVariant.id : b.product_id === selectedVariant.product_id;
                        const stock = b.current_quantity !== undefined ? b.current_quantity : b.quantity;
                        return matchVariant && stock > 0;
                      }) 
                    : [];
                  
                  const hasVariantError = !!errors[`item_${index}_variant_id`];
                  const hasBatchError = !!errors[`item_${index}_batch_id`];
                  const hasQtyError = !!errors[`item_${index}_quantity`] || !!errors[`item_${index}_stock`];

                  return (
                    <div 
                      key={index} 
                      className={`bg-card rounded-2xl border shadow-xs p-3.5 space-y-3 transition-colors ${
                        hasVariantError || hasBatchError || hasQtyError 
                          ? 'border-red-300 bg-red-50/20' 
                          : 'border-border/80'
                      }`}
                    >
                      {/* Item Top Bar */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                            {selectedVariant ? `${selectedVariant.product_name} - ${selectedVariant.name}` : 'Pilih Produk'}
                          </span>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Hapus Item"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Produk / Varian */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                          <span>Produk & Varian <span className="text-red-500">*</span></span>
                        </label>
                        <select
                          value={item.variant_id}
                          onChange={(e) => handleItemChange(index, "variant_id", e.target.value)}
                          className={`w-full p-2.5 rounded-xl border bg-background text-xs font-medium focus:ring-2 outline-none transition-colors ${
                            hasVariantError ? 'border-red-500 focus:ring-red-500/50 bg-red-50/50 text-red-900' : 'focus:ring-primary/40'
                          }`}
                        >
                          <option value="" disabled>-- Pilih Produk & Varian --</option>
                          {variants.map(v => {
                            const variantBatches = batches.filter(b => b.variant_id ? b.variant_id === v.id : b.product_id === v.product_id);
                            const totalStock = variantBatches.reduce((sum, b) => sum + Number(b.current_quantity !== undefined ? b.current_quantity : b.quantity), 0);
                            const outOfStock = totalStock <= 0;
                            
                            return (
                              <option key={v.id} value={v.id} disabled={outOfStock}>
                                {v.product_name} - {v.name} {outOfStock ? '(Stok Habis)' : `(Stok: ${totalStock})`}
                              </option>
                            );
                          })}
                        </select>
                        {hasVariantError && (
                          <p className="text-[10px] text-red-500 font-medium">{errors[`item_${index}_variant_id`]}</p>
                        )}
                      </div>

                      {/* 2 Kolom: Kedaluwarsa & Kuantitas */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Tanggal Kedaluwarsa (Batch) */}
                        <div className="space-y-1 min-w-0">
                          <label className="text-[11px] font-semibold text-muted-foreground truncate block">
                            Kedaluwarsa <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.batch_id}
                            onChange={(e) => handleItemChange(index, "batch_id", e.target.value)}
                            disabled={!item.variant_id}
                            className={`w-full p-2.5 rounded-xl border bg-background text-xs font-medium focus:ring-2 outline-none transition-colors truncate ${
                              hasBatchError ? 'border-red-500 focus:ring-red-500/50 bg-red-50/50 text-red-900' : 'focus:ring-primary/40'
                            } disabled:opacity-50`}
                          >
                            <option value="" disabled>
                              {item.variant_id ? '-- Pilih Exp --' : '-- Pilih Produk --'}
                            </option>
                            {availableBatches.map(b => (
                              <option key={b.id} value={b.id}>
                                {new Date(b.expired_date).toLocaleDateString('id-ID')} (Sisa: {b.current_quantity !== undefined ? b.current_quantity : b.quantity} pcs)
                              </option>
                            ))}
                          </select>
                          {hasBatchError && (
                            <p className="text-[10px] text-red-500 font-medium leading-tight">{errors[`item_${index}_batch_id`]}</p>
                          )}
                        </div>

                        {/* Kuantitas (pcs) */}
                        <div className="space-y-1 min-w-0">
                          <label className="text-[11px] font-semibold text-muted-foreground truncate block">
                            Jumlah (pcs) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="0"
                              value={item.quantity ? Number(item.quantity).toLocaleString('id-ID') : ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                handleItemChange(index, "quantity", val);
                              }}
                              className={`w-full p-2.5 pr-8 rounded-xl border bg-background text-xs text-center font-bold focus:ring-2 outline-none transition-colors ${
                                hasQtyError ? 'border-red-500 focus:ring-red-500/50 bg-red-50/50 text-red-600' : 'focus:ring-primary/40'
                              }`}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground pointer-events-none">
                              pcs
                            </span>
                          </div>
                          {hasQtyError && (
                            <p className="text-[10px] text-red-500 font-medium leading-tight">{errors[`item_${index}_stock`] || errors[`item_${index}_quantity`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Bar Mobile Presisi */}
            <div className="sticky bottom-2 z-10 p-2.5 bg-background/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-lg flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/sales/stock-requests")}
                className="h-10 px-4 rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted text-xs font-semibold transition active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <Save size={15} />
                <span>{isLoading ? "Mengirim..." : "Kirim Pengajuan"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TAMPILAN SISI ADMIN (DESKTOP) */
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/stock-requests")}
              className="p-2.5 bg-background border rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Distribusi
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Kirim stok untuk didistribusikan ke Sales atau Agen.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Informasi Umum</h2>
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tujuan Distribusi</label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value);
                      setErrors(prev => { const n = {...prev}; delete n.salesId; delete n.agenId; return n; });
                    }}
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
                    onChange={(e) => {
                      setDistributionDate(e.target.value);
                      setErrors(prev => { const n = {...prev}; delete n.distributionDate; return n; });
                    }}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className={`w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 outline-none transition-colors ${
                      errors.distributionDate ? "border-red-500 focus:ring-red-500/50 bg-red-50/50" : "focus:ring-primary/50"
                    }`}
                  />
                  {errors.distributionDate && <p className="text-xs text-red-500 font-medium">{errors.distributionDate}</p>}
                </div>

                {targetType === "sales" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nama Sales Tujuan</label>
                    <select
                      value={salesId}
                      onChange={(e) => {
                        setSalesId(e.target.value);
                        setErrors(prev => { const n = {...prev}; delete n.salesId; return n; });
                      }}
                      className={`w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 outline-none transition-colors ${
                        errors.salesId ? "border-red-500 focus:ring-red-500/50 bg-red-50/50" : "focus:ring-primary/50"
                      }`}
                    >
                      <option value="" disabled>-- Pilih Nama Sales --</option>
                      <option value="all">📢 Semua Sales (Broadcast ke Seluruh Sales)</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                      ))}
                    </select>
                    {errors.salesId && <p className="text-xs text-red-500 font-medium">{errors.salesId}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nama Agen Tujuan</label>
                    <select
                      value={agenId}
                      onChange={(e) => {
                        setAgenId(e.target.value);
                        setErrors(prev => { const n = {...prev}; delete n.agenId; return n; });
                      }}
                      className={`w-full p-3 rounded-xl border bg-background font-medium focus:ring-2 outline-none transition-colors ${
                        errors.agenId ? "border-red-500 focus:ring-red-500/50 bg-red-50/50" : "focus:ring-primary/50"
                      }`}
                    >
                      <option value="" disabled>-- Pilih Nama Agen --</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    {errors.agenId && <p className="text-xs text-red-500 font-medium">{errors.agenId}</p>}
                    <p className="text-xs text-amber-600 font-medium">*Syarat & Ketentuan Agen: Pastikan min. order terpenuhi. Stok otomatis berkurang jika ke Agen.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Catatan / Keterangan</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Misal: Persiapan event akhir pekan..."
                    rows={2}
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
                  const selectedVariant = variants.find(v => v.id === item.variant_id);
                  const availableBatches = selectedVariant 
                    ? batches.filter(b => {
                        const matchVariant = b.variant_id ? b.variant_id === selectedVariant.id : b.product_id === selectedVariant.product_id;
                        const stock = b.current_quantity !== undefined ? b.current_quantity : b.quantity;
                        return matchVariant && stock > 0;
                      }) 
                    : [];
                  
                  const hasVariantError = !!errors[`item_${index}_variant_id`];
                  const hasBatchError = !!errors[`item_${index}_batch_id`];
                  const hasQtyError = !!errors[`item_${index}_quantity`] || !!errors[`item_${index}_stock`];

                  return (
                    <div key={index} className={`flex flex-col gap-4 p-4 rounded-xl border ${hasVariantError || hasBatchError || hasQtyError ? 'bg-red-50/30 border-red-200' : 'bg-muted/20'}`}>
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className={`p-2.5 rounded-lg border hidden md:block mt-6 ${hasVariantError || hasBatchError || hasQtyError ? 'bg-red-100 text-red-500 border-red-200' : 'bg-background text-muted-foreground'}`}>
                          <Package size={20} />
                        </div>
                        
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Produk / Varian</label>
                          <select
                            value={item.variant_id}
                            onChange={(e) => handleItemChange(index, "variant_id", e.target.value)}
                            className={`w-full p-2.5 rounded-lg border bg-background font-medium focus:ring-2 outline-none transition-colors ${
                              hasVariantError ? 'border-red-500 focus:ring-red-500/50 bg-red-50/50' : 'focus:ring-primary/50'
                            }`}
                          >
                            <option value="" disabled>-- Pilih Produk --</option>
                            {variants.map(v => {
                              const variantBatches = batches.filter(b => b.variant_id ? b.variant_id === v.id : b.product_id === v.product_id);
                              const totalStock = variantBatches.reduce((sum, b) => sum + Number(b.current_quantity !== undefined ? b.current_quantity : b.quantity), 0);
                              const outOfStock = totalStock <= 0;
                              
                              return (
                                <option key={v.id} value={v.id} disabled={outOfStock}>
                                  {v.product_name} - {v.name} {v.sku ? `(${v.sku})` : ''} {outOfStock ? '(Stok Habis)' : `(Stok: ${totalStock})`}
                                </option>
                              );
                            })}
                          </select>
                          {hasVariantError && <p className="text-[10px] text-red-500 font-medium">{errors[`item_${index}_variant_id`]}</p>}
                        </div>

                        <div className="flex-1 w-full space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Tanggal Kedaluwarsa</label>
                          <select
                            value={item.batch_id}
                            onChange={(e) => handleItemChange(index, "batch_id", e.target.value)}
                            disabled={!item.variant_id}
                            className={`w-full p-2.5 rounded-lg border bg-background font-medium focus:ring-2 outline-none transition-colors ${
                              hasBatchError ? 'border-red-500 focus:ring-red-500/50 bg-red-50/50' : 'focus:ring-primary/50'
                            }`}
                          >
                            <option value="" disabled>-- Pilih Kedaluwarsa Stok --</option>
                            {availableBatches.map(b => (
                              <option key={b.id} value={b.id}>
                                Sisa: {b.current_quantity !== undefined ? b.current_quantity : b.quantity} pcs | Exp: {new Date(b.expired_date).toLocaleDateString('id-ID')}
                              </option>
                            ))}
                          </select>
                          {hasBatchError && <p className="text-[10px] text-red-500 font-medium">{errors[`item_${index}_batch_id`]}</p>}
                        </div>
                        
                        <div className="w-full md:w-32 space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Kuantitas (pcs)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="0"
                              value={item.quantity ? Number(item.quantity).toLocaleString('id-ID') : ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                handleItemChange(index, "quantity", val);
                              }}
                              className={`w-full p-2.5 rounded-lg border bg-background text-center font-bold focus:ring-2 outline-none transition-colors ${
                                hasQtyError ? 'border-red-500 focus:ring-red-500/50 bg-red-50/50 text-red-600' : 'focus:ring-primary/50'
                              }`}
                            />
                            <span className="text-sm font-medium text-muted-foreground md:hidden">pcs</span>
                          </div>
                          {hasQtyError && <p className="text-[10px] text-red-500 font-medium leading-tight">{errors[`item_${index}_stock`] || errors[`item_${index}_quantity`]}</p>}
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
                onClick={() => navigate("/stock-requests")}
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
      )}
    </>
  );
};
