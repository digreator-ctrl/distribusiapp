import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Package, Store, Briefcase, ArrowDownLeft,
  ArrowUpRight, X, Calendar
} from "lucide-react";
import { invalidateStockCache } from "./received-stock";

export const SalesProductDetail = () => {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const [activeSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  // State produk dari router state atau fetch
  const [productData, setProductData] = useState<any>(location.state?.item || null);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!productData);

  // Modal Titip ke Toko
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStoreId, setFormStoreId] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchDetail = async () => {
    if (!variantId || !activeSalesId) return;
    try {
      setIsLoading(true);

      // 1. Fetch sales inventory untuk varian ini jika belum ada dari state
      const resInv = await fetch(`http://localhost:8787/api/sales-inventory/${activeSalesId}`);
      if (resInv.ok) {
        const invList = await resInv.json();
        const found = (invList || []).find((i: any) => i.variant_id === variantId);
        if (found) {
          setProductData(found);
        }
      }

      // 2. Fetch consignments aktif varian ini
      const resCons = await fetch(`http://localhost:8787/api/consignments?sales_id=${activeSalesId}&variant_id=${variantId}`);
      if (resCons.ok) {
        const consList = await resCons.json();
        setConsignments(Array.isArray(consList) ? consList : []);
      }

      // 3. Fetch stores & agents untuk modal titip
      const [resAgents, resStores] = await Promise.all([
        fetch("http://localhost:8787/api/agents"),
        fetch("http://localhost:8787/api/stores")
      ]);
      let allDest: any[] = [];
      if (resAgents.ok) {
        const agents = await resAgents.json();
        if (Array.isArray(agents)) {
          allDest.push(...agents.map((a: any) => ({ id: a.id, name: `${a.name} (Agen/Toko Mitra)` })));
        }
      }
      if (resStores.ok) {
        const storesData = await resStores.json();
        if (Array.isArray(storesData)) {
          allDest.push(...storesData.map((s: any) => ({ id: s.id, name: `${s.name} (Toko)` })));
        }
      }
      setStores(allDest);
    } catch (err) {
      console.error("Gagal memuat detail produk:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [variantId, activeSalesId]);

  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStoreId) {
      setFormError("Pilih Toko / Agen tujuan.");
      return;
    }
    const qty = Number(formQty);
    if (isNaN(qty) || qty <= 0) {
      setFormError("Jumlah titip harus lebih dari 0.");
      return;
    }

    const maxHolding = productData?.current_holding || 0;
    if (qty > maxHolding) {
      setFormError(`Jumlah melebihi stok yang dibawa (${maxHolding} pcs).`);
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8787/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_id: activeSalesId,
          store_id: formStoreId,
          variant_id: variantId,
          quantity: qty
        })
      });

      if (res.ok) {
        setToast({ message: "Berhasil mencatat penitipan stok ke toko!", type: "success" });
        setIsModalOpen(false);
        setFormStoreId("");
        setFormQty("");
        invalidateStockCache();
        fetchDetail();
      } else {
        const err = await res.json();
        setFormError(err.message || "Gagal menyimpan data.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/sales/stock?tab=dibawa", { state: { tab: "dibawa" } });
  };

  if (isLoading && !productData) {
    return (
      <div className="space-y-4 animate-pulse pb-6">
        <div className="h-10 bg-muted/40 rounded-xl" />
        <div className="h-36 bg-muted/40 rounded-2xl" />
        <div className="h-28 bg-muted/40 rounded-2xl" />
        <div className="h-44 bg-muted/40 rounded-2xl" />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="space-y-4 pb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Stok di Tangan</span>
        </button>
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <Package size={32} className="mx-auto text-muted-foreground opacity-30 mb-2" />
          <p className="font-bold text-xs text-foreground">Produk tidak ditemukan</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Data produk varian ini tidak tercatat dalam inventori bawaan Anda.
          </p>
        </div>
      </div>
    );
  }

  const isOutOfStock = productData.current_holding <= 0;
  const isLowStock = productData.current_holding > 0 && productData.current_holding < 10;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition shrink-0"
            title="Kembali"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-foreground truncate">
              Detail Produk
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              Informasi saldo & riwayat titipan produk
            </p>
          </div>
        </div>
      </div>

      {/* Hero Card: Info Produk & Saldo Utama */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block mb-1">
              {productData.product_category || "Produk"}
            </span>
            <h2 className="text-base font-black text-foreground leading-snug">
              {productData.product_name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Varian: <span className="font-bold text-foreground">{productData.variant_name}</span>
              {productData.sku && <span className="ml-1 text-muted-foreground">({productData.sku})</span>}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-black inline-block ${
                isOutOfStock
                  ? "bg-muted text-muted-foreground"
                  : isLowStock
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {isOutOfStock ? "Stok Habis" : isLowStock ? "Stok Menipis" : "Stok Tersedia"}
            </span>
          </div>
        </div>

        {/* Highlight Saldo di Tangan */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Stok di Tangan Sales
              </p>
              <p className="text-[11px] text-muted-foreground">Fisik yang saat ini dibawa</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-foreground">
              {productData.current_holding}
            </span>
            <span className="text-xs font-semibold text-muted-foreground ml-1">pcs</span>
          </div>
        </div>
      </div>

      {/* Rincian Alur Stok Masuk vs Keluar */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-card p-3 rounded-2xl border border-border/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <ArrowDownLeft size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Masuk</span>
          </div>
          <p className="text-lg font-black text-foreground">
            {productData.total_inbound} <span className="text-xs font-normal text-muted-foreground">pcs</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Diterima dari gudang</p>
        </div>

        <div className="bg-card p-3 rounded-2xl border border-border/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Keluar</span>
          </div>
          <p className="text-lg font-black text-foreground">
            {productData.total_outbound} <span className="text-xs font-normal text-muted-foreground">pcs</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Sudah dititipkan ke toko</p>
        </div>
      </div>

      {/* Rincian Berdasarkan Tanggal Kedaluwarsa */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar size={14} className="text-amber-600" />
            Rincian Tanggal Kedaluwarsa
          </h3>
          <span className="text-[10px] text-muted-foreground">{productData.batches?.length || 0} Batch</span>
        </div>

        {(!productData.batches || productData.batches.length === 0) ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-3.5 text-center">
            <p className="text-xs text-muted-foreground italic">
              Tidak ada data tanggal kedaluwarsa untuk stok ini.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {productData.batches.map((b: any, idx: number) => {
              const expDateObj = new Date(b.expired_date);
              const now = new Date();
              const diffTime = expDateObj.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isExpired = diffDays <= 0;
              const isWarning = diffDays > 0 && diffDays <= 60;

              return (
                <div
                  key={b.batch_id || idx}
                  className="bg-card px-3.5 py-2.5 rounded-xl border border-border/70 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      Exp: {formatDate(b.expired_date)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isExpired
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : isWarning
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isExpired ? "Kedaluwarsa" : `${diffDays} hari lagi`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">
                      {b.current_holding.toLocaleString("id-ID")} <span className="text-xs font-normal text-muted-foreground">pcs</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Titipan Aktif di Rak Toko-toko */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Store size={14} className="text-primary" />
            Titipan di Rak Toko ({consignments.length})
          </h3>
          <span className="text-[10px] text-muted-foreground">Konsinyasi aktif</span>
        </div>

        {consignments.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-5 text-center">
            <Store size={22} className="mx-auto text-muted-foreground opacity-30 mb-1.5" />
            <p className="font-semibold text-xs text-foreground">Belum ada titipan di toko</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Produk ini belum dititipkan ke rak toko mitra manapun.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {consignments.map((c: any) => (
              <div
                key={c.id}
                className="bg-card p-3 rounded-xl border border-border/70 flex items-center justify-between shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-foreground truncate">{c.store_name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Titip awal: {c.initial_stock} pcs • Terjual: {c.sold_qty || 0} pcs
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-foreground block">{c.remaining_qty} pcs</span>
                  <span className="text-[9px] text-muted-foreground">Sisa di rak</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tombol Aksi Titipkan ke Toko */}
      {!isOutOfStock && (
        <div className="pt-2">
          <button
            onClick={() => {
              setFormError("");
              setIsModalOpen(true);
            }}
            className="w-full bg-primary text-primary-foreground font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-98 transition"
          >
            <Store size={16} />
            <span>Titipkan Produk Ini ke Toko</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TITIP STOK KE TOKO                                  */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground">Titipkan ke Toko</h3>
                <p className="text-xs text-muted-foreground truncate">{productData.product_name} - {productData.variant_name}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateConsignment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Toko / Agen Tujuan *</label>
                <select
                  required
                  value={formStoreId}
                  onChange={(e) => setFormStoreId(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Pilih Toko Mitra / Agen --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-foreground">Jumlah Titip (pcs) *</label>
                  <span className="text-[10px] text-muted-foreground">
                    Maks: <span className="font-bold text-foreground">{productData.current_holding} pcs</span>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={productData.current_holding}
                  required
                  placeholder="0"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Penitipan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
