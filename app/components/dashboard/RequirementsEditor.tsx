import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Download, Save, Trash2, Loader2 } from "lucide-react";
import { EmailExtraction, ExtractionRequirement } from "../../../types/email";
import api from "../../../lib/api";

interface RequirementsEditorProps {
  ticket: EmailExtraction;
  onBack: () => void;
  onSave: (updatedRequirements: ExtractionRequirement[]) => void;
}

export default function RequirementsEditor({ ticket, onBack, onSave }: RequirementsEditorProps) {
  const [items, setItems] = useState<ExtractionRequirement[]>([]);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket.extraction_result?.Requirements) {
      setItems(ticket.extraction_result.Requirements);
    }
  }, [ticket]);

  const handleFieldChange = (index: number, field: keyof ExtractionRequirement, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { Description: "", Quantity: "", Unit: "", "Unit price": "" }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await api.post('/ticket/update-requirements', { gmail_id: ticket.gmail_id, requirements: items });
      onSave(items); // Update parent state immediately
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save changes");
      throw error;
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#0F1115] z-50 flex flex-col animate-in fade-in duration-200">
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0F1115]">
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white flex items-center gap-3">
              Requirements Editor
              <span className="font-mono text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">{ticket.ticket_number}</span>
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 border border-white/10"><Plus size={16} /> Add Line</button>
            <button 
                onClick={async () => { try { await saveChanges(); onBack(); } catch (e) {} }} 
                disabled={saving} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-medium shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save & Back
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-1 text-right">Action</div>
            </div>
            {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-[#181A1F] border border-white/5 rounded-xl items-start group">
                    <div className="col-span-1 flex items-center justify-center h-full text-gray-600 font-mono text-sm">{index + 1}</div>
                    <div className="col-span-4"><textarea value={item.Description} onChange={(e) => handleFieldChange(index, "Description", e.target.value)} className="w-full bg-[#0F1115] border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none min-h-[50px] resize-none" placeholder="Description"/></div>
                    <div className="col-span-2"><input type="text" value={item.Quantity} onChange={(e) => handleFieldChange(index, "Quantity", e.target.value)} className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"/></div>
                    <div className="col-span-2"><input type="text" value={item.Unit} onChange={(e) => handleFieldChange(index, "Unit", e.target.value)} className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none"/></div>
                    <div className="col-span-2 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span><input type="text" value={item["Unit price"] || ""} onChange={(e) => handleFieldChange(index, "Unit price", e.target.value)} className="w-full bg-[#0F1115] border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-gray-200 focus:border-emerald-500/50 focus:outline-none" placeholder="0.00"/></div>
                    <div className="col-span-1 flex justify-end items-center h-full"><button onClick={() => handleDeleteItem(index)} className="text-gray-600 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg"><Trash2 size={16} /></button></div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}