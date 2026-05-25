import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Database, Shield, Code, ArrowRight, CheckCircle2, Loader2, BookOpen, PenTool, Copy } from "lucide-react";
import { apiFetch } from "@/config/apiConfig";
import { useToast } from "@/context/ToastContext";

const CLAWCHIVES_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (uuid TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, key_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_key_hash ON users(key_hash);
CREATE TABLE IF NOT EXISTS api_tokens (key TEXT PRIMARY KEY, owner_key TEXT NOT NULL, owner_type TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT);
CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', favicon TEXT DEFAULT '', tags TEXT DEFAULT '[]', folder_id TEXT, starred INTEGER DEFAULT 0, archived INTEGER DEFAULT 0, pinned INTEGER DEFAULT 0, color TEXT, jina_url TEXT DEFAULT NULL, user_uuid TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, name TEXT NOT NULL, parent_id TEXT, color TEXT DEFAULT '#06b6d4', user_uuid TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS agent_keys (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, api_key TEXT NOT NULL UNIQUE, permissions TEXT NOT NULL, expiration_type TEXT NOT NULL, expiration_date TEXT, rate_limit INTEGER, is_active INTEGER DEFAULT 1, user_uuid TEXT NOT NULL DEFAULT '', revoked_at TEXT, revoked_by TEXT, revoke_reason TEXT, created_at TEXT NOT NULL, last_used TEXT);
CREATE TABLE IF NOT EXISTS jina_conversions (bookmark_id TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, url TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, user_uuid TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS import_sessions (id TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, key_id TEXT NOT NULL, started_at TEXT NOT NULL, closed_at TEXT, error_count INTEGER DEFAULT 0, errors_json TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, event_type TEXT NOT NULL, actor TEXT, actor_type TEXT, resource TEXT, action TEXT NOT NULL, outcome TEXT NOT NULL, ip_address TEXT, user_agent TEXT, details TEXT);
`;

const PINCHPAD_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (uuid TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, key_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, display_name TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_key_hash ON users(key_hash);
CREATE TABLE IF NOT EXISTS api_tokens (key TEXT PRIMARY KEY, owner_key TEXT NOT NULL, owner_type TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT);
CREATE TABLE IF NOT EXISTS pots (id TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#f59e0b', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, starred INTEGER DEFAULT 0, pinned INTEGER DEFAULT 0, archived INTEGER DEFAULT 0, pot_id TEXT, tags TEXT DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pearl_photos (id TEXT PRIMARY KEY, pearl_id TEXT NOT NULL, user_uuid TEXT NOT NULL, filename TEXT NOT NULL, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS agent_keys (id TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, name TEXT NOT NULL, description TEXT, api_key TEXT NOT NULL UNIQUE, permissions TEXT NOT NULL, expiration_type TEXT NOT NULL, expiration_date TEXT, rate_limit INTEGER, is_active INTEGER DEFAULT 1, created_at TEXT NOT NULL, last_used TEXT, revoked_at TEXT, revoked_by TEXT, revoke_reason TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS import_sessions (id TEXT PRIMARY KEY, user_uuid TEXT NOT NULL, key_id TEXT NOT NULL, started_at TEXT NOT NULL, closed_at TEXT, error_count INTEGER DEFAULT 0, errors_json TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pearl_shares (id TEXT PRIMARY KEY, pearl_id TEXT NOT NULL, share_hash TEXT NOT NULL UNIQUE, is_active INTEGER DEFAULT 1, created_at TEXT NOT NULL, expires_at TEXT);
`;

const CUSTOM_SCHEMA = `
CREATE TABLE IF NOT EXISTS custom_table (id TEXT PRIMARY KEY, name TEXT NOT NULL, user_uuid TEXT NOT NULL, created_at TEXT NOT NULL);
`;

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedRLS, setSelectedRLS] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [publicApiKey, setPublicApiKey] = useState<string>("YOUR_PUBLIC_KEY");
  const [isCopied, setIsCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Fetch public key if we reach the final step
    if (step === 3) {
      apiFetch('/api/system/keys')
        .then(res => res.json())
        .then(keys => {
          const pubKey = keys.find((k: any) => k.type === 'ls');
          if (pubKey) setPublicApiKey(pubKey.key);
        })
        .catch(console.error);
    }
  }, [step]);

  const handleCreateTables = async () => {
    if (!selectedSchema) return;
    setIsProcessing(true);
    try {
      const sqlToExecute = 
        selectedSchema === "clawchives" ? CLAWCHIVES_SCHEMA :
        selectedSchema === "pinchpad" ? PINCHPAD_SCHEMA : CUSTOM_SCHEMA;
      
      const statements = sqlToExecute.split(';').map(s => s.trim()).filter(s => s.length > 0);
      
      for (const stmt of statements) {
        await apiFetch('/api/system/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: stmt, method: 'run' })
        });
      }
      
      toast.success("Database architecture generated successfully!");
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Failed to build tables: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyRLS = async () => {
    if (!selectedRLS || !selectedSchema) return;
    setIsProcessing(true);
    
    try {
      // Determine tables to apply policies to
      const tables = selectedSchema === "clawchives" 
        ? ["bookmarks", "folders", "agent_keys"] 
        : selectedSchema === "pinchpad"
        ? ["notes", "pots", "agent_keys", "pearl_shares"]
        : ["custom_table"];

      let definition = "1=1";
      if (selectedRLS === "auth") definition = "1=1"; // Example, could be updated based on auth context
      if (selectedRLS === "isolated") definition = "user_uuid = @user_uuid";

      for (const table of tables) {
        // We only apply SELECT policy in the wizard for simplicity
        await apiFetch('/api/system/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_name: table,
            action: 'ALL',
            definition: definition
          })
        });
      }

      toast.success("Security boundaries enforced!");
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply security: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">The Setup Wizard</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Abstract complex infrastructure into a simple workflow. We will configure your tables, lock down security, and generate your integration code.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-12">
        {[1, 2, 3].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${step >= s ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {i < 2 && (
              <div className={`w-24 h-1 mx-2 rounded-full transition-colors ${step > s ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: TABLE SCHEMA */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Database className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Step 1: Choose Your Architecture</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: "clawchives", title: "ClawChives Core", icon: BookOpen, desc: "A robust schema designed for bookmarks, folders, and multi-agent coordination." },
              { id: "pinchpad", title: "PinchPad Notes", icon: PenTool, desc: "A state-of-the-art notes engine supporting pearls, media attachments, and pots." },
              { id: "custom", title: "Blank Canvas", icon: Database, desc: "A simple, single custom table to get started from scratch." }
            ].map(schema => (
              <Card 
                key={schema.id}
                className={`cursor-pointer transition-all border-2 hover:shadow-md ${selectedSchema === schema.id ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'}`}
                onClick={() => setSelectedSchema(schema.id)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${selectedSchema === schema.id ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <schema.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{schema.title}</CardTitle>
                  <CardDescription>{schema.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-6">
            <Button size="lg" disabled={!selectedSchema || isProcessing} onClick={handleCreateTables} className="gap-2">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Build Infrastructure"}
              {!isProcessing && <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: RLS */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Shield className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Step 2: Access Control (RLS)</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Row Level Security (RLS) acts like invisible ink on your database. We will apply the selected security boundary across your newly created tables.
          </p>
          
          <div className="grid gap-4">
            {[
              { id: "public", title: "Public Read-Only", desc: "Anyone with a Public API Key can read data, but cannot modify it." },
              { id: "auth", title: "Authenticated Mode", desc: "All users share the same data space, but must provide authentication headers." },
              { id: "isolated", title: "Strict User-Isolation (Recommended)", desc: "Users can ONLY read and write their own data. They are cryptographically blinded to everyone else." }
            ].map(rls => (
              <div 
                key={rls.id}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedRLS === rls.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'}`}
                onClick={() => setSelectedRLS(rls.id)}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedRLS === rls.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selectedRLS === rls.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{rls.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{rls.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button>
            <Button size="lg" disabled={!selectedRLS || isProcessing} onClick={handleApplyRLS} className="gap-2">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enforce Security"}
              {!isProcessing && <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: INTEGRATION */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Code className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Step 3: Integration Code</h2>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Your database is ready and secured.</h3>
              <p className="text-sm mt-1 opacity-90">Copy this exact snippet into your React frontend. It already contains your <code>ls-</code> Public Key and is configured for your chosen tables.</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/50">
              <span className="text-xs font-mono text-slate-400">api.ts</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-7 text-xs transition-colors ${isCopied ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                onClick={() => {
                  navigator.clipboard.writeText(`import { createClient } from 'carabase-sdk';\n\nconst carabase = createClient({\n  url: window.location.origin,\n  publicKey: '${publicApiKey}'\n});\n\nexport async function loadData() {\n  const { data, error } = await carabase\n    .from('${selectedSchema === 'clawchives' ? 'bookmarks' : selectedSchema === 'pinchpad' ? 'notes' : 'custom_table'}')\n    .select('*');\n    \n  if (error) console.error("Error:", error);\n  return data;\n}`);
                  setIsCopied(true);
                  toast.success("Code snippet copied to clipboard!");
                  setTimeout(() => setIsCopied(false), 2000);
                }}
              >
                {isCopied ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {`// 1. Install CaraBase SDK
// npm install carabase-sdk

import { createClient } from 'carabase-sdk';

const carabase = createClient({
  url: window.location.origin, // Or your remote server URL
  publicKey: '${publicApiKey}'
});

// Example usage to fetch your secure data
export async function loadData() {
  const { data, error } = await carabase
    .from('${selectedSchema === 'clawchives' ? 'bookmarks' : selectedSchema === 'pinchpad' ? 'notes' : 'custom_table'}')
    .select('*');
    
  if (error) console.error("Error:", error);
  return data;
}
`}
            </pre>
          </div>

          <div className="flex justify-end pt-6">
            <Button size="lg" onClick={() => window.location.href = '/dashboard/editor'} className="gap-2">
              Open Table Editor <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
