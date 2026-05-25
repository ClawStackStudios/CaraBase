import React, { useState } from "react";
import { LayoutDashboard, Database, Code, Key, Shield, HardDrive, Settings, User, Palette, LogOut, Globe, Network, ChevronDown, ChevronRight, Eye, Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export type SettingsTab = "profile" | "appearance" | "agents" | "import-export" | "storage-shares";

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
  isCollapsed?: boolean;
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
  isCollapsed,
}: SidebarNavProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'database': true,
    'auth': true,
    'storage': true,
    'api': true
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      {
        id: "storage-shares" as SettingsTab,
        label: "Storage Shares",
        icon: Globe,
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3 md:py-2'} rounded-xl text-sm font-bold transition-all ${
                isActive ? active : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isCollapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && label}
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
      id: "database",
      href: "#",
      label: "Database",
      icon: Database,
      active: "",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      badge: null,
      children: [
        {
          id: "editor",
          href: "/dashboard/editor",
          label: "Table Editor",
          icon: Table2,
          active: "bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        },
        {
          id: "sql",
          href: "/dashboard/sql",
          label: "SQL Editor",
          icon: Code,
          active: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        },
        {
          id: "views",
          href: "/dashboard/views",
          label: "Views",
          icon: Eye,
          active: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        },
        {
          id: "triggers",
          href: "/dashboard/triggers",
          label: "Triggers",
          icon: Zap,
          active: "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        }
      ]
    },
    {
      id: "auth",
      href: "#",
      label: "Auth & Security",
      icon: Shield,
      active: "",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      badge: null,
      children: [
        {
          id: "keys",
          href: "/dashboard/keys",
          label: "API Keys",
          icon: Key,
          active: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        },
        {
          id: "policies",
          href: "/dashboard/policies",
          label: "Policies (RLS)",
          icon: Shield,
          active: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        }
      ]
    },
    {
      id: "storage",
      href: "/dashboard/storage",
      label: "Storage Ecosystem",
      icon: HardDrive,
      active: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300 shadow-sm",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      activeBadge: `${badgeBase} bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100`,
      badge: null,
    },
    {
      id: "api",
      href: "#",
      label: "API & Integrations",
      icon: Network,
      active: "",
      inactive: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      badge: null,
      children: [
        {
          id: "api-builder",
          href: "/dashboard/api-builder",
          label: "API Builder",
          icon: Code,
          active: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        },
        {
          id: "sdk",
          href: "/dashboard/sdk",
          label: "SDK & Network",
          icon: Network,
          active: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm",
          inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        }
      ]
    },
    }
  ];

  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        if (item.children) {
          const isExpanded = expandedSections[item.id];
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => !isCollapsed && toggleSection(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-3 md:py-2'} rounded-xl text-sm font-bold transition-all ${item.inactive}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                  <item.icon className="w-5 h-5 md:w-4 md:h-4 text-slate-400 shrink-0" />
                  {!isCollapsed && item.label}
                </div>
                {!isCollapsed && (isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />)}
              </button>
              
              {(isExpanded || isCollapsed) && (
                <div className={`${isCollapsed ? 'space-y-1 pt-1 flex flex-col items-center' : 'pl-9 space-y-1 pt-1'}`}>
                  {item.children.map(child => {
                    const isChildActive = location.pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.id}
                        to={child.href}
                        onClick={() => {
                          if (window.innerWidth < 768) onClose?.();
                        }}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} rounded-xl text-sm font-bold transition-all ${isChildActive ? child.active : child.inactive}`}
                        title={isCollapsed ? child.label : undefined}
                      >
                        <child.icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                        {!isCollapsed && child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        }

        const isActive = item.href === "/dashboard" 
          ? location.pathname === item.href 
          : location.pathname.startsWith(item.href);
          
        return (
          <Link
            key={item.id}
            to={item.href}
            onClick={() => {
              if (window.innerWidth < 768) onClose?.();
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-3 md:py-2'} rounded-xl text-sm font-bold transition-all ${isActive ? item.active : item.inactive}`}
            title={isCollapsed ? item.label : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
              <item.icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              {!isCollapsed && item.label}
            </div>
            {!isCollapsed && item.badge !== null && item.badge !== undefined && (
              <span className={isActive && item.activeBadge ? item.activeBadge : inactiveBadge}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
