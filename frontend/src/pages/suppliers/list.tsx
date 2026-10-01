import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/suppliers`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Derived State: Filtered & Sorted
  const filteredAndSortedSuppliers = useMemo(() => {
    let result = [...suppliers];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.name || "").toLowerCase().includes(q) ||
        (s.contact_person || "").toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortOption === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortOption === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return result;
  }, [suppliers, searchQuery, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredAndSortedSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier</h1>
          <p className="text-muted-foreground mt-1">Kelola data mitra penyuplai produk titipan atau bahan baku.</p>
        </div>
        <button 
          onClick={() => navigate("/suppliers/create")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition"
        >
          + Tambah Supplier
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input 
            type="text" 
            placeholder="Cari supplier (nama, kontak, alamat)..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 outline-none text-sm"
          />
        </div>
        <select 
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
        >
          <option value="name_asc">Nama (A-Z)</option>
          <option value="name_desc">Nama (Z-A)</option>
          <option value="newest">Terbaru Ditambahkan</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Supplier</th>
                  <th className="px-6 py-4 font-semibold">Kontak Person</th>
                  <th className="px-6 py-4 font-semibold">No. Telepon</th>
                  <th className="px-6 py-4 font-semibold">Alamat</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {suppliers.length === 0 
                        ? "Belum ada data supplier." 
                        : "Tidak ada supplier yang cocok dengan pencarian/filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map(sup => (
                    <tr 
                      key={sup.id} 
                      onClick={() => navigate(`/suppliers/${sup.id}`)}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold">{sup.name}</td>
                      <td className="px-6 py-4">{sup.contact_person || '-'}</td>
                      <td className="px-6 py-4">{sup.phone || '-'}</td>
                      <td className="px-6 py-4 max-w-[200px] truncate">{sup.address || '-'}</td>
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
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedSuppliers.length)} dari {filteredAndSortedSuppliers.length} supplier
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
