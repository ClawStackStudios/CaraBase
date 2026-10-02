import React from "react";
import { Link, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface TableFkModalProps {
  foreignKeys: any[];
  columns: any[];
  tables: any[];
  selectedTable: string;
  fkForm: { localCol: string; foreignTable: string; foreignCol: string; onDelete: string; onUpdate: string; };
  setFkForm: React.Dispatch<React.SetStateAction<{ localCol: string; foreignTable: string; foreignCol: string; onDelete: string; onUpdate: string; }>>;
  handleAddFK: (e: React.FormEvent) => void;
  isSubmittingFK: boolean;
}

export function TableFkModal({
  foreignKeys,
  columns,
  tables,
  selectedTable,
  fkForm,
  setFkForm,
  handleAddFK,
  isSubmittingFK
}: TableFkModalProps) {
  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40 mt-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
           <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
             <Link className="h-4 w-4 text-emerald-500" /> Foreign Keys
           </h4>
        </div>

        <div className="mb-6 overflow-hidden rounded-md border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2 font-medium">Local Column</th>
                <th className="px-4 py-2 font-medium">References</th>
                <th className="px-4 py-2 font-medium text-center">On Delete</th>
                <th className="px-4 py-2 font-medium text-center">On Update</th>
              </tr>
            </thead>
            <tbody>
              {foreignKeys.map((fk, idx) => (
                <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{fk.from}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{fk.table}.{fk.to}</span>
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-slate-500 uppercase font-semibold">{fk.on_delete}</td>
                  <td className="px-4 py-2 text-center text-xs text-slate-500 uppercase font-semibold">{fk.on_update}</td>
                </tr>
              ))}
              {foreignKeys.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400 text-xs italic">No foreign keys defined</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddFK} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
           <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              Add Foreign Key Constraint
              <span className="text-amber-500 dark:text-amber-400 font-normal italic flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Notice: Safe Table Recreation Required</span>
           </h5>
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Local Column</label>
                 <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-555" value={fkForm.localCol} onChange={e => setFkForm(prev => ({...prev, localCol: e.target.value}))}>
                   <option value="">Select Column...</option>
                   {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Ref Table</label>
                 <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-555" value={fkForm.foreignTable} onChange={e => setFkForm(prev => ({...prev, foreignTable: e.target.value}))}>
                   <option value="">Select Table...</option>
                   {tables.filter(t => t.name !== selectedTable).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">Ref Column</label>
                 <Input value={fkForm.foreignCol} onChange={e => setFkForm(prev => ({...prev, foreignCol: e.target.value}))} placeholder="e.g. id" className="focus-visible:ring-emerald-500 h-9" />
              </div>
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">On Delete</label>
                 <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-500" value={fkForm.onDelete} onChange={e => setFkForm(prev => ({...prev, onDelete: e.target.value}))}>
                   <option value="RESTRICT">RESTRICT</option>
                   <option value="CASCADE">CASCADE</option>
                   <option value="SET NULL">SET NULL</option>
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold mb-1 block text-slate-600 dark:text-slate-350">On Update</label>
                 <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm focus:ring-emerald-500 focus:border-emerald-555" value={fkForm.onUpdate} onChange={e => setFkForm(prev => ({...prev, onUpdate: e.target.value}))}>
                   <option value="RESTRICT">RESTRICT</option>
                   <option value="CASCADE">CASCADE</option>
                   <option value="SET NULL">SET NULL</option>
                   <option value="SET DEFAULT">SET DEFAULT</option>
                   <option value="NO ACTION">NO ACTION</option>
                 </select>
              </div>
              <div className="col-span-1 md:col-span-5 flex justify-end mt-2">
                <Button type="submit" disabled={isSubmittingFK} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0 py-1.5 px-4 h-9 shadow-xs text-xs font-semibold w-full">
                  {isSubmittingFK ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null} Add Foreign Key
                </Button>
              </div>
           </div>
        </form>
      </CardContent>
    </Card>
  );
}
