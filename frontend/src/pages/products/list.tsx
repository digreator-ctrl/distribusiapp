import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

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
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Katalog Produk</h1>
          <p className="text-muted-foreground mt-1">Kelola data master produk, varian, dan harga. Klik baris untuk melihat detail.</p>
        </div>
        <button 
          onClick={() => navigate("/products/create")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Control Bar: Search, Filters, Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text"
          placeholder="Cari produk, kategori, atau merk..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded-md flex-1 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        />
        
        <select 
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        >
          <option value="ALL">Semua Kategori</option>
          {categories.filter(c => c !== "ALL").map(c => (
            <option key={c as string} value={c as string}>{c as string}</option>
          ))}
        </select>

        <select 
          value={filterBrand}
          onChange={(e) => { setFilterBrand(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        >
          <option value="ALL">Semua Merk</option>
          {brands.filter(b => b !== "ALL").map(b => (
            <option key={b as string} value={b as string}>{b as string}</option>
          ))}
        </select>

        <select 
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        >
          <option value="name_asc">Nama (A-Z)</option>
          <option value="name_desc">Nama (Z-A)</option>
          <option value="category_asc">Kategori (A-Z)</option>
          <option value="brand_asc">Merk (A-Z)</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API...</div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-500 font-semibold mb-3">{error}</p>
          <button onClick={fetchProducts} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-border/50">
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
              <div>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} dari {filteredAndSortedProducts.length} produk
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-2 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"
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
