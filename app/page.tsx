"use client";

import { useState } from "react";
import TicketsBoard from "./components/tickets/TicketBoard";
import TicketSidebar from "./components/tickets/TicketSidebar";
import RequirementsEditor from "./components/dashboard/RequirementsEditor"; 
import { EmailExtraction, ExtractionRequirement, QuotationFile,ActivityLog } from "../types/email";

export default function DashboardPage() {
  const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);

  // 1. State for View Mode
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  // ✅ ADD THIS NEW HANDLER
  const handlePriorityChanged = (newPriority: string) => {
    if (!selectedTicket) return;
    // Update the parent state immediately so it doesn't revert
    setSelectedTicket(prev => prev ? ({ ...prev, ticket_priority: newPriority }) : null);
  };
  const handleActivityLogAdded = (newLog: ActivityLog) => {
    if (!selectedTicket) return;
    
    setSelectedTicket(prev => {
      if (!prev) return null;
    
      const updatedLogs = [...(prev.activity_logs || []), newLog];
      
      return {
        ...prev,
        activity_logs: updatedLogs
      };
    });
  };
const handleStatusChanged = (newStatus: string) => {
    if (!selectedTicket) return;

    // 1. Update the selected ticket in view
    const updatedTicket = { ...selectedTicket, ticket_status: newStatus };
    setSelectedTicket(updatedTicket);
  };
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };
const handleNoteAdded = (newNote: any) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({
      ...prev,
      internal_notes: [...(prev.internal_notes || []), newNote]
    }) : null);
  };
  // 3. Handler to Close Editor
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  // 4. Handler for Quotation File Added
  const handleFileAdded = (newFile: QuotationFile) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({
      ...prev,
      quotation_files: [...(prev.quotation_files || []), newFile]
    }) : null);
  };

  // 5. Handler for CPO File Added (✅ NEW HANDLER)
  const handleCPOAdded = (newFile: QuotationFile) => {
    if (!selectedTicket) return;
    setSelectedTicket(prev => prev ? ({
      ...prev,
      // Safely spread existing cpo_files or default to empty array
      cpo_files: [...(prev.cpo_files || []), newFile]
    }) : null);
  };

  // 6. Handler for Requirements Saved
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

  return (
    <div className="relative h-full w-full bg-[#0F1115]">

      {isEditorOpen && selectedTicket ? (
        <RequirementsEditor
          ticket={selectedTicket}
          onBack={handleCloseEditor}
          onSave={handleRequirementsSaved}
        />
      ) : (
        <>
          <div className="h-full w-full overflow-x-auto overflow-y-hidden p-6">
            <div className="h-full min-w-max">
              <TicketsBoard onTicketClick={setSelectedTicket} />
            </div>
          </div>

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
        </>
      )}

    </div>
  );
}