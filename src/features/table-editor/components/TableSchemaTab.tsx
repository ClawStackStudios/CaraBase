import React from "react";
import { Plus, Trash, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface TableSchemaTabProps {
  columns: any[];
  selectedTable: string;
  triggerDropColumn: (colName: string) => void;
  colToAdd: { name: string; type: string; notNull: boolean; defaultValue: string; };
  setColToAdd: React.Dispatch<React.SetStateAction<{ name: string; type: string; notNull: boolean; defaultValue: string; }>>;
  handleAddColumnToSchema: (e: React.FormEvent) => void;
  isSubmittingColumn: boolean;
  colAddError: string | null;
}

export function TableSchemaTab({
  columns,
  selectedTable,
  triggerDropColumn,
  colToAdd,
  setColToAdd,
  handleAddColumnToSchema,
  isSubmittingColumn,
  colAddError,
}: TableSchemaTabProps) {
  return (
    <div className="space-y-6">
      {/* Schema Info Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/40 shadow-xs">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase">
            <tr>
              <th className="px-5 py-3.5">Column ID</th>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Primary Key</th>
              <th className="px-5 py-3.5">Nullable</th>
              <th className="px-5 py-3.5">Default Value</th>
              <th className="px-5 py-3.5 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {columns.map(col => (
              <tr key={col.name} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">{col.cid}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-150">{col.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-1.5 py-0.5 rounded font-mono font-semibold select-none">
                    {col.type || 'TEXT'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {col.pk === 1 ? (
                    <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold select-none">PRIMARY KEY</span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {col.notnull === 1 ? (
                    <span className="text-[9px] bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-semibold select-none">NOT NULL</span>
                  ) : (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/10 px-1.5 py-0.5 rounded font-semibold select-none">NULLABLE</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {col.dflt_value !== null ? (
                    <code className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 px-1.5 py-0.5 rounded font-mono">
                      {col.dflt_value}
                    </code>
                  ) : (
                    <span className="text-slate-400 italic text-xs">none</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {col.pk !== 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerDropColumn(col.name)}
                      className="h-7 w-7 p-0 text-slate-450 hover:text-red-550 hover:bg-red-50/40 dark:hover:bg-red-950/20"
                      title="Drop Column"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Column Interactive Form Panel */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10 shadow-xs">
        <CardContent className="pt-6">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-4">
            <Plus className="h-4 w-4 text-emerald-500" /> Add New Column to {selectedTable}
          </h4>

          <form onSubmit={handleAddColumnToSchema} className="space-y-4">
            {colAddError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/50 rounded-md text-xs text-red-655 dark:text-red-400 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-550 shrink-0 mt-0.5" />
                <span>{colAddError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Column Name</label>
                <Input
                  value={colToAdd.name}
                  onChange={(e) => setColToAdd(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="column_name"
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Data Type</label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-555"
                  value={colToAdd.type}
                  onChange={(e) => setColToAdd(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="TEXT">TEXT</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="REAL">REAL</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Default Value</label>
                <Input
                  value={colToAdd.defaultValue}
                  onChange={(e) => setColToAdd(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="e.g. '', 'Guest', 0, 1"
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div className="flex items-center h-9 justify-between md:justify-start gap-4">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="coladd-notnull"
                    checked={colToAdd.notNull}
                    onChange={(e) => setColToAdd(prev => ({ ...prev, notNull: e.target.checked }))}
                    className="h-4.5 w-4.5 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-950"
                  />
                  <label htmlFor="coladd-notnull" className="text-xs font-semibold text-slate-700 dark:text-slate-350 select-none">NOT NULL</label>
                </div>

                <Button type="submit" disabled={isSubmittingColumn} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 py-1.5 px-4 h-9 shadow-xs text-xs font-semibold">
                  {isSubmittingColumn ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null} Add Column
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
