import React from 'react';
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Database, Key, Shield, HardDrive, LayoutDashboard, Settings, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

import AppDashboard from "../pages/Dashboard";
import TableEditor from "../pages/TableEditor";
import ApiKeys from "../pages/ApiKeys";
import Policies from "../pages/Policies";
import Storage from "../pages/Storage";

export function Sidebar({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { username, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Table Editor", href: "/dashboard/editor", icon: Database },
    { name: "API Keys", href: "/dashboard/keys", icon: Key },
    { name: "Policies (RLS)", href: "/dashboard/policies", icon: Shield },
    { name: "Storage", href: "/dashboard/storage", icon: HardDrive },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-md flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">CaraBase</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                    isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-350"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350 font-medium">
                {username ? username.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{username || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">ClawStack Studios©™</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme} 
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent border-0 cursor-pointer">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <Sidebar>
      <Routes>
        <Route index element={<AppDashboard />} />
        <Route path="editor" element={<TableEditor />} />
        <Route path="keys" element={<ApiKeys />} />
        <Route path="policies" element={<Policies />} />
        <Route path="storage" element={<Storage />} />
        <Route path="settings" element={<div className="text-slate-800 dark:text-slate-200 font-medium">Settings (Coming Soon)</div>} />
      </Routes>
    </Sidebar>
  );
}
