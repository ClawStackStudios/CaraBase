import React, { useState, useEffect } from "react";
import { apiFetch } from "@/config/apiConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface IndexInfo {
  name: string;
  tableName: string;
  sql: string;
}

export default function Indexes() {
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchIndexes();
  }, []);

  async function fetchIndexes() {
    try {
      const res = await apiFetch("/api/system/indexes");
      if (!res.ok) throw new Error(await res.text());
      setIndexes(await res.json());
    } catch (err: any) {
      toast.error("Failed to fetch indexes: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-500" />
            Database Indexes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View all explicit B-Tree indexes currently speeding up your queries.
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-200">Active Indexes</h3>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : indexes.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No user-defined indexes found.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">You can create indexes in the SQL Editor using <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">CREATE INDEX</code></p>
            </div>
          ) : (
            <div className="space-y-4">
              {indexes.map((idx) => (
                <div key={idx.name} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-mono">{idx.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        Table: {idx.tableName}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900">
                    <pre className="text-xs text-orange-300 font-mono whitespace-pre-wrap">{idx.sql}</pre>
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
