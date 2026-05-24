/**
 * LobsterKeysTab — PinchPad©™
 *
 * Orchestrates the Lobster Keys settings tab:
 * — Lists all keys with LobsterKeyCard
 * — Opens LobsterKeyWizard for key creation
 * — Handles revoke and delete
 *
 * Mirrors ClawChives AgentPermissions, adapted to PinchPad REST API.
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Key, Loader2 } from 'lucide-react';
import { LobsterKeyCard } from './LobsterKeyCard';
import { LobsterKeyWizard } from './LobsterKeyWizard';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiFetch } from '@/config/apiConfig';
import { useToast } from '@/context/ToastContext';

export interface LobsterKey {
  id: string;
  name: string;
  key?: string;
  api_key?: string; // legacy support
  permissions: any;
  expiration_date?: string;
  rate_limit?: number;
  is_active: number;
  created_at: string;
  last_used?: string;
}


export function LobsterKeysTab() {
  const [keys, setKeys] = useState<LobsterKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toast = useToast();

  const loadKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/agent-keys');
      if (!res.ok) throw new Error('Failed to load keys');
      const json = await res.json();
      setKeys(json.data);
    } catch (err) {
      console.error('[LobsterKeysTab] Failed to load keys:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleRevoke = async (id: string) => {
    try {
      await apiFetch(`/api/agent-keys/${id}/revoke`, { method: 'PATCH' });
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: 0 } : k));
      toast.success('Key revoked successfully');
    } catch (err) {
      toast.error('Failed to revoke key');
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await apiFetch(`/api/agent-keys/${id}`, { method: 'DELETE' });
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('Key deleted successfully');
    } catch (err) {
      console.error('[LobsterKeysTab] Delete failed:', err);
      toast.error('Failed to delete key');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleKeyGenerated = (newKey: LobsterKey) => {
    setKeys((prev) => [newKey, ...prev]);
    setIsWizardOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Lobster Keys©™</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Manage API keys for external agents and automation
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Hatch New Key
        </button>
      </div>

      {/* Key List or Empty State */}
      {keys.length === 0 ? (
        <div className="border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/20 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
            <Key className="w-7 h-7 text-emerald-500" />
          </div>
          <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No Lobster Keys</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            Hatch a ClawKey©™ to allow external agents to interact with your Pearls
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((lobster: LobsterKey) => (
            <LobsterKeyCard
              key={lobster.id}
              lobster={lobster}
              onRevoke={handleRevoke}
              onDelete={setConfirmDeleteId}
            />
          ))}
        </div>
      )}

      <LobsterKeyWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onKeyGenerated={handleKeyGenerated}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) executeDelete(confirmDeleteId); }}
        title="Delete LobsterKey?"
        description="Are you sure you want to delete this LobsterKey? Any external agents using it will permanently lose access."
        confirmText="Delete Key"
      />
    </div>
  );
}
