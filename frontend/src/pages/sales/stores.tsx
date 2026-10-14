import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Plus, Search, MapPin, MessageSquare,
  Clock, CheckCircle2, ChevronRight, X,
  Compass, User
} from "lucide-react";

export const SalesStores = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "debt">("all");

  // Modal / Drawer Tambah Toko
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newWa, setNewWa] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Drawer Detail Toko
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [storeDetail, setStoreDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8787/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch stores error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi GPS");
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(pos.coords.latitude);
        setNewLng(pos.coords.longitude);
        setIsGettingGps(false);
      },
      (err) => {
        console.error(err);
        alert("Gagal membaca GPS: " + err.message);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError("Nama toko wajib diisi.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8787/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          owner_name: newOwner.trim(),
          address: newAddress.trim(),
          wa_number: newWa.trim(),
          latitude: newLat,
          longitude: newLng,
        }),
      });

      if (res.ok) {
        setToast({ message: "Toko berhasil ditambahkan!", type: "success" });
        setIsAddOpen(false);
        setNewName("");
        setNewOwner("");
        setNewAddress("");
        setNewWa("");
        setNewLat(null);
        setNewLng(null);
        fetchStores();
      } else {
        const err = await res.json();
        setFormError(err.error || "Gagal menambahkan toko.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (store: any) => {
    setSelectedStore(store);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`http://localhost:8787/api/stores/${store.id}`);
      if (res.ok) {
        const data = await res.json();
        setStoreDetail(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Belum pernah";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  // Filter & Search logic
  const filteredStores = stores.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.name?.toLowerCase().includes(q) ||
      s.owner_name?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterType === "pending") {
      // Toko yang belum dikunjungi hari ini
      const today = new Date().toISOString().split("T")[0];
      const visitedToday = s.last_visit_date && s.last_visit_date.startsWith(today);
      return !visitedToday;
    }
    if (filterType === "debt") {
      return Number(s.total_debt) > 0;
    }
    return true;
  });

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

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store size={20} className="text-primary" />
            Mitra Toko
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola data toko konsinyasi & mulai kunjungan
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary text-primary-foreground font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
        >
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari toko, pemilik, atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            Semua ({stores.length})
          </button>
          <button
            onClick={() => setFilterType("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === "pending"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            Perlu Kunjungan
          </button>
          <button
            onClick={() => setFilterType("debt")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === "debt"
                ? "bg-red-600 text-white shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            Ada Piutang
          </button>
        </div>
      </div>

      {/* List Toko */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-muted/40 rounded-2xl" />
          <div className="h-28 bg-muted/40 rounded-2xl" />
          <div className="h-28 bg-muted/40 rounded-2xl" />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-2">
            <Store size={24} />
          </div>
          <p className="font-bold text-xs text-foreground">Tidak Ada Toko Ditemukan</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {searchQuery ? "Coba kata kunci pencarian yang lain." : "Belum ada toko yang terdaftar. Tambah sekarang."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredStores.map((store) => {
            const hasDebt = Number(store.total_debt) > 0;
            const remaining = Number(store.total_remaining_stock) || 0;

            return (
              <div
                key={store.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-2xs space-y-3 hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-foreground truncate">{store.name}</h3>
                      {hasDebt && (
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] font-black rounded-full shrink-0 border border-red-200">
                          Hutang
                        </span>
                      )}
                    </div>

                    {store.owner_name && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User size={11} className="shrink-0" />
                        <span className="truncate">{store.owner_name}</span>
                      </p>
                    )}

                    {store.address && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={11} className="shrink-0 text-primary/70" />
                        <span className="truncate">{store.address}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDetail(store)}
                    className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground shrink-0"
                    title="Detail Toko"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Info Mini Badge */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/50 text-[10px]">
                  <div className="bg-muted/40 p-1.5 rounded-lg">
                    <p className="text-muted-foreground font-semibold">Stok Rak</p>
                    <p className="font-black text-foreground">{remaining} pcs</p>
                  </div>
                  <div className="bg-muted/40 p-1.5 rounded-lg">
                    <p className="text-muted-foreground font-semibold">Piutang</p>
                    <p className={`font-black ${hasDebt ? "text-red-600" : "text-foreground"}`}>
                      {hasDebt ? formatRupiah(store.total_debt) : "Rp 0"}
                    </p>
                  </div>
                  <div className="bg-muted/40 p-1.5 rounded-lg">
                    <p className="text-muted-foreground font-semibold">Kunjungan</p>
                    <p className="font-bold text-foreground truncate">{formatDate(store.last_visit_date)}</p>
                  </div>
                </div>

                {/* Action Buttons: Mulai Kunjungan + WA + Map */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => navigate(`/sales/toko/kunjungan/${store.id}`)}
                    className="flex-1 bg-primary text-primary-foreground font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition shadow-xs"
                  >
                    <Store size={14} />
                    <span>Mulai Kunjungan</span>
                  </button>

                  {store.wa_number && (
                    <a
                      href={`https://wa.me/${store.wa_number.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-95 transition shrink-0"
                      title="Chat WhatsApp"
                    >
                      <MessageSquare size={16} />
                    </a>
                  )}

                  {store.latitude && store.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:scale-95 transition shrink-0"
                      title="Buka Peta"
                    >
                      <Compass size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER / MODAL TAMBAH TOKO BARU                           */}
      {/* ========================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Store size={18} className="text-primary" />
                Tambah Mitra Toko Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
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

            <form onSubmit={handleAddStore} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Nama Toko *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Berkah Jaya"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Nama Pemilik</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Haji Samsul"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Nomor WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={newWa}
                  onChange={(e) => setNewWa(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Alamat Toko</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap atau patokan jalan..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Titik GPS</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingGps}
                    className="flex-1 bg-muted/80 hover:bg-muted text-foreground text-xs font-bold py-2 px-3 rounded-xl border border-border flex items-center justify-center gap-1.5 transition"
                  >
                    <MapPin size={14} className={newLat ? "text-emerald-500" : "text-muted-foreground"} />
                    <span>{isGettingGps ? "Membaca GPS..." : newLat ? "Lokasi Terkunci ✓" : "Ambil Lokasi Saat Ini"}</span>
                  </button>
                  {newLat && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {newLat.toFixed(4)}, {newLng?.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Toko"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER DETAIL TOKO                                        */}
      {/* ========================================================= */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-foreground truncate">{selectedStore.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{selectedStore.owner_name || "Pemilik tidak dicatat"}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedStore(null);
                  setStoreDetail(null);
                }}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions in Detail */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const id = selectedStore.id;
                  setSelectedStore(null);
                  navigate(`/sales/toko/kunjungan/${id}`);
                }}
                className="flex-1 bg-primary text-primary-foreground font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <Store size={16} />
                <span>Mulai Kunjungan</span>
              </button>

              {selectedStore.wa_number && (
                <a
                  href={`https://wa.me/${selectedStore.wa_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-95 transition flex items-center gap-1 text-xs font-bold"
                >
                  <MessageSquare size={16} />
                  <span>WA</span>
                </a>
              )}
            </div>

            {isLoadingDetail ? (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-16 bg-muted/40 rounded-xl" />
                <div className="h-24 bg-muted/40 rounded-xl" />
              </div>
            ) : storeDetail ? (
              <div className="space-y-4 text-xs">
                {/* Konsinyasi Aktif di Toko */}
                <div>
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Stok Konsinyasi di Rak
                  </h4>
                  {storeDetail.consignments?.length === 0 ? (
                    <p className="text-muted-foreground text-[11px] italic bg-muted/30 p-3 rounded-xl text-center">
                      Belum ada stok konsinyasi aktif di rak toko ini.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {storeDetail.consignments.map((c: any) => (
                        <div
                          key={c.id}
                          className="bg-muted/40 p-2.5 rounded-xl flex items-center justify-between border border-border/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-foreground truncate">{c.product_name} - {c.variant_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Awal: {c.initial_stock} pcs • Terjual: {c.sold_qty || 0} pcs
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-sm text-foreground">{c.remaining_qty}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">sisa</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Riwayat Kunjungan Terakhir */}
                <div>
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    Riwayat Kunjungan Terakhir
                  </h4>
                  {storeDetail.recent_visits?.length === 0 ? (
                    <p className="text-muted-foreground text-[11px] italic bg-muted/30 p-3 rounded-xl text-center">
                      Belum ada riwayat kunjungan yang tercatat.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {storeDetail.recent_visits.map((v: any) => (
                        <div
                          key={v.id}
                          className="bg-muted/40 p-2.5 rounded-xl border border-border/50 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-foreground">{formatDate(v.visit_date)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Sales: {v.sales_name || "Sales"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{formatRupiah(v.payment_received || 0)}</p>
                            {Number(v.outstanding_amount) > 0 && (
                              <p className="text-[10px] text-red-500 font-semibold">
                                Sisa: {formatRupiah(v.outstanding_amount)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
