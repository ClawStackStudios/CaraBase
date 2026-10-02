import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash } from "lucide-react";

interface TableDataGridProps {
  columns: any[];
  rows: any[];
  filteredRows: any[];
  pkName: string;
  sortCol: string | null;
  sortDir: "ASC" | "DESC" | null;
  handleSortToggle: (colName: string) => void;
  openEditDrawer: (row: any) => void;
  triggerDeleteRow: (row: any, e: React.MouseEvent) => void;
  page: number;
  pageSize: number;
  loadingRows: boolean;
  handlePrevPage: () => void;
  handleNextPage: () => void;
}

export function TableDataGrid({
  columns,
  rows,
  filteredRows,
  pkName,
  sortCol,
  sortDir,
  handleSortToggle,
  openEditDrawer,
  triggerDeleteRow,
  page,
  pageSize,
  loadingRows,
  handlePrevPage,
  handleNextPage
}: TableDataGridProps) {
  return (
    <>
      <div className="flex-1 overflow-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 font-semibold sticky top-0 z-10 shadow-sm backdrop-blur-sm">
            <tr>
              {columns.map(col => (
                <th
                  key={col.name}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group select-none"
                  onClick={() => handleSortToggle(col.name)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{col.name}</span>
                    <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
                      {sortCol === col.name ? (
                        sortDir === "ASC" ? <ArrowUp className="h-3 w-3 text-emerald-500" /> : <ArrowDown className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right sticky right-0 bg-slate-50 dark:bg-slate-950/90 shadow-[-5px_0_10px_rgba(0,0,0,0.02)] border-l border-slate-200 dark:border-slate-800 z-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500 dark:text-slate-450 text-sm">
                  {rows.length === 0 ? "No data found in this table." : "No records match your search."}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr key={row[pkName] || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                  {columns.map(col => {
                    const val = row[col.name];
                    const isNull = val === null || val === undefined;
                    const displayVal = isNull ? 'null' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                    const isLongText = displayVal.length > 50;

                    return (
                      <td key={col.name} className="px-4 py-2.5 max-w-[250px] truncate text-slate-700 dark:text-slate-300">
                        {isNull ? (
                          <span className="text-slate-400 italic text-xs">null</span>
                        ) : col.type === "JSON" ? (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-450">{displayVal}</span>
                        ) : isLongText ? (
                          <span title={displayVal}>{displayVal.substring(0, 50)}...</span>
                        ) : (
                          displayVal
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right sticky right-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-900/95 shadow-[-5px_0_10px_rgba(0,0,0,0.02)] border-l border-slate-100 dark:border-slate-800 z-10">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDrawer(row)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => triggerDeleteRow(row, e)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-550 hover:bg-red-50/40 dark:hover:bg-red-950/20"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 text-sm">
         <span className="text-slate-550 dark:text-slate-400">
           Page {page} <span className="text-slate-400 ml-1">({filteredRows.length} showing)</span>
         </span>
         <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1 || loadingRows} className="text-xs h-[30px] border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950">Previous</Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={rows.length < pageSize || loadingRows} className="text-xs h-[30px] border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950">Next</Button>
         </div>
      </div>
    </>
  );
}
