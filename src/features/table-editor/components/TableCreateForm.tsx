import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash, Table2 } from "lucide-react";

interface TableCreateFormProps {
  isCreating: boolean;
  setIsCreating: (creating: boolean) => void;
  newTableName: string;
  setNewTableName: (name: string) => void;
  newColumns: any[];
  setNewColumns: (cols: any[]) => void;
  addColumnDef: () => void;
  handleCreateTable: () => void;
  isSubmittingTable: boolean;
}

export function TableCreateForm({
  isCreating,
  setIsCreating,
  newTableName,
  setNewTableName,
  newColumns,
  setNewColumns,
  addColumnDef,
  handleCreateTable,
  isSubmittingTable
}: TableCreateFormProps) {
  if (!isCreating) return null;

  return (
    <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-sm border bg-emerald-50/5 dark:bg-emerald-950/5">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Table2 className="h-5 w-5 text-emerald-500" /> Create New Table
        </h3>
        <div className="space-y-4">
          <div className="max-w-md">
            <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-300">Table Name</label>
            <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g., users, posts, products" className="focus-visible:ring-emerald-500 focus-visible:border-emerald-500" />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold block text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-1.5">Column Schema & Constraints</label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {newColumns.map((col, idx) => (
                <div key={idx} className="flex flex-wrap gap-2.5 items-center p-3 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex-1 min-w-[150px]">
                    <Input
                      placeholder="Column name"
                      value={col.name}
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].name = e.target.value;
                        setNewColumns(newC);
                      }}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <select
                      className="flex h-9 w-32 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      value={col.type}
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].type = e.target.value;
                        setNewColumns(newC);
                      }}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="INTEGER">INTEGER</option>
                      <option value="REAL">REAL</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                      <option value="JSON">JSON</option>
                    </select>
                  </div>

                  {/* Primary Key constraint */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`newpk-${idx}`}
                      checked={col.primaryKey}
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].primaryKey = e.target.checked;
                        if (e.target.checked) {
                          newC[idx].nullable = false; // Primary key is always NOT NULL
                        }
                        setNewColumns(newC);
                      }}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-555"
                    />
                    <label htmlFor={`newpk-${idx}`} className="text-xs text-slate-600 dark:text-slate-400 font-medium">PK</label>
                  </div>

                  {/* Unique constraint */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`newuniq-${idx}`}
                      checked={col.unique}
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].unique = e.target.checked;
                        setNewColumns(newC);
                      }}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-555"
                    />
                    <label htmlFor={`newuniq-${idx}`} className="text-xs text-slate-600 dark:text-slate-400 font-medium">Unique</label>
                  </div>

                  {/* Not Null / Nullable constraint */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`newnotnull-${idx}`}
                      checked={!col.nullable}
                      disabled={col.primaryKey} // always NOT NULL if PK
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].nullable = !e.target.checked;
                        setNewColumns(newC);
                      }}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-555"
                    />
                    <label htmlFor={`newnotnull-${idx}`} className="text-xs text-slate-600 dark:text-slate-400 font-medium">Not Null</label>
                  </div>

                  {/* Default Value constraint */}
                  <div className="w-36">
                    <Input
                      placeholder="Default value"
                      value={col.defaultValue}
                      onChange={(e) => {
                        const newC = [...newColumns];
                        newC[idx].defaultValue = e.target.value;
                        setNewColumns(newC);
                      }}
                      className="h-8 text-xs focus-visible:ring-emerald-500"
                    />
                  </div>

                  {idx > 0 && (
                     <Button variant="ghost" size="sm" onClick={() => setNewColumns(newColumns.filter((_, i) => i !== idx))} className="hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 h-8">
                       <Trash className="h-4 w-4 text-slate-500 hover:text-red-550" />
                     </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addColumnDef} className="mt-1 text-xs border-dashed border-emerald-500 hover:bg-emerald-50/10 text-emerald-650 dark:text-emerald-450 dark:border-emerald-900">
              <Plus className="h-3 w-3 mr-1" /> Add Column
            </Button>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
            <Button onClick={handleCreateTable} disabled={isSubmittingTable} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white">
              {isSubmittingTable ? "Creating..." : "Create Table"}
            </Button>
            <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
