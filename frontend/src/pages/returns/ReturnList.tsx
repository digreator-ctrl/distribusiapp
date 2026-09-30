import { useTable } from "@refinedev/core";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, CornerUpLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export const ReturnList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const {
    tableQuery: { data, isLoading },
    currentPage,
    setCurrentPage,
    pageCount,
    setFilters
  } = useTable({
    resource: "returns",
    syncWithLocation: false,
  });

  const returns = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters: any[] = [{ field: "search", operator: "eq", value: searchTerm }];
    if (activeTab !== "all") {
      newFilters.push({ field: "status", operator: "eq", value: activeTab });
    }
    setFilters(newFilters);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newFilters: any[] = [{ field: "search", operator: "eq", value: searchTerm }];
    if (tab !== "all") {
      newFilters.push({ field: "status", operator: "eq", value: tab });
    }
    setFilters(newFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'verified':
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_process': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-400';
    }
  };

  const getReturnTypeLabel = (type: string) => {
    switch (type) {
      case 'production_defect': return 'Cacat Produksi';
      case 'shipping_damage': return 'Rusak Pengiriman';
      case 'expired': return 'Kedaluwarsa';
      case 'display_damage': return 'Kerusakan Display';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Daftar Retur Barang</h1>
          <p className="text-sm text-surface-500">Kelola pengajuan retur dari agen, sales, atau toko.</p>
        </div>
        <Button onClick={() => navigate("/returns/create")} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Buat Retur Baru
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <Input
            placeholder="Cari nomor dokumen retur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </form>
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-surface-200 dark:border-surface-800 scrollbar-hide">
          <button 
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'all' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => handleTabChange('all')}
          >
            Semua Retur
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'pending' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => handleTabChange('pending')}
          >
            Menunggu Verifikasi
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Baru</span>
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'approved' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => handleTabChange('approved')}
          >
            Disetujui / Diproses
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'completed' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => handleTabChange('completed')}
          >
            Selesai
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'rejected' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'}`}
            onClick={() => handleTabChange('rejected')}
          >
            Ditolak
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4">No. Retur & Tanggal</th>
                <th className="px-6 py-4">Alasan Retur</th>
                <th className="px-6 py-4">Sumber</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Memuat data...</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">Tidak ada pengajuan retur.</td>
                </tr>
              ) : (
                returns.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-400">
                          <CornerUpLeft className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-surface-900 dark:text-surface-100">{item.return_number}</div>
                          <div className="text-xs text-surface-500">{item.return_date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">
                      {getReturnTypeLabel(item.return_type)}
                    </td>
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400 capitalize">
                      {item.source_type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/returns/${item.id}`}>
                        <Button variant={item.status === 'pending' ? 'default' : 'outline'} size="sm">
                          {item.status === 'pending' ? 'Verifikasi' : <><Eye className="h-4 w-4 mr-1.5" /> Detail</>}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Sebelumnya</Button>
            <span className="text-sm text-surface-600 dark:text-surface-400">Halaman {currentPage} dari {pageCount}</span>
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setCurrentPage(currentPage + 1)}>Selanjutnya</Button>
          </div>
        )}
      </div>
    </div>
  );
};
