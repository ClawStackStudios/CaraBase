/**
 * LobsterKeyCard — PinchPad©™
 *
 * Displays a single Lobster Key with:
 * — Active / Revoked / status badge
 * — Permissions display
 * — Show / hide masked key
 * — Copy key to clipboard
 * — Download key as JSON
 * — Revoke or delete
 *
 * Maintained by CrustAgent©™
 */

import React, { useState } from 'react';
import { Shield, Clock, Trash2, XCircle, Eye, EyeOff, Copy, CheckCircle, Download, AlertTriangle, Key } from 'lucide-react';
import { LobsterKey } from './LobsterKeysTab';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (!key || key.length < 12) return '••••••••••••';
  return key.slice(0, 6) + '••••••••••••' + key.slice(-4);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function parsePermissions(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LobsterKeyCardProps {
  key?: string;
  lobster: LobsterKey;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LobsterKeyCard({ lobster, onRevoke, onDelete }: LobsterKeyCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive = !!lobster.is_active;
  const displayKey = lobster.api_key ?? '';
  const permissions = parsePermissions(lobster.permissions);
  const permKeys = Object.keys(permissions).filter((k) => permissions[k]);

  const handleCopy = async () => {
    if (!displayKey) return;
    try {
      await navigator.clipboard.writeText(displayKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const keyData = {
      type: 'lobster_key',
      key: displayKey,
      id: lobster.id,
      name: lobster.name,
      createdAt: lobster.created_at,
    };
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lobster_key_${lobster.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border-2 rounded-xl p-5 transition-all',
        isActive
          ? 'border-emerald-500/30 dark:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/10'
          : 'border-slate-200 dark:border-slate-800 opacity-60',
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800',
          )}>
            <Shield className={cn('w-5 h-5', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50">{lobster.name}</h4>
              {isActive ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full font-medium">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-xs rounded-full font-medium">
                  Revoked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={() => onRevoke(lobster.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Revoke
            </button>
          )}
          <button
            onClick={() => onDelete(lobster.id)}
            className="p-1.5 border border-red-200 dark:border-red-900/50 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete key"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Meta ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 sm:col-span-2">
          <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <span className="mt-0.5">Permissions:</span>
          <div className="flex flex-wrap gap-1.5 ml-1">
            {permKeys.length > 0 ? (
              permKeys.map((k) => {
                const permName = k.replace('can', '');
                let colorClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                if (permName === 'Read') colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
                if (permName === 'Write') colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
                if (permName === 'Edit') colorClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
                if (permName === 'Move') colorClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
                if (permName === 'Delete') colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
                
                return (
                  <span key={k} className={cn("px-2 py-0.5 text-xs font-medium rounded-full", colorClass)}>
                    {permName}
                  </span>
                );
              })
            ) : (
              <span className="font-medium text-slate-900 dark:text-slate-50 mt-0.5">None</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Created:</span>
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {formatDate(lobster.created_at)}
          </span>
        </div>
        {lobster.expiration_date && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <AlertTriangle className="w-4 h-4 text-emerald-500" />
            <span>Expires:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatDate(lobster.expiration_date)}
            </span>
          </div>
        )}
        {lobster.rate_limit && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span>Rate limit:</span>
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {lobster.rate_limit} req/min
            </span>
          </div>
        )}
      </div>

      {/* ── Key display ─────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Key className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <code className={cn(
              'text-sm font-mono truncate',
              isVisible ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400',
            )}>
              {displayKey ? (isVisible ? displayKey : maskKey(displayKey)) : '••••••••••••'}
            </code>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Show/hide */}
            <button
              onClick={() => setIsVisible((v) => !v)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isVisible ? 'Hide key' : 'Reveal key'}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {/* Copy */}
            {displayKey && (
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy key"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            {/* Download */}
            {displayKey && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Download key JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
