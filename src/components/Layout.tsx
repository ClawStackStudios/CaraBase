import React from 'react';
import { Routes, Route } from "react-router-dom";
import { DashboardShell } from "../features/dashboard/DashboardShell";
import { SettingsPanel } from "../features/settings/SettingsPanel";

import AppDashboard from "../pages/Dashboard";
import TableEditor from "../pages/TableEditor";
import ApiKeys from "../pages/ApiKeys";
import Policies from "../pages/Policies";
import Storage from "../pages/Storage";
import ApiBuilder from "../pages/ApiBuilder";
import SdkSettings from "../pages/SdkSettings";
import Views from "../pages/Views";
import Triggers from "../pages/Triggers";
import SqlEditor from "../pages/SqlEditor";
import { CommandPalette } from "./ui/CommandPalette";

export function AppLayout() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<AppDashboard />} />
        <Route path="editor" element={<TableEditor />} />
        <Route path="api-builder" element={<ApiBuilder />} />
        <Route path="keys" element={<ApiKeys />} />
        <Route path="policies" element={<Policies />} />
        <Route path="storage" element={<Storage />} />
        <Route path="settings" element={<SettingsPanel />} />
        <Route path="sdk" element={<SdkSettings />} />
        <Route path="views" element={<Views />} />
        <Route path="triggers" element={<Triggers />} />
        <Route path="sql" element={<SqlEditor />} />
      </Routes>
      <CommandPalette />
    </DashboardShell>
  );
}
