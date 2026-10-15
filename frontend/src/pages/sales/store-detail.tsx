import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Store, ArrowLeft, MapPin, MessageSquare, Compass,
  Calendar, Clock, CheckCircle2, AlertCircle, User,
  Plus, X
} from "lucide-react";

export const SalesStoreDetail = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [activeSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  const [store, setStore] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedDate, setSchedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [schedNotes, setSchedNotes] = useState("");
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchStoreDetail = async () => {
    if (!storeId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch(`http://localhost:8787/api/stores/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setStore(data);
      } else {
        setError("Toko tidak ditemukan atau telah dihapus.");
      }
    } catch (err: any) {
      console.error("Fetch store detail error:", err);
      setError("Gagal memuat detail toko. Periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetail();
  }, [storeId]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedDate) return;
    setSchedSubmitting(true);
    try {
      const res = await fetch("http://localhost:8787/api/visit-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          sales_id: activeSalesId || null,
          scheduled_date: schedDate,
          notes: schedNotes,
        }),
      });
      if (res.ok) {
        setToast({ message: "Jadwal kunjungan berhasil dibuat!", type: "success" });
        setIsScheduleOpen(false);
        setSchedNotes("");
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat jadwal.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi gangguan koneksi.");
    } finally {
      setSchedSubmitting(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Belum pernah";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-12 animate-pulse">
        <div className="h-10 bg-muted/40 rounded-xl w-36" />
        <div className="h-44 bg-muted/40 rounded-2xl" />
        <div className="h-32 bg-muted/40 rounded-2xl" />
        <div className="h-64 bg-muted/40 rounded-2xl" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="space-y-4 pb-12">
        <button
          onClick={() => navigate("/sales/toko")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Toko</span>
        </button>

        <div className="bg-card border border-dashed border-red-200 rounded-2xl p-8 text-center space-y-2">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="font-bold text-sm text-foreground">Data Toko Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground">{error || "Informasi toko tidak dapat ditampilkan."}</p>
          <button
            onClick={() => navigate("/sales/toko")}
            className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl"
          >
            Kembali ke Mitra Toko
          </button>
        </div>
      </div>
    );
  }

  const hasDebt = Number(store.total_debt) > 0;
  const totalRemainingStock = (store.consignments || []).reduce(
    (sum: number, c: any) => sum + (Number(c.remaining_qty) || 0),
    0
  );

  return (
    <div className="space-y-4 pb-12">
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

      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate("/sales/toko")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition px-2 py-1.5 rounded-lg hover:bg-muted/50 -ml-2"
        >
          <ArrowLeft size={16} />
          <span>Mitra Toko</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1 active:scale-95 transition"
          >
            <Calendar size={14} className="text-primary" />
            <span>Jadwalkan</span>
          </button>
          <button
            onClick={() => navigate(`/sales/toko/kunjungan/${store.id}`)}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <Store size={14} />
            <span>Mulai Kunjungan</span>
          </button>
        </div>
      </div>

      {/* Store Header Card */}
      <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-lg text-foreground tracking-tight">{store.name}</h1>
              {hasDebt ? (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full border border-red-200">
                  Ada Piutang
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200">
                  Lunas
                </span>
              )}
            </div>

            {store.owner_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <User size={13} className="shrink-0 text-muted-foreground/80" />
                <span>Pemilik: <strong className="text-foreground">{store.owner_name}</strong></span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Communication & Direction Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          {store.wa_number && (
            <a
              href={`https://wa.me/${store.wa_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-500/20"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>
          )}

          {store.latitude && store.longitude ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-blue-500/20"
            >
              <Compass size={14} />
              <span>Buka Google Maps</span>
            </a>
          ) : (
            <div className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium text-center">
              GPS belum tercatat
            </div>
          )}
        </div>
      </div>

      {/* Wilayah & Alamat Lengkap Card */}
      <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-2xs space-y-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MapPin size={14} className="text-primary" />
          <span>Wilayah & Lokasi Toko</span>
        </h2>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-semibold">Provinsi</span>
            <p className="font-bold text-foreground mt-0.5">{store.province || "-"}</p>
          </div>

          <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-semibold">Kabupaten / Kota</span>
            <p className="font-bold text-foreground mt-0.5">{store.city || "-"}</p>
          </div>

          <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-semibold">Kecamatan</span>
            <p className="font-bold text-foreground mt-0.5">{store.district || "-"}</p>
          </div>

          <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-semibold">Desa / Kelurahan</span>
            <p className="font-bold text-foreground mt-0.5">{store.village || "-"}</p>
          </div>
        </div>

        {store.address && (
          <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-xs">
            <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Alamat Lengkap / Patokan:</span>
            <p className="text-foreground leading-relaxed">{store.address}</p>
          </div>
        )}
      </div>

      {/* Metrics Highlights */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs">
          <span className="text-[10px] text-muted-foreground font-semibold block">Stok di Rak</span>
          <p className="text-base font-black text-foreground mt-0.5">{totalRemainingStock} pcs</p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs">
          <span className="text-[10px] text-muted-foreground font-semibold block">Total Piutang</span>
          <p className={`text-base font-black mt-0.5 ${hasDebt ? "text-red-600" : "text-emerald-600"}`}>
            {hasDebt ? formatRupiah(store.total_debt) : "Rp 0"}
          </p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs">
          <span className="text-[10px] text-muted-foreground font-semibold block">Kunjungan Terakhir</span>
          <p className="text-xs font-bold text-foreground mt-1 truncate">{formatDate(store.last_visit_date)}</p>
        </div>
      </div>

      {/* Section 1: Stok Konsinyasi di Rak Toko */}
      <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Stok Konsinyasi di Rak ({store.consignments?.length || 0})</span>
          </h2>
        </div>

        {(!store.consignments || store.consignments.length === 0) ? (
          <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
            Belum ada produk konsinyasi aktif di rak toko ini. Mulai kunjungan untuk menitipkan produk.
          </div>
        ) : (
          <div className="space-y-2">
            {store.consignments.map((c: any) => (
              <div
                key={c.id}
                className="bg-muted/40 p-3 rounded-xl border border-border/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate">{c.product_name} - {c.variant_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Awal: {c.initial_stock} pcs • Terjual: {c.sold_qty || 0} pcs • Harga: {formatRupiah(c.price || 0)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-foreground">{c.remaining_qty}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">sisa pcs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Riwayat Kunjungan Terakhir */}
      <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-2xs space-y-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock size={14} className="text-primary" />
          <span>Riwayat Kunjungan Terakhir</span>
        </h2>

        {(!store.recent_visits || store.recent_visits.length === 0) ? (
          <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
            Belum ada riwayat kunjungan tercatat ke toko ini.
          </div>
        ) : (
          <div className="space-y-2">
            {store.recent_visits.map((v: any) => (
              <div
                key={v.id}
                className="bg-muted/40 p-3 rounded-xl border border-border/50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-foreground">{formatDate(v.visit_date)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Sales: {v.sales_name || "Sales"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">{formatRupiah(v.payment_received || 0)}</p>
                  {Number(v.outstanding_amount) > 0 && (
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                      Sisa Piutang: {formatRupiah(v.outstanding_amount)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Jadwal Kunjungan */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                Jadwalkan Kunjungan ke {store.name}
              </h3>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Tanggal Kunjungan *</label>
                <input
                  type="date"
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Agenda / Catatan Kunjungan</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Tagih nota tempo, bawa varian rasa baru..."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={schedSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{schedSubmitting ? "Menyimpan..." : "Simpan Jadwal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
