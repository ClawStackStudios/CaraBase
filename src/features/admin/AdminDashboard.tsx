/**
 * AdminDashboard.tsx — CaraBase©™
 *
 * Overview of system health and aggregate stats.
 * CaraBase-specific metrics: users, tables, policies, endpoints, db size, uptime.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState, useRef } from 'react';
import { useAdmin } from './AdminContext';
import {
  Users,
  Database,
  Activity,
  Clock,
  Shield,
  LogOut,
  ChevronRight,
  Loader2,
  ChevronLeft,
  Settings,
  ChevronDown,
  TableProperties,
  ShieldCheck,
  Webhook
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SystemStats {
  totalUsers: number;
  totalTables: number;
  totalPolicies: number;
  totalEndpoints: number;
  dbSize: number;
  uptime: number;
  lastAudit: string | null;
}

export function AdminDashboard() {
  const { logout } = useAdmin();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Uptime History State
  const [showUptimeHistory, setShowUptimeHistory] = useState(false);
  const [uptimeSessions, setUptimeSessions] = useState<any[]>([]);
  const [isLoadingUptime, setIsLoadingUptime] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({ audit_retention_days: '90', uptime_retention_days: '30' });
  const [showRetentionMenu, setShowRetentionMenu] = useState(false);

  const fetchStats = async () => {
    try {
      const [sysRes, setRes] = await Promise.all([
        fetch('/api/admin/system'),
        fetch('/api/admin/settings')
      ]);
      const sysData = await sysRes.json();
      const setData = await setRes.json();
      
      if (sysData.success) setStats(sysData.data);
      if (setData.success && setData.data) setSettings(prev => ({ ...prev, ...setData.data }));
    } catch (err) {
      console.error('Failed to fetch system data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUptimeHistory = async () => {
    setIsLoadingUptime(true);
    try {
      const res = await fetch('/api/admin/uptime');
      const data = await res.json();
      if (data.success) setUptimeSessions(data.data);
    } catch (err) {
      console.error('Failed to fetch uptime history', err);
    } finally {
      setIsLoadingUptime(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (showUptimeHistory && uptimeSessions.length === 0) {
      fetchUptimeHistory();
    }
  }, [showUptimeHistory]);

  const handleSettingChange = async (key: string, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-emerald-500" />
            System Control
          </h1>
          <p className="text-slate-500 text-sm">Real-time status of the CaraBase ecosystem.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowRetentionMenu(!showRetentionMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-emerald-500 hover:bg-emerald-500/10 transition-all border border-emerald-500/20"
            >
              <Settings className="w-5 h-5" />
              Retention
              <ChevronDown className={`w-4 h-4 transition-transform ${showRetentionMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showRetentionMenu && (
              <div 
                className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 origin-top"
                style={{ animation: 'adminFadeUp 0.2s ease-out' }}
              >
                <div className="p-4 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Audit Logs</label>
                    <select 
                      value={settings.audit_retention_days}
                      onChange={(e) => handleSettingChange('audit_retention_days', e.target.value)}
                      className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="30" className="bg-[#0f1419]">30 Days</option>
                      <option value="60" className="bg-[#0f1419]">60 Days</option>
                      <option value="90" className="bg-[#0f1419]">90 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Uptime History</label>
                    <select 
                      value={settings.uptime_retention_days}
                      onChange={(e) => handleSettingChange('uptime_retention_days', e.target.value)}
                      className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="30" className="bg-[#0f1419]">30 Days</option>
                      <option value="60" className="bg-[#0f1419]">60 Days</option>
                      <option value="90" className="bg-[#0f1419]">90 Days</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-400 hover:bg-red-400/10 transition-all border border-red-400/20"
          >
            <LogOut className="w-5 h-5" />
            Claw Out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Total Users"
          value={stats?.totalUsers || 0}
        />
        <StatCard
          icon={<TableProperties className="w-5 h-5 text-emerald-400" />}
          label="User Tables"
          value={stats?.totalTables || 0}
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-purple-400" />}
          label="RLS Policies"
          value={stats?.totalPolicies || 0}
        />
        <StatCard
          icon={<Database className="w-5 h-5 text-amber-400" />}
          label="Database Size"
          value={formatSize(stats?.dbSize || 0)}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-rose-400" />}
          label="Server Uptime"
          value={formatUptime(stats?.uptime || 0)}
          onClick={() => setShowUptimeHistory(!showUptimeHistory)}
          isActive={showUptimeHistory}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-sky-400" />}
          label="Last Activity"
          value={stats?.lastAudit ? new Date(stats.lastAudit).toLocaleTimeString() : 'Never'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <NavCard 
          to="/admin/users"
          title="User Management"
          description="Audit, monitor, and delete registered users. Metadata-only view."
          icon={<Users className="w-6 h-6" />}
        />
        <NavCard 
          to="/admin/audit"
          title="Audit Logs"
          description="Review security events, schema mutations, policy changes, and data operations."
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      {showUptimeHistory && (
        <UptimeHistorySlider 
          sessions={uptimeSessions} 
          isLoading={isLoadingUptime} 
          formatUptime={formatUptime} 
        />
      )}

      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, onClick, isActive }: { icon: React.ReactNode, label: string, value: string | number, onClick?: () => void, isActive?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900 border rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''} ${isActive ? 'border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
        <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function NavCard({ to, title, description, icon }: { to: string, title: string, description: string, icon: React.ReactNode }) {
  return (
    <Link to={to} className="group">
      <div 
        className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-full flex items-start gap-4 hover:border-emerald-500/50 transition-all hover:-translate-y-1"
      >
        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-black transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 flex items-center justify-between">
            {title}
            <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-emerald-500 transition-colors" />
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function UptimeHistorySlider({ sessions, isLoading, formatUptime }: { sessions: any[], isLoading: boolean, formatUptime: (s: number) => string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 350;
    const start = scrollRef.current.scrollLeft;
    const target = direction === 'left' ? start - scrollAmount : start + scrollAmount;
    const startTime = performance.now();
    const duration = 250;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = start + (target - start) * ease;
      }

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800/50 mb-8">
        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800/50 mb-8">
        <p className="text-slate-500 text-sm">No uptime sessions recorded yet.</p>
      </div>
    );
  }

  return (
    <div 
      className="mb-8"
      style={{ animation: 'adminFadeUp 0.3s ease-out' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Session History
        </h2>
        <div className="flex items-center gap-2 mt-[3px]">
          <button onClick={() => scroll('left')} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-black transition-colors rounded-full border border-rose-500/20">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-black transition-colors rounded-full border border-rose-500/20">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {sessions.map((session, i) => (
          <div 
            key={session.id || i} 
            className={`min-w-[300px] flex-shrink-0 p-5 rounded-2xl border ${i === 0 && !session.end ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900 border-slate-800'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${i === 0 && !session.end ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                {i === 0 && !session.end ? 'CURRENT SESSION' : 'HISTORICAL'}
              </span>
              <span className="text-xs text-slate-500 font-mono" title={session.id}>
                {session.id ? session.id.split('-')[0] : 'legacy'}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="text-2xl font-black text-white mb-1">
                {session.duration !== null ? formatUptime(session.duration) : <span className="text-amber-500 text-lg">Unclean Shutdown</span>}
              </div>
              <div className="text-sm text-slate-400 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span className="text-slate-300">{new Date(session.start).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>End:</span>
                  <span className="text-slate-300">{session.end ? new Date(session.end).toLocaleString() : 'Running'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
