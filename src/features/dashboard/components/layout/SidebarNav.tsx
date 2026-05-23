import { LayoutDashboard, Database, Code, Key, Shield, HardDrive, Settings, User, Palette, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export type SettingsTab = "profile" | "appearance" | "agents" | "import-export";

interface SidebarNavProps {
  // Settings mode
  settingsMode?: boolean;
  activeSettingsTab?: SettingsTab;
  onSettingsTabChange?: (tab: SettingsTab) => void;
  onGoToSettings?: () => void;
  onGoToDashboard?: () => void;
  onShowDatabaseStats?: () => void;
  onLogout?: () => void;
  onClose?: () => void;
}

export function SidebarNav({
  settingsMode,
  activeSettingsTab,
  onSettingsTabChange,
  onGoToSettings,
  onGoToDashboard,
  onShowDatabaseStats,
  onLogout,
  onClose,
}: SidebarNavProps) {
  const location = useLocation();
  const badgeBase = "text-xs px-2 py-0.5 rounded-full font-bold transition-all duration-200";
  const inactiveBadge = `${badgeBase} bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200`;

  if (settingsMode && activeSettingsTab && onSettingsTabChange && onGoToDashboard) {
    const settingsNavItems = [
      {
        id: "profile" as SettingsTab,
        label: "Profile",
        icon: User,
        active: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm",
      },
      {
        id: "appearance" as SettingsTab,
        label: "Appearance",
        icon: Palette,
        active: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm",
      },
      {
        id: "agents" as SettingsTab,
        label: "Lobster Keys",
        icon: Shield,
        active: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm",
      },
      {
        id: "import-export" as SettingsTab,
        label: "Database Actions",
        icon: Database,
        active: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm",
      },
    ];

    return (
      <nav className="space-y-1.5">
        {settingsNavItems.map(({ id, label, icon: Icon, active }) => {
          const isActive = activeSettingsTab === id;
          return (
            <button
              key={id}
              onClick={() => onSettingsTabChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm font-bold transition-all ${
                isActive ? active : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5 md:w-4 md:h-4" />
              {label}
            </button>
          );
        })}
      </nav>
    );
  }

  const navItems = [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      badge: null,
    },
    {
      id: "editor",
      href: "/dashboard/editor",
      label: "Table Editor",
      icon: Database,
      active: "bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      activeBadge: `${badgeBase} bg-teal-200 text-teal-900 dark:bg-teal-800 dark:text-teal-100`,
      badge: 5, // Mock data for now
    },
    {
      id: "api-builder",
      href: "/dashboard/api-builder",
      label: "API Builder",
      icon: Code,
      active: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      activeBadge: `${badgeBase} bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-100`,
      badge: null,
    },
    {
      id: "keys",
      href: "/dashboard/keys",
      label: "API Keys",
      icon: Key,
      active: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      activeBadge: `${badgeBase} bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100`,
      badge: 3,
    },
    {
      id: "policies",
      href: "/dashboard/policies",
      label: "Policies (RLS)",
      icon: Shield,
      active: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      activeBadge: `${badgeBase} bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100`,
      badge: 12,
    },
    {
      id: "storage",
      href: "/dashboard/storage",
      label: "Storage",
      icon: HardDrive,
      active: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      activeBadge: `${badgeBase} bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100`,
      badge: null,
    },
  ];

  return (
    <nav className="space-y-1.5">
      {navItems.map(({ id, href, label, icon: Icon, active, inactive, badge, activeBadge }) => {
        // Dashboard matches exactly, others prefix match
        const isActive = href === "/dashboard" 
          ? location.pathname === href 
          : location.pathname.startsWith(href);
          
        return (
          <Link
            key={id}
            to={href}
            onClick={() => {
              if (window.innerWidth < 768) onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3 py-3 md:py-2 rounded-xl text-sm font-bold transition-all ${isActive ? active : inactive}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 md:w-4 md:h-4" />
              {label}
            </div>
            {badge !== null && badge !== undefined && (
              <span className={isActive && activeBadge ? activeBadge : inactiveBadge}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
