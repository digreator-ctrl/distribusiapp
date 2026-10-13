import { useState, useEffect } from "react";
import { UserCheck, Shield, Warehouse, Smartphone } from "lucide-react";

export const LoginPage = () => {
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [selectedSalesId, setSelectedSalesId] = useState<string>("");
  const [pendingCounts, setPendingCounts] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsersAndRequests = async () => {
      try {
        const resUsers = await fetch("http://localhost:8787/api/users");
        if (resUsers.ok) {
          const uList = await resUsers.json();
          const sales = uList.filter((u: any) => u.role === "sales");
          setSalesUsers(sales);

          const stored = localStorage.getItem("distribusi_user_id");
          const found = sales.find((s: any) => s.id === stored);
          const initialId = found ? found.id : (sales[0]?.id || "");
          setSelectedSalesId(initialId);

          // Cek ada rekomendasi pending untuk tiap sales
          const resReq = await fetch("http://localhost:8787/api/stock-requests?type=recommendation&status=pending");
          if (resReq.ok) {
            const reqs = await resReq.json();
            const counts: { [key: string]: number } = {};
            reqs.forEach((r: any) => {
              if (r.sales_id) {
                counts[r.sales_id] = (counts[r.sales_id] || 0) + 1;
              } else {
                // broadcast
                counts["broadcast"] = (counts["broadcast"] || 0) + 1;
              }
            });
            setPendingCounts(counts);

            // Jika ada sales yang punya rekomendasi, utamakan terpilih
            const salesWithReq = sales.find((s: any) => counts[s.id] > 0);
            if (salesWithReq && !found) {
              setSelectedSalesId(salesWithReq.id);
            }
          }
        }
      } catch (e) {
        console.error("Error loading login data", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersAndRequests();
  }, []);

  const handleLogin = (role: string, salesId?: string) => {
    localStorage.setItem("distribusi_token", "dummy");
    localStorage.setItem("distribusi_role", role);

    if (role === "sales") {
      const targetId = salesId || selectedSalesId;
      const sObj = salesUsers.find((s) => s.id === targetId) || salesUsers[0];
      if (sObj) {
        localStorage.setItem("distribusi_user_id", sObj.id);
        localStorage.setItem("distribusi_user_name", sObj.full_name || sObj.username);
      }
      window.location.href = "/sales";
    } else {
      window.location.href = "/";
    }
  };

  const selectedSales = salesUsers.find((s) => s.id === selectedSalesId);
  const selectedPendingCount = selectedSales 
    ? (pendingCounts[selectedSales.id] || 0) + (pendingCounts["broadcast"] || 0)
    : 0;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="bg-card p-7 sm:p-8 rounded-3xl shadow-xl border w-full max-w-sm text-center">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-4">
          <Warehouse className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tight mb-2">
          Distribusi<span className="text-muted-foreground font-medium">App</span>
        </h1>
        <p className="text-muted-foreground text-xs mb-6">
          Sistem Manajemen Distribusi & Konsinyasi Multi-tenant
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin("owner")}
            className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Masuk Demo (Owner)</span>
          </button>

          <button
            onClick={() => handleLogin("admin")}
            className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Warehouse className="w-4 h-4" />
            <span>Masuk Demo (Admin Gudang)</span>
          </button>

          {/* Section Sales Mobile */}
          <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Demo Sales Lapangan
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">PWA Mobile</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                Pilih Akun Sales:
              </label>
              {isLoading ? (
                <div className="h-8 bg-muted rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {salesUsers.map((s) => {
                    const count = (pendingCounts[s.id] || 0) + (pendingCounts["broadcast"] || 0);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.username} {count > 0 ? `(🔔 ${count} Rekomendasi)` : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {selectedPendingCount > 0 && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Ada {selectedPendingCount} rekomendasi stok masuk menunggu di akun ini!</span>
              </div>
            )}

            <button
              onClick={() => handleLogin("sales")}
              disabled={isLoading || !selectedSalesId}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Masuk sebagai {selectedSales ? (selectedSales.full_name || selectedSales.username) : "Sales"}</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-6">Versi SaaS Multi-tenant (v2.0)</p>
      </div>
    </div>
  );
};
