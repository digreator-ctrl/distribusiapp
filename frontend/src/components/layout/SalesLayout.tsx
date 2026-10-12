import { Outlet, Link, useLocation } from "react-router-dom";
import { useLogout } from "@refinedev/core";
import { LogOut, MapPin, Camera, UserCircle, ClipboardList, PackageCheck } from "lucide-react";

export const SalesLayout = () => {
  const { pathname } = useLocation();
  const { mutate: logout } = useLogout();
  const salesName = localStorage.getItem("distribusi_user_name");

  const isFieldActivity = pathname === '/sales' || pathname === '/sales/';
  const isStockRequests = pathname.startsWith('/sales/stock-requests');
  const isReceivedStock = pathname === '/sales/received-stock';
  const isAsset = pathname === '/sales/asset';
  const isProfile = pathname === '/sales/profile';

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-20 max-w-md mx-auto relative shadow-2xl overflow-hidden bg-white">
      {/* Mobile Top Header */}
      <div className="bg-primary px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider">
              Mode Lapangan {salesName ? `• ${salesName}` : ''}
            </p>
            <h1 className="text-xl font-bold text-white tracking-tight">Sales App</h1>
          </div>
          <button onClick={() => logout()} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
            <LogOut size={18} />
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
          <Link to="/sales/stock-requests" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isStockRequests ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <ClipboardList size={22} className={isStockRequests ? 'fill-primary/20' : ''} />
            <span className="text-[10px] font-medium">Req Stok</span>
          </Link>
          <Link to="/sales/received-stock" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isReceivedStock ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}>
            <PackageCheck size={22} className={isReceivedStock ? 'fill-primary/20' : ''} />
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
