import React from "react";
import { Hash, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface TableIndexesModalProps {
  indexes: any[];
  columns: any[];
  triggerDropIndex: (idxName: string) => void;
  indexForm: { name: string; column: string; unique: boolean; };
  setIndexForm: React.Dispatch<React.SetStateAction<{ name: string; column: string; unique: boolean; }>>;
  handleAddIndex: (e: React.FormEvent) => void;
  isSubmittingIndex: boolean;
}

export function TableIndexesModal({
  indexes,
  columns,
  triggerDropIndex,
  indexForm,
  setIndexForm,
  handleAddIndex,
  isSubmittingIndex
}: TableIndexesModalProps) {
  // It says Modal but actually renders as a Card in the UI per existing styling.
  // We'll keep the Card style to retain full UI parity.
  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40 mt-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
           <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
             <Hash className="h-4 w-4 text-emerald-500" /> Indexes
           </h4>
        </div>

        <div className="mb-6 overflow-hidden rounded-md border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2 font-medium">Index Name</th>
                <th className="px-4 py-2 font-medium">Columns</th>
                <th className="px-4 py-2 font-medium text-center">Unique</th>
                <th className="px-4 py-2 font-medium text-right w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {indexes.map(idx => (
                <tr key={idx.name} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{idx.name}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    {idx.columns ? idx.columns.map((c: any) => c.name).join(', ') : 'unknown'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {idx.unique === 1 ? (
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 px-1.5 py-0.5 rounded font-semibold uppercase">Unique</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 uppercase">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {idx.origin !== 'pk' && (
                      <Button variant="ghost" size="sm" onClick={() => triggerDropIndex(idx.name)} className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {indexes.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400 text-xs italic">No user-defined indexes</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddIndex} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
           <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Create New Index</h5>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Index Name</label>
                 <Input value={indexForm.name} onChange={e => setIndexForm(prev => ({...prev, name: e.target.value}))} placeholder="idx_name" className="focus-visible:ring-emerald-500 h-9" />
              </div>
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Column</label>
                 <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-555" value={indexForm.column} onChange={e => setIndexForm(prev => ({...prev, column: e.target.value}))}>
                   <option value="">Select Column...</option>
                   {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                 </select>
              </div>
              <div className="flex items-center h-9 justify-between md:justify-start gap-4 col-span-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <input type="checkbox" id="idx-unique" checked={indexForm.unique} onChange={e => setIndexForm(prev => ({...prev, unique: e.target.checked}))} className="h-4.5 w-4.5 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700" />
                  <label htmlFor="idx-unique" className="text-xs font-semibold text-slate-700 dark:text-slate-350 select-none">UNIQUE</label>
                </div>
                <Button type="submit" disabled={isSubmittingIndex} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 py-1.5 px-4 h-9 shadow-xs text-xs font-semibold whitespace-nowrap">
                  {isSubmittingIndex ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null} Create Index
                </Button>
              </div>
           </div>
        </form>
      </CardContent>
    </Card>
  );
}
