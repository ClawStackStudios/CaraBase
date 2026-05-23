/**
 * AdminLogin.tsx — CaraBase©™
 *
 * SuperAdmin login portal — Emerald-themed.
 * Adapted from ClawChives SuperAdmin feature.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import { Shield, Loader2, AlertTriangle, Shell } from 'lucide-react';

export function AdminLogin() {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1419] p-4">
      <div 
        className="w-full max-w-md"
        style={{ animation: 'adminFadeUp 0.5s ease-out' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            CaraBase <span className="text-emerald-500">SuperAdmin</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">The Reef is sealed. Enter token to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin Token"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div 
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-500 text-sm"
              style={{ animation: 'adminFadeUp 0.3s ease-out' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Unlock Carapace
                <Shell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest leading-relaxed">
            Sovereign Data Policy Enforced<br />
            Metadata Access Only • No Content Visibility
          </p>
        </div>
      </div>

      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
