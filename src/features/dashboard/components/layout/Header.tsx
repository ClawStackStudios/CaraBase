import React, { useState } from "react";
import { Menu, Sun, Moon, ChevronRight } from "lucide-react";
import { useTheme } from "../../../../context/ThemeContext";
import { useLocation } from "react-router-dom";
import { ConnectModal } from "../../../../components/modals/ConnectModal";

interface HeaderProps {
  user: { username: string } | null;
  onToggleSidebar?: () => void;
  title?: string; // Kept for backwards compatibility but we will use location for breadcrumbs
}

export function Header({
  user,
  onToggleSidebar,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = ["CaraBase"];
    if (path.startsWith("/dashboard/editor")) crumbs.push("Database", "Table Editor");
    else if (path.startsWith("/dashboard/sql")) crumbs.push("Database", "SQL Editor");
    else if (path.startsWith("/dashboard/api-builder")) crumbs.push("API", "API Builder");
    else if (path.startsWith("/dashboard/keys")) crumbs.push("API", "API Keys");
    else if (path.startsWith("/dashboard/policies")) crumbs.push("Auth", "Policies (RLS)");
    else if (path.startsWith("/dashboard/storage")) crumbs.push("Storage", "Buckets");
    else if (path.startsWith("/dashboard/views")) crumbs.push("Database", "Views");
    else if (path.startsWith("/dashboard/triggers")) crumbs.push("Database", "Triggers");
    else if (path.startsWith("/dashboard/sdk")) crumbs.push("API", "SDK Settings");
    else if (path.startsWith("/dashboard/settings")) crumbs.push("System", "Settings");
    else if (path === "/dashboard") crumbs.push("Dashboard");
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-emerald-500 dark:border-red-500 px-4 md:px-6 py-2 md:py-3 flex-shrink-0 h-16 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 h-full">
        {/* Left Side: Toggle & Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="text-slate-700 dark:text-slate-300 p-2 h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-1.5 ml-1 md:ml-0 overflow-hidden">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className={`text-[11px] md:text-sm font-medium tracking-wide truncate ${idx === breadcrumbs.length - 1 ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {crumb}
                </span>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
            
            <div className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors shadow-sm"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Greeting & Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
              <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {user.username}
              </span>
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-xs shadow-sm">
                {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
              </div>
            </div>
          )}

          <button 
            onClick={toggleTheme} 
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
      />
    </header>
  );
}
