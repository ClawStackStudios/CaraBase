import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("cb_sidebar_open");
    return saved !== null ? saved === "true" : true;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("cb_sidebar_open", sidebarOpen.toString());
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path.startsWith("/dashboard/editor")) return "Table Editor";
    if (path.startsWith("/dashboard/api-builder")) return "API Builder";
    if (path.startsWith("/dashboard/keys")) return "API Keys";
    if (path.startsWith("/dashboard/policies")) return "Policies (RLS)";
    if (path.startsWith("/dashboard/storage")) return "Storage";
    if (path.startsWith("/dashboard/settings")) return "Settings";
    return "";
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - FIXED to the left viewport wall */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          !isMobile && !sidebarOpen ? "w-[64px] translate-x-0" : 
          sidebarOpen ? "w-[256px] translate-x-0" : "w-[256px] -translate-x-full"
        }`}
      >
        <Sidebar
          isCollapsed={!isMobile && !sidebarOpen}
          onGoToSettings={() => navigate("/dashboard/settings")}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content Area - Shifted by padding on desktop only */}
      <main 
        className="h-full w-full flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-all duration-300 ease-in-out"
        style={{ 
          paddingLeft: isMobile ? 0 : sidebarOpen ? "256px" : "64px" 
        }}
      >
        <Header
          user={username ? { username } : null}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle()}
        />

        <div className="flex-1 min-h-0 relative overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
