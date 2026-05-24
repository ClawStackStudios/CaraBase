import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash, UploadCloud, File, FileCode2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/config/apiConfig";
import { useToast } from "@/context/ToastContext";
import { Globe, X, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function Storage() {
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [publicBaseUrl, setPublicBaseUrl] = useState<string>('');
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<string>('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [confirmDeleteData, setConfirmDeleteData] = useState<{id: string, filename: string} | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchFiles();
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

  const fetchFiles = async () => {
    try {
      const res = await apiFetch('/api/system/storage');
      const data = await res.json();
      setFiles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload')?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    try {
      const res = await apiFetch('/api/system/storage/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      toast.success('File uploaded successfully');
      fetchFiles();
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteData) return;
    try {
      await apiFetch(`/api/system/storage/${confirmDeleteData.id}`, { method: 'DELETE' });
      toast.success('File deleted successfully');
      fetchFiles();
    } catch (e: any) {
      console.error(e);
      toast.error("Delete failed: " + e.message);
    } finally {
      setConfirmDeleteData(null);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('html')) return <FileCode2 className="h-5 w-5 text-amber-500" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleGenerateShare = async () => {
    if (!shareFileId) return;
    setIsGeneratingShare(true);
    try {
      const expires_at = expiresInDays ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : null;
      const res = await apiFetch(`/api/system/storage/${shareFileId}/shares`, {
        method: 'POST',
        body: JSON.stringify({ expires_at })
      });
      if (!res.ok) throw new Error('Failed to generate share link');
      const data = await res.json();
      
      const baseUrl = publicBaseUrl || window.location.origin;
      const shareUrl = `${baseUrl}/storage/v1/share/${data.share_hash}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Proxy Share URL created and copied to clipboard!");
      setShareFileId(null);
      setExpiresInDays('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Storage Buckets</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage physical files uploaded to the CaraBase instance.</p>
        </div>
        <div>
            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
            <Button 
                onClick={handleUploadClick} 
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
                <UploadCloud className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
            {files.length === 0 ? (
                 <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                     <UploadCloud className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                     <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No files yet</h3>
                     <p>Start uploading files through the /storage/v1 POST endpoint.</p>
                 </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                     <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                         <tr>
                         <th className="px-4 py-3">File Name</th>
                         <th className="px-4 py-3">Original Name</th>
                         <th className="px-4 py-3">Size</th>
                         <th className="px-4 py-3">Type</th>
                         <th className="px-4 py-3">Date</th>
                         <th className="px-4 py-3">Actions</th>
                         </tr>
                     </thead>
                    <tbody>
                         {files.map((file) => (
                         <tr key={file.id} className="border-b dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                             <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                 {getFileIcon(file.mime_type)}
                                 <span className="truncate max-w-[200px]" title={file.filename}>{file.filename}</span>
                             </td>
                             <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{file.original_name}</td>
                             <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatSize(file.size)}</td>
                             <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{file.mime_type}</td>
                             <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(file.created_at).toLocaleString()}</td>
                             <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                 <button
                                     onClick={() => setShareFileId(file.id)}
                                     className="p-1 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors bg-transparent border-0 cursor-pointer"
                                     title="Create Proxy Share"
                                 >
                                     <Globe className="h-4 w-4" />
                                 </button>
                                 <button
                                    onClick={() => setConfirmDeleteData({ id: file.id, filename: file.original_name })}
                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Delete file"
                                 >
                                     <Trash className="h-4 w-4" />
                                 </button>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      {shareFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">Create Proxy Share</h3>
              </div>
              <button onClick={() => setShareFileId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate a secure, cryptographically random public link for this file.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiration (Optional)</label>
                <select 
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Never expires</option>
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareFileId(null)} disabled={isGeneratingShare}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleGenerateShare} disabled={isGeneratingShare}>
                {isGeneratingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Generate Link
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteData}
        title="Delete File"
        description={`Are you sure you want to delete ${confirmDeleteData?.filename}? This action cannot be undone.`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteData(null)}
        confirmText="Delete"
      />
    </div>
  );
}
