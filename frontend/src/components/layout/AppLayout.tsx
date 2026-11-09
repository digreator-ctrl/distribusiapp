import { useState, useEffect } from "react";
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
  Menu,
  X
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export const AppLayout = () => {
  const { menuItems } = useMenu();
  const { mutate: logout } = useLogout();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userRole, setUserRole] = useState<string>(
    () => localStorage.getItem("distribusi_role") || "admin"
  );
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem("distribusi_user_name") || (userRole === "owner" ? "Owner Usaha" : "Admin Sistem")
  );
  const [tenantName, setTenantName] = useState<string>(
    () => localStorage.getItem("distribusi_tenant_name") || "Distribusi SaaS"
  );

  // Otomatis tutup drawer mobile saat berpindah rute/halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sinkronisasi data user real-time dengan database
  useEffect(() => {
    const syncUserProfile = async () => {
      const currentUserId = localStorage.getItem("distribusi_user_id");
      if (!currentUserId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUserId}`);
        if (res.ok) {
          const user = await res.json();
          const latestName = user.full_name || user.username;
          if (latestName) {
            setUserName(latestName);
            localStorage.setItem("distribusi_user_name", latestName);
          }
          if (user.role) {
            setUserRole(user.role);
            localStorage.setItem("distribusi_role", user.role);
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi data profil pengguna:", err);
      }
    };

    syncUserProfile();

    // Dengarkan event lokal jika pengguna mengedit profilnya
    const handleProfileUpdated = (e: any) => {
      const newName = e?.detail?.name || localStorage.getItem("distribusi_user_name");
      const newRole = e?.detail?.role || localStorage.getItem("distribusi_role");
      const newTenant = e?.detail?.tenant_name || localStorage.getItem("distribusi_tenant_name");

      if (newName) setUserName(newName);
      if (newRole) setUserRole(newRole);
      if (newTenant) setTenantName(newTenant);
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdated);
    return () => window.removeEventListener("userProfileUpdated", handleProfileUpdated);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || (userRole === "owner" ? "OW" : "AD");
  };

  const getMenuIcon = (name: string) => {
    switch (name) {
      case "dashboard":
        return <LayoutDashboard size={17} className="shrink-0" />;
      case "products":
        return <Package size={17} className="shrink-0" />;
      case "inbound_batches":
        return <ArrowDownToLine size={17} className="shrink-0" />;
      case "inventory":
        return <Warehouse size={17} className="shrink-0" />;
      case "stock-requests":
        return <ClipboardCheck size={17} className="shrink-0" />;
      case "suppliers":
        return <Building2 size={17} className="shrink-0" />;
      case "agents":
        return <Briefcase size={17} className="shrink-0" />;
      case "stores":
        return <Store size={17} className="shrink-0" />;
      case "users":
        return <Users size={17} className="shrink-0" />;
      case "rbac":
        return <ShieldCheck size={17} className="shrink-0" />;
      default:
        return <FolderTree size={17} className="shrink-0" />;
    }
  };

  const renderNavItems = () => {
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
      <div key={group} className="space-y-1.5">
        {/* 1. NAMA KATEGORI */}
        <div className="flex items-center gap-2 px-1 pt-1 pb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {group}
          </h3>
        </div>

        {/* 2. NAMA MENU */}
        <div className="ml-5 pl-3 border-l-2 border-border/70 space-y-1">
          {grouped[group].map((item: any) => {
            const itemRoute = item.route || "/";
            const isActive = itemRoute === "/" 
              ? location.pathname === "/" 
              : location.pathname === itemRoute || location.pathname.startsWith(`${itemRoute}/`);

            return (
              <Link
                key={item.key}
                to={itemRoute}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-muted/80 hover:text-foreground font-semibold hover:translate-x-0.5'
                }`}
              >
                <span className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors"}>
                  {getMenuIcon(item.name)}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    ));
  };

  const renderFooterProfile = () => (
    <div className="p-3.5 border-t border-border/50 bg-muted/10 space-y-2">
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-card border border-border/60 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
          {getInitials(userName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate" title={userName}>
            {userName}
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
  );

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      {/* ============================================================== */}
      {/* 1. TOP BAR UNTUK MOBILE & TABLET (< 1024px)                     */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card border-b border-border/60 shadow-xs lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-muted active:scale-95 transition-transform"
            aria-label="Buka Menu Navigasi"
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-black text-primary tracking-tight leading-tight truncate">
              Distribusi<span className="text-muted-foreground font-medium">App</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate max-w-[170px]">
              {tenantName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {userRole === "owner" ? "Owner" : "Admin"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
            {getInitials(userName)}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. DRAWER OVERLAY UNTUK MOBILE & TABLET                        */}
      {/* ============================================================== */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card flex flex-col shadow-2xl transition-transform duration-200 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header dengan Tombol Close */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg font-black text-primary tracking-tight truncate">
              Distribusi<span className="text-muted-foreground font-medium">App</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate" title={tenantName}>
              {tenantName} • {userRole === "owner" ? "Owner" : "Admin"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation List */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {renderNavItems()}
        </nav>

        {/* Drawer Footer Profil & Logout */}
        {renderFooterProfile()}
      </aside>

      {/* ============================================================== */}
      {/* 3. SIDEBAR PERMANEN UNTUK DESKTOP (>= 1024px)                  */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex lg:w-72 bg-card border-r flex-col shadow-sm shrink-0 h-screen sticky top-0">
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-border/50">
          <h2 className="text-xl font-black text-primary tracking-tight">
            Distribusi<span className="text-muted-foreground font-medium">App</span>
          </h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate" title={tenantName}>
            {tenantName} • {userRole === "owner" ? "Owner" : "Admin"}
          </p>
        </div>

        {/* Navigasi Berkelompok */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {renderNavItems()}
        </nav>

        {/* Footer Sidebar: Profil Akun & Tombol Keluar */}
        {renderFooterProfile()}
      </aside>

      {/* ============================================================== */}
      {/* 4. MAIN CONTENT AREA (RESPONSIF MOBILE, TABLET & DESKTOP)      */}
      {/* ============================================================== */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
