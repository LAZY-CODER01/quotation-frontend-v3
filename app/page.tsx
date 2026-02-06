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

export default function DashboardPage() {
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

  const handlePriorityChanged = (newPriority: string) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({ ...prev, ticket_priority: newPriority }) : null);
  };

  const handleActivityLogAdded = (newLog: ActivityLog) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => {
      if (!prev) return null;
      const updatedLogs = [...(prev.activity_logs || []), newLog];
      return { ...prev, activity_logs: updatedLogs };
    });
  };

  const handleStatusChanged = (newStatus: string) => {
    if (!selectedTicket) return;
    const updatedTicket = { ...selectedTicket, ticket_status: newStatus };
    setSelectedTicket(updatedTicket);
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
    setSelectedTicket(prev => prev ? ({
      ...prev,
      quotation_files: [...(prev.quotation_files || []), newFile]
    }) : null);
  };

  const handleCPOAdded = (newFile: QuotationFile) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({
      ...prev,
      cpo_files: [...(prev.cpo_files || []), newFile]
    }) : null);
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
          />
        </div>
      )}
    </div>
  );
}