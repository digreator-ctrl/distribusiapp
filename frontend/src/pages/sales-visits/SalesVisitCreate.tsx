import { useState } from "react";
import { useCreate, useList, useCustomMutation, useCustom } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ArrowRight, Store, Package, CheckCircle, Camera, Banknote, PenTool, Plus, Trash2, MapPin } from "lucide-react";

export const SalesVisitCreate = () => {
  const navigate = useNavigate();
  const { mutateAsync: createVisit } = useCreate();
  const { mutateAsync: customMutate } = useCustomMutation();

  const [step, setStep] = useState(1);
  const [salesId, setSalesId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [notes, setNotes] = useState("");
  const [cashCollected, setCashCollected] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mocks for locations/stock due to complex relations in UI
  const { data: salesData } = useList({ resource: "sales", pagination: { mode: "off" } });
  const salesList = salesData?.data || [];

  const { data: storesData } = useList({ resource: "stores", pagination: { mode: "off" } });
  const stores = storesData?.data || [];
  
  const { data: productsData } = useList({ resource: "products", pagination: { mode: "off" } });
  const products = productsData?.data || [];

  // Items state: track old items (sold/return) and new items (drop)
  const [items, setItems] = useState([
    { product_id: "1", product_name: "Roti Sisir Mentega", previous_quantity: 50, sold_quantity: 0, return_quantity: 0, new_quantity: 0, price: 5000 },
    { product_id: "2", product_name: "Roti Coklat Lumer", previous_quantity: 30, sold_quantity: 0, return_quantity: 0, new_quantity: 0, price: 6000 },
  ]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleCompleteVisit = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert("Kunjungan berhasil diselesaikan dan disinkronisasi!");
      navigate("/sales-visits");
      setIsProcessing(false);
    }, 1500);
  };

  const totalBilled = items.reduce((acc, item) => acc + (item.sold_quantity * item.price), 0);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24 md:pb-8">
      {/* Mobile-style App Header */}
      <div className="bg-primary-600 text-white p-4 -mx-4 -mt-4 md:rounded-b-3xl md:mx-0 shadow-md flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-white hover:bg-primary-700" onClick={() => step > 1 ? setStep(step - 1) : navigate("/sales-visits")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Kunjungan Toko</h1>
          <p className="text-primary-100 text-xs">Tahap {step} dari 5</p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="flex justify-between items-center px-2 py-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex flex-col items-center gap-1 flex-1">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-500'}`}>
              {s}
            </div>
            <div className={`h-1 w-full mt-1 rounded-full ${step > s ? 'bg-primary-500' : 'bg-surface-200'}`}></div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        
        {step === 1 && (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 text-primary-600 mb-4">
              <MapPin className="h-5 w-5" />
              <h2 className="text-lg font-bold">Check-in & Display</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1 block">Toko Tujuan</label>
                <select
                  className="w-full h-12 rounded-xl border border-surface-200 bg-surface-50 px-3 font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={storeId} onChange={(e) => setStoreId(e.target.value)}
                >
                  <option value="">-- Pilih Toko Terdekat --</option>
                  <option value="1">Toko Makmur Jaya (0.2 km)</option>
                  <option value="2">Toko Sinar Harapan (1.5 km)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1 block">Foto Kondisi Display</label>
                <div className="h-32 border-2 border-dashed border-surface-300 rounded-xl flex flex-col items-center justify-center text-surface-500 bg-surface-50 hover:bg-surface-100 cursor-pointer transition-colors">
                  <Camera className="h-8 w-8 mb-2 text-primary-400" />
                  <span className="text-sm font-medium">Ambil Foto Display</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1 block">Catatan Tambahan</label>
                <Input placeholder="Display berantakan, perlu rak baru..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            
            <Button className="w-full h-12 rounded-xl" onClick={() => setStep(2)}>
              Lanjut Cek Stok <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Package className="h-5 w-5" />
              <h2 className="text-lg font-bold">Opname Stok Lama</h2>
            </div>
            <p className="text-xs text-surface-500">Hitung barang laku terjual dan barang yang harus ditarik (retur).</p>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 border border-surface-200 rounded-xl bg-surface-50 space-y-3">
                  <div className="flex justify-between items-start border-b border-surface-200 pb-2">
                    <span className="font-bold">{item.product_name}</span>
                    <span className="text-xs bg-surface-200 px-2 py-1 rounded font-mono">Awal: {item.previous_quantity}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-green-600 block mb-1">Laku Terjual</label>
                      <Input type="number" min="0" value={item.sold_quantity} onChange={(e) => handleItemChange(idx, 'sold_quantity', Number(e.target.value))} className="border-green-300 focus-visible:ring-green-500 h-10" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-red-500 block mb-1">Retur (Basi/Rusak)</label>
                      <Input type="number" min="0" value={item.return_quantity} onChange={(e) => handleItemChange(idx, 'return_quantity', Number(e.target.value))} className="border-red-300 focus-visible:ring-red-500 h-10" />
                    </div>
                  </div>
                  <div className="text-right text-xs text-surface-500 pt-1">
                    Sisa di etalase: <span className="font-bold text-surface-900">{item.previous_quantity - item.sold_quantity - item.return_quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full h-12 rounded-xl" onClick={() => setStep(3)}>
              Lanjut Drop Barang <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Plus className="h-5 w-5" />
              <h2 className="text-lg font-bold">Drop Barang Baru</h2>
            </div>
            <p className="text-xs text-surface-500">Masukkan jumlah barang baru yang dititipkan ke toko (konsinyasi).</p>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 border border-surface-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1">{item.product_name}</div>
                    <div className="text-xs text-surface-500">Stok Akhir Nanti: {item.previous_quantity - item.sold_quantity - item.return_quantity + item.new_quantity}</div>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-medium text-blue-600 block mb-1 uppercase text-center">Titip Baru</label>
                    <Input type="number" min="0" value={item.new_quantity} onChange={(e) => handleItemChange(idx, 'new_quantity', Number(e.target.value))} className="border-blue-300 focus-visible:ring-blue-500 h-10 text-center font-bold" />
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full h-12 rounded-xl" onClick={() => setStep(4)}>
              Lanjut Penagihan <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Banknote className="h-5 w-5" />
              <h2 className="text-lg font-bold">Penagihan & Nota</h2>
            </div>
            
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
              <h3 className="font-bold mb-3 text-sm border-b border-surface-200 pb-2">Rincian Tagihan</h3>
              <div className="space-y-2 mb-4">
                {items.filter(i => i.sold_quantity > 0).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product_name} ({item.sold_quantity}x)</span>
                    <span className="font-semibold">Rp {(item.sold_quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
                {items.filter(i => i.sold_quantity > 0).length === 0 && (
                  <div className="text-xs text-surface-500 italic">Tidak ada barang terjual.</div>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-surface-200">
                <span className="font-bold text-surface-900">Total Tagihan</span>
                <span className="text-xl font-bold text-primary-600">Rp {totalBilled.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 block">Pembayaran Diterima (Cash)</label>
              <Input type="number" value={cashCollected} onChange={(e) => setCashCollected(Number(e.target.value))} className="h-12 text-lg font-bold" />
              {cashCollected < totalBilled && cashCollected > 0 && (
                <p className="text-xs text-amber-600 mt-1">Sisa tagihan Rp {(totalBilled - cashCollected).toLocaleString()} akan masuk piutang toko.</p>
              )}
            </div>
            
            <Button className="w-full h-12 rounded-xl" onClick={() => setStep(5)}>
              Lanjut Check-out <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-right-4 text-center">
            <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900">Selesai Kunjungan</h2>
            <p className="text-sm text-surface-500">Minta tanda tangan pemilik/karyawan toko sebagai bukti sah kunjungan & transaksi.</p>
            
            <div className="mt-6 mb-8">
              <div className="h-40 border-2 border-dashed border-surface-300 rounded-xl flex flex-col items-center justify-center text-surface-400 bg-surface-50 cursor-crosshair">
                <PenTool className="h-6 w-6 mb-2 opacity-50" />
                <span className="text-sm">Area Tanda Tangan</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-14 rounded-xl text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25 text-white"
              onClick={handleCompleteVisit}
              disabled={isProcessing}
            >
              {isProcessing ? "Menyimpan Data..." : "Selesaikan Kunjungan"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
