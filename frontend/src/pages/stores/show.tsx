import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Edit, Trash2, Phone, Compass,
  AlertCircle, User, MapPin
} from "lucide-react";

export const StoreShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = (localStorage.getItem("distribusi_role") || "admin").toLowerCase();
  const isOwner = userRole === "owner";

  const initialStore = location.state?.store;
  const [store, setStore] = useState<any | null>(initialStore || null);
  const [isLoading, setIsLoading] = useState(!initialStore);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"inbound" | "sold">("inbound");

  const fetchStore = async () => {
    if (!id) return;
    try {
      if (!store) {
        setIsLoading(true);
      }
      const res = await fetch(`http://localhost:8787/api/stores/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStore(data);
      } else {
        if (!store) {
          setError("Toko tidak ditemukan.");
        }
      }
    } catch (err) {
      console.error(err);
      if (!store) {
        setError("Gagal memuat detail toko.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [id]);

  const handleDelete = async () => {
    if (!isOwner) {
      alert("Aksi hapus hanya dapat dilakukan oleh Owner.");
      return;
    }

    if (!confirm(`Hapus mitra toko "${store?.name}"? Seluruh data terkait akan dihapus secara permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8787/api/stores/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        navigate("/stores", {
          state: { successMessage: `Toko "${store?.name}" berhasil dihapus.` },
        });
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus toko.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi gangguan koneksi.");
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"));
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading && !store) {
    return (
      <div className="py-12 text-center text-muted-foreground animate-pulse text-sm">
        Memuat detail mitra toko...
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="bg-card p-8 rounded-2xl border text-center space-y-3">
        <AlertCircle size={32} className="text-red-500 mx-auto" />
        <h2 className="font-bold text-base text-foreground">Data Toko Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate("/stores")}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow"
        >
          Kembali ke Mitra Toko
        </button>
      </div>
    );
  }

  const isStoreActive = (store.status || "Aktif") === "Aktif";
  const regionParts = [store.province, store.city, store.district, store.village].filter(Boolean);
  const regionText = regionParts.length > 0 ? regionParts.join(" - ") : (store.address || "-");

  const inboundList: any[] = store.inbound_history || [];
  const soldList: any[] = store.sold_history || [];

  const totalInboundQty = inboundList.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalSoldQty = soldList.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalRemainingInStore = Number(store.total_remaining_stock) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/stores")}
            className="p-2 rounded-xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Kembali"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{store.name}</h1>
              <span
                className={`px-2.5 py-0.5 text-xs font-black rounded-full border ${
                  isStoreActive
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}
              >
                {store.status || "Aktif"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <User size={13} />
                <span>Pemilik / PIC: <strong className="text-foreground">{store.owner_name || "-"}</strong></span>
              </span>
              <span>•</span>
              <span className="truncate">{regionText}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/stores/${id}/edit`)}
            className="px-4 py-2 rounded-xl border border-border/80 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Edit size={14} className="text-primary" />
            <span>Edit Toko</span>
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition"
              title="Khusus Owner: Hapus Toko"
            >
              <Trash2 size={14} />
              <span>Hapus Toko</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile & Location Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4 md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin size={14} className="text-primary" />
            <span>Wilayah & Lokasi Toko</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">Provinsi</span>
              <p className="font-bold text-foreground mt-0.5 truncate">{store.province || "-"}</p>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">Kab / Kota</span>
              <p className="font-bold text-foreground mt-0.5 truncate">{store.city || "-"}</p>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">Kecamatan</span>
              <p className="font-bold text-foreground mt-0.5 truncate">{store.district || "-"}</p>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">Desa / Kel</span>
              <p className="font-bold text-foreground mt-0.5 truncate">{store.village || "-"}</p>
            </div>
          </div>

          {store.address && (
            <div className="bg-muted/20 p-3 rounded-xl border border-border/40 text-xs">
              <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Alamat Lengkap / Patokan:</span>
              <p className="text-foreground">{store.address}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            {store.wa_number && (
              <a
                href={`https://wa.me/${store.wa_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition border border-emerald-500/20"
              >
                <Phone size={14} />
                <span>WhatsApp ({store.wa_number})</span>
              </a>
            )}

            {store.latitude && store.longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition border border-blue-500/20"
              >
                <Compass size={14} />
                <span>Buka Google Maps</span>
              </a>
            )}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ringkasan Operasional
          </h2>

          <div className="space-y-3">
            <div className="bg-muted/30 p-3 rounded-xl border border-border/40 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Sisa Stok di Rak</span>
              <span className="text-base font-black text-foreground">{totalRemainingInStore} pcs</span>
            </div>

            <div className="bg-muted/30 p-3 rounded-xl border border-border/40 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Total Stok Masuk</span>
              <span className="text-base font-black text-foreground">{totalInboundQty} pcs</span>
            </div>

            <div className="bg-muted/30 p-3 rounded-xl border border-border/40 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Total Terjual</span>
              <span className="text-base font-black text-emerald-600">{totalSoldQty} pcs</span>
            </div>

            <div className="bg-muted/30 p-3 rounded-xl border border-border/40 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Total Piutang Toko</span>
              <span className="text-sm font-black text-amber-600">{formatRupiah(store.total_debt || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Container: Riwayat Stok Masuk & Riwayat Terjual */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
        {/* Desktop Tab Buttons */}
        <div className="flex border-b border-border gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("inbound")}
            className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all ${
              activeTab === "inbound"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Riwayat Stok Masuk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sold")}
            className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all ${
              activeTab === "sold"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Riwayat Terjual
          </button>
        </div>

        {/* Tab 1: Riwayat Stok Masuk Table */}
        {activeTab === "inbound" && (
          <div>
            {inboundList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs border border-dashed rounded-xl">
                Belum ada riwayat stok masuk ke toko ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border/60 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Tanggal Masuk</th>
                      <th className="px-5 py-3.5">Produk & Varian</th>
                      <th className="px-5 py-3.5 text-center">Jumlah Masuk</th>
                      <th className="px-5 py-3.5 text-center">Sisa di Rak</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {inboundList.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-5 py-3.5 font-semibold text-foreground">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-foreground">
                            {item.product_name ? `${item.product_name} - ${item.variant_name}` : (item.variant_name || "Produk")}
                          </p>
                          {item.sku && <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.sku}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-primary">
                          +{item.qty || 0} pcs
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-foreground">
                          {item.remaining_qty ?? 0} pcs
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.status === "active" ? "Aktif" : "Selesai"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-muted-foreground">
                          {item.sales_name || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Riwayat Terjual Table */}
        {activeTab === "sold" && (
          <div>
            {soldList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs border border-dashed rounded-xl">
                Belum ada riwayat produk terjual di toko ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border/60 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Produk & Varian</th>
                      <th className="px-5 py-3.5 text-center">Jumlah Terjual</th>
                      <th className="px-5 py-3.5 text-right">Harga Satuan</th>
                      <th className="px-5 py-3.5 text-right">Total Nilai</th>
                      <th className="px-5 py-3.5 text-right">Sales Pencatat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {soldList.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-5 py-3.5 font-semibold text-foreground">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-foreground">
                            {item.product_name ? `${item.product_name} - ${item.variant_name}` : (item.variant_name || "Produk")}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-emerald-600">
                          {item.qty || 0} pcs
                        </td>
                        <td className="px-5 py-3.5 text-right text-muted-foreground">
                          {formatRupiah(item.unit_price || 0)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-foreground">
                          {formatRupiah(item.total_price || (item.qty * (item.unit_price || 0)))}
                        </td>
                        <td className="px-5 py-3.5 text-right text-muted-foreground">
                          {item.sales_name || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
