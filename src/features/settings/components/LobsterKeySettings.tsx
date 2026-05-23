import React from "react";
import { Shield, Key, Plus } from "lucide-react";

export function LobsterKeySettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold leading-none tracking-tight text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Agent Lobster Keys
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage API keys for AI Agent access (Coming soon)</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed">
            <Plus className="w-4 h-4" />
            New Key
          </button>
        </div>
        
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <Key className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No active agent keys</h4>
          <p className="text-sm text-slate-500 max-w-md">
            Future versions of CaraBase will allow you to generate scoped agent keys that permit AI agents to assist with schema creation and RLS setup.
          </p>
        </div>
      </div>
    </div>
  );
}
