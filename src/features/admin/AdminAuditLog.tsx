/**
 * AdminAuditLog.tsx — CaraBase©™
 *
 * System audit log viewer — meaningful for a self-managed BaaS.
 * Covers auth events, schema mutations, policy changes, data operations.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ChevronLeft, 
  Loader2, 
  Filter,
  CheckCircle2,
  AlertCircle,
  User,
  Cpu,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  actor: string | null;
  actor_type: string | null;
  resource: string | null;
  action: string;
  outcome: string;
  ip_address: string | null;
  details: string | null;
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [eventType, setEventType] = useState('');
  const [outcome, setOutcome] = useState('');

  const fetchLogs = async (offset = 0) => {
    if (offset === 0) setIsLoading(true);
    else setIsMoreLoading(true);

    try {
      const params = new URLSearchParams();
      if (eventType) params.append('event_type', eventType);
      if (outcome) params.append('outcome', outcome);
      params.append('limit', '50');
      params.append('offset', offset.toString());
      
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        if (offset === 0) {
          setLogs(data.data);
        } else {
          setLogs(prev => [...prev, ...data.data]);
        }
        if (data.pagination) setTotalLogs(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
  }, [eventType, outcome]);

  const loadMore = () => {
    fetchLogs(logs.length);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="text-emerald-500" />
              Audit Logs
            </h1>
            <p className="text-slate-500 text-sm">Reviewing the history of the Reef.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select 
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="bg-transparent text-xs text-slate-400 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Events</option>
              <optgroup label="Auth">
                <option value="AUTH_SUCCESS">Auth Success</option>
                <option value="AUTH_FAILURE">Auth Failure</option>
                <option value="ADMIN_LOGIN">Admin Login</option>
              </optgroup>
              <optgroup label="Schema">
                <option value="TABLE_CREATED">Table Created</option>
                <option value="SCHEMA_ALTERED">Schema Altered</option>
              </optgroup>
              <optgroup label="Security">
                <option value="AGENT_KEY_CREATED">Key Created</option>
                <option value="AGENT_KEY_REVOKED">Key Revoked</option>
                <option value="POLICY_CREATED">Policy Created</option>
                <option value="POLICY_DELETED">Policy Deleted</option>
              </optgroup>
              <optgroup label="Data">
                <option value="CUSTOM_ENDPOINT_POST">Endpoint POST</option>
                <option value="CUSTOM_ENDPOINT_PATCH">Endpoint PATCH</option>
                <option value="CUSTOM_ENDPOINT_DELETE">Endpoint DELETE</option>
                <option value="ENDPOINT_CREATED">Endpoint Registered</option>
                <option value="ENDPOINT_DELETED">Endpoint Removed</option>
              </optgroup>
              <optgroup label="System">
                <option value="SYSTEM_START">System Start</option>
                <option value="SYSTEM_SHUTDOWN">System Shutdown</option>
                <option value="ADMIN_USER_DELETE">Admin User Delete</option>
              </optgroup>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <select 
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="bg-transparent text-xs text-slate-400 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <AuditLogRow key={log.id} log={log} />
          ))}
          {logs.length === 0 && (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <p className="text-slate-500">No events found in the archives.</p>
            </div>
          )}
          
          {logs.length < totalLogs && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isMoreLoading}
                className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isMoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Retrieve Older Archives'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditLogRow({ log }: { key?: React.Key; log: AuditLog }) {
  const [isExpanded, setIsExpanded] = useState(false);
  let details: any = null;
  try {
    details = log.details ? JSON.parse(log.details) : null;
  } catch {
    details = log.details;
  }

  return (
    <div 
      className={`bg-slate-900 border border-slate-800 rounded-xl transition-all ${isExpanded ? 'ring-1 ring-emerald-500/30' : 'hover:border-slate-700'}`}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 flex items-center gap-4 cursor-pointer"
      >
        <div className={`p-1.5 rounded-lg ${log.outcome === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {log.outcome === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>

        <div className="w-24 text-[10px] font-mono text-slate-600 uppercase tracking-tighter leading-none">
          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
          <br />
          {new Date(log.timestamp).toLocaleDateString()}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{log.action}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-500 font-bold uppercase">{log.event_type}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
             <span className="flex items-center gap-1">
               {log.actor_type === 'human' ? <User className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
               {log.actor || 'System'}
             </span>
             {log.ip_address && <span className="font-mono opacity-50">{log.ip_address}</span>}
          </div>
        </div>

        <Info className={`w-4 h-4 text-slate-700 transition-transform ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
      </div>

      {isExpanded && (
        <div 
          className="overflow-hidden"
          style={{ animation: 'adminSlideDown 0.2s ease-out' }}
        >
          <div className="px-4 pb-4 pt-0 border-t border-slate-800/50">
            <div className="mt-4 bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre">
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </div>
            {log.resource && (
              <div className="mt-3 text-[10px] text-slate-600 uppercase tracking-widest">
                Target Resource: <span className="text-slate-400">{log.resource}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes adminSlideDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 300px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
