import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableRowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drawerMode: "insert" | "edit";
  selectedTable: string;
  columns: any[];
  formData: Record<string, any>;
  jsonErrors: Record<string, string>;
  drawerError: string | null;
  drawerSubmitting: boolean;
  submitDrawerForm: (e: React.FormEvent) => void;
  handleInputChange: (colName: string, val: any, type: string) => void;
}

export function TableRowDrawer({
  isOpen,
  onClose,
  drawerMode,
  selectedTable,
  columns,
  formData,
  jsonErrors,
  drawerError,
  drawerSubmitting,
  submitDrawerForm,
  handleInputChange
}: TableRowDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-45 flex justify-end bg-black/40 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {drawerMode === "insert" ? "Insert New Row" : "Edit Existing Row"}
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Table: {selectedTable}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={submitDrawerForm} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {drawerError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/50 rounded-md text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-550 shrink-0 mt-0.5" />
                <span>{drawerError}</span>
              </div>
            )}

            {columns.map(col => {
              const isPk = col.pk === 1 || col.pk === true;
              const isAutoIncrementPk = isPk && col.type === "INTEGER" && drawerMode === "insert";
              const value = formData[col.name] ?? "";
              const isDisabled = isPk && drawerMode === "edit";

              return (
                <div key={col.name} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {col.name}
                      {col.notnull === 1 && <span className="text-red-550">*</span>}
                    </label>
                    <span className="text-[10px] text-slate-455 font-normal uppercase select-none">
                      {col.type} {isPk && "(PK)"}
                    </span>
                  </div>

                  {col.type === "BOOLEAN" ? (
                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id={`form-${col.name}`}
                        checked={value === true || value === 1 || value === "true"}
                        disabled={isDisabled}
                        onChange={(e) => handleInputChange(col.name, e.target.checked, col.type)}
                        className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-emerald-650 focus:ring-emerald-500 accent-emerald-600 bg-white dark:bg-slate-950"
                      />
                      <label htmlFor={`form-${col.name}`} className="text-xs text-slate-650 dark:text-slate-400">
                        {(value === true || value === 1 || value === "true") ? "Active / True" : "Inactive / False"}
                      </label>
                    </div>
                  ) : col.type === "JSON" ? (
                    <div className="space-y-1">
                      <textarea
                        value={value}
                        disabled={isDisabled}
                        onChange={(e) => handleInputChange(col.name, e.target.value, col.type)}
                        placeholder='{"key": "value"}'
                        rows={5}
                        className={`w-full rounded-md border text-xs font-mono p-3 bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${jsonErrors[col.name] ? 'border-red-400 focus:ring-red-550 focus:border-red-550' : 'border-slate-200 dark:border-slate-800'}`}
                      />
                      {jsonErrors[col.name] && (
                        <span className="text-[10px] text-red-555 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {jsonErrors[col.name]}
                        </span>
                      )}
                    </div>
                  ) : col.type === "TEXT" && !isPk ? (
                    <textarea
                      value={value}
                      disabled={isDisabled}
                      onChange={(e) => handleInputChange(col.name, e.target.value, col.type)}
                      placeholder={col.notnull ? "Required text" : "Optional text"}
                      rows={3}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 text-sm p-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : (
                    <Input
                      type={col.type === "INTEGER" || col.type === "REAL" ? "number" : "text"}
                      step={col.type === "REAL" ? "any" : "1"}
                      value={value}
                      disabled={isDisabled}
                      onChange={(e) => handleInputChange(col.name, e.target.value, col.type)}
                      placeholder={
                        isAutoIncrementPk
                          ? "Auto-generated ID (Integer)"
                          : col.notnull
                            ? "Required value"
                            : "Optional value (Null)"
                      }
                      className="w-full focus-visible:ring-emerald-500"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2">
            <Button
              type="submit"
              disabled={drawerSubmitting || Object.values(jsonErrors).some(err => err !== "")}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 py-2 shadow-sm font-semibold transition-all"
            >
              {drawerSubmitting ? "Saving..." : drawerMode === "insert" ? "Insert Record" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-5 border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
