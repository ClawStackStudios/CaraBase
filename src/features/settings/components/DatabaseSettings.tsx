import React from "react";
import { Database, Download, Upload, AlertTriangle } from "lucide-react";

export function DatabaseSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Operations
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your SQLite database backups and imports</p>
        </div>
        
        <div className="p-6 space-y-8">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Export Database</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Download a complete backup of your SQLite database, including all tables, rows, and schema configurations.
            </p>
            <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed">
              <Download className="w-4 h-4" />
              Export .sqlite Backup
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Import Database</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Restore from a previous CaraBase .sqlite backup file. This will merge or overwrite current data.
            </p>
            <button className="flex items-center gap-2 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed">
              <Upload className="w-4 h-4" />
              Import Backup
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Permanently delete all tables and data. This action cannot be undone unless you have a backup.
            </p>
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed transition-colors">
              Reset Entire Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
