import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileSpreadsheet, FileJson, FileText, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BulkUploadPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  const handleFileSelect = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'json'].includes(ext)) {
      toast.error('Unsupported format. Use CSV, Excel (.xlsx), or JSON');
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      let contentType;
      let body;

      if (ext === 'json') {
        contentType = 'application/json';
        body = await selectedFile.text();
      } else if (ext === 'csv') {
        contentType = 'text/csv';
        body = await selectedFile.text();
      } else {
        contentType = 'application/octet-stream';
        body = await selectedFile.arrayBuffer();
      }

      const res = await fetch(`${API}/api/inventory/bulk-upload`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': contentType },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult(data);
      toast.success(`Upload complete: ${data.created} created, ${data.updated} updated`);
    } catch (e) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  const downloadTemplate = async (format) => {
    try {
      const res = await fetch(`${API}/api/inventory/bulk-template?format=${format}`, { credentials: 'include' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_template.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download template'); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="bulk-upload-page">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="h-7 w-7 text-indigo-600" /> Bulk Product Upload
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Import products from CSV, Excel, or JSON files</p>
      </div>

      {/* Template Downloads */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3">Download Template</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => downloadTemplate('csv')} data-testid="download-csv-template">
            <FileText className="h-4 w-4 mr-1 text-green-600" /> CSV Template
          </Button>
          <Button variant="outline" onClick={() => downloadTemplate('excel')} data-testid="download-excel-template">
            <FileSpreadsheet className="h-4 w-4 mr-1 text-emerald-600" /> Excel Template
          </Button>
          <Button variant="outline" onClick={() => downloadTemplate('json')} data-testid="download-json-template">
            <FileJson className="h-4 w-4 mr-1 text-amber-600" /> JSON Template
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        data-testid="upload-dropzone"
        className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed transition-colors p-10 text-center cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.json" onChange={(e) => handleFileSelect(e.target.files[0])} data-testid="file-input" />
        <Upload className="h-12 w-12 mx-auto text-slate-400 mb-3" />
        <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">
          {selectedFile ? selectedFile.name : 'Drop file here or click to browse'}
        </p>
        <p className="text-sm text-slate-400 mt-1">Supports CSV, Excel (.xlsx), and JSON &middot; Max 10,000 products</p>
        {selectedFile && (
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setResult(null); }}>Clear</Button>
            <Button onClick={(e) => { e.stopPropagation(); handleUpload(); }} disabled={uploading} data-testid="upload-btn">
              {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-1" /> Upload</>}
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4" data-testid="upload-results">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white">Upload Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{result.total_processed}</p>
              <p className="text-xs text-slate-500">Total Processed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 tabular-nums">{result.created}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Created</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600 tabular-nums">{result.updated}</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">Updated</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600 tabular-nums">{result.skipped}</p>
              <p className="text-xs text-red-700 dark:text-red-400">Skipped</p>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Errors ({result.errors.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded">
                    Row {err.row}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
