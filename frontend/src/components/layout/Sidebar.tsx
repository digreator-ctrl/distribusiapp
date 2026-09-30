import { useLogout, useGetIdentity } from "@refinedev/core";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Tags,
  Truck,
  Users, 
  Store, 
  LogOut,
  Settings,
  X,
  Archive,
  Factory,
  Download,
  ShoppingCart,
  UserCircle,
  MapPin,
  LayoutGrid,
  CornerUpLeft,
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Activity,
  Box,
  ClipboardList,
  FileText
} from "lucide-react";
import { useState } from "react";

type SubMenuItem = {
  name: string;
  to: string;
};

type MenuCategory = {
  title: string;
  icon: React.ReactNode;
  to?: string; 
  items?: SubMenuItem[];
};

const OWNER_MENUS: MenuCategory[] = [
  { title: "Beranda", icon: <LayoutDashboard className="h-5 w-5" />, to: "/" },
  { 
    title: "Monitoring", 
    icon: <Activity className="h-5 w-5" />, 
    items: [
      { name: "Ringkasan Penjualan", to: "/owner/monitoring/sales" },
      { name: "Ringkasan Stok", to: "/owner/monitoring/stock" },
      { name: "Stok Gudang", to: "/inventory" },
      { name: "Stok Sales", to: "/sales/stock" },
      { name: "Stok Toko", to: "/stores/stock" },
      { name: "Stok Display", to: "/displays/stock" },
      { name: "Konsinyasi", to: "/owner/monitoring/consignment" },
      { name: "Agen", to: "/agents" },
      { name: "Sales", to: "/sales" },
      { name: "Retur", to: "/owner/monitoring/returns" },
    ]
  },
  {
    title: "Produk",
    icon: <Package className="h-5 w-5" />,
    items: [
      { name: "Semua Produk", to: "/products" },
      { name: "Produksi Sendiri", to: "/products/own" },
      { name: "Produk Rekanan", to: "/products/supplier" },
    ]
  },
  {
    title: "Distribusi",
    icon: <Truck className="h-5 w-5" />,
    items: [
      { name: "Agen", to: "/agent-orders" },
      { name: "Konsinyasi", to: "/consignment" },
    ]
  },
  {
    title: "Sales",
    icon: <UserCircle className="h-5 w-5" />,
    items: [
      { name: "Daftar Sales", to: "/sales" },
      { name: "Aktivitas Sales", to: "/sales/activities" },
      { name: "Kunjungan", to: "/sales-visits" },
    ]
  },
  {
    title: "Toko",
    icon: <Store className="h-5 w-5" />,
    items: [
      { name: "Daftar Toko", to: "/stores" },
      { name: "Status Konsinyasi", to: "/stores/consignment" },
      { name: "Riwayat Kunjungan", to: "/stores/visits" },
    ]
  },
  {
    title: "Display",
    icon: <LayoutGrid className="h-5 w-5" />,
    items: [
      { name: "Daftar Display", to: "/displays" },
      { name: "Display Aktif", to: "/displays/active" },
      { name: "Riwayat Display", to: "/displays/history" },
    ]
  },
  {
    title: "Retur",
    icon: <CornerUpLeft className="h-5 w-5" />,
    items: [
      { name: "Semua Retur", to: "/returns" },
      { name: "Retur Produksi", to: "/returns/production" },
      { name: "Retur Pengiriman", to: "/returns/delivery" },
      { name: "Retur Expired", to: "/returns/expired" },
      { name: "Retur Display", to: "/returns/display" },
    ]
  },
  {
    title: "Laporan",
    icon: <BarChart3 className="h-5 w-5" />,
    items: [
      { name: "Laporan Penjualan", to: "/reports/sales" },
      { name: "Laporan Stok", to: "/reports/stock" },
      { name: "Laporan Konsinyasi", to: "/reports/consignment" },
      { name: "Laporan Agen", to: "/reports/agents" },
      { name: "Laporan Sales", to: "/reports/sales-perf" },
      { name: "Laporan Toko", to: "/reports/stores" },
      { name: "Laporan Retur", to: "/reports/returns" },
      { name: "Laporan Display", to: "/reports/displays" },
    ]
  },
  {
    title: "Pengguna",
    icon: <Users className="h-5 w-5" />,
    items: [
      { name: "Daftar Pengguna", to: "/users" },
      { name: "Admin", to: "/users/admins" },
      { name: "Sales", to: "/users/sales" },
    ]
  },
  {
    title: "Pengaturan",
    icon: <Settings className="h-5 w-5" />,
    items: [
      { name: "Profil Usaha", to: "/settings/profile" },
      { name: "Pengaturan Harga", to: "/settings/pricing" },
      { name: "Aturan Agen", to: "/settings/agent-rules" },
      { name: "Aturan Konsinyasi", to: "/settings/consignment-rules" },
      { name: "Aturan Retur", to: "/settings/return-rules" },
      { name: "Pengaturan Sistem", to: "/settings/system" },
    ]
  }
];

