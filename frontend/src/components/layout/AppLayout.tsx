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
          {menuItems.map((item) => {
            const isActive = location.pathname === item.route;
            return (
              <Link
                key={item.key}
                to={item.route || "/"}
                className={`block px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
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
