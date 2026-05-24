import React, { useState, useEffect } from "react";
import { apiFetch } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Trash, Loader2, Play, Plus } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function Triggers() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropping, setIsDropping] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchTriggers();
  }, []);

  async function fetchTriggers() {
    try {
      const res = await apiFetch("/api/system/triggers");
      if (!res.ok) throw new Error(await res.text());
      setTriggers(await res.json());
    } catch (err: any) {
      toast.error("Failed to fetch triggers: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTrigger() {
    if (!query.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/system/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Trigger created successfully");
      setQuery("");
      fetchTriggers();
    } catch (err: any) {
      toast.error("Failed to create trigger: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDropTrigger(name: string) {
    if (!confirm(`Are you sure you want to drop trigger ${name}?`)) return;
    setIsDropping(name);
    try {
      const res = await apiFetch(`/api/system/triggers/${name}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Trigger ${name} dropped`);
      fetchTriggers();
    } catch (err: any) {
      toast.error("Failed to drop trigger: " + err.message);
    } finally {
      setIsDropping(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-fuchsia-500" />
            Database Triggers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create reactive database behavior using SQLite triggers.
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Plus className="w-4 h-4 text-fuchsia-500" />
            Create New Trigger
          </h3>
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative mb-4">
            <div className="absolute top-0 right-0 px-3 py-1 bg-slate-900 text-slate-400 text-xs font-mono border-b border-l border-slate-800 rounded-bl">
              SQL
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="CREATE TRIGGER after_insert_user AFTER INSERT ON users BEGIN ... END;"
              className="w-full h-40 bg-transparent text-emerald-400 font-mono text-sm p-4 outline-none resize-none placeholder:text-slate-700"
              spellCheck={false}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCreateTrigger}
              disabled={isSubmitting || !query.trim()}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-xs font-semibold border-0"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Execute Query
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-200">Existing Triggers</h3>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
            </div>
          ) : triggers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Zap className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No user-defined triggers found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {triggers.map((t) => (
                <div key={t.name} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-mono">{t.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDropTrigger(t.name)}
                      disabled={isDropping === t.name}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 px-2"
                    >
                      {isDropping === t.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="p-4 bg-slate-900">
                    <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap">{t.sql}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
