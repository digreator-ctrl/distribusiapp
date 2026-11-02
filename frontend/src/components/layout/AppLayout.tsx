import { useLogout, useMenu } from "@refinedev/core";
import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  Warehouse, 
  ClipboardCheck, 
  Building2, 
  Briefcase, 
  Store, 
  Users, 
  ShieldCheck, 
  FolderTree,
  LogOut,
  Layers
} from "lucide-react";

export const AppLayout = () => {
  const { menuItems } = useMenu();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const userRole = localStorage.getItem("distribusi_role") || "admin";

  const getMenuIcon = (name: string) => {
    switch (name) {
      case "dashboard":
        return <LayoutDashboard size={16} className="shrink-0" />;
      case "products":
        return <Package size={16} className="shrink-0" />;
      case "inbound_batches":
        return <ArrowDownToLine size={16} className="shrink-0" />;
      case "inventory":
        return <Warehouse size={16} className="shrink-0" />;
      case "stock-requests":
        return <ClipboardCheck size={16} className="shrink-0" />;
      case "suppliers":
        return <Building2 size={16} className="shrink-0" />;
      case "agents":
        return <Briefcase size={16} className="shrink-0" />;
      case "stores":
        return <Store size={16} className="shrink-0" />;
      case "users":
        return <Users size={16} className="shrink-0" />;
      case "rbac":
        return <ShieldCheck size={16} className="shrink-0" />;
      default:
        return <FolderTree size={16} className="shrink-0" />;
    }
  };

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar untuk tampilan Owner/Admin */}
      <aside className="w-72 bg-card border-r flex flex-col shadow-sm shrink-0">
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-border/50">
          <h2 className="text-xl font-black text-primary tracking-tight">
            Distribusi<span className="text-muted-foreground font-medium">App</span>
          </h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            Panel {userRole === "owner" ? "Owner / Eksekutif" : "Admin Gudang"}
          </p>
        </div>

        {/* Navigasi Berkelompok */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {(() => {
            const allowedItems = menuItems.filter(item => {
              if (item.name === "users" && userRole !== "owner") return false;
              if (item.name === "rbac" && userRole !== "owner") return false;
              return true;
            });

            const grouped = allowedItems.reduce((acc: any, item) => {
              const groupName = item.meta?.group || "Lainnya";
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(item);
              return acc;
            }, {});

            const groupOrder = ["Utama", "Manajemen Stok", "Operasional Distribusi", "Mitra Bisnis", "Pengaturan", "Lainnya"];
            const sortedGroups = Object.keys(grouped).sort((a, b) => {
              const idxA = groupOrder.indexOf(a);
              const idxB = groupOrder.indexOf(b);
              return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            });

            return sortedGroups.map((group) => (
              <div key={group} className="space-y-2">
                {/* 1. NAMA KATEGORI: Seragam warnanya & mencolok perbedaannya dari menu */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-white shadow-2xs">
                  <Layers size={13} className="text-indigo-400 shrink-0" />
                  <h3 className="text-[11px] font-black uppercase tracking-wider">
                    {group}
                  </h3>
                </div>

                {/* 2. NAMA MENU: Dibuat lebih menjorok ke dalam (ml-5 pl-3 dengan garis panduan cabang) */}
                <div className="ml-5 pl-3 border-l-2 border-slate-300 dark:border-slate-700 space-y-1">
                  {grouped[group].map((item: any) => {
                    const itemRoute = item.route || "/";
                    const isActive = itemRoute === "/" 
                      ? location.pathname === "/" 
                      : location.pathname === itemRoute || location.pathname.startsWith(`${itemRoute}/`);

                    return (
                      <Link
                        key={item.key}
                        to={itemRoute}
                        className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                          isActive 
                            ? 'bg-primary text-primary-foreground font-bold shadow-xs' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium hover:translate-x-0.5'
                        }`}
                      >
                        <span className={isActive ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-primary transition-colors"}>
                          {getMenuIcon(item.name)}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </nav>

        {/* Footer Sidebar: Profil Akun & Tombol Keluar */}
        <div className="p-3.5 border-t border-border/50 bg-muted/10 space-y-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-card border border-border/60 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
              {userRole === "owner" ? "OW" : "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">
                {userRole === "owner" ? "Budi Hartono" : "Admin Sistem"}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize truncate">
                Role: <span className="font-semibold text-primary">{userRole}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={() => logout()}
            className="w-full px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-scroll p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
