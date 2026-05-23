import { X, Settings, Database, LogOut, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { BouncyBrand } from "../../../../components/ui/BouncyBrand";
import { SidebarNav, type SettingsTab } from "./SidebarNav";

interface SidebarProps {
  // Mobile controls
  onGoToSettings?: () => void;
  onLogout?: () => void;
  onShowDatabaseStats?: () => void;
  // Settings mode
  settingsMode?: boolean;
  activeSettingsTab?: SettingsTab;
  onSettingsTabChange?: (tab: SettingsTab) => void;
  onGoToDashboard?: () => void;
  onClose?: () => void;
}

export function Sidebar({
  onGoToSettings,
  onLogout,
  onShowDatabaseStats,
  settingsMode,
  activeSettingsTab,
  onSettingsTabChange,
  onGoToDashboard,
  onClose,
}: SidebarProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
      {/* Logo Area */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 h-16">
        <Link 
          to="/dashboard"
          onClick={() => {
            if (settingsMode && onGoToDashboard) {
              onGoToDashboard();
            }
          }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
            <span className="text-lg">🦞</span>
          </div>
          <BouncyBrand variant="subtle" className="text-xl" />
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Sidebar Layout */}
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {settingsMode ? (
          <div className="p-3 flex-1 overflow-y-auto">
            <SidebarNav
              settingsMode={settingsMode}
              activeSettingsTab={activeSettingsTab}
              onSettingsTabChange={onSettingsTabChange}
              onGoToDashboard={onGoToDashboard}
              onShowDatabaseStats={onShowDatabaseStats}
              onLogout={onLogout}
              onClose={onClose}
            />
          </div>
        ) : (
          <>
            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col p-3">
              <SidebarNav
                onGoToSettings={onGoToSettings}
                onShowDatabaseStats={onShowDatabaseStats}
                onLogout={onLogout}
                onClose={onClose}
              />
            </div>
            
          </>
        )}
      </div>

      {/* Footer Utility Bar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="space-y-1.5">
          {settingsMode ? (
            <button
              onClick={() => { onGoToDashboard?.(); if (window.innerWidth < 768) onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4" />
              Back to Dashboard
            </button>
          ) : (
            onGoToSettings && (
              <button
                onClick={() => { onGoToSettings(); if (window.innerWidth < 768) onClose?.(); }}
                className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
              >
                <Settings className="w-5 h-5 md:w-4 md:h-4" />
                Settings
              </button>
            )
          )}

          {onShowDatabaseStats && (
            <button
              onClick={() => { onShowDatabaseStats(); if (window.innerWidth < 768) onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
            >
              <Database className="w-5 h-5 md:w-4 md:h-4" />
              Database Stats
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => { onLogout(); if (window.innerWidth < 768) onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-5 h-5 md:w-4 md:h-4" />
              Claw Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
