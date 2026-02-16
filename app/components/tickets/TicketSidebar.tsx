import React, { useState, useEffect } from "react";
import {
  X, ChevronsRight, User, Mail, Building, Clock,
  FileText, Download, Maximize2, ShoppingCart,
  MessageSquare, Send, ChevronDown, ChevronRight,
  FileCheck, AlertTriangle, CheckCircle2, XCircle,
  ShoppingBag, Truck, Loader2, History, RotateCw
} from "lucide-react";
import { EmailExtraction, QuotationFile, ActivityLog } from "../../../types/email";
import api from "../../../lib/api";
import QuotationSection from "../dashboard/QuotationSection";
import CPOSection from "../dashboard/CPOSection";
import { useAuth } from "../../../context/AuthContext";
import {
  formatUaeDateTime,
  formatUaeTime,
  toUaeDate,
} from "../../../app/lib/time";

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
  onFileDeleted?: (fileId: string) => void;
  onFileUpdated?: (fileId: string, newAmount: string) => void;
}

export default function TicketSidebar({
  ticket, isOpen, onClose, onUpdate,
  onEditRequirements, onFileAdded, onCPOAdded, onNoteAdded,
  onStatusChanged, onActivityLogAdded, onPriorityChanged, onAssignmentChanged,
  onFileDeleted, onFileUpdated
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
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [currentPriority, setCurrentPriority] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // ... (lines omitted)


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

  const [optimisticTicket, setOptimisticTicket] = useState<EmailExtraction | null>(null);

  const internalNotes = (ticket?.internal_notes as InternalNote[]) || [];

  // --- Sync State with Ticket ---
  useEffect(() => {
    setOptimisticTicket(null);
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
    ? [...ticket.activity_logs].sort((a, b) => {
      const tb = toUaeDate(b.timestamp)?.getTime() ?? 0;
      const ta = toUaeDate(a.timestamp)?.getTime() ?? 0;
      return tb - ta;
    })
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
    setOptimisticTicket(prev => ({ ...(prev || ticket), assigned_to: newAssignee, updated_at: new Date().toISOString() }));

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
        setOptimisticTicket(prev => ({ ...(prev || ticket), updated_at: new Date().toISOString() }));
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
      case 'CLOSURE_REQUESTED': return { label: 'Closure Requested', color: 'bg-red-400', icon: <XCircle size={14} /> };
      case 'CLOSED': return { label: 'Closed', color: 'bg-red-500', icon: <XCircle size={14} /> };
      default: return { label: 'Inbox', color: 'bg-indigo-500', icon: <CheckCircle2 size={14} /> };
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;

    // Store old priority for revert
    const oldPriority = currentPriority;

    // Optimistic Update
    setCurrentPriority(newPriority);
    setIsPriorityOpen(false);
    setIsUpdatingPriority(true); // Start Loading
    if (onPriorityChanged) onPriorityChanged(newPriority); // Optimistic callback
    setOptimisticTicket(prev => ({ ...(prev || ticket), ticket_priority: newPriority, updated_at: new Date().toISOString() }));

    try {
      await api.post('/ticket/update-priority', { gmail_id: ticket.gmail_id, priority: newPriority });
      createLocalLog("PRIORITY_CHANGE", `Changed priority to ${newPriority}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update priority", error);
      // Revert on failure
      setCurrentPriority(oldPriority);
      if (onPriorityChanged) onPriorityChanged(oldPriority); // Revert callback
      alert("Failed to update priority");
    } finally {
      setIsUpdatingPriority(false); // Stop Loading
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    // Optimistic UI Update
    const oldStatus = currentStatus;
    setCurrentStatus(newStatus);
    setIsStatusOpen(false);
    if (onStatusChanged) onStatusChanged(newStatus); // Optimistic callback
    setOptimisticTicket(prev => ({ ...(prev || ticket), ticket_status: newStatus, updated_at: new Date().toISOString() }));

    try {
      const identifier = ticket.ticket_number || `TKT-${ticket.id}`;
      await api.put(`/ticket/${identifier}/status`, { status: newStatus });

      createLocalLog("STATUS_CHANGE", `Changed status to ${newStatus}`);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Failed to update status", error);
      setCurrentStatus(oldStatus); // Revert
      if (onStatusChanged) onStatusChanged(oldStatus); // Revert callback

      // Show specific error from backend if available
      const errMsg = error.response?.data?.error || "Failed to update status";
      alert(errMsg);
    }
  };

  const handleSaveDetails = async () => {
    if (!ticket) return;

    const newSenderString = `${editForm.senderName} <${editForm.senderEmail}>`;
    const optimisticUpdate = {
      ...ticket,
      subject: editForm.subject,
      sender: newSenderString,
      company_name: editForm.companyName
    };

    setOptimisticTicket(optimisticUpdate);
    setIsEditing(false);

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
      } else {
        alert("Failed to update details");
        setOptimisticTicket(null);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Update details error", error);
      alert("Error updating details");
      setOptimisticTicket(null);
      setIsEditing(true);
    }
  };

  if (!ticket || !isOpen) return null;

  const displayTicket = optimisticTicket || ticket;

  const senderName = displayTicket.sender.split("<")[0].trim();
  const senderEmail = displayTicket.sender.match(/<([^>]+)>/)?.[1] || displayTicket.sender;
  const companyName = displayTicket.company_name || (senderEmail.includes("@") ? senderEmail.split("@")[1].split(".")[0].toUpperCase() : "Unknown");
  let formattedDate = "Unknown Date";
  try {
    // Show the email's original received time in the header (UAE time)
    const timeToShow = displayTicket.received_at || displayTicket.updated_at;

    if (timeToShow) {
      const dateObj = toUaeDate(timeToShow);
      if (dateObj) {
        // ⬇️ Subtract 4 hours (4 * 60 * 60 * 1000 ms)
        const adjustedDate = new Date(dateObj.getTime() - (4 * 60 * 60 * 1000));
        formattedDate = formatUaeDateTime(adjustedDate);
      }
    }
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

  const dbqId = latestQuotation?.name?.substring(0, 11);
  const poId = latestCPO?.name;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[700px] bg-[rgb(var(--bg-primary))] border-l border-[rgb(var(--border-primary))] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col text-sm text-[rgb(var(--text-secondary))]">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-2">

            {/* Ticket ID */}
            <span className="font-mono text-[12px] font-bold text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] px-2 py-1 rounded border border-[rgb(var(--border-primary))]">
              {ticket.ticket_number || `TKT-${ticket.id}`}
            </span>

            {/* DBQ ID */}
            {dbqId && (
              <>
                <div className="w-4 h-[1px] bg-gray-700" />
                <span className="font-mono text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  {dbqId}
                </span>
              </>
            )}

            {/* PO ID */}
            {poId && (
              <>
                <div className="w-4 h-[1px] bg-gray-700" />
                <span className="font-mono text-[12px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                  {poId}
                </span>
              </>
            )}

            <div className="pl-3 border-l border-white/10 ml-1 relative">
              <button
                onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                disabled={isUpdatingPriority}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all ${isUrgent ? "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20" : "bg-[rgb(var(--bg-tertiary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover-bg))]"}`}
              >
                {isUpdatingPriority ? <Loader2 size={10} className="animate-spin" /> : (isUrgent && <AlertTriangle size={10} />)}
                <span>{currentPriority === "URGENT" ? "Urgent" : "Normal"}</span>
                {!isUpdatingPriority && <ChevronDown size={12} className="opacity-50" />}
              </button>
              {isPriorityOpen && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="p-1">
                    <button onClick={() => handlePriorityChange("NORMAL")} className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover-bg))] rounded flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--text-secondary))]" /> Normal</button>
                    <button onClick={() => handlePriorityChange("URGENT")} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2"><AlertTriangle size={10} /> Urgent</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isEditing ? "text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20" : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"}`}
            >
              {isEditing ? <CheckCircle2 size={14} /> : <FileText size={14} />}
              {isEditing ? "Editing Info" : "Edit Info"}
            </button>
            <button onClick={onClose} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">
          <div>
            {isEditing ? (
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <label className="text-xs text-[rgb(var(--text-tertiary))] mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded px-3 py-2 text-[rgb(var(--text-primary))] text-sm focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[rgb(var(--text-tertiary))] mb-1 block">Sender Name</label>
                    <input
                      type="text"
                      value={editForm.senderName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, senderName: e.target.value }))}
                      className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[rgb(var(--text-tertiary))] mb-1 block">Sender Email</label>
                    <input
                      type="text"
                      value={editForm.senderEmail}
                      onChange={(e) => setEditForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                      className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--text-tertiary))] mb-1 block">Company Name</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-[#0F1115] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                    placeholder="Enter company name"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 mt-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--hover-bg))] transition-colors">Cancel</button>
                  <button onClick={handleSaveDetails} className="px-3 py-1.5 rounded bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Save Changes</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-6 leading-snug">{displayTicket.subject || "No Subject"}</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]"><User size={16} /><span className="truncate">{senderName}</span></div>
                  <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]"><Mail size={16} /><span className="truncate">{senderEmail}</span></div>
                  <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]"><Building size={16} /><span>{companyName}</span></div>
                  <div className="flex items-center gap-3 text-[rgb(var(--text-secondary))]"><Clock size={16} /><span>{formattedDate}</span></div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold tracking-wider text-[rgb(var(--text-tertiary))] uppercase">Status</label>

              {/* Status Display Button */}
              <button
                onClick={() => isAdmin && setIsStatusOpen(!isStatusOpen)}
                disabled={!isAdmin}
                title={!isAdmin ? "Only Admins can manually change status." : ""}
                className={`w-full flex items-center justify-between bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2.5 transition-colors ${isAdmin ? "hover:border-[rgb(var(--hover-border))]" : "opacity-50 cursor-not-allowed"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig.color} shadow-[0_0_8px_rgba(255,255,255,0.3)]`}></div>
                  <span className="text-[rgb(var(--text-primary))] text-xs">{statusConfig.label}</span>
                </div>
                {isAdmin && <ChevronDown size={14} className="text-[rgb(var(--text-tertiary))]" />}
              </button>

              {/* Admin Dropdown */}
              {isStatusOpen && isAdmin && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-xl overflow-hidden z-20">
                  <div className="p-1 space-y-0.5">
                    {[{ val: 'OPEN', label: 'Inbox', col: 'bg-indigo-500' }, { val: 'SENT', label: 'Sent', col: 'bg-blue-500' }, { val: 'ORDER_CONFIRMED', label: 'Order Confirmed', col: 'bg-purple-500' }, { val: 'ORDER_COMPLETED', label: 'Order Completed', col: 'bg-emerald-500' }, { val: 'CLOSED', label: 'Closed', col: 'bg-red-500' }].map((opt) => (
                      <button key={opt.val} onClick={() => handleStatusChange(opt.val)} className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover-bg))] rounded flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${opt.col}`} /> {opt.label}</button>
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
                  currentStatus !== 'COMPLETION_REQUESTED' && currentStatus !== 'CLOSURE_REQUESTED' && currentStatus !== 'CLOSED' && currentStatus !== 'ORDER_COMPLETED' && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleStatusChange('COMPLETION_REQUESTED')}
                        className="flex-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Truck size={12} /> Request Completion
                      </button>
                      <button
                        onClick={() => handleStatusChange('CLOSURE_REQUESTED')}
                        className="flex-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 hover:bg-gray-500/20 text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={12} /> Request Closure
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Assigned To Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-[rgb(var(--text-tertiary))] uppercase">Assigned To</label>
              {isAdmin ? (
                <div className="relative">
                  <select value={currentAssignee} onChange={handleAssignChange} className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2.5 text-xs text-[rgb(var(--text-primary))] appearance-none cursor-pointer hover:border-[rgb(var(--hover-border))] focus:outline-none focus:border-emerald-500/50">
                    <option value="">Unassigned</option>
                    {allUsers && Array.isArray(allUsers) && allUsers.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-[rgb(var(--text-tertiary))] pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2.5 opacity-80">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">{currentAssignee ? currentAssignee.charAt(0).toUpperCase() : "?"}</div>
                    <span className={`text-xs ${currentAssignee ? "text-[rgb(var(--text-primary))]" : "text-[rgb(var(--text-tertiary))] italic"}`}>{currentAssignee || "Unassigned"}</span>
                  </div>
                  <span className="text-[rgb(var(--text-tertiary))] text-[10px]">Read-only</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><FileText size={18} className="text-[rgb(var(--text-secondary))]" /><span className="font-medium text-[rgb(var(--text-primary))]">Requirements</span><span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">{requirementsCount} items</span></div>
              <div className="flex gap-2">
                {ticket.extraction_status === "VALID" ? (<button onClick={handleDownload} className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors"><Download size={12} /> Excel</button>) : <span className="text-[10px] font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Irrelevant</span>}
                <button onClick={onEditRequirements} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"><Maximize2 size={14} /> View</button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="border-b border-white/5 pb-2">
              <button onClick={() => toggleSection('files')} className="w-full flex items-center justify-between py-3 hover:text-[rgb(var(--text-primary))] transition-colors group"><div className="flex items-center gap-3 font-medium text-[rgb(var(--text-secondary))] group-hover:text-emerald-400"><FileCheck size={20} className="text-emerald-500" /><span>Quotation Files</span></div>{sections.files ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.files && <div className="mt-3 animate-in slide-in-from-top-2 duration-200"><QuotationSection ticket={ticket} onFileAdded={(f) => { if (onFileAdded) onFileAdded(f); if (onUpdate) onUpdate(); setOptimisticTicket(prev => ({ ...(prev || ticket), updated_at: new Date().toISOString() })); }} onFileDeleted={(id) => { if (onFileDeleted) onFileDeleted(id); if (onUpdate) onUpdate(); setOptimisticTicket(prev => ({ ...(prev || ticket), updated_at: new Date().toISOString() })); }} onFileUpdated={(id, amount) => { if (onFileUpdated) onFileUpdated(id, amount); if (onUpdate) onUpdate(); setOptimisticTicket(prev => ({ ...(prev || ticket), updated_at: new Date().toISOString() })); }} isAdmin={isAdmin} /></div>}
            </div>
            <div className="border-b border-white/5 pb-2">
              <button onClick={() => toggleSection('cpo')} className="w-full flex items-center justify-between py-3 hover:text-[rgb(var(--text-primary))] transition-colors group"><div className="flex items-center gap-3 font-medium text-[rgb(var(--text-secondary))] group-hover:text-emerald-400"><ShoppingCart size={20} className="text-emerald-500" /><span>Customer Purchase Order (CPO)</span></div>{sections.cpo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.cpo && <div className="mt-3 animate-in slide-in-from-top-2 duration-200"><CPOSection ticket={ticket} onFileAdded={(f) => { if (onCPOAdded) onCPOAdded(f); if (onUpdate) onUpdate(); setOptimisticTicket(prev => ({ ...(prev || ticket), updated_at: new Date().toISOString() })); }} onFileDeleted={(id) => { if (onFileDeleted) onFileDeleted(id); if (onUpdate) onUpdate(); setOptimisticTicket(prev => ({ ...(prev || ticket), updated_at: new Date().toISOString() })); }} isAdmin={isAdmin} /></div>}
            </div>
            <div>
              <button onClick={() => toggleSection('notes')} className="w-full flex items-center justify-between py-3 hover:text-[rgb(var(--text-primary))] transition-colors group"><div className="flex items-center gap-3 font-medium text-[rgb(var(--text-secondary))] group-hover:text-emerald-400"><MessageSquare size={20} className="text-emerald-500" /><span>Internal Notes ({internalNotes.length})</span></div>{sections.notes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.notes && (
                <div className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2"><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full h-20 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 text-sm text-[rgb(var(--text-secondary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-emerald-500/50 resize-none" placeholder="Add an internal note..." ></textarea><button onClick={handleAddNote} disabled={isSendingNote || !noteText.trim()} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-emerald-900/20">{isSendingNote ? <Loader2 size={16} className="animate-spin " /> : <Send size={16} className="text-emerald-500" />} Add Note</button></div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {internalNotes.length > 0 ? (
                      internalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-secondary))] rounded-lg p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))]">
                            <span className="font-semibold text-emerald-500">
                              {note.author}
                            </span>
                            <span>{formatUaeDateTime(note.created_at)}</span>
                          </div>
                          <p className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-wrap">
                            {note.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-[rgb(var(--text-tertiary))] italic py-2">
                        No notes yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/5 pt-2">
              <button onClick={() => toggleSection('activity')} className="w-full flex items-center justify-between py-3 hover:text-[rgb(var(--text-primary))] transition-colors group"><div className="flex items-center gap-3 font-medium text-[rgb(var(--text-secondary))] group-hover:text-emerald-400"><History size={18} /><span>Activity Logs ({sortedLogs.length})</span></div>{sections.activity ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              {sections.activity && (
                <div className="mt-2 space-y-0 pl-2 max-h-80 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                  {sortedLogs.length > 0 ? (
                    sortedLogs.map((log) => (
                      <div key={log.id} className="relative pl-6 pb-6 border-l border-white/10 last:border-0 last:pb-0 group">
                        <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] flex items-center justify-center">{getLogIcon(log.action)}</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[rgb(var(--text-primary))]">
                              {log.user}
                            </span>
                            <span className="text-[10px] text-[rgb(var(--text-tertiary))]">
                              {formatUaeTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-[rgb(var(--text-secondary))]">{log.description}</p>
                        </div>
                      </div>
                    ))
                  ) : <div className="text-center text-xs text-[rgb(var(--text-tertiary))] italic py-2">No activity recorded yet.</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        {/* <div className="p-4 border-t border-white/10 bg-[#0F1115] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-2">
            <X size={14} /> Close
          </button>
        </div> */}
      </div>
    </>
  );
}