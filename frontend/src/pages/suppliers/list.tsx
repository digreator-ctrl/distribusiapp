import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Phone, MapPin, User } from "lucide-react";

import { API_BASE_URL } from "../../config/api";
import { cache } from "../../utils/cache";
const API_URL = API_BASE_URL;

export const SupplierList = () => {
  const navigate = useNavigate();
  const cachedSuppliers = cache.get<any[]>("suppliers_list");
  const [suppliers, setSuppliers] = useState<any[]>(() => cachedSuppliers || []);
  const [isLoading, setIsLoading] = useState(!cachedSuppliers);

  // Pagination & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSuppliers = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/suppliers`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSuppliers(list);
      cache.set("suppliers_list", list);
    } catch (err) {
      console.error(err);
      if (!cachedSuppliers) setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, [cachedSuppliers]);

  useEffect(() => {
    fetchSuppliers(Boolean(cachedSuppliers));
  }, [fetchSuppliers, cachedSuppliers]);

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
    <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Supplier</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Kelola data mitra penyuplai produk titipan atau bahan baku.</p>
        </div>
        <button 
          onClick={() => navigate("/suppliers/create")}
          className="w-full sm:w-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xs hover:opacity-90 transition text-center shrink-0 text-sm"
        >
          + Tambah Supplier
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Cari supplier (nama, kontak, alamat)..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="flex-1 p-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/50 outline-none text-sm"
        />
        <select 
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
          className="p-2.5 border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-background"
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
          {/* Mobile Card List */}
          <div className="sm:hidden space-y-2.5">
            {paginatedSuppliers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/10">
                <p className="text-xs font-semibold">
                  {suppliers.length === 0
                    ? "Belum ada data supplier."
                    : "Tidak ada supplier yang cocok dengan pencarian/filter."}
                </p>
              </div>
            ) : (
              paginatedSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  onClick={() => navigate(`/suppliers/${sup.id}`)}
                  className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group hover:border-primary/50"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {sup.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                      <User size={11} className="shrink-0" />
                      <span>Kontak: {sup.contact_person || "-"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                      <Phone size={11} className="shrink-0" />
                      <span>{sup.phone || "-"}</span>
                    </p>
                    {sup.address && (
                      <p className="text-[11px] text-muted-foreground truncate mt-1 flex items-center gap-1">
                        <MapPin size={11} className="shrink-0 text-primary" />
                        <span>{sup.address}</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))
            )}
          </div>

          {/* Desktop / Tablet Table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/50">
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-3 pt-2">
              <div className="text-center sm:text-left">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedSuppliers.length)} dari {filteredAndSortedSuppliers.length} supplier
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center px-2 font-medium">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
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
