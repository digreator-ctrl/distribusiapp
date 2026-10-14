import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useLogout } from "@refinedev/core";
import { LogOut, Home, Store, Package, Clock, UserCheck } from "lucide-react";

export const SalesLayout = () => {
  const { pathname } = useLocation();
  const { mutate: logout } = useLogout();
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [currentSalesId, setCurrentSalesId] = useState<string>(
    localStorage.getItem("distribusi_user_id") || ""
  );
  const [currentSalesName, setCurrentSalesName] = useState<string>(
    localStorage.getItem("distribusi_user_name") || "Sales"
  );
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchPendingCount = async (salesId: string) => {
    if (!salesId) return;
    try {
      const res = await fetch(`http://localhost:8787/api/stock-requests?type=recommendation&status=pending&target_type=sales&sales_id=${salesId}`);
      if (res.ok) {
        const data = await res.json();
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:8787/api/users");
        if (res.ok) {
          const all = await res.json();
          const sales = all.filter((u: any) => u.role === "sales");
          setSalesUsers(sales);

          const storedId = localStorage.getItem("distribusi_user_id");
          const found = sales.find((s: any) => s.id === storedId);
          if (found) {
            setCurrentSalesId(found.id);
            setCurrentSalesName(found.full_name || found.username);
            fetchPendingCount(found.id);
          } else if (sales.length > 0) {
            setCurrentSalesId(sales[0].id);
            setCurrentSalesName(sales[0].full_name || sales[0].username);
            localStorage.setItem("distribusi_user_id", sales[0].id);
            localStorage.setItem("distribusi_user_name", sales[0].full_name || sales[0].username);
            fetchPendingCount(sales[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();

    const handleSalesChanged = () => {
      const newId = localStorage.getItem("distribusi_user_id") || "";
      const newName = localStorage.getItem("distribusi_user_name") || "Sales";
      setCurrentSalesId(newId);
      setCurrentSalesName(newName);
      fetchPendingCount(newId);
    };

    window.addEventListener("salesChanged", handleSalesChanged);
    return () => window.removeEventListener("salesChanged", handleSalesChanged);
  }, []);

  const handleSwitchSales = (id: string) => {
    const found = salesUsers.find((u) => u.id === id);
    if (found) {
      localStorage.setItem("distribusi_user_id", found.id);
      localStorage.setItem("distribusi_user_name", found.full_name || found.username);
      setCurrentSalesId(found.id);
      setCurrentSalesName(found.full_name || found.username);
      fetchPendingCount(found.id);
      window.dispatchEvent(new Event("salesChanged"));
    }
  };

  const isHome = pathname === '/sales' || pathname === '/sales/';
  const isToko = pathname.startsWith('/sales/toko') || pathname.startsWith('/sales/visit');
  const isStock = pathname === '/sales/stock' || pathname === '/sales/received-stock' || pathname.startsWith('/sales/stock-requests');
  const isHistory = pathname.startsWith('/sales/history');

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-20 max-w-md mx-auto relative shadow-2xl overflow-hidden bg-white">
      {/* Mobile Top Header */}
      <div className="bg-primary px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider">
                Mode Sales PWA
              </span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 font-black text-[9px] rounded-full animate-bounce">
                  {pendingCount} Rekomendasi
                </span>
              )}
            </div>

            {/* Quick Switcher Dropdown in Header */}
            {salesUsers.length > 1 ? (
              <div className="flex items-center gap-1">
                <UserCheck size={14} className="text-white/80 shrink-0" />
                <select
                  value={currentSalesId}
                  onChange={(e) => handleSwitchSales(e.target.value)}
                  className="bg-white/15 text-white font-bold text-xs rounded-lg px-2 py-0.5 border border-white/25 outline-none focus:bg-white/25 cursor-pointer max-w-[200px]"
                >
                  {salesUsers.map((s) => (
                    <option key={s.id} value={s.id} className="text-foreground bg-background">
                      {s.full_name || s.username}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <h1 className="text-base font-bold text-white tracking-tight truncate">
                {currentSalesName}
              </h1>
            )}
          </div>

          <button 
            onClick={() => logout()} 
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition active:scale-95 shrink-0"
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation (4 Menu Utama: Beranda, Toko, Stok Saya, Riwayat) */}
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-border shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] z-20">
        <div className="flex justify-around items-center h-16">
          {/* 1. Beranda */}
          <Link
            to="/sales"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isHome ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary/70'
            }`}
          >
            <Home size={22} className={isHome ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px]">Beranda</span>
          </Link>

          {/* 2. Toko */}
          <Link
            to="/sales/toko"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isToko ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary/70'
            }`}
          >
            <Store size={22} className={isToko ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px]">Toko</span>
          </Link>

          {/* 3. Stok Saya */}
          <Link
            to="/sales/stock"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
              isStock ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary/70'
            }`}
          >
            <div className="relative">
              <Package size={22} className={isStock ? 'stroke-[2.5]' : ''} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-amber-500 text-white font-bold text-[9px] rounded-full ring-1 ring-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Stok</span>
          </Link>

          {/* 4. Riwayat */}
          <Link
            to="/sales/history"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isHistory ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary/70'
            }`}
          >
            <Clock size={22} className={isHistory ? 'stroke-[2.5]' : ''} />
            <span className="text-[10px]">Riwayat</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
