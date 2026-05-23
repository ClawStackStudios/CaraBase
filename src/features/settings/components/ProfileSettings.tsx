import React from "react";
import { User, Download } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

export function ProfileSettings() {
  const { username, userUuid } = useAuth();
  const displayName = "";
  const email = "";
  const avatar = "";

  return (
    <div className="space-y-6">
      {/* Profile Settings Block */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-emerald-600 dark:text-emerald-400 mb-1.5">Profile Settings</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your CaraBase identity</p>
        </div>
        
        <div className="p-6 space-y-6 opacity-75 pointer-events-none">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden border-4 border-emerald-600 shadow-lg flex-shrink-0 transition-transform">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                <input
                  type="text"
                  value={username || "User"}
                  readOnly
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic font-medium">
                  Your unique handle (cannot be changed after setup)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  readOnly
                  placeholder="Coming soon..."
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  placeholder="Coming soon..."
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Block */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Account Information</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
               <span className="text-slate-600 dark:text-slate-400">Account Type</span>
               <span className="text-slate-900 dark:text-slate-100 font-bold">Admin</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-600 dark:text-slate-400">Storage Engine</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">Local (SQLite)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-600 dark:text-slate-400">UUID</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{userUuid || "N/A"}</span>
            </div>
            
            <div className="pt-4">
              <button
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border-2 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.98] transition-all"
                onClick={() => {
                  const keyData = localStorage.getItem("carabase_auth");
                  if (keyData) {
                    const blob = new Blob([keyData], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "carabase_identity_key.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } else {
                    alert("No identity found. Are you logged in?");
                  }
                }}
              >
                <Download className="w-4 h-4" />
                Download Identity Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
