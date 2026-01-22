
import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Download, Save, Trash2, Loader2 } from "lucide-react";
import { EmailExtraction, ExtractionRequirement } from "../../../types/email";
import api from "../../../lib/api";

interface RequirementsEditorProps {
  ticket: EmailExtraction;
  onBack: () => void;
}

export default function RequirementsEditor({ ticket, onBack }: RequirementsEditorProps) {
  const [items, setItems] = useState<ExtractionRequirement[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize state from ticket data
  useEffect(() => {
    if (ticket.extraction_result?.Requirements) {
      setItems(ticket.extraction_result.Requirements);
    }
  }, [ticket]);

  // --- Handlers ---

  const handleFieldChange = (index: number, field: keyof ExtractionRequirement, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    // Auto-save logic could go here (debounced), for now we use a manual/auto trigger
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { Description: "", Quantity: "1", Unit: "pcs", "Unit price": "0" }
    ]);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await api.post('/ticket/update-requirements', {
        gmail_id: ticket.gmail_id,
        requirements: items
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save requirements", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save effect (e.g., every 3 seconds if changed)
  // For simplicity, we'll just expose the save status and save on unmount or button click
  // But let's add a "Save" button to be explicit.

  return (
    <div className="fixed inset-0 bg-[#0F1115] z-50 flex flex-col animate-in fade-in duration-200">
      
      {/* --- Top Bar --- */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0F1115]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white flex items-center gap-3">
              Requirements Editor
              <span className="font-mono text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                {ticket.ticket_number || ticket.id}
              </span>
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length} items
              </span>
            </h1>
            <span className="text-xs text-gray-500">{ticket.subject}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {lastSaved && (
                <span className="text-xs text-gray-500 mr-4">
                    Saved {lastSaved.toLocaleTimeString()}
                </span>
            )}
            
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/10">
                <Download size={16} />
                Download Draft
            </button>
            
            <button 
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/10"
            >
                <Plus size={16} />
                Add Line
            </button>

            <button 
                onClick={() => { saveChanges(); onBack(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
                Save & Back
            </button>
        </div>
      </div>

      {/* --- Editor Content --- */}
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2 text-right">Action</div>
            </div>

            {/* Rows */}
            {items.map((item, index) => (
                <div 
                    key={index} 
                    className="grid grid-cols-12 gap-4 p-4 bg-[#181A1F] border border-white/5 rounded-xl items-start hover:border-white/10 transition-colors group"
                >
                    {/* Index */}
                    <div className="col-span-1 flex items-center justify-center h-full text-gray-600 font-mono text-sm">
                        {index + 1}
                    </div>

                    {/* Description (Editable) */}
                    <div className="col-span-5">
                        <textarea
                            value={item.Description}
                            onChange={(e) => handleFieldChange(index, "Description", e.target.value)}
                            className="w-full bg-[#0F1115] border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none min-h-[80px] resize-none placeholder-gray-700"
                            placeholder="Enter item description..."
                        />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                        <input
                            type="text"
                            value={item.Quantity}
                            onChange={(e) => handleFieldChange(index, "Quantity", e.target.value)}
                            className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
                        />
                    </div>

                    {/* Unit */}
                    <div className="col-span-2">
                         <input
                            type="text"
                            value={item.Unit}
                            onChange={(e) => handleFieldChange(index, "Unit", e.target.value)}
                            className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end items-start pt-2">
                        <button 
                            onClick={() => handleDeleteItem(index)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}

            {/* Empty State */}
            {items.length === 0 && (
                <div className="text-center py-20 text-gray-600 border border-dashed border-white/10 rounded-xl">
                    No requirements added yet. Click "Add Line" to start.
                </div>
            )}
        </div>
      </div>

    </div>
  );
}