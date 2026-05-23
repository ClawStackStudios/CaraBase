/**
 * AdminUserList.tsx — CaraBase©™
 *
 * User management interface. Metadata-only, sovereign-compliant.
 * Adapted from ClawChives SuperAdmin feature.
 *
 * Maintained by CrustAgent©™
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Trash2,
  ChevronLeft,
  Loader2,
  Key as KeyIcon,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserMetadata {
  uuid: string;
  username: string;
  created_at: string;
  active_keys: number;
  last_login: string | null;
}

export function AdminUserList() {
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<UserMetadata | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async (offset = 0) => {
    try {
      const res = await fetch(`/api/admin/users?limit=50&offset=${offset}`);
      const data = await res.json();
      if (data.success) {
        if (offset === 0) {
          setUsers(data.data);
        } else {
          setUsers(prev => [...prev, ...data.data]);
        }
        setTotalUsers(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loadMore = () => {
    setIsMoreLoading(true);
    fetchUsers(users.length);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== deleteTarget.username) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.uuid}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.uuid !== deleteTarget.uuid));
        setDeleteTarget(null);
        setDeleteConfirm('');
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.uuid.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-emerald-500" />
              User Audit
            </h1>
            <p className="text-slate-500 text-sm">Managing the ecosystem inhabitants.</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 w-64"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">UUID</th>
                <th className="px-6 py-4 text-center">Agent Keys</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.uuid} className="hover:bg-slate-800/30 transition-colors text-sm group">
                  <td className="px-6 py-4 font-bold text-emerald-500">{u.username}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{u.uuid.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{u.active_keys}</span>
                      <span className="text-[10px] text-slate-600 uppercase">Agents</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500">No inhabitants found in this sector.</p>
            </div>
          )}
          
          {users.length < totalUsers && !search && (
            <div className="p-4 border-t border-slate-800 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isMoreLoading}
                className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isMoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More Inhabitants'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            style={{ animation: 'adminFadeUp 0.3s ease-out' }}
          >
            <div className="flex items-center gap-4 text-red-500 mb-6">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Scuttle Inhabitant?</h2>
                <p className="text-slate-500 text-sm">This action is permanent and absolute.</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
              <p className="text-slate-400 text-sm mb-4">
                Deleting <span className="text-white font-bold">{deleteTarget.username}</span> will purge:
              </p>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-center gap-2"><KeyIcon className="w-3 h-3" /> {deleteTarget.active_keys} Agent Keys & Sessions</li>
                <li className="flex items-center gap-2"><Users className="w-3 h-3" /> All API tokens & session data</li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest text-center">
                Type <span className="text-white font-mono">{deleteTarget.username}</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-white focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="Inhabitant username"
                autoFocus
              />
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Abort
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleteConfirm !== deleteTarget.username || isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Scuttle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
