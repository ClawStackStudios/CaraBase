import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Plus, Trash2, Database, Info, Loader2 } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/context/ToastContext";

export default function Policies() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  
  const [newTargetTable, setNewTargetTable] = useState("");
  const [newAction, setNewAction] = useState("SELECT");
  const [newDefinition, setNewDefinition] = useState("1=1");
  const [policyToRemove, setPolicyToRemove] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPolicies();
    fetchTables();
  }, []);

  async function fetchPolicies() {
    try {
      const res = await apiFetch('/api/system/policies');
      setPolicies(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTables() {
    try {
      const res = await apiFetch('/api/system/tables');
      const data = await res.json();
      setTables(data);
      if (data.length > 0) setNewTargetTable(data[0].name);
    } catch (err) {
      console.error(err);
    }
  }

  async function addPolicy() {
    if (!newTargetTable || !newDefinition) return;
    setIsAdding(true);
    try {
      await apiFetch('/api/system/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: newTargetTable,
          action: newAction,
          definition: newDefinition
        })
      });
      setNewDefinition("1=1");
      toast.success('Policy added successfully');
      fetchPolicies();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add policy: ' + (err as Error).message);
    } finally {
      setIsAdding(false);
    }
  }

  function removePolicy(id: string) {
    setPolicyToRemove(id);
  }

  async function confirmRemove() {
    if (!policyToRemove) return;
    try {
      await apiFetch(`/api/system/policies/${policyToRemove}`, { method: 'DELETE' });
      toast.success('Policy removed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove policy: ' + (err as Error).message);
    } finally {
      setPolicyToRemove(null);
      fetchPolicies();
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Row Level Security Policies</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Restrict rows returned by the API when using Public API Keys. Equivalent to PostgreSQL RLS, powered by dynamic SQLite WHERE clauses.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex gap-3 text-sm text-blue-900 dark:text-blue-200">
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
          <p>
              By default, tables have <strong>NO</strong> access allowed via Public API Keys unless a policy permits it. 
              Write conditions using standard SQLite syntax (e.g. <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 rounded text-blue-950 dark:text-blue-200">is_public = 1</code>).
          </p>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Create New Policy</CardTitle>
          <CardDescription>Grant access to specific tables based on a SQL condition.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="w-full md:w-48 space-y-1">
                 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Target Table</label>
                 <select 
                   className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm"
                   value={newTargetTable}
                   onChange={(e) => setNewTargetTable(e.target.value)}
                 >
                   {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                   {tables.length === 0 && <option disabled value="">No tables yet</option>}
                 </select>
             </div>
             <div className="w-full md:w-32 space-y-1">
                 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Action</label>
                 <select 
                   className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm"
                   value={newAction}
                   onChange={(e) => setNewAction(e.target.value)}
                 >
                   <option value="ALL">ALL</option>
                   <option value="SELECT">SELECT</option>
                   <option value="INSERT">INSERT</option>
                   <option value="UPDATE">UPDATE</option>
                   <option value="DELETE">DELETE</option>
                 </select>
             </div>
             <div className="flex-1 space-y-1">
                 <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Definition (WHERE clause)</label>
                 <Input 
                   placeholder="e.g. 1=1 OR author_id = 'xxx'" 
                   value={newDefinition} 
                   onChange={(e) => setNewDefinition(e.target.value)} 
                   className="font-mono"
                 />
             </div>
             <Button onClick={addPolicy} disabled={tables.length === 0 || isAdding}>
               {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2"/>} Add Policy
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">Active Policies</h3>
          {policies.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                  <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p>No security policies defined.</p>
                  <p className="text-sm">Public API Keys currently have 0 access to the database.</p>
              </div>
          ) : (
              <div className="grid gap-4">
                  {policies.map(policy => (
                      <div key={policy.id} className="bg-white dark:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <Shield className="w-5 h-5"/>
                              </div>
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">{policy.table_name}</span>
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs font-medium">{policy.action}</span>
                                  </div>
                                  <code className="text-slate-500 dark:text-slate-400 text-xs font-mono">{policy.definition}</code>
                              </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removePolicy(policy.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                              <Trash2 className="w-4 h-4" />
                          </Button>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <ConfirmDialog
        isOpen={!!policyToRemove}
        title="Delete Policy"
        description="Are you sure you want to delete this RLS policy? This will instantly change data access for Public API keys."
        confirmText="Delete Policy"
        onConfirm={confirmRemove}
        onCancel={() => setPolicyToRemove(null)}
      />
    </div>
  );
}
