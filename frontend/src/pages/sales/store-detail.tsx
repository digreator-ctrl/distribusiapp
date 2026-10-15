import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MessageSquare, Compass,
  User, AlertCircle, Phone, Edit2, Trash2, X, Check,
  Navigation, ExternalLink, Loader2, MapPin
} from "lucide-react";
import {
  PROVINCES_DATA,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  parseGmapsInput,
  type RegionItem
} from "../../lib/wilayah";

export const SalesStoreDetail = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const userRole = (localStorage.getItem("distribusi_role") || "sales").toLowerCase();
  const isOwner = userRole === "owner";

  const [store, setStore] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab State: "inbound" (Riwayat Stok Masuk) vs "sold" (Riwayat Terjual)
  const [historyTab, setHistoryTab] = useState<"inbound" | "sold">("inbound");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    owner_name: "",
    status: "Aktif",
    wa_number: "",
    province: "",
    city: "",
    district: "",
    village: "",
    address: "",
  });

  const [selectedProvId, setSelectedProvId] = useState("");
  const [editRegencies, setEditRegencies] = useState<RegionItem[]>([]);
  const [selectedRegId, setSelectedRegId] = useState("");
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);

  const [editDistricts, setEditDistricts] = useState<RegionItem[]>([]);
  const [selectedDistId, setSelectedDistId] = useState("");
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [editVillages, setEditVillages] = useState<RegionItem[]>([]);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  const [editGmaps, setEditGmaps] = useState("");
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchStoreDetail = async () => {
    if (!storeId) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch(`http://localhost:8787/api/stores/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setStore(data);
        setEditForm({
          name: data.name || "",
          owner_name: data.owner_name || "",
          status: data.status || "Aktif",
          wa_number: data.wa_number ? String(data.wa_number).replace(/\D/g, "") : "",
          province: data.province || "",
          city: data.city || "",
          district: data.district || "",
          village: data.village || "",
          address: data.address || "",
        });

        if (data.latitude && data.longitude) {
          setEditLat(data.latitude);
          setEditLng(data.longitude);
          setEditGmaps(`${data.latitude}, ${data.longitude}`);
        }

        // Initialize regions if existing
        const prov = PROVINCES_DATA.find((p) => p.name.toLowerCase() === (data.province || "").toLowerCase());
        if (prov) {
          setSelectedProvId(prov.id);
          const regList = await fetchRegencies(prov.id);
          setEditRegencies(regList);

          const reg = regList.find((r) => r.name.toLowerCase() === (data.city || "").toLowerCase());
          if (reg) {
            setSelectedRegId(reg.id);
            const distList = await fetchDistricts(reg.id);
            setEditDistricts(distList);

            const dist = distList.find((d) => d.name.toLowerCase() === (data.district || "").toLowerCase());
            if (dist) {
              setSelectedDistId(dist.id);
              const vilList = await fetchVillages(dist.id);
              setEditVillages(vilList);
            }
          }
        }
      } else {
        setError("Toko tidak ditemukan atau telah dihapus.");
      }
    } catch (err: any) {
      console.error("Fetch store detail error:", err);
      setError("Gagal memuat detail toko. Periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetail();
  }, [storeId]);

  const handleEditProvChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    setSelectedProvId(provId);
    const found = PROVINCES_DATA.find((p) => p.id === provId);
    setEditForm((prev) => ({
      ...prev,
      province: found ? found.name : "",
      city: "",
      district: "",
      village: ""
    }));

    setSelectedRegId("");
    setEditRegencies([]);
    setSelectedDistId("");
    setEditDistricts([]);
    setEditVillages([]);

    if (provId) {
      setIsLoadingRegencies(true);
      const data = await fetchRegencies(provId);
      setEditRegencies(data);
      setIsLoadingRegencies(false);
    }
  };

  const handleEditRegChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegId(regId);
    const found = editRegencies.find((r) => r.id === regId);
    setEditForm((prev) => ({
      ...prev,
      city: found ? found.name : "",
      district: "",
      village: ""
    }));

    setSelectedDistId("");
    setEditDistricts([]);
    setEditVillages([]);

    if (regId) {
      setIsLoadingDistricts(true);
      const data = await fetchDistricts(regId);
      setEditDistricts(data);
      setIsLoadingDistricts(false);
    }
  };

  const handleEditDistChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    setSelectedDistId(distId);
    const found = editDistricts.find((d) => d.id === distId);
    setEditForm((prev) => ({
      ...prev,
      district: found ? found.name : "",
      village: ""
    }));

    setEditVillages([]);

    if (distId) {
      setIsLoadingVillages(true);
      const data = await fetchVillages(distId);
      setEditVillages(data);
      setIsLoadingVillages(false);
    }
  };

  const handleEditGmapsChange = (val: string) => {
    setEditGmaps(val);
    const parsed = parseGmapsInput(val);
    if (parsed.lat !== null && parsed.lng !== null) {
      setEditLat(parsed.lat);
      setEditLng(parsed.lng);
    } else {
      setEditLat(null);
      setEditLng(null);
    }
  };

  const handleEditGetGps = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi GPS");
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditLat(pos.coords.latitude);
        setEditLng(pos.coords.longitude);
        setEditGmaps(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setIsGettingGps(false);
      },
      (err) => {
        console.error(err);
        alert("Gagal membaca GPS: " + err.message);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert("Nama Toko wajib diisi.");
      return;
    }
    if (!editForm.owner_name.trim()) {
      alert("Nama Pemilik / PIC Toko wajib diisi.");
      return;
    }
    if (!editForm.wa_number.trim()) {
      alert("Nomor WhatsApp wajib diisi.");
      return;
    }
    if (editForm.wa_number.length < 11 || editForm.wa_number.length > 15) {
      alert("Nomor WhatsApp harus angka dengan panjang 11 sampai 15 digit.");
      return;
    }
    if (!editForm.province) {
      alert("Provinsi wajib dipilih.");
      return;
    }
    if (!editForm.city) {
      alert("Kabupaten / Kota wajib dipilih.");
      return;
    }
    if (!editForm.district) {
      alert("Kecamatan wajib dipilih.");
      return;
    }
    if (!editForm.village) {
      alert("Desa / Kelurahan wajib dipilih.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8787/api/stores/${storeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          latitude: editLat,
          longitude: editLng,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setStore((prev: any) => ({ ...prev, ...updated }));
        setIsEditModalOpen(false);
        setToast({ message: "Data toko berhasil diperbarui!", type: "success" });
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal memperbarui data toko.");
      }
    } catch (err) {
      console.error("Update store error:", err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!isOwner) {
      alert("Aksi hapus hanya dapat dilakukan oleh Owner.");
      return;
    }

    if (!confirm(`Hapus mitra toko "${store.name}"? Seluruh riwayat dan data terkait akan dihapus secara permanen.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:8787/api/stores/${storeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Mitra toko berhasil dihapus.");
        navigate("/sales/toko", { replace: true });
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal menghapus mitra toko.");
      }
    } catch (err) {
      console.error("Delete store error:", err);
      alert("Terjadi gangguan saat menghapus toko.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"));
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-12 animate-pulse">
        <div className="h-10 bg-muted/40 rounded-xl w-36" />
        <div className="h-44 bg-muted/40 rounded-2xl" />
        <div className="h-12 bg-muted/40 rounded-2xl" />
        <div className="h-64 bg-muted/40 rounded-2xl" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="space-y-4 pb-12">
        <button
          onClick={() => navigate("/sales/toko")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Mitra Toko</span>
        </button>

        <div className="bg-card border border-dashed border-red-200 rounded-2xl p-8 text-center space-y-2">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="font-bold text-sm text-foreground">Data Toko Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground">{error || "Informasi toko tidak dapat ditampilkan."}</p>
          <button
            onClick={() => navigate("/sales/toko")}
            className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl"
          >
            Kembali ke Mitra Toko
          </button>
        </div>
      </div>
    );
  }

  const isStoreActive = (store.status || "Aktif") === "Aktif";
  const regionParts = [store.province, store.city, store.district, store.village].filter(Boolean);
  const regionText = regionParts.length > 0 ? regionParts.join(" - ") : (store.address || "-");

  const inboundList: any[] = store.inbound_history || [];
  const soldList: any[] = store.sold_history || [];

  const totalInboundQty = inboundList.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalSoldQty = soldList.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalRemainingInStore = Number(store.total_remaining_stock) || 0;

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header Navigation & Action Buttons (Edit & Delete) */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate("/sales/toko")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition px-2 py-1.5 rounded-lg hover:bg-muted/50 -ml-2"
        >
          <ArrowLeft size={16} />
          <span>Mitra Toko</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Button Edit Toko */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1 active:scale-95 transition border border-border/50"
          >
            <Edit2 size={13} className="text-primary" />
            <span>Edit</span>
          </button>

          {/* Button Delete Toko (Khusus Owner) */}
          {isOwner && (
            <button
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition disabled:opacity-50"
              title="Khusus Owner: Hapus Toko"
            >
              <Trash2 size={13} />
              <span>{isDeleting ? "Hapus..." : "Hapus"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Detail Terkait Toko (Sederhana & Padat) */}
      <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-2xs space-y-3">
        {/* Nama Toko & Pemilik */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-lg text-foreground tracking-tight truncate">{store.name}</h1>
              {/* Status Aktif / Tidak Aktif (Menggantikan keterangan lunas) */}
              <span
                className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${
                  isStoreActive
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}
              >
                {store.status || "Aktif"}
              </span>
            </div>

            {/* Nama Owner / PIC */}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <User size={13} className="shrink-0 text-muted-foreground/80" />
              <span>Pemilik / PIC: <strong className="text-foreground">{store.owner_name || "-"}</strong></span>
            </p>
          </div>
        </div>

        {/* Alamat & Wilayah */}
        <div className="pt-2 border-t border-border/50 space-y-1">
          <p className="text-[11px] text-muted-foreground/90 font-medium leading-relaxed">
            {regionText}
          </p>
          {store.address && regionParts.length > 0 && (
            <p className="text-[11px] text-muted-foreground/75 italic">
              Patokan / Detail: {store.address}
            </p>
          )}
        </div>

        {/* Kontak WhatsApp & Maps */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {store.wa_number ? (
            <a
              href={`https://wa.me/${store.wa_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-500/20"
            >
              <MessageSquare size={14} />
              <span>WhatsApp ({store.wa_number})</span>
            </a>
          ) : (
            <div className="flex-1 py-2 rounded-xl bg-muted/50 text-muted-foreground text-xs font-medium text-center flex items-center justify-center gap-1">
              <Phone size={13} />
              <span>No HP belum ada</span>
            </div>
          )}

          {store.latitude && store.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-blue-500/20"
            >
              <Compass size={14} />
              <span>Peta</span>
            </a>
          )}
        </div>

        {/* Ringkasan Cepat Stok */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
          <div className="bg-muted/30 rounded-xl p-2 border border-border/30">
            <span className="text-[10px] text-muted-foreground font-semibold block">Sisa di Rak</span>
            <span className="text-sm font-black text-foreground">{totalRemainingInStore} pcs</span>
          </div>
          <div className="bg-muted/30 rounded-xl p-2 border border-border/30">
            <span className="text-[10px] text-muted-foreground font-semibold block">Total Masuk</span>
            <span className="text-sm font-black text-foreground">{totalInboundQty} pcs</span>
          </div>
          <div className="bg-muted/30 rounded-xl p-2 border border-border/30">
            <span className="text-[10px] text-muted-foreground font-semibold block">Total Terjual</span>
            <span className="text-sm font-black text-emerald-600">{totalSoldQty} pcs</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB NAVIGATION: RIWAYAT STOK MASUK vs RIWAYAT TERJUAL     */}
      {/* ========================================================= */}
      <div className="flex border-b border-border bg-card rounded-2xl p-1 gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setHistoryTab("inbound")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            historyTab === "inbound"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Riwayat Stok Masuk
        </button>
        <button
          type="button"
          onClick={() => setHistoryTab("sold")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            historyTab === "sold"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Riwayat Terjual
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RIWAYAT STOK MASUK                                  */}
      {/* ========================================================= */}
      {historyTab === "inbound" && (
        <div className="space-y-2.5">
          {inboundList.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center space-y-1.5">
              <p className="text-xs font-bold text-foreground">Belum Ada Riwayat Stok Masuk</p>
              <p className="text-[11px] text-muted-foreground">
                Stok yang dititipkan atau dimasukkan saat kunjungan sales akan tercatat otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {inboundList.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-2xs space-y-2"
                >
                  {/* Baris Atas: Nama Produk & Tanggal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-foreground truncate">
                        {item.product_name ? `${item.product_name} - ${item.variant_name}` : (item.variant_name || "Produk")}
                      </h4>
                      {item.sku && (
                        <span className="text-[10px] text-muted-foreground/80 font-mono block">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0 text-right">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {/* Baris Bawah: Detail Jumlah Masuk & Sisa */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40 text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">
                        Masuk: +{item.qty || 0} pcs
                      </span>
                      <span className="text-muted-foreground">
                        Sisa Rak: <strong className="text-foreground">{item.remaining_qty ?? 0} pcs</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status === "active" ? "Aktif" : "Selesai"}
                      </span>
                      {item.sales_name && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          oleh {item.sales_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RIWAYAT TERJUAL                                     */}
      {/* ========================================================= */}
      {historyTab === "sold" && (
        <div className="space-y-2.5">
          {soldList.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center space-y-1.5">
              <p className="text-xs font-bold text-foreground">Belum Ada Riwayat Terjual</p>
              <p className="text-[11px] text-muted-foreground">
                Barang yang terjual di toko ini akan tercatat otomatis saat sales melakukan input pada kunjungan toko.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {soldList.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-2xs space-y-2"
                >
                  {/* Baris Atas: Nama Produk & Tanggal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-foreground truncate">
                        {item.product_name ? `${item.product_name} - ${item.variant_name}` : (item.variant_name || "Produk")}
                      </h4>
                      {item.sales_name && (
                        <span className="text-[10px] text-muted-foreground">
                          Dicatat oleh: {item.sales_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0 text-right">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {/* Baris Bawah: Jumlah Terjual & Total Nilai */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40 text-[11px]">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Terjual: {item.qty || 0} pcs
                    </span>

                    <div className="text-right">
                      <span className="font-black text-foreground">
                        {formatRupiah(item.total_price || (item.qty * (item.unit_price || 0)))}
                      </span>
                      {Number(item.unit_price) > 0 && (
                        <span className="text-[10px] text-muted-foreground block">
                          @{formatRupiah(item.unit_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Edit Mitra Toko */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                Edit Data Mitra Toko
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStore} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Nama Toko *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-foreground block mb-1">Nama Owner / PIC</label>
                  <input
                    type="text"
                    value={editForm.owner_name}
                    onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Status Toko</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-foreground">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-semibold ${
                    editForm.wa_number.length >= 11 && editForm.wa_number.length <= 15
                      ? "text-emerald-600"
                      : editForm.wa_number.length > 0
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}>
                    {editForm.wa_number.length} / 15 digit (min. 11)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Hanya angka, contoh: 081234567890"
                  value={editForm.wa_number}
                  onChange={(e) => setEditForm({ ...editForm, wa_number: e.target.value.replace(/\D/g, "").slice(0, 15) })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                />
              </div>

              {/* Regional Fields Cascading Dropdown */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} className="text-primary" />
                  <span>Wilayah Toko (Wajib Diisi Lengkap)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-foreground block mb-1 text-[11px]">
                      Provinsi <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedProvId}
                      onChange={handleEditProvChange}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                    >
                      <option value="">-- Pilih Provinsi (Urut Abjad) --</option>
                      {PROVINCES_DATA.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-foreground text-[11px]">
                        Kabupaten / Kota <span className="text-red-500">*</span>
                      </label>
                      {isLoadingRegencies && (
                        <Loader2 size={10} className="animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <select
                      required
                      disabled={!selectedProvId || isLoadingRegencies}
                      value={selectedRegId}
                      onChange={handleEditRegChange}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedProvId
                          ? "Pilih Provinsi dahulu"
                          : "-- Pilih Kab/Kota (Urut Abjad) --"}
                      </option>
                      {editRegencies.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-foreground text-[11px]">
                        Kecamatan <span className="text-red-500">*</span>
                      </label>
                      {isLoadingDistricts && (
                        <Loader2 size={10} className="animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <select
                      required
                      disabled={!selectedRegId || isLoadingDistricts}
                      value={selectedDistId}
                      onChange={handleEditDistChange}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedRegId
                          ? "Pilih Kab/Kota dahulu"
                          : "-- Pilih Kecamatan (Urut Abjad) --"}
                      </option>
                      {editDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-foreground text-[11px]">
                        Desa / Kelurahan <span className="text-red-500">*</span>
                      </label>
                      {isLoadingVillages && (
                        <Loader2 size={10} className="animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <select
                      required
                      disabled={!selectedDistId || isLoadingVillages}
                      value={editForm.village}
                      onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedDistId
                          ? "Pilih Kecamatan dahulu"
                          : "-- Pilih Desa/Kel (Urut Abjad) --"}
                      </option>
                      {editVillages.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Alamat Lengkap / Patokan</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya ..., Depan Masjid..."
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-xs"
                />
              </div>

              {/* Titik Google Maps Input & Helper */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <label className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                    <Compass size={13} className="text-blue-600" />
                    <span>Titik Google Maps</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleEditGetGps}
                      disabled={isGettingGps}
                      className="px-2 py-0.5 bg-background border border-border rounded-md text-[10px] font-bold text-foreground flex items-center gap-1"
                    >
                      <Navigation size={10} className={isGettingGps ? "animate-spin text-primary" : "text-primary"} />
                      <span>{isGettingGps ? "GPS..." : "GPS Saya"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = [editForm.address, editForm.village, editForm.district, editForm.city, editForm.province].filter(Boolean).join(", ");
                        window.open(target ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}` : "https://www.google.com/maps", "_blank");
                      }}
                      className="px-2 py-0.5 bg-blue-500/10 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold flex items-center gap-1"
                    >
                      <ExternalLink size={10} />
                      <span>Peta</span>
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Tempel link Google Maps atau koordinat"
                  value={editGmaps}
                  onChange={(e) => handleEditGmapsChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {editLat !== null && editLng !== null && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200 inline-block">
                    ✓ Koordinat: {editLat.toFixed(5)}, {editLng?.toFixed(5)}
                  </span>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-black shadow-sm active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
