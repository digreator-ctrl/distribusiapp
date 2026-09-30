import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Store, Plus, Package, MoreHorizontal } from "lucide-react";

export const BottomNav = ({ onOpenMore }: { onOpenMore: () => void }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-200 dark:bg-[hsl(224,20%,10%)] dark:border-surface-800 lg:hidden pb-safe">
      <div className="flex items-center justify-between px-2 h-16">
        <Link 
          to="/" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            isActive("/") ? "text-primary-600 dark:text-primary-400" : "text-surface-500 hover:text-surface-900"
          )}
        >
          <Home className={cn("h-5 w-5", isActive("/") && "fill-current")} />
          <span className="text-[10px] font-medium">Beranda</span>
        </Link>
        
        <Link 
          to="/stores" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            isActive("/stores") ? "text-primary-600 dark:text-primary-400" : "text-surface-500 hover:text-surface-900"
          )}
        >
          <Store className={cn("h-5 w-5", isActive("/stores") && "fill-current")} />
          <span className="text-[10px] font-medium">Toko</span>
        </Link>

        {/* Center Floating Action Button */}
        <div className="relative w-full flex justify-center -mt-6">
          <Link 
            to="/sales-visits/create" 
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-transform active:scale-95 border-4 border-surface-50 dark:border-[hsl(224,20%,8%)]"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        <Link 
          to="/inventory/my-stock" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            isActive("/inventory/my-stock") ? "text-primary-600 dark:text-primary-400" : "text-surface-500 hover:text-surface-900"
          )}
        >
          <Package className={cn("h-5 w-5", isActive("/inventory/my-stock") && "fill-current")} />
          <span className="text-[10px] font-medium">Stok</span>
        </Link>

        <button 
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-surface-500 hover:text-surface-900 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Lainnya</span>
        </button>
      </div>
    </div>
  );
};
