import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Store, Plus, Search, MapPin, Phone,
  CheckCircle2, X, Trash2, Edit, Eye, Filter
} from "lucide-react";

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 shadow-xl max-w-sm w-full animate-in fade-in slide-in-from-top-5">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-bold text-green-800">Berhasil</h3>
        <p className="text-xs text-green-700 mt-0.5">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="text-green-500 hover:text-green-700 transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const StoreList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = (localStorage.getItem("distribusi_role") || "admin").toLowerCase();
  const isOwner = userRole === "owner";

  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8787/api/stores");
      if (res.ok) {
        const json = await res.json();
        setStores(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error("Gagal memuat toko:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDelete = async (storeId: string, storeName: string) => {
    if (!isOwner) {
      alert("Aksi hapus hanya dapat dilakukan oleh Owner.");
      return;
    }

    if (!confirm(`Hapus mitra toko "${storeName}"? Seluruh data terkait akan dihapus secara permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8787/api/stores/${storeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccessMsg(`Toko "${storeName}" berhasil dihapus.`);
        fetchStores();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus toko.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi gangguan koneksi.");
    }
  };

  const provinces = useMemo(() => {
    const pSet = new Set<string>();
    stores.forEach((s) => {
      if (s.province) pSet.add(s.province);
    });
    return Array.from(pSet);
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchesSearch =
        search === "" ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.city?.toLowerCase().includes(search.toLowerCase()) ||
        s.address?.toLowerCase().includes(search.toLowerCase());

      const sStatus = s.status || "Aktif";
      const matchesStatus = statusFilter === "all" || sStatus === statusFilter;
      const matchesProvince = provinceFilter === "all" || s.province === provinceFilter;

      return matchesSearch && matchesStatus && matchesProvince;
    });
  }, [stores, search, statusFilter, provinceFilter]);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const totalActiveStores = stores.filter((s) => (s.status || "Aktif") === "Aktif").length;
  const totalDebtStores = stores.reduce((sum, s) => sum + (Number(s.total_debt) || 0), 0);
  const totalStockInStores = stores.reduce((sum, s) => sum + (Number(s.total_remaining_stock) || 0), 0);

  return (
    <>
      {successMsg && <Toast message={successMsg} onClose={() => setSuccessMsg("")} />}

      <div className="space-y-6">
        {/* Header & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Store className="text-primary w-6 h-6" />
              Mitra Toko
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola data toko ritel mitra konsinyasi dan distribusi.
            </p>
          </div>
          <button
            onClick={() => navigate("/stores/create")}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span>Tambah Mitra Toko</span>
          </button>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-5 rounded-2xl border shadow-xs space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Mitra Toko</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{stores.length}</span>
              <span className="text-xs text-emerald-600 font-bold">({totalActiveStores} Aktif)</span>
            </div>
          </div>

          <div className="bg-card p-5 rounded-2xl border shadow-xs space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Stok di Toko</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground">{totalStockInStores}</span>
              <span className="text-xs text-muted-foreground font-semibold">pcs</span>
            </div>
          </div>

          <div className="bg-card p-5 rounded-2xl border shadow-xs space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Piutang Toko</span>
            <p className="text-2xl font-black text-amber-600">{formatRupiah(totalDebtStores)}</p>
          </div>
        </div>

        {/* Table & Filter Container */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama toko, PIC, wilayah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60 text-xs">
                <Filter size={13} className="text-muted-foreground" />
                <span className="text-muted-foreground font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-foreground focus:outline-none"
                >
                  <option value="all">Semua</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>

              {provinces.length > 0 && (
                <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60 text-xs">
                  <MapPin size={13} className="text-muted-foreground" />
                  <span className="text-muted-foreground font-semibold">Provinsi:</span>
                  <select
                    value={provinceFilter}
                    onChange={(e) => setProvinceFilter(e.target.value)}
                    className="bg-transparent font-bold text-foreground focus:outline-none"
                  >
                    <option value="all">Semua</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse text-sm">
              Memuat data mitra toko...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm border border-dashed rounded-xl">
              Tidak ada mitra toko yang sesuai dengan pencarian atau filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border/60 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Nama Toko & PIC</th>
                    <th className="px-5 py-3.5">Wilayah</th>
                    <th className="px-5 py-3.5">Kontak</th>
                    <th className="px-5 py-3.5 text-center">Stok di Rak</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredStores.map((store) => {
                    const isStoreActive = (store.status || "Aktif") === "Aktif";
                    const regionParts = [store.province, store.city, store.district].filter(Boolean);
                    const regionText = regionParts.length > 0 ? regionParts.join(" - ") : (store.address || "-");

                    return (
                      <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/stores/${store.id}`)}>
                            {store.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            PIC: {store.owner_name || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate">
                          <p className="font-medium text-foreground">{regionText}</p>
                          {store.address && regionParts.length > 0 && (
                            <p className="text-[10px] text-muted-foreground truncate">{store.address}</p>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {store.wa_number ? (
                            <a
                              href={`https://wa.me/${store.wa_number.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Phone size={12} />
                              <span>{store.wa_number}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-center font-bold text-foreground">
                          {store.total_remaining_stock || 0} pcs
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isStoreActive
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200"
                            }`}
                          >
                            {store.status || "Aktif"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/stores/${store.id}`)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition"
                              title="Lihat Detail"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={() => navigate(`/stores/${store.id}/edit`)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-muted transition"
                              title="Edit Toko"
                            >
                              <Edit size={15} />
                            </button>

                            {isOwner && (
                              <button
                                onClick={() => handleDelete(store.id, store.name)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                                title="Khusus Owner: Hapus Toko"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
