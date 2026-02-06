"use client";

import { useState } from "react";
import { Filter, Plus } from "lucide-react";

// Components
import TicketsBoard from "./components/tickets/TicketBoard";
import TicketSidebar from "./components/tickets/TicketSidebar";
import RequirementsEditor from "./components/dashboard/RequirementsEditor";
import FilterSidebar from "./components/layout/FilterSidebar"; // Check if this path matches your folder structure
import { Clock, Loader2 } from "lucide-react";
// Types
import { FilterState, INITIAL_FILTERS } from "./../types/filters";
import { EmailExtraction, ExtractionRequirement, QuotationFile, ActivityLog } from "../types/email";
import DateRangeModal from "./components/modals/DateRangeModal";
import NewTicketModal from "./components/modals/NewTicketModal";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useInfiniteTickets } from "../hooks/useTickets";
export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadMoreTrigger, setLoadMoreTrigger] = useState(0);

  // ✅ NEW: Date Range Modal State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const handleLoadMore = () => {
    setLoadingOlder(true);
    setLoadMoreTrigger(prev => prev + 1);
    // Reset loading state after a delay or pass a callback to the board
    setTimeout(() => setLoadingOlder(false), 1000);
  };
  // 1. State for Views & Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // --- Handlers ---

  // Helper to update infinite query cache
  const updateTicketInCache = (updater: (ticket: EmailExtraction) => EmailExtraction) => {
    if (!selectedTicket) return;
    const queryKey = ["tickets", "infinite", 10]; // Matches default days=10

    queryClient.setQueryData<InfiniteData<EmailExtraction[]>>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map(page =>
          page.map(ticket =>
            (ticket.id === selectedTicket.id || ticket.gmail_id === selectedTicket.gmail_id)
              ? updater(ticket)
              : ticket
          )
        )
      };
    });

  };

  const handlePriorityChanged = (newPriority: string) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, ticket_priority: newPriority };
    setSelectedTicket(updated);
    updateTicketInCache(t => ({ ...t, ticket_priority: newPriority }));
  };

  const handleStatusChanged = (newStatus: string) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, ticket_status: newStatus };
    setSelectedTicket(updated);
    updateTicketInCache(t => ({ ...t, ticket_status: newStatus }));
  };

  const handleActivityLogAdded = (newLog: ActivityLog) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => {
      if (!prev) return null;
      const updatedLogs = [...(prev.activity_logs || []), newLog];
      return { ...prev, activity_logs: updatedLogs };
    });
    // Activity logs don't show on card typically, so cache update optional but good for consistency
    updateTicketInCache(t => ({ ...t, activity_logs: [...(t.activity_logs || []), newLog] }));
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleNoteAdded = (newNote: any) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({
      ...prev,
      internal_notes: [...(prev.internal_notes || []), newNote]
    }) : null);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterOpen(false);
  };

  const handleFileAdded = (newFile: QuotationFile) => {
    if (!selectedTicket) return;
    const updatedQuotations = [...(selectedTicket.quotation_files || []), newFile];
    // ✅ Optimistic Status Update: Set to SENT
    const updatedTicket = {
      ...selectedTicket,
      quotation_files: updatedQuotations,
      ticket_status: 'SENT'
    };
    setSelectedTicket(updatedTicket);
    updateTicketInCache(t => ({
      ...t,
      quotation_files: [...(t.quotation_files || []), newFile],
      ticket_status: 'SENT'
    }));
  };

  const handleCPOAdded = (newFile: QuotationFile) => {
    if (!selectedTicket) return;
    const updatedCPOs = [...(selectedTicket.cpo_files || []), newFile];
    // ✅ Optimistic Status Update: Set to ORDER_CONFIRMED
    const updatedTicket = {
      ...selectedTicket,
      cpo_files: updatedCPOs,
      ticket_status: 'ORDER_CONFIRMED'
    };
    setSelectedTicket(updatedTicket);
    updateTicketInCache(t => ({
      ...t,
      cpo_files: [...(t.cpo_files || []), newFile],
      ticket_status: 'ORDER_CONFIRMED'
    }));
  };

  const handleFileDeleted = (fileId: string) => {
    if (!selectedTicket) return;
    // Attempt to remove from both arrays as we don't know type easily here without iterating
    const updateFiles = (t: EmailExtraction) => ({
      ...t,
      quotation_files: t.quotation_files?.filter(f => f.id !== fileId) || [],
      cpo_files: t.cpo_files?.filter(f => f.id !== fileId) || []
    });

    setSelectedTicket(prev => prev ? updateFiles(prev) : null);
    updateTicketInCache(updateFiles);
  };

  const handleFileUpdated = (fileId: string, newAmount: string) => {
    if (!selectedTicket) return;
    const updateFiles = (t: EmailExtraction) => {
      const update = (f: QuotationFile) => f.id === fileId ? { ...f, amount: newAmount } : f;
      return {
        ...t,
        quotation_files: t.quotation_files?.map(update) || [],
        cpo_files: t.cpo_files?.map(update) || []
      };
    };
    setSelectedTicket(prev => prev ? updateFiles(prev) : null);
    updateTicketInCache(updateFiles);
  };

  const handleRequirementsSaved = (newReqs: ExtractionRequirement[]) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({
      ...prev,
      extraction_result: {
        ...prev.extraction_result,
        Requirements: newReqs
      }
    }) : null);
  };

  // --- Render ---

  return (
    <div className="relative h-full w-full bg-[#0F1115]">

      {/* Global Filter Sidebar (Always mounted, visibility controlled by prop) */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApply={handleApplyFilters}
      />

      {/* ✅ NEW: Date Range Modal */}
      <DateRangeModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
      />

      {/* ✅ NEW: Create Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
      />

      {isEditorOpen && selectedTicket ? (
        <RequirementsEditor
          ticket={selectedTicket}
          onBack={handleCloseEditor}
          onSave={handleRequirementsSaved}
        />
      ) : (
        <div className="flex flex-col h-full"> {/* Changed to flex-col to stack Header + Board */}

          <div className="flex-none px-6 pt-6 pb-2 flex justify-between items-center bg-black">
            <h1 className="text-xl font-bold text-white">Tickets</h1>

            <div className="flex items-center gap-3">
              {/* ✅ FIXED: "Load Older" opens Modal */}
              <button
                onClick={() => setIsDateModalOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-50"
              >
                <Clock size={16} className="group-hover:text-emerald-400 transition-colors" />
                {"Load Older"}
              </button>

              <button
                onClick={() => setIsFilterOpen(true)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border
                  ${isFilterOpen || JSON.stringify(filters) !== JSON.stringify(INITIAL_FILTERS)
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-[rgb(var(--panel))] border-[rgb(var(--border))] text-gray-300 hover:text-white hover:border-emerald-500'
                  }
                `}
              >
                <Filter size={16} />
                Filters
              </button>

              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Plus size={16} />
                New Ticket
              </button>
            </div>
          </div>

          {/* Main Board Area */}
          <div className="flex-1 w-full overflow-x-auto overflow-y-hidden px-6 pb-6 bg-black">
            <div className="h-full min-w-max bg-black">
              <TicketsBoard
                onTicketClick={setSelectedTicket}
                activeFilters={filters}
                loadMoreTrigger={loadMoreTrigger}
              />
            </div>
          </div>

          {/* Ticket Detail Sidebar */}
          <TicketSidebar
            ticket={selectedTicket}
            isOpen={!!selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onEditRequirements={handleOpenEditor}
            onFileAdded={handleFileAdded}
            onCPOAdded={handleCPOAdded}
            onNoteAdded={handleNoteAdded}
            onStatusChanged={handleStatusChanged}
            onActivityLogAdded={handleActivityLogAdded}
            onPriorityChanged={handlePriorityChanged}
            onFileDeleted={handleFileDeleted}
            onFileUpdated={handleFileUpdated}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["tickets"] })}
          />
        </div>
      )}
    </div>
  );
}