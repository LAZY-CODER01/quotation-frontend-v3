import React, { useState, useEffect } from "react";
import { 
  X, ChevronsRight, User, Mail, Building, Clock, 
  FileText, Download, Maximize2, ShoppingCart, 
  MessageSquare, Send, ChevronDown, ChevronRight, 
  FileCheck, AlertTriangle, CheckCircle2, XCircle, 
  ShoppingBag, Truck
} from "lucide-react";
import { format } from "date-fns";
import { EmailExtraction ,QuotationFile } from "../../../types/email";

import api from "../../../lib/api";
import QuotationSection from "../dashboard/QuotationSection";
interface TicketSidebarProps {
  ticket: EmailExtraction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
    // 1. Add this prop
  onEditRequirements?: () => void; 
  onFileAdded?: (newFile: QuotationFile) => void;
}

export default function TicketSidebar({ ticket, isOpen, onClose, onUpdate, onEditRequirements ,onFileAdded
}: TicketSidebarProps) {
  // --- Local State ---
  const [sections, setSections] = useState({
    files: false,
    cpo: false,
    notes: true
  });

  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [currentPriority, setCurrentPriority] = useState("");
  
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  // --- Sync State with Ticket ---
  useEffect(() => {
    if (ticket) {
      setCurrentPriority(ticket.ticket_priority || "NORMAL");
      setCurrentStatus(ticket.ticket_status || "OPEN");
    }
  }, [ticket]);

  // --- Helpers ---
  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SENT': return { label: 'Sent', color: 'bg-blue-500', icon: <Send size={14} /> };
      case 'ORDER_CONFIRMED': return { label: 'Order Confirmed', color: 'bg-yellow-500', icon: <ShoppingBag size={14} /> };
      case 'ORDER_COMPLETED': return { label: 'Order Completed', color: 'bg-emerald-500', icon: <Truck size={14} /> };
      case 'CLOSED': return { label: 'Closed', color: 'bg-gray-500', icon: <XCircle size={14} /> };
      default: return { label: 'Inbox', color: 'bg-indigo-500', icon: <CheckCircle2 size={14} /> };
    }
  };

  // --- API Handlers ---

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    // Optimistic Update
    setCurrentPriority(newPriority);
    setIsPriorityOpen(false);

    try {
      await api.post('/ticket/update-priority', {
        ticket_number: ticket.ticket_number,
        priority: newPriority
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update priority", error);
      setCurrentPriority(ticket.ticket_priority || "NORMAL"); // Revert
      alert("Failed to update priority");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    // Optimistic Update
    setCurrentStatus(newStatus);
    setIsStatusOpen(false);

    try {
      await api.post('/ticket/update-status', {
        ticket_number: ticket.ticket_number,
        status: newStatus
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update status", error);
      setCurrentStatus(ticket.ticket_status || "OPEN"); // Revert
      alert("Failed to update status");
    }
  };

  if (!ticket || !isOpen) return null;

  // --- Derived Data ---
  const senderName = ticket.sender.split("<")[0].trim();
  const senderEmail = ticket.sender.match(/<([^>]+)>/)?.[1] || ticket.sender;
  const companyName = senderEmail.includes("@") 
    ? senderEmail.split("@")[1].split(".")[0].charAt(0).toUpperCase() + senderEmail.split("@")[1].split(".")[0].slice(1) + " Inc."
    : "Unknown Company";
  
  const formattedDate = ticket.received_at 
    ? format(new Date(ticket.received_at), "MMM d, yyyy h:mm a")
    : "Unknown Date";

  const requirementsCount = ticket.extraction_result?.Requirements?.length || 0;
  const isUrgent = currentPriority === "URGENT";
  const statusConfig = getStatusConfig(currentStatus);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed top-0 right-0 h-full w-[650px] bg-[#0F1115] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col text-sm text-gray-300">
        
        {/* --- 1. Top Bar --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Ticket ID */}
            <span className="font-mono text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
              {ticket.ticket_number || `TKT-${ticket.id}`}
            </span>
            
            {/* Priority Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                className={`
                  flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all
                  ${isUrgent 
                    ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }
                `}
              >
                {isUrgent && <AlertTriangle size={10} />}
                <span>{currentPriority === "URGENT" ? "Urgent" : "Normal"}</span>
                <ChevronDown size={12} className="opacity-50" />
              </button>

              {isPriorityOpen && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#181A1F] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-1">
                    <button
                      onClick={() => handlePriorityChange("NORMAL")}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Normal
                    </button>
                    <button
                      onClick={() => handlePriorityChange("URGENT")}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2"
                    >
                       <AlertTriangle size={10} />
                       Urgent
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <ChevronsRight size={14} />
              <span>Collapse</span>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- Scrollable Content Area --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* --- 2. Header & Meta Info --- */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 leading-snug">
              {ticket.subject || "No Subject"}
            </h2>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center gap-3 text-gray-400">
                <User size={16} className="text-gray-500" />
                <span className="truncate" title={senderName}>{senderName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail size={16} className="text-gray-500" />
                <span className="truncate" title={senderEmail}>{senderEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Building size={16} className="text-gray-500" />
                <span>{companyName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Clock size={16} className="text-gray-500" />
                <span className="whitespace-nowrap">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* --- 3. Status & Assignment --- */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Status Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Status</label>
              
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between bg-[#181A1F] border border-white/10 rounded-lg px-3 py-2.5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig.color} shadow-[0_0_8px_rgba(255,255,255,0.3)]`}></div>
                  <span className="text-white text-xs">{statusConfig.label}</span>
                </div>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {isStatusOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#181A1F] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-1 space-y-0.5">
                    {[
                      { val: 'OPEN', label: 'Inbox', col: 'bg-indigo-500' },
                      { val: 'SENT', label: 'Sent', col: 'bg-blue-500' },
                      { val: 'ORDER_CONFIRMED', label: 'Order Confirmed', col: 'bg-yellow-500' },
                      { val: 'ORDER_COMPLETED', label: 'Order Completed', col: 'bg-emerald-500' },
                      { val: 'CLOSED', label: 'Closed', col: 'bg-gray-500' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => handleStatusChange(opt.val)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded flex items-center gap-2 transition-colors"
                      >
                         <div className={`w-1.5 h-1.5 rounded-full ${opt.col}`} />
                         {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assigned To (Visual Placeholder) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Assigned To</label>
              <div className="flex items-center justify-between bg-[#181A1F] border border-white/10 rounded-lg px-3 py-2.5 cursor-pointer opacity-70">
                 <span className="text-gray-500 italic text-xs">Unassigned</span>
                <ChevronDown size={14} className="text-gray-500" />
              </div>
            </div>
            
          </div>

          {/* --- 4. Requirements Card --- */}
          <div className="bg-[#181A1F] border border-white/10 rounded-xl p-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    <span className="font-medium text-white">Requirements</span>
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {requirementsCount} items
                    </span>
                </div>
                
                <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors">
                        <Download size={14} />
                        Draft
                    </button>
                   <button 
                        onClick={onEditRequirements} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Maximize2 size={14} />
                        View ({requirementsCount})
                    </button>
                </div>
             </div>
             <p className="text-xs text-gray-600">Open for bulk editing</p>
          </div>

          {/* --- 5. Collapsible Sections --- */}
          <div className="space-y-2 border-t border-white/10 pt-4">
             {/* Section: Files */}
             <div className="border-b border-white/5 pb-2">
                <button 
                  onClick={() => toggleSection('files')}
                  className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"
                >
                    <div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400">
                        <FileCheck size={18} />
                        <span>Quotation Files</span>
                    </div>
                    {sections.files ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                 {sections.files && (
    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
      <QuotationSection 
                ticket={ticket} 
                onFileAdded={onFileAdded} // Pass it down
            />
    </div>
  )}
             </div>

             {/* Section: CPO */}
             <div className="border-b border-white/5 pb-2">
                <button 
                  onClick={() => toggleSection('cpo')}
                  className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"
                >
                    <div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400">
                        <ShoppingCart size={18} />
                        <span>Customer Purchase Order (CPO)</span>
                    </div>
                    {sections.cpo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
             </div>

             {/* Section: Internal Notes (Active) */}
             <div>
                <button 
                  onClick={() => toggleSection('notes')}
                  className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"
                >
                    <div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400">
                        <MessageSquare size={18} />
                        <span>Internal Notes</span>
                    </div>
                    {sections.notes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {sections.notes && (
                    <div className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <textarea 
                            className="w-full h-24 bg-[#0A0B0D] border border-white/10 rounded-lg p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                            placeholder="Add an internal note..."
                        ></textarea>
                        <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20">
                            <Send size={16} />
                            Add Note
                        </button>
                    </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </>
  );
}