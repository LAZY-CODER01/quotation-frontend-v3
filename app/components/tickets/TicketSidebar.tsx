import React, { useState, useEffect } from "react";
import {
  X, ChevronsRight, User, Mail, Building, Clock,
  FileText, Download, Maximize2, ShoppingCart,
  MessageSquare, Send, ChevronDown, ChevronRight,
  FileCheck, AlertTriangle, CheckCircle2, XCircle,
  ShoppingBag, Truck, Loader2, History, RotateCw
} from "lucide-react";
import { format } from "date-fns";
import { EmailExtraction, QuotationFile, ActivityLog } from "../../../types/email";
import api from "../../../lib/api";
import QuotationSection from "../dashboard/QuotationSection";
import CPOSection from "../dashboard/CPOSection";
import { useAuth } from "../../../context/AuthContext";

interface InternalNote {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

interface TicketSidebarProps {
  ticket: EmailExtraction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onEditRequirements?: () => void;
  onFileAdded?: (newFile: QuotationFile) => void;
  onCPOAdded?: (newFile: QuotationFile) => void;
  onNoteAdded?: (newNote: InternalNote) => void;
  onStatusChanged?: (newStatus: string) => void;
  onActivityLogAdded?: (log: ActivityLog) => void;
  onPriorityChanged?: (newPriority: string) => void;
  onAssignmentChanged?: (newAssignee: string) => void;
}

export default function TicketSidebar({
  ticket, isOpen, onClose, onUpdate,
  onEditRequirements, onFileAdded, onCPOAdded, onNoteAdded,
  onStatusChanged, onActivityLogAdded, onPriorityChanged, onAssignmentChanged
}: TicketSidebarProps) {

  const { user, allUsers } = useAuth(); // ✅ Use allUsers from context
  const isAdmin = user?.role === 'ADMIN';

  const [sections, setSections] = useState({
    files: false,
    cpo: false,
    notes: true,
    activity: true
  });

  const [currentAssignee, setCurrentAssignee] = useState("");
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [currentPriority, setCurrentPriority] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isSendingNote, setIsSendingNote] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: "",
    senderName: "",
    senderEmail: "",
    companyName: ""
  });

  const internalNotes = (ticket?.internal_notes as InternalNote[]) || [];

  // --- Sync State with Ticket ---
  useEffect(() => {
    if (ticket) {
      setCurrentPriority(ticket.ticket_priority || "NORMAL");
      setCurrentStatus(ticket.ticket_status || "OPEN");
      // ✅ This ensures the state matches the DB value on load
      setCurrentAssignee(ticket.assigned_to || "");

      // Initialize Edit Form
      const senderName = ticket.sender.split("<")[0].trim().replace(/"/g, "");
      const senderEmail = ticket.sender.match(/<([^>]+)>/)?.[1] || (ticket.sender.includes("@") ? ticket.sender : "");
      const companyName = ticket.company_name || (senderEmail.includes("@") ? senderEmail.split("@")[1].split(".")[0].toUpperCase() : "");

      setEditForm({
        subject: ticket.subject || "",
        senderName: senderName,
        senderEmail: senderEmail,
        companyName: companyName
      });
    }
  }, [ticket]);

  // --- Helpers ---
  const sortedLogs = ticket?.activity_logs
    ? [...ticket.activity_logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE': return <RotateCw size={14} className="text-blue-400" />;
      case 'EDIT_DETAILS': return <FileText size={14} className="text-indigo-400" />;
      case 'PRIORITY_CHANGE': return <AlertTriangle size={14} className="text-orange-400" />;
      case 'QUOTATION_UPLOAD': return <FileCheck size={14} className="text-green-400" />;
      case 'CPO_UPLOAD': return <ShoppingCart size={14} className="text-purple-400" />;
      case 'NOTE_ADDED': return <MessageSquare size={14} className="text-yellow-400" />;
      case 'ASSIGNMENT_CHANGE': return <User size={14} className="text-pink-400" />;
      default: return <History size={14} className="text-gray-500" />;
    }
  };

  const createLocalLog = (action: string, description: string) => {
    const newLog: ActivityLog = {
      id: `temp-${Date.now()}`,
      action: action,
      description: description,
      user: user?.username || "You",
      timestamp: new Date().toISOString(),
      metadata: {}
    };
    if (onActivityLogAdded) onActivityLogAdded(newLog);
  };

  // --- Handlers ---

  const handleAssignChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssignee = e.target.value;
    if (!ticket) return;

    setCurrentAssignee(newAssignee); // Optimistic Update

    try {
      const res = await api.post('/ticket/assign', {
        gmail_id: ticket.gmail_id,
        assigned_to: newAssignee
      });

      if (res.data.success) {
        if (onAssignmentChanged) onAssignmentChanged(newAssignee);
        if (onActivityLogAdded && res.data.log) onActivityLogAdded(res.data.log);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Assign error", error);
      alert("Failed to assign user");
      setCurrentAssignee(ticket.assigned_to || ""); // Revert
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !ticket) return;
    setIsSendingNote(true);
    try {
      const response = await api.post("/ticket/add-note", {
        gmail_id: ticket.gmail_id,
        text: noteText
      });
      if (response.data.success) {
        setNoteText("");
        if (onNoteAdded) onNoteAdded(response.data.note);
        createLocalLog("NOTE_ADDED", "Added an internal note");
      } else {
        alert("Failed to add note");
      }
    } catch (error) {
      console.error("Note error", error);
      alert("Error saving note");
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ticket) return;
    try {
      const response = await api.get(`/quotation/generate/${ticket.gmail_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${ticket.ticket_number || ticket.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to download quotation.");
    }
  };

  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SENT': return { label: 'Sent', color: 'bg-blue-500', icon: <Send size={14} /> };
      case 'ORDER_CONFIRMED': return { label: 'Order Confirmed', color: 'bg-purple-500', icon: <ShoppingBag size={14} /> };
      case 'ORDER_COMPLETED': return { label: 'Order Completed', color: 'bg-emerald-500', icon: <Truck size={14} /> };
      case 'COMPLETION_REQUESTED': return { label: 'Completion Requested', color: 'bg-orange-500', icon: <AlertTriangle size={14} /> };
      case 'CLOSED': return { label: 'Closed', color: 'bg-red-500', icon: <XCircle size={14} /> };
      default: return { label: 'Inbox', color: 'bg-indigo-500', icon: <CheckCircle2 size={14} /> };
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    setCurrentPriority(newPriority);
    setIsPriorityOpen(false);
    try {
      await api.post('/ticket/update-priority', { gmail_id: ticket.gmail_id, priority: newPriority });
      if (onPriorityChanged) onPriorityChanged(newPriority);
      createLocalLog("PRIORITY_CHANGE", `Changed priority to ${newPriority}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update priority", error);
      setCurrentPriority(ticket.ticket_priority || "NORMAL");
      alert("Failed to update priority");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    // Optimistic UI Update
    const oldStatus = currentStatus;
    setCurrentStatus(newStatus);
    setIsStatusOpen(false);

    try {
      const identifier = ticket.ticket_number || `TKT-${ticket.id}`;
      await api.put(`/ticket/${identifier}/status`, { status: newStatus });

      if (onStatusChanged) onStatusChanged(newStatus);
      createLocalLog("STATUS_CHANGE", `Changed status to ${newStatus}`);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Failed to update status", error);
      setCurrentStatus(oldStatus); // Revert

      // Show specific error from backend if available
      const errMsg = error.response?.data?.error || "Failed to update status";
      alert(errMsg);
    }
  };

  const handleSaveDetails = async () => {
    if (!ticket) return;

    try {
      const payload = {
        gmail_id: ticket.gmail_id,
        subject: editForm.subject,
        sender_name: editForm.senderName,
        sender_email: editForm.senderEmail,
        company_name: editForm.companyName
      };

      const res = await api.post('/ticket/update-details', payload);
      if (res.data.success) {
        if (onUpdate) onUpdate();
        setIsEditing(false);
        // Create local log for immediate feedback if needed, 
        // but backend logs generic "EDIT_DETAILS". 
        // We can just rely on refetch from onUpdate.
      } else {
        alert("Failed to update details");
      }
    } catch (error) {
      console.error("Update details error", error);
      alert("Error updating details");
    }
  };

  if (!ticket || !isOpen) return null;

  const senderName = ticket.sender.split("<")[0].trim();
  const senderEmail = ticket.sender.match(/<([^>]+)>/)?.[1] || ticket.sender;
  const companyName = ticket.company_name || (senderEmail.includes("@") ? senderEmail.split("@")[1].split(".")[0].toUpperCase() : "Unknown");
  let formattedDate = "Unknown Date";
  try {
    formattedDate = ticket.received_at ? format(new Date(ticket.received_at), "MMM d, yyyy h:mm a") : "Unknown Date";
  } catch (e) {
    console.error("Date parsing error", e);
    formattedDate = "Invalid Date";
  }
  const requirementsCount = ticket.extraction_result?.Requirements?.length || 0;
  const isUrgent = currentPriority === "URGENT";
  const statusConfig = getStatusConfig(currentStatus);

  // Get latest reference IDs
  const latestQuotation = ticket.quotation_files && ticket.quotation_files.length > 0
    ? ticket.quotation_files[ticket.quotation_files.length - 1]
    : null;
  const latestCPO = ticket.cpo_files && ticket.cpo_files.length > 0
    ? ticket.cpo_files[ticket.cpo_files.length - 1]
    : null;

  const dbqId = latestQuotation?.reference_id;
  const poId = latestCPO?.reference_id;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[650px] bg-[#0F1115] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col text-sm text-gray-300">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">

            {/* Ticket ID */}
            <span className="font-mono text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
              {ticket.ticket_number || `TKT-${ticket.id}`}
            </span>

            {/* DBQ ID */}
            {dbqId && (
              <>
                <div className="w-4 h-[1px] bg-gray-700" />
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  {dbqId}
                </span>
              </>
            )}

            {/* PO ID */}
            {poId && (
              <>
                <div className="w-4 h-[1px] bg-gray-700" />
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                  {poId}
                </span>
              </>
            )}

            <div className="pl-3 border-l border-white/10 ml-1 relative">
              <button
                onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all ${isUrgent ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
              >
                {isUrgent && <AlertTriangle size={10} />}
                <span>{currentPriority === "URGENT" ? "Urgent" : "Normal"}</span>
                <ChevronDown size={12} className="opacity-50" />
              </button>
              {isPriorityOpen && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#181A1F] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="p-1">
                    <button onClick={() => handlePriorityChange("NORMAL")} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Normal</button>
                    <button onClick={() => handlePriorityChange("URGENT")} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2"><AlertTriangle size={10} /> Urgent</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isEditing ? "text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20" : "text-gray-500 hover:text-white"}`}
            >
              {isEditing ? <CheckCircle2 size={14} /> : <FileText size={14} />}
              {isEditing ? "Editing Info" : "Edit Info"}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">
          <div>
            {isEditing ? (
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Sender Name</label>
                    <input
                      type="text"
                      value={editForm.senderName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, senderName: e.target.value }))}
                      className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Sender Email</label>
                    <input
                      type="text"
                      value={editForm.senderEmail}
                      onChange={(e) => setEditForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                      className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    placeholder="Enter company name"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 mt-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                  <button onClick={handleSaveDetails} className="px-3 py-1.5 rounded bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Save Changes</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white mb-6 leading-snug">{ticket.subject || "No Subject"}</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="flex items-center gap-3 text-gray-400"><User size={16} /><span className="truncate">{senderName}</span></div>
                  <div className="flex items-center gap-3 text-gray-400"><Mail size={16} /><span className="truncate">{senderEmail}</span></div>
                  <div className="flex items-center gap-3 text-gray-400"><Building size={16} /><span>{companyName}</span></div>
                  <div className="flex items-center gap-3 text-gray-400"><Clock size={16} /><span>{formattedDate}</span></div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Status</label>

              {/* Status Display Button */}
              <button
                onClick={() => isAdmin && setIsStatusOpen(!isStatusOpen)}
                disabled={!isAdmin}
                title={!isAdmin ? "Only Admins can manually change status." : ""}
                className={`w-full flex items-center justify-between bg-[#181A1F] border border-white/10 rounded-lg px-3 py-2.5 transition-colors ${isAdmin ? "hover:border-white/20" : "opacity-50 cursor-not-allowed"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig.color} shadow-[0_0_8px_rgba(255,255,255,0.3)]`}></div>
                  <span className="text-white text-xs">{statusConfig.label}</span>
                </div>
                {isAdmin && <ChevronDown size={14} className="text-gray-500" />}
              </button>

              {/* Admin Dropdown */}
              {isStatusOpen && isAdmin && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#181A1F] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
                  <div className="p-1 space-y-0.5">
                    {[{ val: 'OPEN', label: 'Inbox', col: 'bg-indigo-500' }, { val: 'SENT', label: 'Sent', col: 'bg-blue-500' }, { val: 'ORDER_CONFIRMED', label: 'Order Confirmed', col: 'bg-purple-500' }, { val: 'ORDER_COMPLETED', label: 'Order Completed', col: 'bg-emerald-500' }, { val: 'CLOSED', label: 'Closed', col: 'bg-red-500' }].map((opt) => (
                      <button key={opt.val} onClick={() => handleStatusChange(opt.val)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${opt.col}`} /> {opt.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons based on Role */}
              <div className="mt-2 flex gap-2">
                {isAdmin ? (
                  <>
                    {currentStatus !== 'ORDER_COMPLETED' && currentStatus !== 'CLOSED' && (
                      <button
                        onClick={() => handleStatusChange('ORDER_COMPLETED')}
                        className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={12} /> Mark Completed
                      </button>
                    )}
                    {currentStatus !== 'CLOSED' && (
                      <button
                        onClick={() => handleStatusChange('CLOSED')}
                        className="flex-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 hover:bg-gray-500/20 text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={12} /> Close Ticket
                      </button>
                    )}
                  </>
                ) : (
                  currentStatus !== 'COMPLETION_REQUESTED' && currentStatus !== 'CLOSED' && currentStatus !== 'ORDER_COMPLETED' && (
                    <button
                      onClick={() => handleStatusChange('COMPLETION_REQUESTED')}
                      className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Truck size={12} /> Request Completion
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Assigned To Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Assigned To</label>
              {isAdmin ? (
                <div className="relative">
                  <select value={currentAssignee} onChange={handleAssignChange} className="w-full bg-[#181A1F] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white appearance-none cursor-pointer hover:border-white/20 focus:outline-none focus:border-emerald-500/50">
                    <option value="">Unassigned</option>
                    {allUsers && Array.isArray(allUsers) && allUsers.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#181A1F] border border-white/10 rounded-lg px-3 py-2.5 opacity-80">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">{currentAssignee ? currentAssignee.charAt(0).toUpperCase() : "?"}</div>
                    <span className={`text-xs ${currentAssignee ? "text-gray-200" : "text-gray-500 italic"}`}>{currentAssignee || "Unassigned"}</span>
                  </div>
                  <span className="text-gray-600 text-[10px]">Read-only</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#181A1F] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><FileText size={18} className="text-gray-400" /><span className="font-medium text-white">Requirements</span><span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">{requirementsCount} items</span></div>
              <div className="flex gap-2">
                {ticket.extraction_status === "VALID" ? (<button onClick={handleDownload} className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors"><Download size={12} /> Excel</button>) : <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Irrelevant</span>}
                <button onClick={onEditRequirements} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"><Maximize2 size={14} /> View</button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="border-b border-white/5 pb-2">
              <button onClick={() => toggleSection('files')} className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"><div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400"><FileCheck size={20} className="text-emerald-500" /><span>Quotation Files</span></div>{sections.files ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.files && <div className="mt-3 animate-in slide-in-from-top-2 duration-200"><QuotationSection ticket={ticket} onFileAdded={(f) => { if (onFileAdded) onFileAdded(f); if (onUpdate) onUpdate(); }} onFileDeleted={onUpdate} isAdmin={isAdmin} /></div>}
            </div>
            <div className="border-b border-white/5 pb-2">
              <button onClick={() => toggleSection('cpo')} className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"><div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400"><ShoppingCart size={20} className="text-emerald-500" /><span>Customer Purchase Order (CPO)</span></div>{sections.cpo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.cpo && <div className="mt-3 animate-in slide-in-from-top-2 duration-200"><CPOSection ticket={ticket} onFileAdded={(f) => { if (onCPOAdded) onCPOAdded(f); if (onUpdate) onUpdate(); }} onFileDeleted={onUpdate} isAdmin={isAdmin} /></div>}
            </div>
            <div>
              <button onClick={() => toggleSection('notes')} className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"><div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400"><MessageSquare size={20} className="text-emerald-500" /><span>Internal Notes ({internalNotes.length})</span></div>{sections.notes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.notes && (
                <div className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2"><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full h-20 bg-[#0A0B0D] border border-white/10 rounded-lg p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none" placeholder="Add an internal note..." ></textarea><button onClick={handleAddNote} disabled={isSendingNote || !noteText.trim()} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/20">{isSendingNote ? <Loader2 size={16} className="animate-spin " /> : <Send size={16} className="text-emerald-500" />} Add Note</button></div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {internalNotes.length > 0 ? (internalNotes.map((note) => (<div key={note.id} className="bg-[#0A0B0D] border border-white/5 rounded-lg p-3 space-y-1"><div className="flex items-center justify-between text-xs text-gray-500"><span className="font-semibold text-emerald-500">{note.author}</span><span>{new Date(note.created_at).toLocaleString()}</span></div><p className="text-sm text-gray-300 whitespace-pre-wrap">{note.text}</p></div>))) : <div className="text-center text-xs text-gray-600 italic py-2">No notes yet.</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/5 pt-2">
              <button onClick={() => toggleSection('activity')} className="w-full flex items-center justify-between py-3 hover:text-white transition-colors group"><div className="flex items-center gap-3 font-medium text-gray-300 group-hover:text-emerald-400"><History size={18} /><span>Activity Logs ({sortedLogs.length})</span></div>{sections.activity ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.activity && (
                <div className="mt-2 space-y-0 pl-2 max-h-80 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                  {sortedLogs.length > 0 ? (
                    sortedLogs.map((log) => (
                      <div key={log.id} className="relative pl-6 pb-6 border-l border-white/10 last:border-0 last:pb-0 group">
                        <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-[#181A1F] border border-white/10 flex items-center justify-center">{getLogIcon(log.action)}</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-200">{log.user}</span><span className="text-[10px] text-gray-500">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span></div>
                          <p className="text-xs text-gray-400">{log.description}</p>
                        </div>
                      </div>
                    ))
                  ) : <div className="text-center text-xs text-gray-600 italic py-2">No activity recorded yet.</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="p-4 border-t border-white/10 bg-[#0F1115] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-2">
            <X size={14} /> Close
          </button>
        </div>
      </div>
    </>
  );
}