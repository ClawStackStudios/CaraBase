import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Plus, Trash2, KeyRound, ShieldAlert, Loader2, Key, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/context/ToastContext";
import { LobsterKeysTab } from "@/components/lobster-keys/LobsterKeysTab";

export default function ApiKeys() {
  const [activeTab, setActiveTab] = useState<'system' | 'lobster'>('system');
  
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState("public");
  const [newlyGenerated, setNewlyGenerated] = useState<{name:string, key:string, type:string} | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (activeTab === 'system') {
      fetchKeys();
    }
  }, [activeTab]);

  async function fetchKeys() {
    try {
      const res = await apiFetch('/api/system/keys');
      setKeys(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function generateKey() {
    if (!newKeyName.trim()) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/system/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, type: newKeyType })
      });
      const keyData = await res.json();
      setNewlyGenerated(keyData);
      setNewKeyName("");
      toast.success('Key generated successfully');
      fetchKeys();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate key: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  function revokeKey(id: string) {
    setKeyToRevoke(id);
  }

  async function confirmRevoke() {
    if (!keyToRevoke) return;
    try {
      await apiFetch(`/api/system/keys/${keyToRevoke}`, { method: 'DELETE' });
      toast.success('Key revoked successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to revoke key: ' + (err as Error).message);
    } finally {
      setKeyToRevoke(null);
      fetchKeys();
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">API Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your API keys and Agent Access.
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'system'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          System Keys
        </button>
        <button
          onClick={() => setActiveTab('lobster')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'lobster'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>LobsterKeys</span>
        </button>
      </div>

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {newlyGenerated && (
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <KeyRound className="h-5 w-5" /> Key Generated Successfully
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Important: Copy this key immediately. You will not be able to see the full key again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md border border-emerald-200 dark:border-emerald-900 p-2 overflow-hidden shadow-sm">
                   <code className="text-sm font-mono flex-1 px-2 text-slate-800 dark:text-slate-200 truncate">{newlyGenerated.key}</code>
                   <Button onClick={() => copyToClipboard(newlyGenerated.key)} variant="outline" size="sm" className={`shrink-0 border transition-colors ${isCopied ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-50 dark:bg-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-800 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'}`}>
                     {isCopied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />} 
                     {isCopied ? "Copied!" : "Copy"}
                   </Button>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={() => setNewlyGenerated(null)} variant="ghost" className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900">
                        I have copied my key
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Generate New Secret</CardTitle>
              <CardDescription>Create a new API key to access your database.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 max-w-2xl">
                <div className="flex-1 space-y-1">
                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Key Name</label>
                   <Input placeholder="e.g. Production Web App" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                </div>
                <div className="w-48 space-y-1">
                   <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</label>
                   <select 
                      className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3 py-1 text-sm shadow-sm"
                      value={newKeyType}
                      onChange={(e) => setNewKeyType(e.target.value)}
                    >
                      <option value="public">Public (anon)</option>
                      <option value="private">Private (service_role)</option>
                   </select>
                </div>
                <Button onClick={generateKey} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2"/>} 
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
             <CardHeader>
                 <CardTitle>Active API Keys</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Key Prefix</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                       {keys.map(key => (
                         <tr key={key.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{key.name}</td>
                            <td className="px-6 py-4">
                               <code className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 px-2 py-1 rounded font-mono text-xs">{key.partial_key}</code>
                            </td>
                            <td className="px-6 py-4">
                               {key.type === 'private' 
                                 ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"><ShieldAlert className="w-3 h-3"/> service_role</span> 
                                 : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">anon</span>
                               }
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                               {new Date(key.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <Button variant="ghost" size="sm" onClick={() => revokeKey(key.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                                   Revoke
                               </Button>
                            </td>
                         </tr>
                       ))}
                       {keys.length === 0 && (
                           <tr>
                               <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    No API keys generated yet.
                               </td>
                           </tr>
                       )}
                    </tbody>
                 </table>
             </CardContent>
          </Card>
          
          <ConfirmDialog
            isOpen={!!keyToRevoke}
            title="Revoke API Key"
            description="Are you sure you want to revoke this key? Any applications relying on it will instantly lose access. This action cannot be undone."
            confirmText="Revoke Key"
            onConfirm={confirmRevoke}
            onCancel={() => setKeyToRevoke(null)}
          />
        </div>
      )}

      {activeTab === 'lobster' && (
        <div className="animate-in fade-in duration-300">
          <LobsterKeysTab />
        </div>
      )}
    </div>
  );
}
