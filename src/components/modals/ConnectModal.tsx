import React, { useState, useEffect } from "react";
import { Box, Database, CheckCircle2, Copy, X, Terminal, Code2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Link } from "react-router-dom";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Zero-dependency REST client snippet for the Framework path.
// Uses the public API key via the `apikey` header — no SDK install required.
const carabaseClientSnippet = (baseUrl: string) => `// carabase/client.js — zero-dependency CaraBase client
const CARABASE_URL = '${baseUrl}';
const CARABASE_KEY = '[YOUR_LOBSTER_KEY]';

export async function carabaseFetch(table, options = {}) {
  const res = await fetch(\`\${CARABASE_URL}/rest/v1/\${table}\`, {
    ...options,
    headers: { 'Content-Type': 'application/json', apikey: CARABASE_KEY, ...options.headers },
  });
  if (!res.ok) throw new Error(\`CaraBase \${res.status}: \${await res.text()}\`);
  return res.json();
}

// Read rows
const rows = await carabaseFetch('users');`;

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const [activeMethod, setActiveMethod] = useState<'framework' | 'direct'>('framework');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [authType, setAuthType] = useState<'human' | 'lobster'>('lobster');
  const toast = useToast();

  const baseUrl = window.location.origin;
  const clientSnippet = carabaseClientSnippet(baseUrl);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCurlSnippet = () => {
    const keyPlaceholder = authType === 'human' ? '[YOUR_HUMAN_KEY]' : '[YOUR_LOBSTER_KEY]';
    return `curl -X GET '${baseUrl}/rest/v1/users?limit=5' \\
  -H "Authorization: Bearer ${keyPlaceholder}" \\
  -H "Content-Type: application/json"`;
  };

  const getFetchSnippet = () => {
    const keyPlaceholder = authType === 'human' ? '[YOUR_HUMAN_KEY]' : '[YOUR_LOBSTER_KEY]';
    return `const response = await fetch('${baseUrl}/rest/v1/users?limit=5', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${keyPlaceholder}',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            Connect to CaraBase
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full max-h-[80vh] overflow-y-auto">
          
          {/* Main Content Area */}
          <div className="flex-1 p-6 space-y-8">
            
            {/* Connection Method Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveMethod('framework')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${activeMethod === 'framework' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Box className={`w-8 h-8 ${activeMethod === 'framework' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Framework</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">JavaScript / TypeScript app</p>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveMethod('direct')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${activeMethod === 'direct' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Terminal className={`w-8 h-8 ${activeMethod === 'direct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Direct API</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Raw HTTP or cURL</p>
                </div>
              </button>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
              
              {/* FRAMEWORK CONTENT */}
              {activeMethod === 'framework' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div className="w-full">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Point your app at CaraBase</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Add these environment variables to your project.</p>
                      <div className="relative group bg-slate-900 rounded-xl border border-slate-800">
                        <pre className="p-4 pr-16 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{`VITE_CARABASE_URL=${baseUrl}
VITE_CARABASE_PUBLIC_KEY=[YOUR_LOBSTER_KEY]`}</pre>
                        <button 
                          onClick={() => copyToClipboard('install', `VITE_CARABASE_URL=${baseUrl}\nVITE_CARABASE_PUBLIC_KEY=[YOUR_LOBSTER_KEY]`)}
                          className="absolute right-2 top-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          {copiedId === 'install' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div className="w-full">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Query your data</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">A tiny zero-dependency client helper — works immediately, no SDK install required.</p>
                      
                      <div className="relative group bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                        <pre className="p-4 pr-16 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap min-h-[160px]">{clientSnippet}</pre>
                        <button 
                          className="absolute right-2 top-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          onClick={() => copyToClipboard('file', clientSnippet)}
                        >
                          {copiedId === 'file' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>Need a key?</span>
                        <Link to="/dashboard/keys" onClick={onClose} className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                          Generate one in API Keys &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DIRECT API CONTENT */}
              {activeMethod === 'direct' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex gap-4">
                    <Code2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">REST API Access</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Interact directly with the CaraBase REST endpoints. Choose your key type below to see the formatted requests.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">1. Select Auth Type</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setAuthType('lobster')}
                        className={`p-3 rounded-lg border text-left transition-colors \${authType === 'lobster' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                      >
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Lobster Key (Recommended)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scoped access bound by RLS policies.</p>
                      </button>
                      <button 
                        onClick={() => setAuthType('human')}
                        className={`p-3 rounded-lg border text-left transition-colors \${authType === 'human' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                      >
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">Human Key (Admin)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Full unrestricted system access.</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">2. Execute Queries</h4>
                      <Link to="/dashboard/keys" onClick={onClose} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                        Get your API Key &rarr;
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {/* cURL Block */}
                      <div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">cURL Example</div>
                        <div className="relative group bg-slate-900 rounded-xl border border-slate-800">
                          <pre className="p-4 pr-16 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{getCurlSnippet()}</pre>
                          <button 
                            onClick={() => copyToClipboard('curl', getCurlSnippet())}
                            className="absolute right-2 top-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            {copiedId === 'curl' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Fetch Block */}
                      <div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">JavaScript (Fetch)</div>
                        <div className="relative group bg-slate-900 rounded-xl border border-slate-800">
                          <pre className="p-4 pr-16 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{getFetchSnippet()}</pre>
                          <button 
                            onClick={() => copyToClipboard('fetch', getFetchSnippet())}
                            className="absolute right-2 top-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            {copiedId === 'fetch' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}