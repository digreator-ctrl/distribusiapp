import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useLogout } from "@refinedev/core";
import { LogOut, MapPin, Camera, UserCircle, ClipboardList, PackageCheck, UserCheck } from "lucide-react";

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

  const isFieldActivity = pathname === '/sales' || pathname === '/sales/';
  const isStockRequests = pathname.startsWith('/sales/stock-requests');
  const isReceivedStock = pathname === '/sales/received-stock';
  const isAsset = pathname === '/sales/asset';
  const isProfile = pathname === '/sales/profile';

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-20 max-w-md mx-auto relative shadow-2xl overflow-hidden bg-white">
      {/* Mobile Top Header */}
      <div className="bg-primary px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider">
                Mode Lapangan
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-border shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] z-20">
        <div className="flex justify-around items-center h-16">
          <Link to="/sales" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isFieldActivity ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <MapPin size={22} className={isFieldActivity ? 'fill-primary/20' : ''} />
            <span className="text-[10px] font-medium">Lapangan</span>
          </Link>

          <Link to="/sales/stock-requests" className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isStockRequests ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <div className="relative">
              <ClipboardList size={22} className={isStockRequests ? 'fill-primary/20' : ''} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] font-medium">Req Stok</span>
          </Link>

          <Link to="/sales/received-stock" className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isReceivedStock ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <div className="relative">
              <PackageCheck size={22} className={isReceivedStock ? 'fill-primary/20' : ''} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 bg-amber-500 text-white font-bold text-[9px] rounded-full ring-1 ring-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Stok Masuk</span>
          </Link>

          <Link to="/sales/asset" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isAsset ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <Camera size={22} className={isAsset ? 'fill-primary/20' : ''} />
            <span className="text-[10px] font-medium">Aset</span>
          </Link>

          <Link to="/sales/profile" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isProfile ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <UserCircle size={22} className={isProfile ? 'fill-primary/20' : ''} />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
