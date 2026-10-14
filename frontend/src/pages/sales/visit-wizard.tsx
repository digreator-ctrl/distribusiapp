import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2, ArrowRight, ArrowLeft, DollarSign,
  Package, ShoppingBag, Check, X, MessageSquare
} from "lucide-react";

export const SalesVisitWizard = () => {
  const { storeId } = useParams<{ storeId?: string }>();
  const navigate = useNavigate();

  const [activeSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );
  const [activeSalesName] = useState<string>(
    localStorage.getItem("distribusi_user_name") || "Sales"
  );

  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(storeId || "");
  const [selectedStore, setSelectedStore] = useState<any | null>(null);

  // Data Stok
  const [existingConsignments, setExistingConsignments] = useState<any[]>([]);
  const [holdingInventory, setHoldingInventory] = useState<any[]>([]);

  // Wizard Steps (1 - 5)
  // Step 1: Cek Stok Lama
  // Step 2: Input Stok Sisa & Hitung Terjual
  // Step 3: Pembayaran & Sisa Piutang
  // Step 4: Titip Stok Baru dari Stok di Tangan
  // Step 5: Konfirmasi, Simpan & Struk WA
  const [step, setStep] = useState<number>(1);

  // Form State
  // Sisa stok fisik per variant: { [variantId]: number }
  const [remainingInputs, setRemainingInputs] = useState<{ [variantId: string]: string }>({});
  // Pembayaran
  const [paymentReceived, setPaymentReceived] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  // Titip Stok Baru: { [variantId]: number }
  const [newConsignments, setNewConsignments] = useState<{ [variantId: string]: number }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Fetch Store List if no storeId, or fetch selected store
  useEffect(() => {
    const init = async () => {
      try {
        // GPS capture
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {},
            { timeout: 5000 }
          );
        }

        const resStores = await fetch("http://localhost:8787/api/stores");
        if (resStores.ok) {
          const list = await resStores.json();
          setStores(Array.isArray(list) ? list : []);
        }

        // Fetch sales inventory (stok di tangan)
        if (activeSalesId) {
          const resInv = await fetch(`http://localhost:8787/api/sales-inventory/${activeSalesId}`);
          if (resInv.ok) {
            const inv = await resInv.json();
            setHoldingInventory(Array.isArray(inv) ? inv : []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [activeSalesId]);

  // 2. Fetch Store Details when selectedStoreId changes
  useEffect(() => {
    if (!selectedStoreId) return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:8787/api/stores/${selectedStoreId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedStore(data);
          const consignments = data.consignments || [];
          setExistingConsignments(consignments);

          // Inisialisasi remaining input default sama dengan remaining_qty
          const initialRemaining: { [id: string]: string } = {};
          consignments.forEach((c: any) => {
            initialRemaining[c.variant_id] = String(c.remaining_qty);
          });
          setRemainingInputs(initialRemaining);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetail();
  }, [selectedStoreId]);

  // Kalkulasi Terjual & Tagihan
  const calculatedItems = existingConsignments.map((c) => {
    const initialQty = Number(c.remaining_qty) || 0; // stok awal periode ini
    const remainingInput = remainingInputs[c.variant_id];
    const physicalRemaining = remainingInput === "" ? initialQty : Number(remainingInput);
    const validRemaining = Math.max(0, Math.min(initialQty, isNaN(physicalRemaining) ? initialQty : physicalRemaining));
    const soldQty = Math.max(0, initialQty - validRemaining);
    const unitPrice = Number(c.price) || 0;
    const subtotal = soldQty * unitPrice;

    return {
      variant_id: c.variant_id,
      product_name: c.product_name,
      variant_name: c.variant_name,
      previous_stock: initialQty,
      remaining_stock: validRemaining,
      sold_qty: soldQty,
      unit_price: unitPrice,
      subtotal,
    };
  });

  const totalSoldAmount = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalSoldQty = calculatedItems.reduce((sum, item) => sum + item.sold_qty, 0);

  // Sisa piutang dari transaksi hari ini
  const numPayment = Number(paymentReceived) || 0;
  const currentOutstanding = Math.max(0, totalSoldAmount - numPayment);

  // Handler auto set payment to full
  const handlePayFull = () => {
    setPaymentReceived(String(totalSoldAmount));
  };

  const handlePayZero = () => {
    setPaymentReceived("0");
  };

  // Titip Stok Baru Helpers
  const handleAddNewConsignmentQty = (variantId: string, delta: number, maxHolding: number) => {
    setNewConsignments((prev) => {
      const current = prev[variantId] || 0;
      const next = Math.max(0, Math.min(maxHolding, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[variantId];
        return copy;
      }
      return { ...prev, [variantId]: next };
    });
  };

  const totalNewConsignmentQty = Object.values(newConsignments).reduce((sum, q) => sum + q, 0);

  // Submit Kunjungan
  const handleSubmitVisit = async () => {
    if (!selectedStoreId || !activeSalesId) {
      alert("Pilih toko dan pastikan Anda login.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Siapkan payload items gabungan (stok lama yang diaudit + stok baru yang dititipkan)
      const allVariantIds = new Set([
        ...calculatedItems.map((i) => i.variant_id),
        ...Object.keys(newConsignments),
      ]);

      const itemsPayload = Array.from(allVariantIds).map((vId) => {
        const audit = calculatedItems.find((i) => i.variant_id === vId);
        const newQty = newConsignments[vId] || 0;

        return {
          variant_id: vId,
          previous_stock: audit ? audit.previous_stock : 0,
          remaining_stock: audit ? audit.remaining_stock : 0,
          sold_qty: audit ? audit.sold_qty : 0,
          unit_price: audit ? audit.unit_price : 0,
          new_consignment_qty: newQty,
        };
      });

      const payload = {
        tenant_id: "tenant-1",
        sales_id: activeSalesId,
        store_id: selectedStoreId,
        visit_date: new Date().toISOString(),
        total_sold_amount: totalSoldAmount,
        payment_received: numPayment,
        outstanding_amount: currentOutstanding,
        notes: paymentNotes || null,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null,
        items: itemsPayload,
      };

      const res = await fetch("http://localhost:8787/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const err = await res.json();
        alert("Gagal menyimpan kunjungan: " + (err.error || "Terjadi kesalahan"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  // Buat pesan WhatsApp Nota Kunjungan
  const generateWhatsAppMessage = () => {
    if (!selectedStore) return "";
    const storeName = selectedStore.name;
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let msg = `*BUKTI KUNJUNGAN & NOTA KONSINYASI*\n`;
    msg += `Toko: *${storeName}*\n`;
    msg += `Tanggal: ${dateStr}\n`;
    msg += `Sales: ${activeSalesName}\n`;
    msg += `--------------------------------\n`;

    if (calculatedItems.length > 0) {
      msg += `*Audit Stok Terjual:*\n`;
      calculatedItems.forEach((item) => {
        if (item.sold_qty > 0) {
          msg += `• ${item.product_name} (${item.variant_name}): ${item.sold_qty} pcs x ${formatRupiah(item.unit_price)} = ${formatRupiah(item.subtotal)}\n`;
        }
      });
      msg += `*Total Penjualan:* ${formatRupiah(totalSoldAmount)}\n`;
    }

    msg += `*Pembayaran Diterima:* ${formatRupiah(numPayment)}\n`;
    if (currentOutstanding > 0) {
      msg += `*Sisa Piutang:* ${formatRupiah(currentOutstanding)}\n`;
    }

    if (totalNewConsignmentQty > 0) {
      msg += `--------------------------------\n`;
      msg += `*Titip Stok Baru di Rak:*\n`;
      Object.entries(newConsignments).forEach(([vId, qty]) => {
        const item = holdingInventory.find((h) => h.variant_id === vId);
        const name = item ? `${item.product_name} (${item.variant_name})` : "Item";
        msg += `• ${name}: +${qty} pcs\n`;
      });
    }

    msg += `--------------------------------\n`;
    msg += `Terima kasih atas kerja samanya. 🙏`;

    return encodeURIComponent(msg);
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    const waLink = selectedStore?.wa_number
      ? `https://wa.me/${selectedStore.wa_number.replace(/\D/g, "")}?text=${generateWhatsAppMessage()}`
      : null;

    return (
      <div className="bg-card border border-border/80 rounded-3xl p-6 text-center space-y-4 shadow-lg animate-in zoom-in-95">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 size={36} />
        </div>

        <div>
          <h2 className="text-xl font-black text-foreground">Kunjungan Selesai! 🎉</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Data kunjungan ke <span className="font-bold text-foreground">{selectedStore?.name}</span> telah disimpan.
          </p>
        </div>

        {/* Ringkasan */}
        <div className="bg-muted/40 rounded-2xl p-4 text-xs space-y-2 border border-border/50 text-left">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Penjualan:</span>
            <span className="font-bold text-foreground">{formatRupiah(totalSoldAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uang Diterima:</span>
            <span className="font-bold text-emerald-600">{formatRupiah(numPayment)}</span>
          </div>
          {currentOutstanding > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sisa Piutang:</span>
              <span className="font-bold text-red-600">{formatRupiah(currentOutstanding)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-border/50">
            <span className="text-muted-foreground">Titip Stok Baru:</span>
            <span className="font-bold text-foreground">{totalNewConsignmentQty} pcs</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
            >
              <MessageSquare size={16} />
              <span>Kirim Struk via WhatsApp</span>
            </a>
          ) : (
            <button
              onClick={() => {
                const text = decodeURIComponent(generateWhatsAppMessage());
                navigator.clipboard.writeText(text);
                alert("Toko tidak memiliki nomor WA. Teks nota telah disalin ke clipboard!");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
            >
              <MessageSquare size={16} />
              <span>Salin Teks Nota (No WA Kosong)</span>
            </button>
          )}

          <button
            onClick={() => navigate("/sales/toko")}
            className="w-full bg-primary text-primary-foreground font-bold text-xs py-3 rounded-xl active:scale-98 transition shadow-xs"
          >
            Kembali ke Daftar Toko
          </button>

          <button
            onClick={() => navigate("/sales")}
            className="w-full bg-muted/60 text-muted-foreground hover:text-foreground font-semibold text-xs py-2.5 rounded-xl transition"
          >
            Ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header Wizard */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate("/sales/toko");
          }}
          className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="text-center flex-1 px-2 min-w-0">
          <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
            Langkah {step} dari 5
          </p>
          <h1 className="text-sm font-bold text-foreground truncate">
            {step === 1 && "1. Cek Stok Lama di Rak"}
            {step === 2 && "2. Hitung Fisik Sisa & Terjual"}
            {step === 3 && "3. Pembayaran Uang"}
            {step === 4 && "4. Titip Stok Baru"}
            {step === 5 && "5. Konfirmasi Kunjungan"}
          </h1>
        </div>

        <button
          onClick={() => navigate("/sales/toko")}
          className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition shrink-0"
          title="Tutup Wizard"
        >
          <X size={16} />
        </button>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="grid grid-cols-5 gap-1.5 px-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Pemilihan Toko Jika Belum Dipilih */}
      {!selectedStoreId && (
        <div className="bg-card p-4 rounded-2xl border border-border space-y-3 shadow-xs">
          <label className="text-xs font-bold text-foreground block">
            Pilih Toko yang Dikunjungi:
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Pilih Mitra Toko --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.owner_name ? `(${s.owner_name})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedStore && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs text-foreground truncate">{selectedStore.name}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{selectedStore.address || "Alamat tidak dicatat"}</p>
          </div>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
            Aktif
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 1: CEK STOK LAMA (Barang dititipkan sebelumnya)       */}
      {/* ========================================================= */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-primary" />
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Stok Awal di Rak Toko
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Berikut adalah daftar barang yang tercatat dititipkan ke toko ini pada kunjungan sebelumnya.
            </p>

            {existingConsignments.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-amber-900">Belum Ada Stok Konsinyasi</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Ini kunjungan perdana atau stok sebelumnya sudah kosong. Lanjutkan untuk menitipkan stok baru.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingConsignments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-muted/40 p-3 rounded-xl border border-border/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">{c.product_name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.variant_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{c.remaining_qty} pcs</p>
                      <p className="text-[10px] text-muted-foreground">{formatRupiah(c.price || 0)}/pcs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedStoreId}
            className="w-full bg-primary text-primary-foreground font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition disabled:opacity-50"
          >
            <span>Lanjut: Input Sisa Fisik</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: INPUT STOK SISA & HITUNG TERJUAL                  */}
      {/* ========================================================= */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-xs">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Hitung Fisik Sisa di Rak
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Masukkan jumlah barang fisik yang masih tersisa di rak. Sistem akan otomatis menghitung jumlah terjual.
            </p>

            {existingConsignments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Tidak ada stok lama untuk dihitung.
              </p>
            ) : (
              <div className="space-y-3">
                {calculatedItems.map((item) => (
                  <div
                    key={item.variant_id}
                    className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{item.product_name}</h4>
                        <p className="text-[10px] text-muted-foreground">{item.variant_name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        Awal: {item.previous_stock} pcs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                          Sisa Fisik Rak:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.previous_stock}
                          value={remainingInputs[item.variant_id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRemainingInputs((prev) => ({
                              ...prev,
                              [item.variant_id]: val,
                            }));
                          }}
                          className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground text-center focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="bg-emerald-500/10 p-2 rounded-xl text-right">
                        <span className="text-[10px] font-bold text-emerald-800 block">Terjual:</span>
                        <span className="text-sm font-black text-emerald-600">
                          {item.sold_qty} pcs
                        </span>
                        <span className="text-[10px] text-emerald-700 block mt-0.5">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Banner Total Terjual */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl text-white shadow-md flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-white/80">Total Tagihan Terjual</p>
              <h2 className="text-xl font-black">{formatRupiah(totalSoldAmount)}</h2>
            </div>
            <div className="text-right">
              <span className="text-lg font-black">{totalSoldQty}</span>
              <span className="text-[10px] text-white/80 ml-1">pcs</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Kembali
            </button>
            <button
              onClick={() => {
                // Auto-fill payment dengan full jika payment masih kosong
                if (paymentReceived === "") setPaymentReceived(String(totalSoldAmount));
                setStep(3);
              }}
              className="flex-1 bg-primary text-primary-foreground font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition"
            >
              <span>Lanjut: Pembayaran</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: PEMBAYARAN                                        */}
      {/* ========================================================= */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" />
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Penerimaan Uang
              </h3>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border border-border/50 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Tagihan Terjual:</span>
              <span className="text-sm font-black text-foreground">{formatRupiah(totalSoldAmount)}</span>
            </div>

            {/* Tombol Shortcut Cepat */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePayFull}
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-300 font-bold text-xs py-2 rounded-xl transition"
              >
                Bayar Penuh (Lunas)
              </button>
              <button
                type="button"
                onClick={handlePayZero}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-300 font-bold text-xs py-2 rounded-xl transition"
              >
                Belum Bayar (Hutang)
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Jumlah Uang Diterima (Rp)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={paymentReceived}
                onChange={(e) => setPaymentReceived(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base font-black text-foreground focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Sisa Piutang Info */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                currentOutstanding > 0
                  ? "bg-red-50 border-red-200 text-red-800 font-semibold"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
              }`}
            >
              <span>{currentOutstanding > 0 ? "Sisa Piutang Toko:" : "Status Pembayaran:"}</span>
              <span className="font-black text-sm">
                {currentOutstanding > 0 ? formatRupiah(currentOutstanding) : "LUNAS ✓"}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Catatan Pembayaran / Kunjungan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Toko bayar transfer, sisa janji lunas selasa depan..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Kembali
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-primary text-primary-foreground font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition"
            >
              <span>Lanjut: Titip Stok Baru</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: TITIP STOK BARU DARI STOK DI TANGAN               */}
      {/* ========================================================= */}
      {step === 4 && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" />
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Titip Stok Baru ke Rak
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pilih item dari "Stok di Tangan" Anda untuk dititipkan ke toko ini. Jumlah tidak boleh melebihi stok yang dibawa.
            </p>

            {holdingInventory.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-amber-900">Stok di Tangan Kosong</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Anda tidak membawa stok apapun saat ini. Lewati langkah ini untuk langsung konfirmasi.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {holdingInventory.map((item) => {
                  const holding = Number(item.current_holding) || 0;
                  const qty = newConsignments[item.variant_id] || 0;

                  return (
                    <div
                      key={item.variant_id}
                      className="bg-muted/30 p-3 rounded-xl border border-border/60 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-foreground truncate">{item.product_name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.variant_name} • Ada {holding} pcs di tangan
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddNewConsignmentQty(item.variant_id, -1, holding)}
                          disabled={qty <= 0}
                          className="w-8 h-8 rounded-lg bg-card border border-border text-foreground font-black text-sm flex items-center justify-center active:scale-95 transition disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-black text-xs text-foreground">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleAddNewConsignmentQty(item.variant_id, 1, holding)}
                          disabled={qty >= holding}
                          className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black text-sm flex items-center justify-center active:scale-95 transition disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ringkasan Titip Baru */}
          <div className="bg-card border border-border rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Total Stok Baru Dititipkan:</span>
            <span className="font-black text-foreground">{totalNewConsignmentQty} pcs</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(3)}
              className="py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Kembali
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 bg-primary text-primary-foreground font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition"
            >
              <span>Lanjut: Konfirmasi</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 5: KONFIRMASI & SIMPAN                               */}
      {/* ========================================================= */}
      {step === 5 && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Konfirmasi Kunjungan Toko
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mitra Toko:</span>
                  <span className="font-bold text-foreground">{selectedStore?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Pelaksana:</span>
                  <span className="font-bold text-foreground">{activeSalesName}</span>
                </div>
              </div>

              {/* Rincian Penjualan */}
              <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Item Terjual:</span>
                  <span className="font-bold text-foreground">{totalSoldQty} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Nilai Terjual:</span>
                  <span className="font-black text-foreground">{formatRupiah(totalSoldAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uang Diterima:</span>
                  <span className="font-black text-emerald-600">{formatRupiah(numPayment)}</span>
                </div>
                {currentOutstanding > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sisa Piutang:</span>
                    <span className="font-black text-red-600">{formatRupiah(currentOutstanding)}</span>
                  </div>
                )}
              </div>

              {/* Rincian Titip Baru */}
              <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stok Baru Dititipkan:</span>
                  <span className="font-bold text-foreground">{totalNewConsignmentQty} pcs</span>
                </div>
              </div>

              {paymentNotes && (
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">Catatan: </span>
                  {paymentNotes}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(4)}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Kembali
            </button>
            <button
              onClick={handleSubmitVisit}
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? "Menyimpan Data..." : "Simpan & Selesaikan Kunjungan"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
