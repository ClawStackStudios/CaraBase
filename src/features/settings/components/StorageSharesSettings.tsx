import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Trash, Globe, Calendar, Link as LinkIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/config/apiConfig";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface StorageShare {
  id: string;
  storage_id: string;
  share_hash: string;
  created_at: string;
  expires_at: string | null;
  original_name: string;
  mime_type: string;
  size: number;
}

export function StorageSharesSettings() {
  const [shares, setShares] = useState<StorageShare[]>([]);
  const [publicBaseUrl, setPublicBaseUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRevokeData, setConfirmRevokeData] = useState<{hash: string, filename: string} | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchShares();
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await apiFetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setPublicBaseUrl(data.tunnelUrl || window.location.origin);
      }
    } catch {
      setPublicBaseUrl(window.location.origin);
    }
  };

  const fetchShares = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/system/storage/shares');
      const data = await res.json();
      setShares(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load active shares");
    } finally {
      setIsLoading(false);
    }
  };

  const executeRevoke = async () => {
    if (!confirmRevokeData) return;
    
    try {
      const res = await apiFetch(`/api/system/storage/shares/${confirmRevokeData.hash}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke share');
      
      toast.success('Public share revoked successfully.');
      fetchShares();
    } catch (e: any) {
      console.error(e);
      toast.error("Revocation failed: " + e.message);
    } finally {
      setConfirmRevokeData(null);
    }
  };

  const copyShareLink = (hash: string) => {
    const baseUrl = publicBaseUrl || window.location.origin;
    const url = `${baseUrl}/storage/v1/share/${hash}`;
    navigator.clipboard.writeText(url);
    toast.success("Proxy Share URL copied to clipboard!");
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Proxy Membrane Shares</CardTitle>
              <CardDescription>Manage your cryptographically secure, active public links.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">Loading shares...</div>
          ) : shares.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Globe className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No active shares</h3>
              <p>You can create secure public links from the Storage dashboard.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Proxy Hash</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((share) => {
                    const expired = isExpired(share.expires_at);
                    return (
                      <tr key={share.id} className="border-b dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={share.original_name}>
                            {share.original_name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {formatSize(share.size)} • {new Date(share.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            <span className="truncate w-24">{share.share_hash.substring(0, 16)}...</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Expired
                            </span>
                          ) : share.expires_at ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-xs font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              Expires {new Date(share.expires_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Never Expires
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyShareLink(share.share_hash)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-900/30 rounded transition-colors"
                              title="Copy proxy link"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmRevokeData({ hash: share.share_hash, filename: share.original_name })}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Revoke share"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ConfirmDialog
        isOpen={!!confirmRevokeData}
        title="Revoke Public Share"
        description={`Are you sure you want to revoke the public share for ${confirmRevokeData?.filename}? The proxy link will break instantly and cannot be recovered.`}
        onConfirm={executeRevoke}
        onCancel={() => setConfirmRevokeData(null)}
        confirmText="Revoke Share"
      />
    </div>
  );
}
