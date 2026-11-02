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
  LogOut
} from "lucide-react";

export const AppLayout = () => {
  const { menuItems } = useMenu();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const userRole = localStorage.getItem("distribusi_role") || "admin";

  // Konfigurasi visual untuk setiap grup kategori agar warna dan hierarki visual lebih mudah dibedakan
  const groupConfig: { [key: string]: { label: string; badgeBg: string; textColor: string; dotColor: string } } = {
    "Utama": {
      label: "Utama",
      badgeBg: "bg-blue-500/10 border-blue-500/20",
      textColor: "text-blue-700 dark:text-blue-400",
      dotColor: "bg-blue-500",
    },
    "Manajemen Stok": {
      label: "Manajemen Stok",
      badgeBg: "bg-amber-500/10 border-amber-500/20",
      textColor: "text-amber-700 dark:text-amber-400",
      dotColor: "bg-amber-500",
    },
    "Operasional Distribusi": {
      label: "Operasional Distribusi",
      badgeBg: "bg-purple-500/10 border-purple-500/20",
      textColor: "text-purple-700 dark:text-purple-400",
      dotColor: "bg-purple-500",
    },
    "Mitra Bisnis": {
      label: "Mitra Bisnis",
      badgeBg: "bg-emerald-500/10 border-emerald-500/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    },
    "Pengaturan": {
      label: "Pengaturan",
      badgeBg: "bg-slate-500/10 border-slate-500/20",
      textColor: "text-slate-700 dark:text-slate-400",
      dotColor: "bg-slate-500",
    },
    "Lainnya": {
      label: "Lainnya",
      badgeBg: "bg-muted/40 border-border/40",
      textColor: "text-muted-foreground",
      dotColor: "bg-muted-foreground",
    },
  };

  const getMenuIcon = (name: string) => {
    switch (name) {
      case "dashboard":
        return <LayoutDashboard size={15} className="shrink-0" />;
      case "products":
        return <Package size={15} className="shrink-0" />;
      case "inbound_batches":
        return <ArrowDownToLine size={15} className="shrink-0" />;
      case "inventory":
        return <Warehouse size={15} className="shrink-0" />;
      case "stock-requests":
        return <ClipboardCheck size={15} className="shrink-0" />;
      case "suppliers":
        return <Building2 size={15} className="shrink-0" />;
      case "agents":
        return <Briefcase size={15} className="shrink-0" />;
      case "stores":
        return <Store size={15} className="shrink-0" />;
      case "users":
        return <Users size={15} className="shrink-0" />;
      case "rbac":
        return <ShieldCheck size={15} className="shrink-0" />;
      default:
        return <FolderTree size={15} className="shrink-0" />;
    }
  };
  
  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar untuk tampilan Owner/Admin */}
      <aside className="w-68 bg-card border-r flex flex-col shadow-sm shrink-0">
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-primary tracking-tight">
              Distribusi<span className="text-muted-foreground font-medium">App</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
              Panel {userRole === "owner" ? "Owner / Eksekutif" : "Admin Gudang"}
            </p>
          </div>
        </div>

        {/* Daftar Navigasi Berkelompok */}
        <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto">
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

            return sortedGroups.map((group) => {
              const config = groupConfig[group] || groupConfig["Lainnya"];

              return (
                <div key={group} className="space-y-1.5">
                  {/* Header Kategori: Diberikan styling badge/warna pembeda yang kontras */}
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${config.badgeBg}`}>
                    <span className={`w-2 h-2 rounded-full ${config.dotColor} shrink-0`} />
                    <h3 className={`text-[10px] font-black uppercase tracking-wider ${config.textColor}`}>
                      {group}
                    </h3>
                  </div>

                  {/* Menu Items: Menjorok ke dalam (Indented) dengan garis panduan cabang di sisi kiri */}
                  <div className="ml-3 pl-2.5 border-l-2 border-border/60 space-y-1">
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
                              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground font-medium hover:translate-x-0.5'
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
              );
            });
          })()}
        </nav>

        {/* Footer Sidebar: Info Role & Tombol Keluar */}
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
