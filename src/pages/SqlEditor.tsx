import React, { useState } from 'react';
import { Play, Database, AlertCircle, CheckCircle2, Code } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function SqlEditor() {
  const { getAuthHeaders } = useAuth();
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResults(null);
    setExecutionTime(null);
    
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/system/query', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          query: query,
          method: query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('PRAGMA') ? 'all' : 'run' 
        })
      });
      
      const data = await response.json();
      const endTime = performance.now();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }
      
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        // Handle "run" response which returns { changes, lastInsertRowid }
        setResults([data]);
      }
      
      setExecutionTime(endTime - startTime);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-purple-500" />
            SQL Editor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Execute raw SQL queries directly against the CaraBase database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={executeQuery}
            disabled={isLoading || !query.trim()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Play className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
            {isLoading ? 'Running...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden shrink-0">
        <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>Query Editor</span>
          <span>Cmd/Ctrl + Enter to run</span>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-48 lg:h-64 p-4 bg-transparent text-sm font-mono text-slate-800 dark:text-slate-200 resize-y outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
          placeholder="Type your SQL query here..."
          spellCheck={false}
        />
      </div>

      {/* Results Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Results
          </h2>
          {executionTime !== null && !error && (
            <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              Executed in {executionTime.toFixed(2)}ms
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-0 relative">
          {error && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Query Error</h3>
              <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-4 py-3 rounded-xl font-mono text-sm max-w-2xl border border-red-200 dark:border-red-900/50">
                {error}
              </p>
            </div>
          )}

          {!error && !results && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
              <Code className="w-12 h-12 mb-4 opacity-20" />
              <p>Run a query to see results here.</p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!error && results && results.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
              <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500 opacity-50" />
              <p>Query executed successfully. No rows returned.</p>
            </div>
          )}

          {!error && results && results.length > 0 && (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-16 text-center border-r border-slate-200 dark:border-slate-700/50">
                    #
                  </th>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700/50 last:border-0">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {results.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-2 font-mono text-xs text-slate-400 dark:text-slate-500 text-center border-r border-slate-200 dark:border-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                      {i + 1}
                    </td>
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 last:border-0 max-w-xs truncate" title={val !== null ? String(val) : 'NULL'}>
                        {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
