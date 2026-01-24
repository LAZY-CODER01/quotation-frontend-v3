import React, { useState, useRef, useMemo } from "react";
import { Upload, FileCheck, Loader2, ExternalLink } from "lucide-react";
import { EmailExtraction, QuotationFile } from "../../../types/email";
import api from "../../../lib/api";

interface CPOSectionProps {
  ticket: EmailExtraction;
  onFileAdded?: (newFile: QuotationFile) => void;
}

export default function CPOSection({ ticket, onFileAdded }: CPOSectionProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ✅ 1. Sanitize + Deduplicate files
   */
  const cpoFiles: QuotationFile[] = useMemo(() => {
    if (!Array.isArray(ticket.cpo_files)) return [];

    const map = new Map<string, QuotationFile>();

    for (const file of ticket.cpo_files) {
      if (!file) continue;

      const key =
        (file as any).id ||
        (file as any)._id ||
        file.url ||
        file.name;

      if (!key) continue;

      map.set(key, file); // dedupe happens here
    }

    return Array.from(map.values());
  }, [ticket.cpo_files]);

  /**
   * ✅ 2. Upload handler
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const poNumber = window.prompt("Enter Customer PO Number:");
  if (poNumber === null) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);              // 👈 MUST be "file"
  formData.append("gmail_id", ticket.gmail_id);
  formData.append("po_number", poNumber);

  setUploading(true);
  try {
    const response = await api.post("/ticket/upload-cpo", formData);

    if (response.data?.success && response.data?.file) {
      onFileAdded?.(response.data.file);
    } else {
      alert(response.data?.message || "Upload failed");
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
        {cpoFiles.length > 0 ? (
          cpoFiles.map((file) => {
            const key =
              (file as any).id ||
              (file as any)._id ||
              file.url ||
              file.name;

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-[#0A0B0D] border border-white/10 rounded-lg"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                    <FileCheck size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">
                      {file.name || "Unnamed file"}
                    </p>

                    <p className="text-xs text-gray-500">
                      {file.uploaded_at
                        ? new Date(file.uploaded_at).toLocaleString()
                        : "Date N/A"}
                    </p>
                  </div>
                </div>

                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-gray-500 text-xs italic">
            No PO files uploaded yet.
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
          {uploading ? "Uploading PO..." : "Upload PO File"}
        </button>
      </div>
    </div>
  );
}
