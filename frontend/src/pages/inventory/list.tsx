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
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Gudang</h1>
          <p className="text-muted-foreground mt-1">Pantau ketersediaan stok riil produk dan varian yang tersimpan di gudang utama.</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Total Item: <span className="font-semibold text-foreground">{filteredAndSortedItems.length}</span></p>
          <p>Total Stok: <span className="font-semibold text-foreground">{totalPhysicalStock.toLocaleString("id-ID")} pcs</span></p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text"
          placeholder="Cari produk / SKU..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        >
          <option value="name_asc">Nama (A - Z)</option>
          <option value="name_desc">Nama (Z - A)</option>
          <option value="stock_desc">Stok Tertinggi</option>
          <option value="stock_asc">Stok Terendah</option>
          <option value="category_asc">Kategori (A - Z)</option>
          <option value="supplier_asc">Supplier (A - Z)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data stok gudang...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-border/50">
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
              <div>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)} dari {filteredAndSortedItems.length} item
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