const ADMIN_MENUS: MenuCategory[] = [
  { title: "Beranda", icon: <LayoutDashboard className="h-5 w-5" />, to: "/" },
  {
    title: "Produk",
    icon: <Package className="h-5 w-5" />,
    items: [
      { name: "Semua Produk", to: "/products" },
      { name: "Kategori", to: "/categories" },
      { name: "Varian", to: "/products/variants" },
      { name: "Satuan", to: "/products/units" },
      { name: "Harga", to: "/products/pricing" },
    ]
  },
  {
    title: "Produksi",
    icon: <Factory className="h-5 w-5" />,
    items: [
      { name: "Produksi Sendiri", to: "/production" },
      { name: "Penerimaan Rekanan", to: "/receipts" },
      { name: "Batch Produksi", to: "/production/batches" },
      { name: "Riwayat Produksi", to: "/production/history" },
    ]
  },
  {
    title: "Stok",
    icon: <Archive className="h-5 w-5" />,
    items: [
      { name: "Stok Gudang", to: "/inventory" },
      { name: "Stok Sales", to: "/sales/stock" },
      { name: "Stok Toko", to: "/stores/stock" },
      { name: "Stok Display", to: "/displays/stock" },
      { name: "Mutasi Stok", to: "/inventory/movements" },
      { name: "Stock Opname", to: "/inventory/opname" },
    ]
  },
  {
    title: "Distribusi",
    icon: <Truck className="h-5 w-5" />,
    items: [
      { name: "Ke Agen", to: "/distributions/agents" },
      { name: "Ke Sales", to: "/distributions/sales" },
      { name: "Riwayat Distribusi", to: "/distributions/history" },
    ]
  },
  {
    title: "Agen",
    icon: <Briefcase className="h-5 w-5" />,
    items: [
      { name: "Daftar Agen", to: "/agents" },
      { name: "Ketentuan Agen", to: "/agents/rules" },
      { name: "Pesanan Agen", to: "/agent-orders" },
      { name: "Penjualan Agen", to: "/agents/sales" },
      { name: "Retur Agen", to: "/agents/returns" },
    ]
  },
  {
    title: "Sales",
    icon: <UserCircle className="h-5 w-5" />,
    items: [
      { name: "Daftar Sales", to: "/sales" },
      { name: "Stok Sales", to: "/sales/stock" },
      { name: "Distribusi Sales", to: "/distributions/sales" },
      { name: "Aktivitas Sales", to: "/sales/activities" },
      { name: "Kunjungan", to: "/sales-visits" },
    ]
  },
  {
    title: "Toko",
    icon: <Store className="h-5 w-5" />,
    items: [
      { name: "Daftar Toko", to: "/stores" },
      { name: "Data Konsinyasi", to: "/stores/consignment" },
      { name: "Stok Toko", to: "/stores/stock" },
      { name: "Penjualan Toko", to: "/stores/sales" },
      { name: "Retur Toko", to: "/stores/returns" },
      { name: "Riwayat Kunjungan", to: "/stores/visits" },
    ]
  },
  {
    title: "Display",
    icon: <LayoutGrid className="h-5 w-5" />,
    items: [
      { name: "Daftar Display", to: "/displays" },
      { name: "Penempatan Display", to: "/displays/placements" },
      { name: "Isi Display", to: "/displays/contents" },
      { name: "Perpindahan", to: "/displays/movements" },
      { name: "Riwayat Display", to: "/displays/history" },
    ]
  },
  {
    title: "Retur",
    icon: <CornerUpLeft className="h-5 w-5" />,
    items: [
      { name: "Semua Retur", to: "/returns" },
      { name: "Menunggu Verifikasi", to: "/returns/pending" },
      { name: "Retur Produksi", to: "/returns/production" },
      { name: "Retur Pengiriman", to: "/returns/delivery" },
      { name: "Retur Expired", to: "/returns/expired" },
      { name: "Retur Display", to: "/returns/display" },
      { name: "Riwayat Retur", to: "/returns/history" },
    ]
  },
  {
    title: "Rekanan",
    icon: <Truck className="h-5 w-5" />,
    items: [
      { name: "Daftar Rekanan", to: "/suppliers" },
      { name: "Produk Rekanan", to: "/products/supplier" },
      { name: "Riwayat Penerimaan", to: "/receipts/history" },
    ]
  },
  {
    title: "Laporan",
    icon: <BarChart3 className="h-5 w-5" />,
    items: [
      { name: "Semua Laporan", to: "/reports" },
    ]
  },
];

