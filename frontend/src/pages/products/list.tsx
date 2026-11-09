import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronRight, 
  Package 
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";
const API_URL = API_BASE_URL;

export const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // States for Filter, Search, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterBrand, setFilterBrand] = useState("ALL");
  const [sortOption, setSortOption] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(`Gagal memuat data: ${err.message}. Pastikan backend sedang berjalan.`);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derived unique categories and brands for filter dropdowns
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["ALL", ...Array.from(cats)];
  }, [products]);

  const brands = useMemo(() => {
    const b = new Set(products.map(p => p.brand).filter(Boolean));
    return ["ALL", ...Array.from(b)];
  }, [products]);

  // Count active non-default filters for mobile indicator
  const activeFilterCount = (filterCategory !== "ALL" ? 1 : 0) + 
                            (filterBrand !== "ALL" ? 1 : 0) + 
                            (sortOption !== "name_asc" ? 1 : 0);

  // Filter, Search, and Sort logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Filter Category
    if (filterCategory !== "ALL") {
      result = result.filter(p => p.category === filterCategory);
    }

    // Filter Brand
    if (filterBrand !== "ALL") {
      result = result.filter(p => p.brand === filterBrand);
    }

    // Sort
    result.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      const catA = a.category?.toLowerCase() || "";
      const catB = b.category?.toLowerCase() || "";
      const brandA = a.brand?.toLowerCase() || "";
      const brandB = b.brand?.toLowerCase() || "";

      switch (sortOption) {
        case "name_asc": return nameA.localeCompare(nameB);
        case "name_desc": return nameB.localeCompare(nameA);
        case "category_asc": return catA.localeCompare(catB) || nameA.localeCompare(nameB);
        case "brand_asc": return brandA.localeCompare(brandB) || nameA.localeCompare(nameB);
        default: return 0;
      }
    });

    return result;
  }, [products, searchQuery, filterCategory, filterBrand, sortOption]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  
  // Ensure current page is valid when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-card p-3.5 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
      {/* ============================================================== */}
      {/* 1. HEADER & CONTROLS UNTUK DESKTOP / TABLET (TIDAK BERUBAH)    */}
      {/* ============================================================== */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Katalog Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data master produk, varian, dan harga. Klik baris untuk melihat detail.</p>
        </div>
        <button 
          onClick={() => navigate("/products/create")}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xs hover:opacity-90 transition text-center shrink-0 text-sm"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Desktop / Tablet Control Bar (Search, Filters, Sort) */}
      <div className="hidden sm:flex gap-3 mb-6">
        <input 
          type="text"
          placeholder="Cari produk, kategori, atau merk..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl flex-1 focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
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
          value={filterBrand}
          onChange={(e) => { setFilterBrand(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="ALL">Semua Merk</option>
          {brands.filter(b => b !== "ALL").map(b => (
            <option key={b as string} value={b as string}>{b as string}</option>
          ))}
        </select>

        <select 
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="name_asc">Nama (A-Z)</option>
          <option value="name_desc">Nama (Z-A)</option>
          <option value="category_asc">Kategori (A-Z)</option>
          <option value="brand_asc">Merk (A-Z)</option>
        </select>
      </div>

      {/* ============================================================== */}
      {/* 2. HEADER & CONTROLS KHUSUS MOBILE (UI/UX MOBILE-FIRST)         */}
      {/* ============================================================== */}
      {/* Mobile Top Header: Judul + Counter + Tombol Tambah Kompak */}
      <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Katalog Produk</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {filteredAndSortedProducts.length}
            </span>
          </h1>
        </div>
        <button 
          onClick={() => navigate("/products/create")}
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
            placeholder="Cari nama, merk, kategori..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-muted/40 border border-border/80 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
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
              <span>Opsi Filter &amp; Urutan</span>
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterCategory("ALL");
                  setFilterBrand("ALL");
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
                Merk Produk
              </label>
              <select 
                value={filterBrand}
                onChange={(e) => { setFilterBrand(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border rounded-xl text-xs bg-card focus:ring-2 focus:ring-primary/40 outline-none"
              >
                <option value="ALL">Semua Merk</option>
                {brands.filter(b => b !== "ALL").map(b => (
                  <option key={b as string} value={b as string}>{b as string}</option>
                ))}
              </select>
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
                <option value="name_asc">Nama (A-Z)</option>
                <option value="name_desc">Nama (Z-A)</option>
                <option value="category_asc">Kategori (A-Z)</option>
                <option value="brand_asc">Merk (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* ============================================================== */}
      {/* 3. KONTEN DAFTAR PRODUK (DESKTOP TABEL vs MOBILE CARDS)         */}
      {/* ============================================================== */}
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse text-sm">Memuat katalog produk...</div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-500 font-semibold mb-3 text-sm">{error}</p>
          <button onClick={fetchProducts} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold">
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* A. TAMPILAN KHUSUS MOBILE: KARTU LIST PRODUK SEDERHANA & EFISIEN */}
          <div className="sm:hidden space-y-2.5">
            {paginatedProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                <Package className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-xs font-semibold">
                  {products.length === 0 
                    ? "Belum ada produk di database." 
                    : "Tidak ada produk yang cocok dengan pencarian."}
                </p>
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group hover:border-primary/50"
                >
                  <div className="min-w-0 flex-1">
                    {/* Baris 1: Nama Produk & Status Dot */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <span 
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          product.is_active == null || product.is_active ? 'bg-emerald-500' : 'bg-red-500'
                        }`} 
                        title={product.is_active == null || product.is_active ? "Aktif" : "Nonaktif"} 
                      />
                    </div>

                    {/* Baris 2: Merk • Kategori */}
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {product.brand || 'Tanpa Merk'} • {product.category || 'Tanpa Kategori'}
                    </p>

                    {/* Baris 3: Badges (Supplier & Jumlah Varian) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {product.supplier_name ? (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 truncate max-w-[130px]">
                          🏢 {product.supplier_name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          🏭 Internal
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {product.variants?.length || 0} varian
                      </span>
                    </div>
                  </div>

                  {/* Panah Navigasi Kanan */}
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))
            )}
          </div>

          {/* B. TAMPILAN DESKTOP & TABLET: TABEL LENGKAP (TIDAK BERUBAH) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Produk</th>
                  <th className="px-6 py-4 font-semibold">Supplier</th>
                  <th className="px-6 py-4 font-semibold">Kategori</th>
                  <th className="px-6 py-4 font-semibold">Merk</th>
                  <th className="px-6 py-4 font-semibold text-center">Varian</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {products.length === 0 
                        ? "Belum ada data produk di database. Silakan tambah produk baru." 
                        : "Tidak ada produk yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold">{product.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-700">
                        {product.supplier_name ? (
                          <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">{product.supplier_name}</span>
                        ) : (
                          <span className="text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border/50">Internal</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{product.category || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium">{product.brand || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
                          {product.variants?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          product.is_active == null || product.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {product.is_active == null || product.is_active ? "Aktif" : "Nonaktif"}
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
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} dari {filteredAndSortedProducts.length} produk
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
