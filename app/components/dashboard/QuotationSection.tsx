import React, { useState, useRef } from "react";
import { Upload, FileText, Loader2, ExternalLink } from "lucide-react";
import { EmailExtraction, QuotationFile } from "../../../types/email";
import api from "../../../lib/api";

interface QuotationSectionProps {
  ticket: EmailExtraction;
  onFileAdded?: (newFile: QuotationFile) => void;
}

export default function QuotationSection({ ticket, onFileAdded }: QuotationSectionProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("gmail_id", ticket.gmail_id);

    setUploading(true);
    try {
      const response = await api.post("/ticket/upload-quotation", formData, {
        headers: { "Content-Type": undefined } as any, // Unset default JSON header to allow browser to set boundary
      });

      if (response.data.success && response.data.file) {
        if (onFileAdded) {
          onFileAdded(response.data.file);
        }
      } else {
        alert("Upload failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Upload error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* File List */}
      <div className="space-y-2">
        {ticket.quotation_files && ticket.quotation_files.length > 0 ? (
          ticket.quotation_files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-[#0A0B0D] border border-white/10 rounded-lg group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                    {file.amount && <span>• {file.amount}</span>}
                  </div>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 text-xs italic">
            No quotation files yet.
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-sm"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>{uploading ? "Uploading..." : "Upload File"}</span>
        </button>
      </div>
    </div>
  );
}