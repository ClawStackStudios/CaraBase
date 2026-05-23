import React, { useState } from "react";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

export function AppearanceSettings() {
  const { theme, toggleTheme } = useTheme();
  // Mock states for density and items per page
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [itemsPerPage, setItemsPerPage] = useState<10 | 25 | 50>(25);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-emerald-600 dark:text-emerald-400 mb-1.5">Appearance Settings</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customize how CaraBase looks and feels</p>
        </div>
        <div className="p-6 space-y-8">
          {/* Theme Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">Theme</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={theme !== "light" ? toggleTheme : undefined}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  theme === "light"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={theme !== "dark" ? toggleTheme : undefined}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  theme === "dark"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                <Moon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium">Dark</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">Note: Auto theme coming soon.</p>
          </div>

          {/* Table Density */}
          <div className="opacity-75 pointer-events-none">
            <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">Table Density</label>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  density === "comfortable"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Comfortable
              </button>
              <button
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  density === "compact"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Compact
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">Coming soon: Adjust data table padding.</p>
          </div>

          {/* Items Per Page */}
          <div className="opacity-75 pointer-events-none">
            <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">Rows Per Page</label>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    itemsPerPage === count
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">Coming soon: Adjust pagination limits.</p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
              disabled
            >
              <Palette className="w-4 h-4" />
              Apply Appearance Settings (Saved automatically)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
