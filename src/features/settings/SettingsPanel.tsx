import React, { useState, useEffect } from "react";
import { ProfileSettings } from "./components/ProfileSettings";
import { AppearanceSettings } from "./components/AppearanceSettings";
import { LobsterKeySettings } from "./components/LobsterKeySettings";
import { DatabaseSettings } from "./components/DatabaseSettings";
import { Sidebar } from "../dashboard/components/layout/Sidebar";
import { Header } from "../dashboard/components/layout/Header";
import type { SettingsTab } from "../dashboard/components/layout/SidebarNav";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function SettingsPanel() {
  const navigate = useNavigate();
  const { username, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const saved = sessionStorage.getItem("cb_settings_tab");
    return (saved as SettingsTab) || "profile";
  });
  
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
    sessionStorage.setItem("cb_settings_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("cb_sidebar_open", sidebarOpen.toString());
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 overflow-hidden flex z-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
        />
      )}

      {/* Sidebar — fixed, never in document flow */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "256px" }}
      >
        <Sidebar
          settingsMode
          activeSettingsTab={activeTab}
          onSettingsTabChange={setActiveTab}
          onGoToDashboard={() => navigate("/dashboard")}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <main 
        className="flex-1 flex flex-col min-w-0 overflow-hidden h-full transition-all duration-300 ease-in-out bg-slate-50 dark:bg-slate-950"
        style={{ paddingLeft: sidebarOpen && !isMobile ? "256px" : 0 }}
      >
        <Header
          user={username ? { username } : null}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Settings"
        />

        <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Configure your CaraBase experience and manage your Lobster identity.
            </p>
          </div>
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "agents" && <LobsterKeySettings />}
          {activeTab === "import-export" && <DatabaseSettings />}
        </div>
      </main>
    </div>
  );
}
