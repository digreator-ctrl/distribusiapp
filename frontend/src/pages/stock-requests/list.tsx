import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, X, Plus, FileText, Send, Inbox, AlertCircle, User } from "lucide-react";

export const StockRequestList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("distribusi_role") || "admin";
  const isSales = role === "sales";
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"recommendation" | "request">("recommendation");
  const [pendingRecCount, setPendingRecCount] = useState<number>(0);

  // Multi-sales data scoping
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [activeSalesId, setActiveSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Fetch daftar sales untuk identifikasi akun aktif
  useEffect(() => {
    const fetchSalesUsers = async () => {
      try {
        const res = await fetch("http://localhost:8787/api/users");
        if (res.ok) {
          const allUsers = await res.json();
          const salesOnly = allUsers.filter((u: any) => u.role === "sales");
          setSalesUsers(salesOnly);
          if (isSales && salesOnly.length > 0) {
            const currentStored = localStorage.getItem("distribusi_user_id");
            const matched = salesOnly.find((s: any) => s.id === currentStored);
            if (!matched) {
              setActiveSalesId(salesOnly[0].id);
              localStorage.setItem("distribusi_user_id", salesOnly[0].id);
              localStorage.setItem("distribusi_user_name", salesOnly[0].full_name || salesOnly[0].username);
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data user sales:", err);
      }
    };
    fetchSalesUsers();

    const handleSalesChanged = () => {
      const stored = localStorage.getItem("distribusi_user_id") || "";
      setActiveSalesId(stored);
    };

    window.addEventListener("salesChanged", handleSalesChanged);
    return () => window.removeEventListener("salesChanged", handleSalesChanged);
  }, [isSales]);

  const handleSalesChange = (id: string) => {
    setActiveSalesId(id);
    localStorage.setItem("distribusi_user_id", id);
    const found = salesUsers.find((u) => u.id === id);
    if (found) {
      localStorage.setItem("distribusi_user_name", found.full_name || found.username);
    }
    window.dispatchEvent(new Event("salesChanged"));
  };

  // Cek rekomendasi pending
  useEffect(() => {
    if (!isSales) return;
    const checkPending = async () => {
      try {
        let url = "http://localhost:8787/api/stock-requests?type=recommendation&status=pending&target_type=sales";
        if (activeSalesId) url += `&sales_id=${activeSalesId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : 0;
          setPendingRecCount(count);
          // Jika ada rekomendasi pending, otomatis fokuskan ke tab rekomendasi
          if (count > 0) {
            setFilterType("recommendation");
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkPending();
  }, [isSales, activeSalesId]);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        let url = "http://localhost:8787/api/stock-requests";
        const params = new URLSearchParams();
        if (filterType) params.append("type", filterType);

        if (isSales) {
          // Hanya target sales (TIDAK BISA MELIHAT DATA AGEN)
          params.append("target_type", "sales");
          // Hanya sales yang sedang aktif (TIDAK BISA MELIHAT DATA SALES LAIN)
          if (activeSalesId) {
            params.append("sales_id", activeSalesId);
          }
        }

        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          let data = Array.isArray(json) ? json : [];

          // Double check filter di client-side:
          if (isSales) {
            data = data.filter((req: any) => {
              // 1. Tolak semua data agen
              if (req.target_type === "agen" || req.agen_name || req.agen_id) {
                return false;
              }
              // 2. Pada pengajuan sales (request), hanya tampilkan milik sales aktif
              if (filterType === "request") {
                return req.sales_id === activeSalesId;
              }
              // 3. Pada rekomendasi admin, hanya tampilkan jika untuk sales aktif atau broadcast (sales_id NULL & target_type sales)
              if (filterType === "recommendation") {
                return req.sales_id === activeSalesId || (!req.sales_id && req.target_type === "sales");
              }
              return true;
            });
          }

          setRequests(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [filterType, isSales, activeSalesId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Disetujui</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Menunggu</span>;
    }
  };

  const createPath = isSales ? "/sales/stock-requests/create" : "/stock-requests/create";
  const getDetailPath = (id: string) => isSales ? `/sales/stock-requests/${id}` : `/stock-requests/${id}`;

  return (
    <div className={isSales ? "space-y-4" : "bg-card p-8 rounded-2xl border shadow-sm"}>
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 shadow-sm mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">Berhasil</h3>
            <p className="text-sm text-green-700 mt-1">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-green-500 hover:text-green-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* SISI SALES (MOBILE) */}
      {isSales ? (
        <div className="bg-card p-4 sm:p-5 rounded-2xl border shadow-sm">
          {/* Header Title & Button Horizontal (Menyamping) */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
                Request & Rekomendasi
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Kelola stok produk & pengajuan Anda
              </p>
            </div>
            <button 
              onClick={() => navigate(createPath)}
              className="h-9 px-3.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold shadow hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Plus size={15} />
              <span>Pengajuan</span>
            </button>
          </div>

          {/* Banner Pemberitahuan jika ada rekomendasi pending */}
          {pendingRecCount > 0 && (
            <div 
              onClick={() => setFilterType("recommendation")}
              className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 cursor-pointer hover:bg-amber-100/80 transition shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ada <strong>{pendingRecCount} rekomendasi stok</strong> dari Admin menunggu konfirmasi!</span>
              </div>
              <span className="font-bold underline text-amber-700 text-[11px] shrink-0">Lihat &rarr;</span>
            </div>
          )}

          {/* Akun Sales Aktif (Switcher jika ada multiple sales) */}
          <div className="flex items-center justify-between bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-xs mb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User size={13} className="text-primary shrink-0" />
              <span>Akun Sales:</span>
            </div>
            <div>
              {salesUsers.length > 0 ? (
                <select
                  value={activeSalesId}
                  onChange={(e) => handleSalesChange(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.username} ({u.username})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-foreground">Sales</span>
              )}
            </div>
          </div>

          {/* Segmented Filter Buttons Presisi */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl mb-4 border border-border/40">
            <button 
              onClick={() => setFilterType("recommendation")} 
              className={`h-8 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                filterType === "recommendation" 
                  ? "bg-background text-foreground shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Inbox size={13} className={pendingRecCount > 0 ? "text-amber-500" : ""} />
              <span>Rekomendasi</span>
              {pendingRecCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white font-black text-[10px] rounded-full">
                  {pendingRecCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setFilterType("request")} 
              className={`h-8 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                filterType === "request" 
                  ? "bg-background text-foreground shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Send size={13} />
              <span>Pengajuan Saya</span>
            </button>
          </div>

          {/* Konten Data List Sales */}
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground animate-pulse flex flex-col items-center">
              <FileText size={28} className="mb-2 opacity-20" />
              <p className="text-xs">Memuat data pengajuan & rekomendasi...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center bg-muted/10 rounded-xl border border-dashed border-border/70 p-4">
              <FileText size={36} className="mb-2 opacity-20" />
              <p className="font-semibold text-xs text-foreground">
                Belum ada {filterType === "request" ? "pengajuan" : "rekomendasi"} stok
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 text-center">
                {filterType === "request" 
                  ? "Tekan tombol 'Pengajuan' di atas untuk mengajukan stok baru." 
                  : "Belum ada rekomendasi stok dari Admin untuk Anda."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {requests.map((req: any) => (
                <div 
                  key={req.id} 
                  onClick={() => navigate(getDetailPath(req.id))}
                  className="p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer shadow-2xs space-y-2 group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {req.code}
                        {req.priority === "urgent" && (
                          <span title="Mendesak"><AlertCircle size={13} className="text-red-500 shrink-0" /></span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {req.distribution_date 
                          ? `Tgl Distribusi: ${new Date(req.distribution_date).toLocaleDateString('id-ID')}`
                          : new Date(req.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    <span>Jumlah Item</span>
                    <span className="font-semibold text-foreground">
                      {req.item_count} SKU <span className="text-[11px] font-normal text-muted-foreground">({req.total_qty} pcs)</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* SISI DESKTOP (ADMIN / OWNER) */
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Distribusi & Approval Stok</h1>
              <p className="text-muted-foreground mt-1">
                Kelola rekomendasi stok ke Sales (Distribusi) atau setujui pengajuan (Approval).
              </p>
            </div>
            <button 
              onClick={() => navigate(createPath)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition shrink-0 flex items-center gap-2"
            >
              <Plus size={18} />
              <span>+ Distribusi</span>
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setFilterType("recommendation")} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filterType === "recommendation" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Distribusi
            </button>
            <button 
              onClick={() => setFilterType("request")} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filterType === "request" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Approval Stok
            </button>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API...</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center bg-muted/20 rounded-xl border border-dashed border-border">
              <FileText size={48} className="mb-3 opacity-20" />
              <p className="font-medium text-foreground">Belum ada data pengajuan/rekomendasi.</p>
              <p className="text-sm mt-1">Klik tombol tambah untuk membuat baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50 bg-background">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Tanggal Distribusi</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Kode</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Tipe Tujuan</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Nama Tujuan</th>
                    <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Item SKU</th>
                    <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req: any) => (
                    <tr 
                      key={req.id} 
                      onClick={() => navigate(getDetailPath(req.id))}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {req.distribution_date ? new Date(req.distribution_date).toLocaleDateString('id-ID') : new Date(req.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          {req.code}
                          {req.priority === "urgent" && (
                            <span title="Mendesak"><AlertCircle size={14} className="text-red-500" /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {req.agen_name ? (
                          <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-semibold">Agen</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold">Sales</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">
                          {req.agen_name 
                            ? req.agen_name 
                            : (req.sales_full_name || req.sales_username || "Semua Sales (Broadcast)")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-bold">{req.item_count} SKU</span>
                          <span className="text-xs text-muted-foreground">{req.total_qty} pcs</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
