import React from "react";
import { Table2, Search, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableSidebarProps {
  tables: any[];
  selectedTable: string | null;
  sidebarSearch: string;
  loading: boolean;
  setSidebarSearch: (val: string) => void;
  setSelectedTable: (name: string) => void;
  triggerDropTable: (name: string, e: React.MouseEvent) => void;
  setIsCreating: (val: boolean) => void;
}

export function TableSidebar({
  tables,
  selectedTable,
  sidebarSearch,
  loading,
  setSidebarSearch,
  setSelectedTable,
  triggerDropTable,
  setIsCreating
}: TableSidebarProps) {
  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto shadow-sm flex flex-col">
      <div className="p-3 border-b border-slate-100 dark:border-slate-850 flex flex-col gap-3">
        <Button onClick={() => setIsCreating(true)} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 transition-all shadow-sm">
          <Plus className="h-4 w-4" /> New Table
        </Button>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tables..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="text-sm w-full outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 border-0 focus:ring-0 focus:outline-none"
          />
          {sidebarSearch && (
            <button onClick={() => setSidebarSearch("")} className="bg-transparent border-0 cursor-pointer p-0">
              <span className="text-slate-450 hover:text-slate-600 text-lg leading-none">&times;</span>
            </button>
          )}
        </div>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto flex-1">
        {filteredTables.map(t => (
          <div key={t.name} className={`group w-full flex items-center justify-between px-2 py-1 text-sm rounded-md transition-colors ${selectedTable === t.name ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
            <button
              onClick={() => setSelectedTable(t.name)}
              className="flex-1 text-left flex items-center gap-2 border-0 bg-transparent cursor-pointer text-inherit font-inherit py-1.5"
            >
              <Table2 className="h-4 w-4 opacity-70 shrink-0" />
              <span className="truncate">{t.name}</span>
            </button>
            <button
              onClick={(e) => triggerDropTable(t.name, e)}
              className="bg-transparent border-0 cursor-pointer p-1.5 text-slate-400 hover:text-red-550 hover:bg-red-50 dark:hover:bg-red-950/30 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              title="Drop Table"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {filteredTables.length === 0 && !loading && (
          <p className="text-sm text-slate-500 dark:text-slate-450 p-4 text-center">No tables match search.</p>
        )}
      </div>
    </div>
  );
}
