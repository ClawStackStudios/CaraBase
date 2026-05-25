import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Key, Shield, Table2, Search, Terminal, ChevronDown, ChevronUp, Activity, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/config/apiConfig";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tables: 0,
    keys: 0,
    policies: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  
  // Pagination for logs
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 5;

  useEffect(() => {
    async function loadData() {
      try {
        const [tables, keys, policies, logsRes] = await Promise.all([
          apiFetch('/api/system/tables').then(res => res.json()),
          apiFetch('/api/system/keys').then(res => res.json()),
          apiFetch('/api/system/policies').then(res => res.json()),
          apiFetch('/api/system/audit-logs').then(res => res.ok ? res.json() : []),
        ]);
        setStats({
          tables: Array.isArray(tables) ? tables.length : 0,
          keys: Array.isArray(keys) ? keys.length : 0,
          policies: Array.isArray(policies) ? policies.length : 0,
        });
        setLogs(Array.isArray(logsRes) ? logsRes : []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    loadData();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setLogPage(1);
  }, [search]);

  const features = [
    { name: "Database Tables", stat: stats.tables, href: "/dashboard/editor", icon: Table2, desc: "Your custom SQL tables. The foundation of your data." },
    { name: "API Keys", stat: stats.keys, href: "/dashboard/keys", icon: Key, desc: "Active Lobster Keys granting secure access to your REST API." },
    { name: "RLS Policies", stat: stats.policies, href: "/dashboard/policies", icon: Shield, desc: "Security rules acting as bouncers to protect your rows." },
  ];

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      (log.event_type || '').toLowerCase().includes(term) ||
      (log.actor || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.outcome || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  const getEventBadgeClass = (eventType: string) => {
    if (eventType.startsWith('AUTH_')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
    if (eventType.startsWith('AGENT_')) return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20';
    if (eventType.startsWith('SYSTEM_')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Project Overview</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome to CaraBase. Your self-hosted SQLite backend is running perfectly.
        </p>
      </div>

      {/* Guided Wizard for Non-Technical Users */}
      <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-blue-100 dark:border-blue-900/50">
          <h2 className="text-lg font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Getting Started Guide
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300/70 mt-1">
            Follow these three simple steps to build and secure your first application backend.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-blue-100 dark:divide-blue-900/50">
          <div className="p-6 flex flex-col h-full">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center mb-4 text-sm">1</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Build the Foundation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 flex-1">
              Create your first database table. Tables are where your actual data lives (like a spreadsheet).
            </p>
            <Link to="/dashboard/editor" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all w-fit">
              Create a Table <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-6 flex flex-col h-full">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center mb-4 text-sm">2</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Lock it Down</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 flex-1">
              Set up Row Level Security (RLS). This acts as a bouncer, ensuring users can only see the data they are allowed to see.
            </p>
            <Link to="/dashboard/policies" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all w-fit">
              Secure your Data <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-6 flex flex-col h-full">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center mb-4 text-sm">3</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Connect your App</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 flex-1">
              Generate a Lobster Key (API Key). You will use this key in your frontend app to talk to CaraBase securely.
            </p>
            <Link to="/dashboard/keys" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all w-fit">
              Generate API Key <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((item) => (
          <Link key={item.name} to={item.href}>
            <Card className="hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all cursor-pointer h-full border-slate-200/60 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {item.name}
                </CardTitle>
                <item.icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{item.stat}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Security Audit Trail Console */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
              <Terminal className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              Security Audit Trail
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Real-time cryptographic audit log of all system mutations and authentication vectors.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md py-1.5 text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
                <Activity className="h-8 w-8 stroke-1 text-slate-300 dark:text-slate-700 animate-pulse" />
                No audit log records matching search queries found.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800/80">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Event Type</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Outcome</th>
                    <th className="py-2.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedLogs.map((log) => {
                    const isExpanded = expandedLog === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${getEventBadgeClass(log.event_type)}`}>
                              {log.event_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[10px] max-w-[120px] truncate">
                            {log.actor || 'anonymous'}
                            <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans mt-0.5">
                              {log.actor_type || 'system'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {log.action}
                          </td>
                          <td className="py-3 px-4">
                            {log.outcome === 'success' ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Success
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                <XCircle className="h-3.5 w-3.5" />
                                Failure
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                              {isExpanded ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/30 dark:bg-slate-950/20">
                            <td colSpan={6} className="py-3.5 px-6 border-b border-slate-100 dark:border-slate-800/80">
                              <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto shadow-inner leading-relaxed">
                                <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1.5 flex justify-between items-center text-[9px] uppercase tracking-wider">
                                  <span>Log Reference #{log.id}</span>
                                  <span>Host: {log.ip_address || '127.0.0.1'}</span>
                                </div>
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify({
                                    timestamp: log.timestamp,
                                    event_type: log.event_type,
                                    actor: log.actor,
                                    actor_type: log.actor_type,
                                    action: log.action,
                                    outcome: log.outcome,
                                    resource: log.resource,
                                    ip_address: log.ip_address,
                                    user_agent: log.user_agent,
                                    details: log.details ? JSON.parse(log.details) : null
                                  }, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <span className="font-medium text-slate-900 dark:text-white">{(logPage - 1) * logsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(logPage * logsPerPage, filteredLogs.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredLogs.length}</span> results
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                  disabled={logPage === totalPages}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
