/**
 * LobsterKeyWizard — PinchPad©™
 *
 * 4-step modal for generating Lobster Keys:
 * details → permissions → expiration → review → generated
 *
 * Maintained by CrustAgent©™
 */

import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertTriangle, Eye, EyeOff, Copy, CheckCircle, Clock, Zap } from 'lucide-react';
import { apiFetch } from '@/config/apiConfig';
import { LobsterKey } from './LobsterKeysTab';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';


function cn(...inputs: any[]) { return twMerge(clsx(inputs)); }

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 'details' | 'permissions' | 'expiration' | 'review' | 'generated';

export type PermissionLevel = "READ" | "WRITE" | "EDIT" | "MOVE" | "FULL" | "ECOSYSTEM" | "CUSTOM";

export interface AgentPermission {
  level: PermissionLevel;
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canMove: boolean;
  canDelete: boolean;
}

interface FormData {
  name: string;
  description: string;
  permissionLevel: PermissionLevel;
  customPermissions?: AgentPermission;
  expirationType: 'never' | '30d' | '60d' | '90d' | 'custom';
  customExpirationDate: string;
  rateLimit: number;
}

const STEPS: WizardStep[] = ['details', 'permissions', 'expiration', 'review', 'generated'];
const STEP_LABELS: Record<WizardStep, string> = {
  details: 'Details', permissions: 'Permissions', expiration: 'Expiration',
  review: 'Review', generated: 'Done',
};

const INITIAL_FORM: FormData = {
  name: '', description: '', permissionLevel: 'READ',
  customPermissions: { level: 'CUSTOM', canRead: false, canWrite: false, canEdit: false, canMove: false, canDelete: false },
  expirationType: 'never', customExpirationDate: '', rateLimit: 0,
};

export const PERMISSION_CONFIGS: Record<PermissionLevel, AgentPermission> = {
  READ: { level: "READ", canRead: true, canWrite: false, canEdit: false, canMove: false, canDelete: false },
  WRITE: { level: "WRITE", canRead: true, canWrite: true, canEdit: false, canMove: false, canDelete: false },
  EDIT: { level: "EDIT", canRead: true, canWrite: true, canEdit: true, canMove: false, canDelete: false },
  MOVE: { level: "MOVE", canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: false },
  ECOSYSTEM: { level: "ECOSYSTEM", canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: false },
  FULL: { level: "FULL", canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: true },
  CUSTOM: { level: "CUSTOM", canRead: false, canWrite: false, canEdit: false, canMove: false, canDelete: false },
};

