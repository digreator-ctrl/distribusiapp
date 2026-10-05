import { useList } from "@refinedev/core";
import { Package, Search, BarChart3 } from "lucide-react";
import { useState } from "react";

export const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data, isLoading } = useList({
    resource: "inventory",
    pagination: { mode: "off" }
  });

  const items = data?.data || [];

  const filteredItems = items.filter((item: any) => 
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <BarChart3 size={24} />
              </div>
              Katalog & Stok Gudang
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Pantau total stok riil dari setiap varian produk yang tersedia di gudang saat ini.
            </p>
          </div>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama produk, varian, atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground animate-pulse flex flex-col items-center">
            <Package size={32} className="mb-3 opacity-20" />
            <p>Memuat data stok gudang...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center bg-muted/20 rounded-xl border border-dashed border-border">
            <Package size={48} className="mb-3 opacity-20" />
            <p className="font-medium text-foreground">Tidak ada data stok ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-background shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Nama Produk & Kategori</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Varian (SKU)</th>
                  <th className="px-6 py-4 font-semibold text-center whitespace-nowrap w-48">Sisa Stok Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{item.product_name}</span>
                        {item.category && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{item.variant_name}</span>
                        {item.sku && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded inline-block w-max">SKU: {item.sku}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border ${
                        item.total_stock <= 0 ? 'bg-red-50 border-red-200 text-red-700' : 
                        item.total_stock < 20 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        <span className="font-black text-xl">{item.total_stock}</span>
                        <span className="text-xs font-bold opacity-70">pcs</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
