import { useState, useEffect } from "react";
import { useCreate, useList, useCustomMutation, useCustom } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Store, Package, CheckCircle, Plus, Trash2, MapPin } from "lucide-react";

export const SalesVisitCreate = () => {
  const navigate = useNavigate();
  const { mutateAsync: createVisit } = useCreate();
  const { mutateAsync: customMutate } = useCustomMutation();

  const [step, setStep] = useState(1);
  const [salesId, setSalesId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get Store's previous stock based on its location
  // First, fetch locations to find store's locationId
  const { data: locationsData } = useCustom({ url: "/api/locations", method: "get" });
  const storeLocationId = locationsData?.data?.data?.find((l: any) => l.type === 'store' && l.reference_id === storeId)?.id;
  
  // Then fetch inventory balances for this location
  const { data: stockData, isLoading: isLoadingStock } = useCustom({
    url: "/api/inventory/balances",
    method: "get",
    config: { query: { location_id: storeLocationId } },
    queryOptions: { enabled: !!storeLocationId }
  });
  const previousStocks = stockData?.data?.data || [];

  const [items, setItems] = useState<any[]>([]);

  const { data: salesData } = useList({ resource: "sales", pagination: { mode: "off" } });
  const salesList = salesData?.data || [];

  const { data: storesData } = useList({ resource: "stores", pagination: { mode: "off" } });
  const stores = storesData?.data || [];
  
  const { data: productsData } = useList({ resource: "products", pagination: { mode: "off" } });
  const products = productsData?.data || [];

  // Initialize items from previous stock when moving to step 2
  const handleProceedToStep2 = () => {
    if (!salesId || !storeId) {
      alert("Pilih Sales dan Toko terlebih dahulu");
      return;
    }
    
    // Auto-populate items based on previous stock
    const initialItems = previousStocks.map((stock: any) => ({
      product_id: stock.product_id,
      variant_id: stock.variant_id,
      batch_id: stock.batch_id,
      product_name: stock.product_name,
      previous_quantity: stock.quantity,
      sold_quantity: 0,
      return_quantity: 0,
      new_quantity: 0,
    }));
    
    setItems(initialItems);
    setStep(2);
  };

  const handleAddItem = () => {
    setItems([...items, { 
      product_id: "", variant_id: "", batch_id: "", product_name: "",
      previous_quantity: 0, sold_quantity: 0, return_quantity: 0, new_quantity: 0 
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleCompleteVisit = async () => {
    try {
      setIsProcessing(true);
      const date = new Date().toISOString().split("T")[0];
      
      // 1. Create Visit (Check-in)
      const visitRes = await createVisit({
        resource: "sales_visits",
        values: { sales_id: salesId, store_id: storeId, visit_date: date, notes }
      });
      const visitId = visitRes.data.id;

      // 2. Add Items
      // Filter out items that are empty / invalid
      const validItems = items.filter(i => i.product_id).map(i => ({
        ...i,
        remaining_quantity: (i.previous_quantity || 0) - (i.sold_quantity || 0) - (i.return_quantity || 0) + (i.new_quantity || 0)
      }));

      if (validItems.length > 0) {
        await customMutate({
          url: `/api/sales_visits/${visitId}/items`,
          method: "post",
          values: { items: validItems }
        });
      }

      // 3. Complete Visit
      await customMutate({
        url: `/api/sales_visits/${visitId}/complete`,
        method: "post",
        values: {}
      });

      alert("Kunjungan berhasil diselesaikan!");
      navigate("/sales-visits");

    } catch (error: any) {
      alert(error?.message || "Terjadi kesalahan saat memproses kunjungan.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 2 ? setStep(1) : navigate("/sales-visits")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Kunjungan Toko</h1>
          <p className="text-sm text-surface-500">Mulai kunjungan dan catat aktivitas.</p>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex items-center w-full max-w-sm">
          <div className={`flex-1 h-2 rounded-l-full ${step >= 1 ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${step >= 1 ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'}`}>1</div>
          <div className={`flex-1 h-2 ${step >= 2 ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${step >= 2 ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'}`}>2</div>
          <div className={`flex-1 h-2 rounded-r-full ${step >= 2 ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-800'}`}></div>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-6">
          <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
            <Store className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Pilih Toko & Sales</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenaga Penjual (Sales) <span className="text-red-500">*</span></label>
              <select
                required
                value={salesId}
                onChange={(e) => setSalesId(e.target.value)}
                className="flex h-12 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-base dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
              >
                <option value="">Pilih Sales...</option>
                {salesList.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.area || '-'})</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Toko Tujuan <span className="text-red-500">*</span></label>
              <select
                required
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="flex h-12 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-base dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
              >
                <option value="">Pilih Toko...</option>
                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.address}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan / Laporan Awal</label>
              <Input
                placeholder="Kondisi display baik..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          
          <Button className="w-full h-12 text-base mt-4" onClick={handleProceedToStep2}>
            Lanjut Check Stok <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-[hsl(224,20%,12%)]">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold">Cek Fisik Barang</h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Item Baru
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-6 text-surface-500">Tidak ada stok sebelumnya. Tambahkan item baru.</div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="bg-surface-50 dark:bg-[hsl(224,20%,12%)] border border-surface-200 dark:border-surface-800 p-4 rounded-xl space-y-4 relative">
                    {/* Item Delete Button */}
                    <button 
                      className="absolute top-4 right-4 text-surface-400 hover:text-red-500"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    
                    <div className="pr-8 space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-surface-500">Produk</label>
                      {item.product_name ? (
                        <div className="font-semibold text-surface-900 dark:text-surface-100">{item.product_name}</div>
                      ) : (
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-800 dark:bg-[hsl(224,20%,8%)]"
                        >
                          <option value="">Pilih Produk...</option>
                          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-xs font-medium text-surface-500">Stok Awal</label>
                        <Input type="number" disabled value={item.previous_quantity} className="bg-surface-100 dark:bg-surface-800" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400">Laku Terjual</label>
                        <Input type="number" min="0" value={item.sold_quantity} onChange={(e) => handleItemChange(index, "sold_quantity", Number(e.target.value))} className="border-green-300 dark:border-green-800 focus-visible:ring-green-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-xs font-medium text-red-500">Retur / Tarik</label>
                        <Input type="number" min="0" value={item.return_quantity} onChange={(e) => handleItemChange(index, "return_quantity", Number(e.target.value))} className="border-red-300 dark:border-red-800 focus-visible:ring-red-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-xs font-medium text-blue-500">Titip Baru</label>
                        <Input type="number" min="0" value={item.new_quantity} onChange={(e) => handleItemChange(index, "new_quantity", Number(e.target.value))} className="border-blue-300 dark:border-blue-800 focus-visible:ring-blue-500" />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-surface-200 dark:border-surface-800 mt-2">
                      <span className="text-sm font-medium text-surface-500">Stok Akhir Toko:</span>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {Math.max(0, (item.previous_quantity || 0) - (item.sold_quantity || 0) - (item.return_quantity || 0) + (item.new_quantity || 0))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button 
            className="w-full h-12 text-base font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25" 
            onClick={handleCompleteVisit}
            disabled={isProcessing}
          >
            {isProcessing ? "Menyimpan Data..." : <><CheckCircle className="h-5 w-5 mr-2" /> Selesaikan Kunjungan</>}
          </Button>
        </div>
      )}
    </div>
  );
};
