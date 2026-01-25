import React, { useState, useRef, useMemo } from "react";
import { Upload, FileCheck, Loader2, ExternalLink, X, Check, ShoppingCart } from "lucide-react";
import { EmailExtraction, QuotationFile } from "../../../types/email";
import api from "../../../lib/api";

interface CPOSectionProps {
  ticket: EmailExtraction;
  onFileAdded?: (newFile: QuotationFile) => void;
}

// Sub-component for individual CPO file row
const CPORow = ({ file }: { file: QuotationFile }) => {
  return (
    <div className="group flex items-center justify-between p-3 bg-[#181A1F] border border-white/5 hover:border-white/10 rounded-lg transition-all">
      
      {/* File Info */}
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
          <FileCheck size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-200 truncate pr-4" title={file.name}>
            {file.name}
          </p>
          <p className="text-[10px] text-gray-500">
            {file.uploaded_at 
              ? new Date(file.uploaded_at).toLocaleString([], { 
                  year: 'numeric', month: 'short', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                }) 
              : "Date N/A"}
          </p>
        </div>
      </div>

      {/* Right Side: PO Number + Link */}
      <div className="flex items-center gap-3">
        
        {/* Read-only PO Number Badge */}
        {file.po_number && (
          <div className="px-2 py-1 bg-[#0A0B0D] border border-white/10 rounded text-xs font-mono text-purple-400">
            PO: {file.po_number}
          </div>
        )}

        {/* Download Link */}
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default function CPOSection({ ticket, onFileAdded }: CPOSectionProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staging State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPONumber, setPendingPONumber] = useState("");

  // 1. Sanitize + Deduplicate files + Sort (Newest First)
  const cpoFiles: QuotationFile[] = useMemo(() => {
    if (!Array.isArray(ticket.cpo_files)) return [];
    
    const map = new Map<string, QuotationFile>();
    for (const file of ticket.cpo_files) {
      if (!file) continue;
      const key = (file as any).id || (file as any)._id || file.url || file.name;
      if (!key) continue;
      map.set(key, file);
    }
    
    // Convert to array and sort by uploaded_at desc
    return Array.from(map.values()).sort((a, b) => {
        const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
        const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
        return dateB - dateA;
    });
  }, [ticket.cpo_files]);

  // 2. Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setPendingPONumber(""); // Reset PO number for new file
    }
  };

  const handleCancel = () => {
    setPendingFile(null);
    setPendingPONumber("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Handle Upload Confirmation
  const handleUpload = async () => {
    if (!pendingFile) return;

    if (!pendingPONumber.trim()) {
      alert("Please enter the PO Number.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("gmail_id", ticket.gmail_id);
    formData.append("po_number", pendingPONumber);

    setUploading(true);
    try {
      const response = await api.post("/ticket/upload-cpo", formData);

      if (response.data?.success && response.data?.file) {
        if (onFileAdded) onFileAdded(response.data.file);
        handleCancel(); // Clear staging area
      } else {
        alert(response.data?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#0F1115] rounded-lg p-1 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Purchase Orders</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {cpoFiles.length} Files
          </span>
        </div>
      </div>

      {/* --- STAGING AREA --- */}
      {pendingFile ? (
        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
          
          {/* File Name Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <ShoppingCart size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" title={pendingFile.name}>
                {pendingFile.name}
              </p>
              <p className="text-[10px] text-purple-400">Ready to upload</p>
            </div>
            <button 
              onClick={handleCancel} 
              className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* PO Input & Confirm Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-[#0A0B0D] border border-white/10 rounded-lg px-3 py-2 focus-within:border-purple-500/50 transition-all">
              <span className="text-xs font-bold text-gray-500">PO#</span>
              <input 
                type="text" 
                value={pendingPONumber}
                onChange={(e) => setPendingPONumber(e.target.value)}
                placeholder="Enter PO Number..."
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-gray-600 font-mono"
                autoFocus
              />
            </div>
            
            <button 
              onClick={handleUpload}
              disabled={uploading || !pendingPONumber}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-purple-900/20"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Confirm</span>
            </button>
          </div>
        </div>
      ) : (
        // --- DEFAULT UPLOAD BUTTON ---
        <div className="flex items-center justify-between p-3 bg-[#181A1F] border border-dashed border-white/10 rounded-lg">
          <p className="text-xs text-gray-500 font-mono hidden sm:block">
            Customer PO Documents (PDF/Img)
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-[#22252B] hover:bg-[#2A2E35] border border-white/10 rounded-lg text-xs text-gray-300 transition-all hover:text-white hover:border-white/20"
            >
              <Upload size={14} />
              <span>Select PO</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Existing Files List --- */}
      <div className="space-y-2">
        {cpoFiles.length > 0 ? (
          cpoFiles.map((file) => {
             const key = (file as any).id || (file as any)._id || file.url || file.name;
             return <CPORow key={key} file={file} />;
          })
        ) : (
          !pendingFile && (
            <div className="py-4 text-center text-xs text-gray-600 italic">
              No PO files uploaded yet.
            </div>
          )
        )}
      </div>

    </div>
  );
}