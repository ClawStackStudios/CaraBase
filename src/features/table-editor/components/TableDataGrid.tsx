import React from "react";
import { DatabaseZap, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableDataGridProps {
  columns: any[];
  filteredRows: any[];
  loadingRows: boolean;
  sortCol: string | null;
  sortDir: "ASC" | "DESC" | null;
  handleSortToggle: (colName: string) => void;
  openEditDrawer: (row: any) => void;
  triggerDeleteRow: (row: any, e: React.MouseEvent) => void;
  page: number;
  pageSize: number;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  hasMore: boolean;
}

export function TableDataGrid({
  columns,
  filteredRows,
  loadingRows,
  sortCol,
  sortDir,
  handleSortToggle,
  openEditDrawer,
  triggerDeleteRow,
  page,
  pageSize,
  handlePrevPage,
  handleNextPage,
  hasMore
}: TableDataGridProps) {
  return (
    <>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 sticky top-0 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map(col => {
                const isSorted = sortCol === col.name;
                return (
                  <th
                    key={col.name}
                    onClick={() => handleSortToggle(col.name)}
                    className="px-4 py-3.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors group"
                  >
                     <div className="flex items-center gap-1.5 justify-between">
                       <div className="flex items-center gap-1">
                         {col.name}
                         <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal uppercase bg-slate-100 dark:bg-slate-800 px-1 rounded">{col.type}</span>
                         {col.pk === 1 && (
                           <span className="text-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1 rounded uppercase font-semibold">PK</span>
                         )}
                       </div>
                       <div className="text-slate-400 group-hover:text-slate-650 transition-colors">
                         {!isSorted && <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />}
                         {isSorted && sortDir === "ASC" && <ArrowUp className="h-3 w-3 text-emerald-555" />}
                         {isSorted && sortDir === "DESC" && <ArrowDown className="h-3 w-3 text-emerald-555" />}
                       </div>
                     </div>
                  </th>
                );
              })}
              <th className="px-4 py-3.5 font-semibold text-right whitespace-nowrap w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingRows ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                  {columns.map(col => (
                     <td key={col.name} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4"></div></td>
                  ))}
                  <td className="px-4 py-3"></td>
                </tr>
              ))
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-slate-500 dark:text-slate-400">
                  <DatabaseZap className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No rows matching current filters found.</p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => openEditDrawer(row)}
                  className="border-b last:border-0 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors cursor-pointer group"
                >
                  {columns.map(col => {
                    const val = row[col.name];
                    const isJson = col.type === "JSON";
                    return (
                      <td key={col.name} className="px-4 py-3 text-slate-700 dark:text-slate-350 truncate max-w-[200px]">
                        {val !== null ? (
                          isJson ? (
                            <span className="font-mono text-xs text-blue-600 dark:text-blue-450 bg-blue-50/40 dark:bg-blue-950/10 px-1 rounded truncate block max-w-full">
                              {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </span>
                          ) : String(val)
                        ) : (
                          <span className="text-slate-400 dark:text-slate-550 italic">null</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDrawer(row)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-555 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
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
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasMore || loadingRows} className="text-xs h-[30px] border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950">Next</Button>
         </div>
      </div>
    </>
  );
}
