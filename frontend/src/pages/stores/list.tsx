import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  Store,
  CheckCircle2,
  MapPin,
  User,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { cache } from "../../utils/cache";

const API_URL = API_BASE_URL;

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

const regionText = (s: any) =>
  [s.province, s.city, s.district, s.village].filter(Boolean).join(" - ") || "-";

export const StoreList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const cachedStores = cache.get<any[]>("stores_list");
  const [stores, setStores] = useState<any[]>(() => cachedStores || []);
  const [isLoading, setIsLoading] = useState(!cachedStores);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterProvince, setFilterProvince] = useState("ALL");
  const [sortOption, setSortOption] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchStores = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/stores`);
        if (res.ok) {
          const json = await res.json();
          const data = Array.isArray(json) ? json : [];
          setStores(data);
          cache.set("stores_list", data);
        }
      } catch (err) {
        console.error("Gagal memuat toko:", err);
        if (!cachedStores) setStores([]);
      } finally {
        setIsLoading(false);
      }
    },
    [cachedStores]
  );

  useEffect(() => {
    fetchStores(Boolean(cachedStores));
  }, [fetchStores, cachedStores]);

  const provinces = useMemo(() => {
    const pSet = new Set<string>();
    stores.forEach((s) => {
      if (s.province) pSet.add(s.province);
    });
    return ["ALL", ...Array.from(pSet).sort()];
  }, [stores]);

  const activeFilterCount =
    (filterStatus !== "ALL" ? 1 : 0) +
    (filterProvince !== "ALL" ? 1 : 0) +
    (sortOption !== "name_asc" ? 1 : 0);

  const filteredAndSortedStores = useMemo(() => {
    let result = [...stores];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.owner_name && s.owner_name.toLowerCase().includes(q)) ||
          (s.province && s.province.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.district && s.district.toLowerCase().includes(q)) ||
          (s.village && s.village.toLowerCase().includes(q)) ||
          (s.address && s.address.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== "ALL") {
      result = result.filter((s) => (s.status || "Aktif") === filterStatus);
    }

    if (filterProvince !== "ALL") {
      result = result.filter((s) => s.province === filterProvince);
    }

    result.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      switch (sortOption) {
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "name_desc":
          return nameB.localeCompare(nameA);
        default:
          return 0;
      }
    });

    return result;
  }, [stores, searchQuery, filterStatus, filterProvince, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedStores.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedStores = filteredAndSortedStores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusBadgeClass = (status?: string) =>
    (status || "Aktif") === "Aktif"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-zinc-100 text-zinc-700 border-zinc-200";

  return (
    <div className="bg-card p-3.5 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
      {successMsg && <Toast message={successMsg} onClose={() => setSuccessMsg("")} />}

      {/* ============================================================== */}
      {/* 1. HEADER & CONTROLS UNTUK DESKTOP / TABLET                      */}
      {/* ============================================================== */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Store className="text-primary w-6 h-6 md:w-7 md:h-7" />
            Mitra Toko
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data toko ritel mitra konsinyasi dan distribusi. Klik baris untuk melihat detail.
          </p>
        </div>
        <button
          onClick={() => navigate("/stores/create")}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xs hover:opacity-90 transition text-center shrink-0 text-sm"
        >
          + Tambah Mitra Toko
        </button>
      </div>

      {/* Desktop / Tablet Control Bar (Search, Filters, Sort) */}
      <div className="hidden sm:flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Cari nama toko, PIC, atau wilayah..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-xl flex-1 focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        />

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="ALL">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
        </select>

        <select
          value={filterProvince}
          onChange={(e) => {
            setFilterProvince(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="ALL">Semua Provinsi</option>
          {provinces
            .filter((p) => p !== "ALL")
            .map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
        </select>

        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="name_asc">Nama (A-Z)</option>
          <option value="name_desc">Nama (Z-A)</option>
        </select>
      </div>

      {/* ============================================================== */}
      {/* 2. HEADER & CONTROLS KHUSUS MOBILE (UI/UX MOBILE-FIRST)          */}
      {/* ============================================================== */}
      {/* Mobile Top Header: Judul + Counter + Tombol Tambah Kompak */}
      <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <Store className="text-primary w-5 h-5 shrink-0" />
            <span>Mitra Toko</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {filteredAndSortedStores.length}
            </span>
          </h1>
        </div>
        <button
          onClick={() => navigate("/stores/create")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Mobile Search & Filter Bar */}
      <div className="flex sm:hidden items-center gap-2 mb-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, PIC, wilayah..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-muted/40 border border-border/80 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className={`p-2 rounded-xl border flex items-center justify-center shrink-0 transition-all active:scale-95 relative ${
            activeFilterCount > 0 || isMobileFilterOpen
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-card border-border/80 text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Filter dan Urutkan"
        >
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0 && !isMobileFilterOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Horizontal Scrolling Status Chips */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none -mx-1 px-1">
        {["ALL", "Aktif", "Tidak Aktif"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilterStatus(status);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
              filterStatus === status
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {status === "ALL" ? "Semua Status" : status}
          </button>
        ))}
      </div>

      {/* Mobile Expandable Filter & Sort Drawer Panel */}
      {isMobileFilterOpen && (
        <div className="sm:hidden mb-3.5 p-3.5 bg-muted/30 border border-border/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-primary" />
              <span>Opsi Filter &amp; Urutan</span>
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setFilterProvince("ALL");
                  setSortOption("name_asc");
                  setCurrentPage(1);
                }}
                className="text-[11px] font-bold text-destructive hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Provinsi
              </label>
              <select
                value={filterProvince}
                onChange={(e) => {
                  setFilterProvince(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="ALL">Semua Provinsi</option>
                {provinces
                  .filter((p) => p !== "ALL")
                  .map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Urutkan Berdasarkan
              </label>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="name_asc">Nama (A-Z)</option>
                <option value="name_desc">Nama (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. KONTEN DAFTAR MITRA TOKO (DESKTOP TABEL vs MOBILE CARDS)      */}
      {/* ============================================================== */}
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse text-sm">
          Memuat data mitra toko...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* A. TAMPILAN KHUSUS MOBILE: KARTU LIST TOKO */}
          <div className="sm:hidden space-y-2.5">
            {paginatedStores.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                <Store className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-xs font-semibold">
                  {stores.length === 0
                    ? "Belum ada mitra toko di database."
                    : "Tidak ada mitra toko yang cocok dengan pencarian."}
                </p>
              </div>
            ) : (
              paginatedStores.map((store) => {
                const isActive = (store.status || "Aktif") === "Aktif";
                return (
                  <div
                    key={store.id}
                    onClick={() => navigate(`/stores/${store.id}`, { state: { store } })}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group hover:border-primary/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {store.name}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : "bg-zinc-400"}`}
                          title={store.status || "Aktif"}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground truncate mb-1.5 flex items-center gap-1">
                        <User size={11} className="shrink-0" />
                        <span>PIC: {store.owner_name || "-"}</span>
                      </p>

                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin size={11} className="shrink-0 text-primary" />
                        <span>{regionText(store)}</span>
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* B. TAMPILAN DESKTOP & TABLET: TABEL LENGKAP */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Toko</th>
                  <th className="px-6 py-4 font-semibold">PIC</th>
                  <th className="px-6 py-4 font-semibold">Wilayah</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {stores.length === 0
                        ? "Belum ada data mitra toko di database. Silakan tambah mitra toko baru."
                        : "Tidak ada mitra toko yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedStores.map((store) => (
                    <tr
                      key={store.id}
                      onClick={() => navigate(`/stores/${store.id}`, { state: { store } })}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold">{store.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {store.owner_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {regionText(store)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold border ${statusBadgeClass(
                            store.status
                          )}`}
                        >
                          {store.status || "Aktif"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* C. PAGINATION CONTROLS (RESPONSIF MOBILE & DESKTOP) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-3 pt-2">
              <div className="text-center sm:text-left text-xs">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedStores.length)} dari{" "}
                {filteredAndSortedStores.length} mitra toko
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-2 font-medium text-xs">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