const SALES_MENUS: MenuCategory[] = [
  { title: "Beranda", icon: <LayoutDashboard className="h-5 w-5" />, to: "/" },
  { title: "Kunjungan", icon: <MapPin className="h-5 w-5" />, to: "/sales-visits" },
  { title: "Toko", icon: <Store className="h-5 w-5" />, to: "/stores" },
  { title: "Stok Saya", icon: <Box className="h-5 w-5" />, to: "/inventory/my-stock" },
  { title: "Lainnya", icon: <ClipboardList className="h-5 w-5" />, items: [
    { name: "Display", to: "/displays/my-displays" },
    { name: "Riwayat Kunjungan", to: "/sales-visits/history" },
    { name: "Riwayat Retur", to: "/returns/history" },
    { name: "Profil", to: "/profile" },
    { name: "Pengaturan", to: "/settings" },
  ]}
];

// Reusable Collapsible Menu Item
const CollapsibleMenuItem = ({ 
  category, 
  pathname, 
  setIsOpen 
}: { 
  category: MenuCategory; 
  pathname: string;
  setIsOpen: (v: boolean) => void;
}) => {
  // Check if any sub-item is active
  const isActive = category.to 
    ? (pathname === category.to || (category.to !== "/" && pathname.startsWith(category.to)))
    : category.items?.some(item => pathname === item.to || pathname.startsWith(item.to));

  const [expanded, setExpanded] = useState(isActive);

  if (!category.items || category.items.length === 0) {
    return (
      <Link
        to={category.to || "#"}
        onClick={() => setIsOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive 
            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" 
            : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
        )}
      >
        {category.icon}
        {category.title}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive 
            ? "bg-primary-50/50 text-primary-700 dark:bg-primary-900/10 dark:text-primary-400" 
            : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
        )}
      >
        <div className="flex items-center gap-3">
          {category.icon}
          {category.title}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      
      {expanded && (
        <div className="pl-11 space-y-1 mt-1 pb-2">
          {category.items.map((item) => {
            const isSubActive = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  isSubActive
                    ? "font-medium text-primary-700 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20"
                    : "text-surface-500 hover:text-surface-900 hover:bg-surface-50 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean; 
  setIsOpen: (v: boolean) => void 
}) => {
  const { data: user } = useGetIdentity<{ name: string; email: string }>();
  const rawRole = localStorage.getItem('role') || null;
  const role = rawRole ? (rawRole.startsWith('role-') ? rawRole : `role-${rawRole}`) : null;
  const { mutate: logout } = useLogout();
  const location = useLocation();

  const businessStr = localStorage.getItem("business");
  const business = businessStr ? JSON.parse(businessStr) : null;

  let activeMenus = ADMIN_MENUS;
  if (role === 'role-owner') activeMenus = OWNER_MENUS;
  if (role === 'role-sales') activeMenus = SALES_MENUS;

  // On mobile for sales, we might want to hide this completely later, but for now we render it
  // and handle the PWA bottom navigation elsewhere.

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
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-surface-500 hover:text-surface-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {activeMenus.map((category, idx) => (
            <CollapsibleMenuItem 
              key={idx} 
              category={category} 
              pathname={location.pathname} 
              setIsOpen={setIsOpen} 
            />
          ))}
        </div>

        <div className="border-t border-surface-200 dark:border-surface-800 p-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
              <span className="font-semibold text-surface-600 dark:text-surface-300">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{user?.name}</p>
              <p className="truncate text-xs text-surface-500">{role?.replace("role-", "").toUpperCase() || "User"}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="text-surface-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
