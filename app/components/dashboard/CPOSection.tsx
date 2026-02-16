import React, { useState, useRef, useMemo } from "react";
import { Upload, FileCheck, Loader2, ExternalLink, X, Check, ShoppingCart, Banknote, Trash2, Download } from "lucide-react";
import { EmailExtraction, QuotationFile } from "../../../types/email";
import api from "../../../lib/api";
import { useUpload } from "../../../context/UploadContext"; // ✅ Custom Hook
import { formatUaeDateTime, toUaeDate } from "../../../app/lib/time";
interface CPOSectionProps {
  ticket: EmailExtraction;
  onFileAdded?: (newFile: QuotationFile) => void;
  onFileDeleted?: (fileId: string) => void;
  isAdmin?: boolean;
}

// Sub-component for individual CPO file row
const CPORow = ({
  file,
  isAdmin,
  onDelete
}: {
  file: QuotationFile;
  isAdmin?: boolean;
  onDelete: (id: string) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this PO file?")) return;
    setIsDeleting(true);
    await onDelete(file.id);
    setIsDeleting(false);
  };

  return (
    <div className="group flex items-center justify-between p-3 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-secondary))] hover:border-[rgb(var(--hover-border))] rounded-lg transition-all">

      {/* File Info */}
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <FileCheck size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[rgb(var(--text-primary))] truncate pr-4" title={file.name}>
            {/* ✅ FIX: Show file name as primary */}
            {file.name}
          </p>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] truncate" title={file.reference_id}>
            {file.reference_id || "No Ref ID"}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-[rgb(var(--text-tertiary))]">
            <span>
              {file.uploaded_at
                ? formatUaeDateTime(file.uploaded_at)
                : "Date N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Badges + Actions */}
      <div className="flex items-center gap-2">

        {/* PO Number Badge */}
        {file.po_number && (
          <div className="px-2 py-1 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded text-[10px] font-mono text-[rgb(var(--text-secondary))]" title="PO Number">
            PO: {file.po_number}
          </div>
        )}

        {/* Amount Badge (New) */}
        {file.amount && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-mono text-blue-400 font-bold">
            <span>AED {file.amount}</span>
          </div>
        )}

        {/* Download Button */}
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          download
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
            className="p-1.5 text-[rgb(var(--text-tertiary))] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete File (Admin)"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function CPOSection({ ticket, onFileAdded, onFileDeleted, isAdmin }: CPOSectionProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<Set<string>>(new Set());

  // Staging State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPONumber, setPendingPONumber] = useState("");
  // const [pendingAmount, setPendingAmount] = useState(""); // REMOVED

  // Local State for Optimistic Updates
  const [localFiles, setLocalFiles] = useState<QuotationFile[]>([]);

  // 1. Sanitize + Deduplicate files + Sort (Newest First)
  // Sync local state when ticket changes
  // 1. Sanitize + Deduplicate files + Sort (Newest First)
  // Sync local state when ticket changes
  React.useEffect(() => {
    let serverFiles: QuotationFile[] = [];
    if (Array.isArray(ticket.cpo_files)) {
      const map = new Map<string, QuotationFile>();
      for (const file of ticket.cpo_files) {
        if (!file) continue;
        const key = (file as any).id || (file as any)._id || file.url || file.name;
        if (!key) continue;
        map.set(key, file);
      }
      serverFiles = Array.from(map.values()).sort((a, b) => {
        const dateA = a.uploaded_at ? toUaeDate(a.uploaded_at)?.getTime() ?? 0 : 0;
        const dateB = b.uploaded_at ? toUaeDate(b.uploaded_at)?.getTime() ?? 0 : 0;
        return dateB - dateA;
      });
    }

    setLocalFiles(prev => {
      // Keep pending files that are still uploading
      const pending = prev.filter(f => pendingFilesRef.current.has(f.id));
      // Merge: Pending first (as they are newest), then server files
      return [...pending, ...serverFiles];
    });
  }, [ticket.cpo_files]);

  // 2. Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setPendingPONumber("");
      // setPendingAmount("");
    }
  };

  const handleCancel = () => {
    setPendingFile(null);
    setPendingPONumber("");
    // setPendingAmount("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Handle Upload Confirmation


  // ... (existing imports, but wait replace content replaces block)

  // Re-using the logic from QuotationSection for consistency.

  const { uploadFile } = useUpload(); // ✅ Global Context

  // 3. Handle Upload Confirmation
  const handleUpload = async () => {
    if (!pendingFile) return;

    // Optional amount check removed

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("gmail_id", ticket.gmail_id);
    formData.append("po_number", pendingPONumber);
    formData.append("amount", ""); // Always empty for auto-extract

    setUploading(true);

    // Optimistic Add
    const tempId = `temp-${Date.now()}`;
    const tempFile: QuotationFile = {
      id: tempId,
      name: pendingFile.name,
      url: "#",
      uploaded_at: new Date().toISOString(),
      reference_id: "PENDING",
      amount: "Auto-Extracting...",
      po_number: pendingPONumber
    };

    pendingFilesRef.current.add(tempId);
    setLocalFiles(prev => [tempFile, ...prev]);
    // Note: Delaying onFileAdded until success to prevent premature re-fetch

    // Clear staging area immediately
    handleCancel();

    // Context Upload
    await uploadFile({
      url: "/ticket/upload-cpo",
      formData: formData,
      onSuccess: (data) => {
        pendingFilesRef.current.delete(tempId);

        if (data?.success && data?.file) {
          const newFile = data.file;
          setLocalFiles(prev => prev.map(f => f.id === tempId ? newFile : f));
          if (onFileAdded) onFileAdded(newFile);
        } else {
          alert(data?.message || "Upload failed");
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
      const res = await api.delete(`/cpo/delete/${fileId}`);
      if (!res.data.success) {
        // Revert
        setLocalFiles(oldFiles);
        // Parent revert would need re-adding logic
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error", error);
      // Revert
      setLocalFiles(oldFiles);
      alert("Error deleting file");
    }
  };

  return (
    <div className="bg-[rgb(var(--bg-primary))] rounded-lg p-1 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Purchase Orders</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {localFiles.length} Files
          </span>
        </div>
      </div>

      {/* --- STAGING AREA --- */}
      {pendingFile ? (
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">

          {/* File Name Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <ShoppingCart size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" title={pendingFile.name}>
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

          {/* Inputs Row */}
          <div className="flex items-center gap-3 mt-2">

            {/* PE Number Input skipped previously */}

            <div className="flex-1 flex items-center gap-2 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2">
              <span className="text-xs text-[rgb(var(--text-secondary))] italic">
                Price will be auto-extracted...
              </span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        // --- DEFAULT UPLOAD BUTTON ---
        <div className="flex items-center justify-between p-3 bg-[rgb(var(--bg-secondary))] border border-dashed border-[rgb(var(--border-primary))] rounded-lg">
          <p className="text-xs text-[rgb(var(--text-tertiary))] font-mono hidden sm:block">
            Upload confirmed CPO (PDF/Img)
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-[rgb(var(--bg-secondary))] hover:bg-[rgb(var(--hover-bg))] border border-[rgb(var(--border-primary))] rounded-lg text-xs text-[rgb(var(--text-secondary))] transition-all hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--hover-border))]"
            >
              <Upload size={14} />
              <span>Select CPO</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Existing Files List --- */}
      <div className="space-y-2">
        {localFiles.length > 0 ? (
          localFiles.map((file) => {
            const key = (file as any).id || (file as any)._id || file.url || file.name;
            return (
              <CPORow
                key={key}
                file={file}
                isAdmin={isAdmin}
                onDelete={handleDeleteFile}
              />
            );
          })
        ) : (
          !pendingFile && (
            <div className="py-4 text-center text-xs text-[rgb(var(--text-tertiary))] italic">
              No LPO files uploaded yet.
            </div>
          )
        )}
      </div>

    </div>
  );
}