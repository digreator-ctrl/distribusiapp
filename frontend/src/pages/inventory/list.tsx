import {
  useState,
  useEffect,
  useCallback,
  useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  Package,
  Building2,
  Warehouse
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { cache } from "../../utils/cache";

const API_URL = API_BASE_URL;

export const InventoryList = () => {
  const navigate = useNavigate();
  // Client-side cache untuk perpindahan halaman instan tanpa jeda loading
  const cachedInventory = cache.get<any[]>("inventory_list");
  const [items, setItems] = useState<any[]>(() => cachedInventory || []);
  const [isLoading, setIsLoading] = useState(!cachedInventory);

  // States: Search, Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortOption, setSortOption] = useState("name_asc");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInventory = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/inventory`);
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : [];
        setItems(data);
        cache.set("inventory_list", data);
      }
    } catch (err) {
      console.error("Gagal mengambil data stok gudang:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory(Boolean(cachedInventory));
  }, [fetchInventory, cachedInventory]);

  // Derived filter options
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ["ALL", ...Array.from(cats)];
  }, [items]);

  // Active filter count for mobile badge
  const activeFilterCount = (filterCategory !== "ALL" ? 1 : 0) + (sortOption !== "name_asc" ? 1 : 0);

  // Filter & Sort Logic
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item: any) => 
        (item.product_name && item.product_name.toLowerCase().includes(q)) || 
        (item.variant_name && item.variant_name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.supplier_name && item.supplier_name.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filterCategory !== "ALL") {
      result = result.filter((item: any) => item.category === filterCategory);
    }

    // Sort logic
    result.sort((a: any, b: any) => {
      const nameA = `${a.product_name || ""} ${a.variant_name || ""}`.toLowerCase();
      const nameB = `${b.product_name || ""} ${b.variant_name || ""}`.toLowerCase();
      const stockA = Number(a.total_stock) || 0;
      const stockB = Number(b.total_stock) || 0;
      const catA = (a.category || "").toLowerCase();
      const catB = (b.category || "").toLowerCase();
      const suppA = (a.supplier_name || "Internal").toLowerCase();
      const suppB = (b.supplier_name || "Internal").toLowerCase();

      switch (sortOption) {
        case "name_asc": return nameA.localeCompare(nameB);
        case "name_desc": return nameB.localeCompare(nameA);
        case "stock_desc": return stockB - stockA;
        case "stock_asc": return stockA - stockB;
        case "category_asc": return catA.localeCompare(catB) || nameA.localeCompare(nameB);
        case "supplier_asc": return suppA.localeCompare(suppB) || nameA.localeCompare(nameB);
        default: return 0;
      }
    });

    return result;
  }, [items, searchTerm, filterCategory, sortOption]);

  // Pagination Logic (10 per page)
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPhysicalStock = filteredAndSortedItems.reduce((acc, curr) => acc + (Number(curr.total_stock) || 0), 0);

  return (
    <div className="bg-card p-3.5 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
      {/* ============================================================== */}
      {/* 1. HEADER & CONTROLS UNTUK DESKTOP / TABLET (TIDAK BERUBAH)    */}
      {/* ============================================================== */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Stok Gudang</h1>
          <p className="text-sm text-muted-foreground mt-1">Pantau ketersediaan stok riil produk dan varian yang tersimpan di gudang utama.</p>
        </div>
        <div className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground bg-muted/40 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-border/60">
          <p>Total Item: <span className="font-semibold text-foreground">{filteredAndSortedItems.length}</span></p>
          <p>Total Stok: <span className="font-semibold text-foreground">{totalPhysicalStock.toLocaleString("id-ID")} pcs</span></p>
        </div>
      </div>

      {/* Desktop / Tablet Control Bar: Search, Filters, Sort */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:flex gap-3 mb-6">
        <input 
          type="text"
          placeholder="Cari produk / SKU..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl lg:flex-1 focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        />
        
        <select 
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="ALL">Semua Kategori</option>
          {categories.filter(c => c !== "ALL").map(c => (
            <option key={c as string} value={c as string}>{c as string}</option>
          ))}
        </select>

        <select 
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="name_asc">Nama (A - Z)</option>
          <option value="name_desc">Nama (Z - A)</option>
          <option value="stock_desc">Stok Tertinggi</option>
          <option value="stock_asc">Stok Terendah</option>
          <option value="category_asc">Kategori (A - Z)</option>
          <option value="supplier_asc">Supplier (A - Z)</option>
        </select>
      </div>

      {/* ============================================================== */}
      {/* 2. HEADER & CONTROLS KHUSUS MOBILE (UI/UX MOBILE-FIRST)         */}
      {/* ============================================================== */}
      {/* Mobile Top Header: Judul + Counter + Total Stok Badge Ringkas */}
      <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Stok Gudang</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {filteredAndSortedItems.length}
            </span>
          </h1>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted/70 border border-border/80 rounded-xl text-xs font-bold text-foreground">
            <span className="text-[10px] text-muted-foreground font-medium">Total:</span> {totalPhysicalStock.toLocaleString("id-ID")} pcs
          </span>
        </div>
      </div>

      {/* Mobile Search & Filter Bar */}
      <div className="flex sm:hidden items-center gap-2 mb-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Cari produk, SKU, varian..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-muted/40 border border-border/80 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tombol Buka Panel Filter & Urutkan */}
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

      {/* Mobile Horizontal Scrolling Category Chips */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none -mx-1 px-1">
        <button
          type="button"
          onClick={() => { setFilterCategory("ALL"); setCurrentPage(1); }}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
            filterCategory === "ALL"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Semua Kategori
        </button>
        {categories.filter(c => c !== "ALL").map(c => (
          <button
            key={c as string}
            type="button"
            onClick={() => { setFilterCategory(c as string); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
              filterCategory === c
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {c as string}
          </button>
        ))}
      </div>

      {/* Mobile Expandable Filter & Sort Drawer Panel */}
      {isMobileFilterOpen && (
        <div className="sm:hidden mb-3.5 p-3.5 bg-muted/30 border border-border/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-primary" />
              <span>Opsi Urutan &amp; Filter</span>
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterCategory("ALL");
                  setSortOption("name_asc");
                  setCurrentPage(1);
                }}
                className="text-[11px] font-bold text-destructive hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Urutkan Berdasarkan
            </label>
            <select 
              value={sortOption}
              onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
            >
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
              <option value="stock_desc">Stok Tertinggi</option>
              <option value="stock_asc">Stok Terendah</option>
              <option value="category_asc">Kategori (A - Z)</option>
              <option value="supplier_asc">Supplier (A - Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. KONTEN DAFTAR STOK GUDANG (DESKTOP TABEL vs MOBILE CARDS)   */}
      {/* ============================================================== */}
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse text-sm">Memuat data stok gudang...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* A. TAMPILAN KHUSUS MOBILE: KARTU LIST STOK GUDANG RINGKAS & EFISIEN */}
          <div className="sm:hidden space-y-2.5">
            {paginatedItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                <Package className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-xs font-semibold">
                  {items.length === 0 
                    ? "Belum ada data stok gudang." 
                    : "Tidak ada data yang cocok dengan pencarian/filter."}
                </p>
              </div>
            ) : (
              paginatedItems.map((item: any) => {
                const stockNum = Number(item.total_stock) || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/products/${item.product_id}?tab=stock-history`)}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group hover:border-primary/50"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Baris 1: Nama Produk & Jumlah Stok */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.product_name}
                        </h3>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border shrink-0 ${
                          stockNum > 10
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : stockNum > 0
                            ? "text-amber-700 bg-amber-50 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300"
                            : "text-red-700 bg-red-50 border-red-200/60 dark:bg-red-950/40 dark:text-red-300"
                        }`}>
                          {stockNum.toLocaleString("id-ID")} pcs
                        </span>
                      </div>

                      {/* Baris 2: Varian & SKU */}
                      {item.variant_name && (
                        <p className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5 flex-wrap">
                          <span>Varian: <strong className="text-foreground">{item.variant_name}</strong></span>
                          {item.sku && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted/60 rounded text-muted-foreground border border-border/40">
                              {item.sku}
                            </span>
                          )}
                        </p>
                      )}

                      {/* Baris 3: Kategori, Merk, Supplier */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {item.category && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                        {item.brand && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                            {item.brand}
                          </span>
                        )}
                        {item.supplier_name ? (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 truncate max-w-[120px]">
                            <Building2 size={11} className="inline mr-1 text-blue-600 shrink-0" />{item.supplier_name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            <Warehouse size={11} className="inline mr-1 text-muted-foreground shrink-0" />Internal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron Right */}
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* B. TAMPILAN DESKTOP & TABLET: TABEL LENGKAP (TIDAK BERUBAH) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Produk</th>
                  <th className="px-6 py-4 font-semibold">Varian</th>
                  <th className="px-6 py-4 font-semibold">Kategori</th>
                  <th className="px-6 py-4 font-semibold">Supplier</th>
                  <th className="px-6 py-4 font-semibold">Merk</th>
                  <th className="px-6 py-4 font-semibold text-right">Stok</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {items.length === 0 ? "Belum ada data stok gudang." : "Tidak ada data yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item: any) => (
                    <tr 
                      key={item.id} 
                      onClick={() => navigate(`/products/${item.product_id}?tab=stock-history`)}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {item.variant_name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span>{item.variant_name}</span>
                            {item.sku && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                ({item.sku})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.category || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {item.supplier_name ? (
                          <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100">{item.supplier_name}</span>
                        ) : (
                          <span className="text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full text-xs font-medium border border-border/50">Internal</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.brand || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                        {Number(item.total_stock).toLocaleString("id-ID")} pcs
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
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)} dari {filteredAndSortedItems.length} item
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-2 font-medium text-xs">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
