import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Package, Store, Briefcase, Calendar,
  X, Phone
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

  // Active Tab: "exp" (Rincian Tanggal Exp) vs "stores" (Sebaran di Toko)
  const [activeTab, setActiveTab] = useState<"exp" | "stores">("exp");

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

  // Konsolidasi sebaran toko (mengelompokkan per toko mitra)
  const storeDistribution = useMemo(() => {
    const storeMap = new Map<string, {
      storeId: string;
      storeName: string;
      storeContact: string;
      totalInitial: number;
      totalRemaining: number;
      totalSold: number;
      lastDate: string;
      recordsCount: number;
    }>();

    consignments.forEach((c) => {
      const sId = c.store_id || c.store_name || "unknown";
      if (!storeMap.has(sId)) {
        storeMap.set(sId, {
          storeId: sId,
          storeName: c.store_name || "Toko Mitra",
          storeContact: c.store_contact || "",
          totalInitial: 0,
          totalRemaining: 0,
          totalSold: 0,
          lastDate: c.created_at,
          recordsCount: 0
        });
      }
      const item = storeMap.get(sId)!;
      item.totalInitial += Number(c.initial_stock || 0);
      item.totalRemaining += Number(c.remaining_qty || 0);
      item.totalSold += Number(c.sold_qty || 0);
      item.recordsCount += 1;
      if (c.created_at && new Date(c.created_at) > new Date(item.lastDate)) {
        item.lastDate = c.created_at;
      }
    });

    return Array.from(storeMap.values()).sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [consignments]);

  // Statistik sebaran toko
  const totalStoreRemaining = useMemo(() => {
    return storeDistribution.reduce((acc, s) => acc + s.totalRemaining, 0);
  }, [storeDistribution]);

  const totalStoreSold = useMemo(() => {
    return storeDistribution.reduce((acc, s) => acc + s.totalSold, 0);
  }, [storeDistribution]);

  const activeStoresCount = useMemo(() => {
    return storeDistribution.filter((s) => s.totalRemaining > 0).length;
  }, [storeDistribution]);

  // Rincian Batch / Tanggal Expired
  const batches = useMemo(() => {
    return Array.isArray(productData?.batches) ? productData.batches : [];
  }, [productData]);

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
        <div className="h-44 bg-muted/40 rounded-2xl" />
        <div className="h-12 bg-muted/40 rounded-xl" />
        <div className="h-48 bg-muted/40 rounded-2xl" />
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

  const currentHolding = Number(productData.current_holding || 0);
  const isOutOfStock = currentHolding <= 0;
  const isLowStock = currentHolding > 0 && currentHolding < 10;

  return (
    <div className="space-y-4 pb-6">
      {/* Toast Notifikasi */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-black/5 rounded-md">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition shrink-0 active:scale-95"
            title="Kembali"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-foreground truncate">
              Detail Stok Produk
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              Stok di tangan, tanggal expired & sebaran toko
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CARD UTAMA: SEDERHANA NAMUN DETAIL                        */}
      {/* ========================================================= */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        {/* Info Identitas Produk */}
        <div className="p-4 border-b border-border/40 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {productData.product_category || "Produk"}
                </span>
                {productData.sku && (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                    SKU: {productData.sku}
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-foreground leading-snug">
                {productData.product_name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Varian: <span className="font-bold text-foreground">{productData.variant_name}</span>
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${
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

        {/* Card Highlight: Stok Saat Ini Dipegang */}
        <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                  Stok Dipegang Saat Ini
                </p>
                <p className="text-[11px] text-muted-foreground">Fisik yang sedang Anda bawa</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-black text-foreground tracking-tight">
                  {currentHolding.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-bold text-muted-foreground">pcs</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Saldo fisik di tangan</span>
            </div>
          </div>

          {/* Rincian Ringkas Alur Masuk & Keluar + Tombol Aksi */}
          <div className="mt-3.5 pt-3 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <div>
                <span>Diterima: </span>
                <span className="font-bold text-foreground">
                  {Number(productData.total_inbound || 0).toLocaleString("id-ID")} pcs
                </span>
              </div>
              <span className="opacity-40">•</span>
              <div>
                <span>Dititipkan: </span>
                <span className="font-bold text-foreground">
                  {Number(productData.total_outbound || 0).toLocaleString("id-ID")} pcs
                </span>
              </div>
            </div>

            {!isOutOfStock && (
              <button
                onClick={() => {
                  setFormError("");
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-2xs hover:bg-primary/90 active:scale-95 transition flex items-center gap-1.5 ml-auto"
              >
                <Store size={13} />
                <span>Titipkan ke Toko</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2 TAB NAVIGATION                                          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-2xl border border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("exp")}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "exp"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Rincian Tanggal Exp</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeTab === "exp" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"
            }`}
          >
            {batches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stores")}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "stores"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Sebaran di Toko</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeTab === "stores" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {storeDistribution.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RINCIAN TANGGAL KEDALUWARSA                        */}
      {/* ========================================================= */}
      {activeTab === "exp" && (
        <div className="space-y-2">
          {batches.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
              <Calendar size={28} className="mx-auto text-muted-foreground opacity-30 mb-2" />
              <p className="font-semibold text-xs text-foreground">
                Tidak ada data tanggal kedaluwarsa
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Stok ini tidak memiliki rincian tanggal kedaluwarsa khusus.
              </p>
            </div>
          ) : (
            batches.map((b: any, idx: number) => {
              const expDateObj = new Date(b.expired_date);
              const now = new Date();
              const diffTime = expDateObj.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isExpired = diffDays <= 0;
              const isWarning = diffDays > 0 && diffDays <= 60;
              const batchHolding = Number(b.current_holding || 0);

              return (
                <div
                  key={b.batch_id || idx}
                  className="bg-card px-4 py-3 rounded-xl border border-border/70 shadow-2xs flex items-center justify-between gap-3"
                >
                  {/* Tanggal Exp & Hitungan Mundur */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={15}
                        className={
                          isExpired
                            ? "text-red-500 shrink-0"
                            : isWarning
                            ? "text-amber-500 shrink-0"
                            : "text-emerald-500 shrink-0"
                        }
                      />
                      <span className="text-xs font-bold text-foreground">
                        Exp: {formatDate(b.expired_date)}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-semibold mt-0.5 pl-5.5 ${
                        isExpired
                          ? "text-red-600 font-bold"
                          : isWarning
                          ? "text-amber-600 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isExpired ? "Sudah kedaluwarsa" : `${diffDays} hari lagi`}
                    </p>
                  </div>

                  {/* Jumlah Pcs */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-foreground">
                      {batchHolding.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground ml-1">pcs</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SEBARAN DI TOKO (PRODUK INI TERSEBAR DI MANA SAJA) */}
      {/* ========================================================= */}
      {activeTab === "stores" && (
        <div className="space-y-3">
          {/* Header Ringkasan Sebaran Toko */}
          <div className="bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Tersebar di {storeDistribution.length} Toko Mitra
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {activeStoresCount} toko masih memiliki sisa stok di rak
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
              <div className="bg-muted/40 p-2 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Total Sisa di Rak:</span>
                <span className="text-sm font-black text-foreground">
                  {totalStoreRemaining.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">pcs</span>
                </span>
              </div>
              <div className="bg-muted/40 p-2 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Total Sudah Terjual:</span>
                <span className="text-sm font-black text-emerald-600">
                  {totalStoreSold.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">pcs</span>
                </span>
              </div>
            </div>
          </div>

          {storeDistribution.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center space-y-3">
              <Store size={32} className="mx-auto text-muted-foreground opacity-30" />
              <div>
                <p className="font-bold text-xs text-foreground">
                  Belum tersebar di toko manapun
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[240px] mx-auto">
                  Produk ini belum pernah dititipkan ke toko atau agen mitra.
                </p>
              </div>

              {!isOutOfStock && (
                <button
                  onClick={() => {
                    setFormError("");
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs hover:bg-primary/90 active:scale-95 transition inline-flex items-center gap-1.5"
                >
                  <Store size={14} />
                  <span>Titipkan ke Toko Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {storeDistribution.map((s) => {
                const isStoreOutOfStock = s.totalRemaining <= 0;
                const sellRate = s.totalInitial > 0
                  ? Math.round((s.totalSold / s.totalInitial) * 100)
                  : 0;

                return (
                  <div
                    key={s.storeId}
                    className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <Store size={14} className="text-primary shrink-0" />
                          <h4 className="font-bold text-xs text-foreground truncate">
                            {s.storeName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          {s.storeContact && (
                            <span className="flex items-center gap-0.5 truncate">
                              <Phone size={10} className="shrink-0" />
                              {s.storeContact}
                            </span>
                          )}
                          <span>• Terakhir: {formatDate(s.lastDate)}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isStoreOutOfStock
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isStoreOutOfStock ? "Stok Toko Habis" : "Aktif di Rak"}
                      </span>
                    </div>

                    {/* Rincian Angka Toko */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/30 rounded-xl text-center">
                      <div>
                        <span className="text-[9px] text-muted-foreground block">Sisa di Rak</span>
                        <span className="text-xs font-black text-foreground">
                          {s.totalRemaining} <span className="text-[9px] font-normal text-muted-foreground">pcs</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block">Dititipkan</span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {s.totalInitial} <span className="text-[9px] font-normal">pcs</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block">Terjual</span>
                        <span className="text-xs font-black text-emerald-600">
                          {s.totalSold} <span className="text-[9px] font-normal">pcs</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Penjualan Toko */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Tingkat Penjualan di Toko Ini</span>
                        <span className="font-bold text-foreground">{sellRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, sellRate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                <p className="text-xs text-muted-foreground truncate">
                  {productData.product_name} - {productData.variant_name}
                </p>
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
                    Maks: <span className="font-bold text-foreground">{currentHolding} pcs</span>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={currentHolding}
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
