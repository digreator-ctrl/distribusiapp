import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Store,
  ChevronRight, ArrowDownLeft, RefreshCw
} from "lucide-react";

export const SalesHistory = () => {
  const navigate = useNavigate();
  const [activeSalesId, setActiveSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );

  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "all">("today");
  const [visits, setVisits] = useState<any[]>([]);
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [visitDetail, setVisitDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchData = async (salesId: string) => {
    if (!salesId) return;
    try {
      setIsLoading(true);

      // 1. Fetch visits
      const resVisits = await fetch(`http://localhost:8787/api/visits?sales_id=${salesId}`);
      if (resVisits.ok) {
        const vData = await resVisits.json();
        setVisits(Array.isArray(vData) ? vData : []);
      }

      // 2. Fetch approved stock requests (ambil gudang)
      const resSr = await fetch(`http://localhost:8787/api/stock-requests?sales_id=${salesId}&status=approved`);
      if (resSr.ok) {
        const srData = await resSr.json();
        setInbounds(Array.isArray(srData) ? srData : []);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeSalesId);

    const handleSalesChanged = () => {
      const newId = localStorage.getItem("distribusi_user_id") || "";
      setActiveSalesId(newId);
    };
    window.addEventListener("salesChanged", handleSalesChanged);
    return () => window.removeEventListener("salesChanged", handleSalesChanged);
  }, [activeSalesId]);

  const handleOpenVisitDetail = async (visit: any) => {
    setSelectedVisit(visit);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`http://localhost:8787/api/visits/${visit.id}`);
      if (res.ok) {
        const data = await res.json();
        setVisitDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const formatTime = (isoString?: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  // Filter events by period
  const todayStr = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const isWithinPeriod = (isoDate?: string) => {
    if (!isoDate) return false;
    const itemDate = new Date(isoDate);
    if (filterPeriod === "today") {
      return isoDate.startsWith(todayStr);
    }
    if (filterPeriod === "week") {
      return itemDate >= sevenDaysAgo;
    }
    return true;
  };

  const filteredVisits = visits.filter((v) => isWithinPeriod(v.visit_date));
  const filteredInbounds = inbounds.filter((i) => isWithinPeriod(i.distribution_date || i.created_at));

  // Gabungkan ke timeline berurutan
  const timelineEvents = [
    ...filteredVisits.map((v) => ({
      type: "visit",
      date: new Date(v.visit_date || v.created_at).getTime(),
      data: v,
    })),
    ...filteredInbounds.map((i) => ({
      type: "inbound",
      date: new Date(i.distribution_date || i.created_at).getTime(),
      data: i,
    })),
  ].sort((a, b) => b.date - a.date);

  // Ringkasan
  const totalPaymentReceived = filteredVisits.reduce(
    (sum, v) => sum + (Number(v.payment_received) || 0),
    0
  );
  const totalStoresVisited = filteredVisits.length;

  return (
    <div className="space-y-4 pb-6">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Riwayat Aktivitas
          </h1>
          <p className="text-xs text-muted-foreground">
            Jejak kunjungan toko, setoran & stok masuk
          </p>
        </div>

        <button
          onClick={() => fetchData(activeSalesId)}
          className="p-2 rounded-xl border border-border/80 bg-background hover:bg-muted text-muted-foreground transition shrink-0"
          title="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter Waktu */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
        <button
          onClick={() => setFilterPeriod("today")}
          className={`h-8 text-xs font-semibold rounded-lg transition-all ${
            filterPeriod === "today"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setFilterPeriod("week")}
          className={`h-8 text-xs font-semibold rounded-lg transition-all ${
            filterPeriod === "week"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          7 Hari Terakhir
        </button>
        <button
          onClick={() => setFilterPeriod("all")}
          className={`h-8 text-xs font-semibold rounded-lg transition-all ${
            filterPeriod === "all"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua
        </button>
      </div>

      {/* Mini Card Ringkasan Periode */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-card p-3 rounded-2xl border border-border/70 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Uang Diterima
          </span>
          <p className="text-lg font-black text-emerald-600 mt-0.5">
            {formatRupiah(totalPaymentReceived)}
          </p>
        </div>
        <div className="bg-card p-3 rounded-2xl border border-border/70 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Toko Dikunjungi
          </span>
          <p className="text-lg font-black text-foreground mt-0.5">
            {totalStoresVisited} <span className="text-xs font-normal text-muted-foreground">toko</span>
          </p>
        </div>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-muted/40 rounded-2xl" />
          <div className="h-20 bg-muted/40 rounded-2xl" />
          <div className="h-20 bg-muted/40 rounded-2xl" />
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-2">
            <Clock size={24} />
          </div>
          <p className="font-bold text-xs text-foreground">Belum Ada Aktivitas</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tidak ada jejak transaksi pada periode ini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
          {timelineEvents.map((evt, idx) => {
            if (evt.type === "visit") {
              const v = evt.data;
              const hasDebt = Number(v.outstanding_amount) > 0;

              return (
                <div
                  key={`v-${v.id || idx}`}
                  onClick={() => handleOpenVisitDetail(v)}
                  className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-2xs flex items-start gap-3 relative ml-2 hover:border-primary/40 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Store size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-xs text-foreground truncate">{v.store_name}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {formatTime(v.visit_date)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(v.visit_date)}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50 text-[11px]">
                      <span className="font-bold text-emerald-600">
                        {formatRupiah(v.payment_received || 0)}
                      </span>
                      {hasDebt && (
                        <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                          Sisa: {formatRupiah(v.outstanding_amount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-muted-foreground/50 self-center shrink-0" />
                </div>
              );
            } else {
              const inb = evt.data;
              return (
                <div
                  key={`i-${inb.id || idx}`}
                  onClick={() => navigate(`/sales/stock-requests/${inb.id}`)}
                  className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-2xs flex items-start gap-3 relative ml-2 hover:border-primary/40 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowDownLeft size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-xs text-foreground truncate">
                        Ambil Stok Gudang ({inb.request_number || "REQ"})
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {formatTime(inb.distribution_date || inb.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {inb.type === "recommendation" ? "Rekomendasi Diterima" : "Pengajuan Disetujui"} • {inb.total_qty || 0} pcs
                    </p>
                  </div>

                  <ChevronRight size={14} className="text-muted-foreground/50 self-center shrink-0" />
                </div>
              );
            }
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DETAIL KUNJUNGAN                                    */}
      {/* ========================================================= */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground">Detail Kunjungan</h3>
                <p className="text-xs text-muted-foreground">{selectedVisit.store_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedVisit(null);
                  setVisitDetail(null);
                }}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-16 bg-muted/40 rounded-xl" />
                <div className="h-20 bg-muted/40 rounded-xl" />
              </div>
            ) : visitDetail ? (
              <div className="space-y-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal:</span>
                    <span className="font-bold text-foreground">{formatDate(visitDetail.visit_date)} {formatTime(visitDetail.visit_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uang Diterima:</span>
                    <span className="font-black text-emerald-600">{formatRupiah(visitDetail.payment_received || 0)}</span>
                  </div>
                  {Number(visitDetail.outstanding_amount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sisa Piutang:</span>
                      <span className="font-black text-red-600">{formatRupiah(visitDetail.outstanding_amount)}</span>
                    </div>
                  )}
                </div>

                {visitDetail.items && visitDetail.items.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                      Rincian Barang Kunjungan
                    </h4>
                    <div className="space-y-1.5">
                      {visitDetail.items.map((it: any) => (
                        <div
                          key={it.id}
                          className="bg-muted/30 p-2.5 rounded-xl border border-border/50 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-foreground">{it.product_name} - {it.variant_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Terjual: {it.sold_qty} pcs • Titip Baru: {it.new_consignment_qty} pcs
                            </p>
                          </div>
                          <span className="font-bold text-foreground">
                            {formatRupiah((it.sold_qty || 0) * (it.unit_price || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {visitDetail.notes && (
                  <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">Catatan: </span>
                    {visitDetail.notes}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
