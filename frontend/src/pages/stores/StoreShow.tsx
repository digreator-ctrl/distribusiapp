import { useShow, useCustom } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, User, Building, Package, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const StoreShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { queryResult } = useShow({
    resource: "stores",
    id,
  });

  const store = queryResult.data?.data;

  // Mendapatkan location_id untuk toko ini (asumsikan kita fetch semua lokasi dan cari yang reference_id nya cocok)
  // Ini adalah pendekatan sederhana, lebih baik lagi jika API /stores/:id mengembalikan location_id
  const { data: locationsData } = useCustom({
    url: "/api/locations",
    method: "get",
    config: {
      query: { limit: 100 } // asumsikan kurang dari 100
    }
  });
  
  const storeLocation = locationsData?.data?.data?.find((loc: any) => loc.reference_id === id && loc.type === 'store');

  const { data: stockData, isLoading: isLoadingStock } = useCustom({
    url: "/api/inventory/balances",
    method: "get",
    config: {
      query: { location_id: storeLocation?.id }
    },
    queryOptions: {
      enabled: !!storeLocation?.id
    }
  });

  const stocks = stockData?.data?.data || [];

  if (queryResult.isLoading) return <div className="p-4">Memuat data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/stores")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{store?.name}</h1>
          <p className="text-sm text-surface-500">Kode: {store?.store_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-200 dark:border-surface-800 pb-2">Informasi Toko</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <User className="h-5 w-5 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Pemilik</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{store?.owner_name || "-"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Telepon</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{store?.phone || "-"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Building className="h-5 w-5 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Tipe</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 capitalize">{store?.type}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Alamat Lengkap</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {store?.address}
                    {store?.district && <>, {store.district}</>}
                    {store?.city && <>, {store.city}</>}
                  </p>
                  {store?.latitude && store?.longitude && (
                    <a 
                      href={`https://maps.google.com/?q=${store.latitude},${store.longitude}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                    >
                      Lihat di Peta <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-[hsl(224,20%,12%)]">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Stok Barang di Toko (Titipan)</h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white dark:bg-[hsl(224,20%,10%)] text-surface-600 dark:text-surface-400 font-medium border-b border-surface-200 dark:border-surface-800">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3 text-right">Kuantitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800 bg-white dark:bg-[hsl(224,20%,10%)]">
                  {!storeLocation ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-surface-500">Mencari lokasi gudang toko...</td>
                    </tr>
                  ) : isLoadingStock ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-surface-500">Memuat stok...</td>
                    </tr>
                  ) : stocks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-surface-500">Tidak ada stok (kosong).</td>
                    </tr>
                  ) : (
                    stocks.map((item: any) => (
                      <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-[hsl(224,20%,12%)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-surface-900 dark:text-surface-100">{item.product_name}</div>
                          <div className="text-xs text-surface-500">{item.variant_name}</div>
                        </td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{item.product_sku}</td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                          {item.batch_number ? (
                            <span className="inline-flex bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-xs font-mono">
                              {item.batch_number}
                            </span>
                          ) : (
                            <span className="text-surface-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary-600 dark:text-primary-400 text-base">
                          {item.quantity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
