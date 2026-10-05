import { useLogout, useMenu } from "@refinedev/core";
import { Link, Outlet, useLocation } from "react-router-dom";

export const AppLayout = () => {
  const { menuItems } = useMenu();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  
  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar untuk tampilan Owner/Admin */}
      <aside className="w-64 bg-card border-r flex flex-col shadow-sm">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-black text-primary tracking-tight">Distribusi<span className="text-muted-foreground font-medium">App</span></h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {(() => {
            const allowedItems = menuItems.filter(item => {
              if (item.name === "users" && localStorage.getItem("distribusi_role") !== "owner") return false;
              if (item.name === "rbac" && localStorage.getItem("distribusi_role") !== "owner") return false;
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
              <div key={group} className="mb-4">
                <h3 className="px-4 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
                  {group}
                </h3>
                <div className="space-y-1">
                  {grouped[group].map((item: any) => {
                    const isActive = location.pathname === (item.route || "/");
                    return (
                      <Link
                        key={item.key}
                        to={item.route || "/"}
                        className={`block px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                          isActive 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </nav>
        <div className="p-4 border-t border-border/50">
          <button 
            onClick={() => logout()}
            className="w-full px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            Keluar
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