export const PERMISSION_INFO: Record<PermissionLevel, {
  label: string; description: string; color: string; bgColor: string; borderColor: string; icon: string;
}> = {
  ECOSYSTEM: { label: "ClawStack Ecosystem", description: "1-Click Preset: Optimized for ClawChives & PinchPad. Includes all capabilities except permanent deletion.", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", borderColor: "border-emerald-500", icon: "🦀" },
  READ: { label: "Read Only", description: "Can read bookmarks and folders. Cannot create, modify, or delete.", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800", icon: "📖" },
  WRITE: { label: "Write", description: "Can create new bookmarks and folders. Cannot modify or delete.", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800", icon: "✏️" },
  EDIT: { label: "Edit", description: "Can read, write, and modify bookmarks/folders. Cannot delete.", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-900/20", borderColor: "border-orange-200 dark:border-orange-800", icon: "🔧" },
  MOVE: { label: "Move", description: "Can read, write, edit, and move items. Cannot permanently delete.", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-200 dark:border-purple-800", icon: "📁" },
  FULL: { label: "Full Access", description: "Complete control over all bookmark operations.", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/20", borderColor: "border-red-200 dark:border-red-800", icon: "🔑" },
  CUSTOM: { label: "Custom", description: "Granular control over specific actions.", color: "text-slate-700 dark:text-slate-300", bgColor: "bg-slate-50 dark:bg-slate-800/50", borderColor: "border-slate-300 dark:border-slate-600", icon: "⚙️" },
};

interface LobsterKeyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyGenerated: (key: LobsterKey) => void;
}

export function LobsterKeyWizard({ isOpen, onClose, onKeyGenerated }: LobsterKeyWizardProps) {
  const [step, setStep] = useState<WizardStep>('details');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generatedKey, setGeneratedKey] = useState<LobsterKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) { setStep('details'); setForm(INITIAL_FORM); setGeneratedKey(null); setError(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIdx = STEPS.indexOf(step);
  const isLastConfigStep = step === 'review';

  const isStepValid = (): boolean => {
    if (step === 'details') return form.name.trim().length >= 2;
    if (step === 'permissions') {
      if (form.permissionLevel === 'CUSTOM') {
        const c = form.customPermissions;
        return !!c && (c.canRead || c.canWrite || c.canEdit || c.canMove || c.canDelete);
      }
      return true;
    }
    if (step === 'expiration') {
      if (form.expirationType === 'custom') return form.customExpirationDate.length > 0;
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 'review') {
      await handleGenerate();
      return;
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  };

  const handleBack = () => {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let permissions: Record<string, boolean> = {};
      const basePerms = form.permissionLevel === 'CUSTOM' && form.customPermissions
        ? form.customPermissions
        : PERMISSION_CONFIGS[form.permissionLevel];

      const { level: _, ...permsOnly } = basePerms;
      permissions = permsOnly;

      const expirationDate = form.expirationType === 'custom' ? form.customExpirationDate
        : form.expirationType === 'never' ? null
        : new Date(Date.now() + parseInt(form.expirationType) * 24 * 60 * 60 * 1000).toISOString();
      const rateLimit = form.rateLimit > 0 ? form.rateLimit : null;

      const res = await apiFetch('/api/agent-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          permissions,
          expirationType: form.expirationType,
          rateLimit
        })
      });

      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error || 'Failed to generate key');
      }

      const { data: key } = await res.json();
      setGeneratedKey(key);
      setStep('generated');
      onKeyGenerated(key);
    } catch (e: any) {
      setError(e.message || 'Failed to generate key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey?.key) return;
    try {
      await navigator.clipboard.writeText(generatedKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const formatExpirationDate = () => {
    if (form.expirationType === 'never') return 'Never expires';
    if (form.expirationType === 'custom') return form.customExpirationDate;
    const days = parseInt(form.expirationType);
    return new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 dark:border-emerald-500/60 rounded-2xl shadow-2xl shadow-emerald-500/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <Key className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Hatch a Lobster Key</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create a secure <span className="text-emerald-600 dark:text-emerald-400 font-mono">lb-</span> API key
              </p>
            </div>
          </div>
          {step !== 'generated' && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'generated' && (
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              {(['details', 'permissions', 'expiration', 'review'] as WizardStep[]).map((s, i) => {
                const isCompleted = currentIdx > i;
                const isCurrent = step === s;
                return (
                  <React.Fragment key={s}>
                    {i > 0 && <div className={cn('flex-1 h-px', isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')} />}
                    <div className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all',
                      isCurrent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : isCompleted ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500',
                    )}>
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        isCurrent ? 'bg-emerald-500 text-white'
                        : isCompleted ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500',
                      )}>
                        {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* ── Details ──────────────────────────────────────────────────── */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" placeholder="e.g., Sync Bot"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  placeholder="What will this agent do?"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Permissions ───────────────────────────────────────────────── */}
          {step === 'permissions' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select the permission level for this agent. Choose the minimum level required.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(PERMISSION_INFO) as PermissionLevel[]).map((level) => {
                  const info = PERMISSION_INFO[level];
                  const isSelected = form.permissionLevel === level;
                  
                  return (
                    <div
                      key={level}
                      className={cn(
                        'cursor-pointer transition-all rounded-xl p-4 border-2',
                        isSelected
                          ? `${info.bgColor} ${info.borderColor} ring-1 ring-emerald-500/50 shadow-sm`
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                      )}
                      onClick={() => setForm(f => ({ ...f, permissionLevel: level }))}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('text-2xl', isSelected ? "" : "opacity-50 grayscale transition-all")}>
                          {info.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={cn('font-semibold', info.color)}>
                              {info.label}
                            </h3>
                            {isSelected && (
                              <Check className="w-5 h-5 text-emerald-500 ml-auto" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {info.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {PERMISSION_CONFIGS[level].canRead && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">Read</span>}
                            {PERMISSION_CONFIGS[level].canWrite && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">Write</span>}
                            {PERMISSION_CONFIGS[level].canEdit && <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">Edit</span>}
                            {PERMISSION_CONFIGS[level].canMove && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">Move</span>}
                            {PERMISSION_CONFIGS[level].canDelete && <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">Delete</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.permissionLevel === "CUSTOM" && form.customPermissions && (
                <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Custom Permissions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(["canRead", "canWrite", "canEdit", "canMove", "canDelete"] as const).map((flag) => (
                      <label key={flag} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.customPermissions![flag]}
                          onChange={(e) =>
                            setForm(f => ({
                              ...f,
                              customPermissions: {
                                ...f.customPermissions!,
                                [flag]: e.target.checked,
                              },
                            }))
                          }
                          className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500/20 bg-white dark:bg-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {flag.replace("can", "")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Expiration ────────────────────────────────────────────────── */}
          {step === 'expiration' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expiration</label>
                <select
                  value={form.expirationType}
                  onChange={(e) => setForm(f => ({ ...f, expirationType: e.target.value as FormData['expirationType'] }))}
                  className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="never">Never expires</option>
                  <option value="30d">30 days</option>
                  <option value="60d">60 days</option>
                  <option value="90d">90 days</option>
                  <option value="custom">Custom date</option>
                </select>
              </div>
              {form.expirationType === 'never' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Security Warning</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Keys that never expire are a security risk. Consider setting an expiration date.</p>
                  </div>
                </div>
              )}
              {form.expirationType !== 'never' && form.expirationType !== 'custom' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Expires on <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatExpirationDate()}</span>
                  </p>
                </div>
              )}
              {form.expirationType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Date</label>
                  <input type="date"
                    value={form.customExpirationDate}
                    onChange={(e) => setForm(f => ({ ...f, customExpirationDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              )}
              {/* Rate limit inline in expiration step */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Rate Limit — <span className="text-emerald-600 dark:text-emerald-400 font-bold">{form.rateLimit === 0 ? '∞ Unlimited' : `${form.rateLimit} req/min`}</span>
                </label>
                <input type="range" min="0" max="1000" step="10"
                  value={form.rateLimit}
                  onChange={(e) => setForm(f => ({ ...f, rateLimit: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex gap-2 mt-3">
                  {[0, 60, 300, 1000].map((v) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, rateLimit: v }))}
                      className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                        form.rateLimit === v ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}>
                      {v === 0 ? '∞' : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Review ────────────────────────────────────────────────────── */}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Review Configuration</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                {[
                  { label: 'Name', value: form.name },
                  { label: 'Description', value: form.description || '—' },
                  { label: 'Permissions', value: form.permissionLevel === 'CUSTOM' ? 'Custom' : PERMISSION_INFO[form.permissionLevel].label },
                  { label: 'Expiration', value: formatExpirationDate() },
                  { label: 'Rate Limit', value: form.rateLimit === 0 ? 'Unlimited' : `${form.rateLimit} req/min` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Generated ─────────────────────────────────────────────────── */}
          {step === 'generated' && generatedKey && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">🦞 Lobster Key Spawned!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                  Copy it now — it won't be shown again.
                </p>
              </div>
              <div className="border-2 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">API Key</span>
                  <button onClick={() => setIsMasked(v => !v)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 font-mono text-sm break-all text-emerald-700 dark:text-emerald-300">
                    {isMasked ? generatedKey.key?.replace(/./g, '•') : generatedKey.key}
                  </code>
                  <button onClick={handleCopy}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0">
                    {copied ? <><CheckCircle className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Security Notice</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">Store this key securely. Do not share it publicly or commit it to version control.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-emerald-500/20 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          {step !== 'generated' ? (
            <>
              <button
                onClick={step === 'details' ? onClose : handleBack}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {step === 'details' ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleNext}
                disabled={!isStepValid() || isGenerating}
                className="px-6 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? 'Generating...' : isLastConfigStep ? 'Hatch Key 🦞' : 'Next →'}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Done 🦞
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
