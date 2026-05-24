import React from "react";
import { LobsterKeysTab } from "../../../components/lobster-keys/LobsterKeysTab";

export function LobsterKeySettings() {
  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors p-6">
        <LobsterKeysTab />
      </div>
    </div>
  );
}
