import { Package, Search, BarChart3, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const InventoryList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States: Search, Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortOption, setSortOption] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/inventory`);
      if (res.ok) {
        const json = await res.json();
        setItems(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error("Gagal mengambil data stok gudang:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Derived filter options
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ["ALL", ...Array.from(cats)];
  }, [items]);

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
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <BarChart3 size={22} />
              </div>
              Stok Gudang
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pantau ketersediaan stok riil produk dan varian yang tersimpan di gudang utama.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block border-r pr-3 text-xs text-muted-foreground">
              <p>Total Item: <span className="font-semibold text-foreground">{filteredAndSortedItems.length}</span></p>
              <p>Total Stok: <span className="font-semibold text-foreground">{totalPhysicalStock.toLocaleString("id-ID")} pcs</span></p>
            </div>
            <button
              onClick={fetchInventory}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Perbarui
            </button>
          </div>
        </div>

        {/* Control Bar: Search, Category Filter, Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* 1. Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari produk / SKU..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/20 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* 2. Filter Kategori */}
          <div className="w-full sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.filter(c => c !== "ALL").map(c => (
                <option key={c as string} value={c as string}>{c as string}</option>
              ))}
            </select>
          </div>

          {/* 3. Sort Option */}
          <div className="w-full sm:w-48">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer font-medium"
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

        <div className="flex justify-between items-center text-xs text-muted-foreground italic mb-3">
          <p>Klik pada baris data untuk melihat riwayat stok masuk & keluar.</p>
          {(searchTerm || filterCategory !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("ALL");
                setSortOption("name_asc");
                setCurrentPage(1);
              }}
              className="text-primary hover:underline font-medium not-italic"
            >
              Reset Filter
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground animate-pulse flex flex-col items-center">
            <Package size={28} className="mb-2 opacity-20" />
            <p className="text-sm">Memuat data stok gudang...</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-xl border border-dashed border-border">
            <Package size={36} className="mb-2 opacity-20" />
            <p className="font-medium text-sm text-foreground">Tidak ada data stok ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama Produk</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Merk</th>
                    <th className="px-4 py-3 font-semibold text-right">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedItems.map((item: any) => (
                    <tr 
                      key={item.id} 
                      onClick={() => navigate(`/products/${item.product_id}?tab=stock-history`)}
                      className="hover:bg-muted/50 cursor-pointer transition-colors group"
                      title={`Klik untuk melihat riwayat stok ${item.product_name}`}
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.product_name}
                        {item.variant_name && (
                          <span className="text-muted-foreground text-xs ml-1.5 font-normal">
                            ({item.variant_name})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.category || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.supplier_name || "Internal"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.brand || "-"}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-foreground text-right whitespace-nowrap">
                        {Number(item.total_stock).toLocaleString("id-ID")} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-sm text-muted-foreground">
              <div className="text-xs sm:text-sm">
                Menampilkan <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)}</span> dari <span className="font-semibold text-foreground">{filteredAndSortedItems.length}</span> item
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm"
                  >
                    <ChevronLeft size={14} />
                    Sebelumnya
                  </button>
                  <span className="px-2 text-xs font-medium">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm"
                  >
                    Selanjutnya
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
