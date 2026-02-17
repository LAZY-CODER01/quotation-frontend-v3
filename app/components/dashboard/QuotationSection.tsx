import React, { useState, useRef } from "react";
import { Upload, FileText, Loader2, ExternalLink, X, Check, Trash2, Download } from "lucide-react";
import { EmailExtraction, QuotationFile } from "../../../types/email";
import api from "../../../lib/api";
import { useUpload } from "../../../context/UploadContext"; // ✅ Import hook
import { formatUaeDateTime, toUaeDate } from "../../../app/lib/time";

interface QuotationSectionProps {
  ticket: EmailExtraction;
  onFileAdded?: (newFile: QuotationFile) => void;
  onFileDeleted?: (fileId: string) => void;
  onFileUpdated?: (fileId: string, newAmount: string) => void;
  isAdmin?: boolean;
}

// Sub-component for existing files (View Only / Edit Price)
const FileRow = ({
  file,
  gmailId,
  isAdmin,
  onDelete,
  onFileUpdated
}: {
  file: QuotationFile;
  gmailId: string;
  isAdmin?: boolean;
  onDelete: (fileId: string) => void;
  onFileUpdated?: (fileId: string, newAmount: string) => void;
}) => {
  const [amount, setAmount] = useState(file.amount || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (amount === file.amount) return;
    setIsSaving(true);
    setIsSaving(true);
    // Optimistic update callback
    if (onFileUpdated) onFileUpdated(file.id, amount);

    try {
      const res = await api.post("/ticket/update-file-amount", {
        gmail_id: gmailId,
        file_id: file.id,
        amount: amount
      });
      // if (res.data.success) {} // Already handled optimistically
    } catch (error) {
      console.error("Failed to update amount", error);
      // Revert if needed? Ideally parent handles revert or we just alert.
      // For amount, it's tricky to revert parent without old amount.
      // But since we didn't pass old amount to valid request, effectively we stay consistent eventually via refetch.
      // But to be safe, we could pass old/new.
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    setIsDeleting(true);
    await onDelete(file.id);
    setIsDeleting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };

  return (
    <div className="group flex items-center justify-between p-3 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-secondary))] hover:border-[rgb(var(--hover-border))] rounded-lg transition-all">

      {/* File Info */}
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[rgb(var(--text-primary))] truncate pr-4" title={file.name}>
            {/* ✅ FIX: Show Filename as primary */}
            {file.name}
          </p>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] truncate" title={file.reference_id}>
            {/* Show Reference ID below */}
            {file.reference_id || "No Ref ID"}
          </p>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
            {formatUaeDateTime(file.uploaded_at)}
          </p>
        </div>
      </div>

      {/* Right Side: Input + Actions */}
      <div className="flex items-center gap-3">

        {/* Editable Amount Input */}
        <div className="flex items-center gap-2 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded px-2 py-1.5 focus-within:border-blue-500/50 transition-colors w-24 sm:w-28">
          <span className="text-[10px] font-bold text-green-500">AED</span>
          <input
            type="text"
            value={amount}
            readOnly
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className="w-full bg-transparent text-xs text-[rgb(var(--text-primary))]  text-right font-mono"
          />
          {isSaving && <Loader2 size={10} className="animate-spin text-blue-500" />}
        </div>

        {/* Clear Download Button */}
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          download // Encourage browser to download
          className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--hover-bg))] hover:text-[rgb(var(--text-primary))] rounded border border-[rgb(var(--border-secondary))] hover:border-[rgb(var(--hover-border))] transition-all"
        >
          <Download size={12} />
          <span>Download</span>
        </a>

        {/* Delete Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete File (Admin)"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function QuotationSection({ ticket, onFileAdded, onFileDeleted, onFileUpdated, isAdmin }: QuotationSectionProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<Set<string>>(new Set());

  // Staging State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // const [pendingAmount, setPendingAmount] = useState(""); // REMOVED - Auto-extract only

  // Local state for optimistic updates
  const [localFiles, setLocalFiles] = useState<QuotationFile[]>(ticket.quotation_files || []);

  // Sync with ticket prop when it changes (re-fetch)
  // Sync with ticket prop when it changes (re-fetch)
  React.useEffect(() => {
    let serverFiles: QuotationFile[] = [];
    if (Array.isArray(ticket.quotation_files)) {
      serverFiles = ticket.quotation_files;
    }

    setLocalFiles(prev => {
      const pending = prev.filter(f => pendingFilesRef.current.has(f.id));
      return [...pending, ...serverFiles];
    });
  }, [ticket.quotation_files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      // setPendingAmount("");
    }
  };

  const handleCancel = () => {
    setPendingFile(null);
    // setPendingAmount("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const { uploadFile } = useUpload(); // ✅ Global Context

  const handleUpload = async () => {
    if (!pendingFile) return;

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("gmail_id", ticket.gmail_id);
    formData.append("amount", ""); // Always empty to trigger auto-extraction

    setUploading(true);

    // Optimistic Add
    const tempId = `temp-${Date.now()}`;
    const tempFile: QuotationFile = {
      id: tempId,
      name: pendingFile.name,
      url: "#",
      uploaded_at: new Date().toISOString(),
      reference_id: "PENDING",
      amount: "Auto-Extracting..."
    };

    pendingFilesRef.current.add(tempId);
    setLocalFiles(prev => [...prev, tempFile]);
    // Note: Delaying onFileAdded until success

    // Clear form immediately
    handleCancel();

    // Trigger Background Upload via Context
    await uploadFile({
      url: "/ticket/upload-quotation",
      formData: formData,
      onSuccess: (data) => {
        pendingFilesRef.current.delete(tempId);

        if (data.success && data.file) {
          const newFile = data.file;
          setLocalFiles(prev => prev.map(f => f.id === tempId ? newFile : f));
          if (onFileAdded) onFileAdded(newFile);
        } else {
          alert("Upload failed: " + (data.message || "Unknown error"));
          revertOptimistic(tempId);
        }
        setUploading(false);
      },
      onError: (err) => {
        pendingFilesRef.current.delete(tempId);
        console.error("Upload error", err);
        alert("Upload error");
        revertOptimistic(tempId);
        setUploading(false);
      }
    });
  };

  const revertOptimistic = (tempId: string) => {
    setLocalFiles(prev => prev.filter(f => f.id !== tempId));
    if (onFileDeleted) onFileDeleted(tempId);
  };

  const handleDeleteFile = async (fileId: string) => {
    // Optimistic Delete
    const oldFiles = localFiles;
    setLocalFiles(prev => prev.filter(f => f.id !== fileId));
    if (onFileDeleted) onFileDeleted(fileId); // Optimistic callback

    try {
      const res = await api.delete(`/quotation/delete/${fileId}`);
      if (!res.data.success) {
        // Revert
        setLocalFiles(oldFiles);
        // We can't easily "undelete" in parent without re-adding.
        // But onUpdate will refetch eventually.
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error", error);
      // Revert
      setLocalFiles(oldFiles);
      alert("Error deleting file");
    }
  };

  const handleFileUpdatedLocally = (fileId: string, newAmount: string) => {
    setLocalFiles(prev => prev.map(f => f.id === fileId ? { ...f, amount: newAmount } : f));
    if (onFileUpdated) onFileUpdated(fileId, newAmount);
  };

  return (
    <div className="bg-[rgb(var(--bg-primary))] rounded-lg p-1 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Quotation Files</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {ticket.ticket_number || "NO-ID"}
          </span>
        </div>
      </div>

      {/* --- STAGING AREA --- */}
      {pendingFile ? (
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate" title={pendingFile.name}>
                {pendingFile.name}
              </p>
              <p className="text-[10px] text-blue-400">Ready to upload</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-[rgb(var(--hover-bg))] rounded-full text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 flex items-center gap-2 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2">
              <span className="text-xs text-[rgb(var(--text-secondary))] italic">
                Price will be auto-extracted...
              </span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Confirm Upload</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-[rgb(var(--bg-secondary))] border border-dashed border-[rgb(var(--border-primary))] rounded-lg">
          <p className="text-xs text-[rgb(var(--text-tertiary))] font-mono hidden sm:block">
            DBQ-XX-XXXX Company.xlsx
          </p>
          <div className="w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--hover-bg))] border border-[rgb(var(--border-primary))] rounded-lg text-xs text-[rgb(var(--text-secondary))] transition-all hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--hover-border))]"
            >
              <Upload size={14} />
              <span>Select File</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Existing Files List (Sorted by Newest First) --- */}
      <div className="space-y-2">
        {localFiles && localFiles.length > 0 ? (
          // ✅ SORTING APPLIED HERE
          [...localFiles]
            .sort((a, b) => {
              const tb = toUaeDate(b.uploaded_at)?.getTime() ?? 0;
              const ta = toUaeDate(a.uploaded_at)?.getTime() ?? 0;
              return tb - ta;
            })
            .map((file) => (
              <FileRow
                key={file.id}
                file={file}
                gmailId={ticket.gmail_id}
                isAdmin={isAdmin}
                onDelete={handleDeleteFile}
                onFileUpdated={handleFileUpdatedLocally}
              />
            ))
        ) : (
          !pendingFile && (
            <div className="py-4 text-center text-xs text-[rgb(var(--text-tertiary))] italic">
              No files uploaded yet.
            </div>
          )
        )}
      </div>

    </div>
  );
}