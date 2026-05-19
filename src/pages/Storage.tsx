import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash, UploadCloud, File, FileCode2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/config/apiConfig";

export default function Storage() {
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

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
      fetchFiles();
    } catch (err: any) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const deleteFile = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await apiFetch(`/api/system/storage/${id}`, { method: 'DELETE' });
      fetchFiles();
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Storage Buckets</h1>
          <p className="text-slate-500 mt-1">Manage physical files uploaded to the CaraBase instance.</p>
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
                <div className="text-center py-12 text-slate-500">
                    <UploadCloud className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No files yet</h3>
                    <p>Start uploading files through the /storage/v1 POST endpoint.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
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
                        <tr key={file.id} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-3">
                                {getFileIcon(file.mime_type)}
                                <span className="truncate max-w-[200px]" title={file.filename}>{file.filename}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{file.original_name}</td>
                            <td className="px-4 py-3 text-slate-500">{formatSize(file.size)}</td>
                            <td className="px-4 py-3 text-slate-500">{file.mime_type}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(file.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/storage/v1/file/${file.id}`);
                                        alert("URL copied!");
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Copy public URL"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => deleteFile(file.id, file.original_name)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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
    </div>
  );
}
