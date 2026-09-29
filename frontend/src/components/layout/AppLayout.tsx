import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGetIdentity } from "@refinedev/core";

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: user } = useGetIdentity<{ name: string }>();

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-[hsl(224,20%,8%)] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-surface-200 bg-white px-6 shadow-sm dark:border-surface-800 dark:bg-[hsl(224,20%,10%)] lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)}
            className="-ml-2"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100 truncate">
              Hai, {user?.name?.split(' ')[0] || 'User'}
            </h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
