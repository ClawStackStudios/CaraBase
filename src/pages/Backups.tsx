import React, { useEffect, useState, useRef } from "react";
import { Database, Download, Upload, AlertTriangle, Play, HardDrive, Clock, Loader2, Save, Trash, Archive } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/config/apiConfig";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConfirmDialogInput } from "@/components/ui/confirm-dialog-input";

interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export default function Backups() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [confirmDeleteBackup, setConfirmDeleteBackup] = useState<string | null>(null);
  const [confirmImportDbFile, setConfirmImportDbFile] = useState<File | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  
  const importInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const fetchBackups = async () => {
    try {
      const res = await apiFetch('/api/system/backups');
      const json = await res.json();
      if (json.success) {
        setBackups(json.data);
      } else {
        toast.error(json.error || 'Failed to fetch backups');
      }
    } catch (err: any) {
      toast.error('Network error loading backups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleTriggerBackup = async () => {
    setIsTriggering(true);
    try {
      const res = await apiFetch('/api/system/backups/trigger', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Backup created: ${json.data.filename}`);
        await fetchBackups();
      } else {
        toast.error(json.error || 'Failed to trigger backup');
      }
    } catch (err: any) {
      toast.error('Network error triggering backup');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const res = await apiFetch(`/api/system/backups/download/${filename}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to download backup');
      }
    } catch (err) {
      toast.error('Network error during download');
    }
  };

  const executeDeleteBackup = async () => {
    if (!confirmDeleteBackup) return;
    try {
      const res = await apiFetch(`/api/system/backups/${confirmDeleteBackup}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Deleted backup: ${confirmDeleteBackup}`);
        fetchBackups();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to delete backup');
      }
    } catch (e: any) {
      toast.error('Network error deleting backup');
    } finally {
      setConfirmDeleteBackup(null);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setConfirmImportDbFile(e.target.files[0]);
    }
    // reset input
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const executeImportDb = async () => {
    if (!confirmImportDbFile) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('db_file', confirmImportDbFile);
    try {
      const res = await apiFetch('/api/system/backups/import', {
        method: 'POST',
        body: formData
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(json.message || 'Database imported successfully. Server restarting...');
        setConfirmImportDbFile(null);
        // Page will likely refresh or error out due to server restart, which is expected
        setTimeout(() => window.location.reload(), 3000);
      } else {
        toast.error(json.error || 'Import failed');
      }
    } catch (e: any) {
      toast.error('Network error importing database');
    } finally {
      setIsImporting(false);
      setConfirmImportDbFile(null);
    }
  };

  const executeWipeDb = async () => {
    setIsWiping(true);
    try {
      const res = await apiFetch('/api/system/wipe', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(json.message || 'Volume wiped. Server restarting...');
        setConfirmWipe(false);
        setTimeout(() => window.location.reload(), 3000);
      } else {
        toast.error(json.error || 'Wipe failed');
      }
    } catch (e: any) {
      toast.error('Network error wiping database');
    } finally {
      setIsWiping(false);
      setConfirmWipe(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Archive className="w-6 h-6 text-emerald-500" />
            Database Backups
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your scheduled SQLite database snapshots and disaster recovery.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-sm transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold leading-none tracking-tight text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Automated Backups
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your scheduled SQLite database snapshots</p>
          </div>
          <button 
            onClick={handleTriggerBackup}
            disabled={isTriggering}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Snapshot Now
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Snapshots run daily at 00:00 (Retaining last 5)</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>Stored in /data/backups/</span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-12 flex justify-center text-emerald-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No backups available yet. Trigger one manually or wait for the schedule.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {backups.map(backup => (
                  <div key={backup.filename} className="p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors group">
                    <div>
                      <div className="font-mono text-sm text-slate-700 dark:text-slate-300 font-bold">{backup.filename}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(backup.createdAt).toLocaleString()} • {(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDownload(backup.filename)}
                        className="p-2 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Download Backup"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteBackup(backup.filename)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Backup"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Import Database</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Restoring from a backup manually replaces the `carabase.sqlite` file in your volume. The CaraBase server will stop, load the new db from upload, and restart.
            </p>
            <input 
              type="file" 
              accept=".sqlite,.db" 
              className="hidden" 
              ref={importInputRef} 
              onChange={handleImportFileChange}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Database Snapshot
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h4>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">
                Permanently wipe the entire CaraBase volume (Database and Storage). This will destroy all API Keys, LobsterKeys, storage files, policies, and users.
              </p>
              <button
                onClick={() => setConfirmWipe(true)}
                disabled={isWiping}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isWiping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                Wipe CaraBase Volume
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteBackup}
        title="Delete Snapshot"
        description={`Are you sure you want to permanently delete the backup ${confirmDeleteBackup}?`}
        onConfirm={executeDeleteBackup}
        onCancel={() => setConfirmDeleteBackup(null)}
        confirmText="Delete Backup"
      />

      <ConfirmDialog
        isOpen={!!confirmImportDbFile}
        title="Import Database Snapshot"
        description="If anyone else besides the owner uses this database, their service will be disrupted by this action briefly. Make sure nothing important is happening if you share your server while taking this action. The server will briefly stop, load the new database, and restart automatically."
        onConfirm={executeImportDb}
        onCancel={() => setConfirmImportDbFile(null)}
        confirmText="Acknowledge and Import"
      />

      <ConfirmDialogInput
        isOpen={confirmWipe}
        title="Wipe CaraBase Volume"
        description="The CaraBase server will shut down immediately after deletion confirmation. The server will need to be manually restarted after this process (unless your Docker/manager auto-restarts it)."
        expectedInput="delete"
        onConfirm={executeWipeDb}
        onCancel={() => setConfirmWipe(false)}
        confirmText="Permanently Wipe Everything"
      />
    </div>
  );
}
