import { useLogout, useGetIdentity, usePermissions } from "@refinedev/core";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { 
  LayoutDashboard, 
  Package, 
  Tags,
  Truck,
  Users, 
  Store, 
  LogOut,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

type MenuType = {
  name: string;
  to: string;
  icon: React.ReactNode;
  roles: string[];
};

const MENUS: MenuType[] = [
  { name: "Dashboard", to: "/", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["role-owner", "role-admin", "role-sales"] },
  { name: "Produk", to: "/products", icon: <Package className="h-5 w-5" />, roles: ["role-owner", "role-admin"] },
  { name: "Kategori Produk", to: "/categories", icon: <Tags className="h-5 w-5" />, roles: ["role-owner", "role-admin"] },
  { name: "Rekanan", to: "/suppliers", icon: <Truck className="h-5 w-5" />, roles: ["role-owner", "role-admin"] },
  { name: "Sales & Toko", to: "/stores", icon: <Store className="h-5 w-5" />, roles: ["role-owner", "role-admin", "role-sales"] },
  { name: "Pengguna", to: "/users", icon: <Users className="h-5 w-5" />, roles: ["role-owner", "role-admin"] },
  { name: "Pengaturan", to: "/settings", icon: <Settings className="h-5 w-5" />, roles: ["role-owner"] },
];

export const Sidebar = ({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean; 
  setIsOpen: (v: boolean) => void 
}) => {
  const { data: user } = useGetIdentity<{ name: string; email: string }>();
  const { data: role } = usePermissions<string>();
  const { mutate: logout } = useLogout();
  const location = useLocation();

  const businessStr = localStorage.getItem("business");
  const business = businessStr ? JSON.parse(businessStr) : null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white transition-transform duration-300 dark:bg-[hsl(224,20%,10%)] border-r border-surface-200 dark:border-surface-800 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">D</span>
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 truncate">
              {business?.name || "DistribusiApp"}
            </h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-surface-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {MENUS.filter(menu => !role || menu.roles.includes(role)).map((menu) => {
              const isActive = location.pathname === menu.to || 
                               (menu.to !== "/" && location.pathname.startsWith(menu.to));
              return (
                <Link
                  key={menu.to}
                  to={menu.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" 
                      : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                  )}
                >
                  {menu.icon}
                  {menu.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-surface-200 dark:border-surface-800 p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
              <span className="font-semibold text-surface-600 dark:text-surface-300">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{user?.name}</p>
              <p className="truncate text-xs text-surface-500">{role?.replace("role-", "").toUpperCase()}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="text-surface-400 hover:text-red-500 dark:hover:text-red-400"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
