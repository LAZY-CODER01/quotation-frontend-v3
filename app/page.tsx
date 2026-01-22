"use client";

import { useState } from "react";
import TicketsBoard from "./components/tickets/TicketBoard";
import TicketSidebar from "./components/tickets/TicketSidebar";
import RequirementsEditor from "./components/dashboard/RequirementsEditor"; // Import new component
import { EmailExtraction } from "../types/email";

export default function DashboardPage() {
  const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
  
  // 1. State for View Mode
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // 2. Handler to Open Editor
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
    // We keep selectedTicket set so we know WHAT to edit
  };

  // 3. Handler to Close Editor (refresh board data if needed)
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    // Ideally trigger a re-fetch in board here if data changed, 
    // but for now simplistic toggle is fine.
  };

  return (
    <div className="relative h-full w-full bg-[#0F1115]">
      
      {/* 4. Conditional Rendering */}
      {isEditorOpen && selectedTicket ? (
        // Full Screen Editor
        <RequirementsEditor 
            ticket={selectedTicket} 
            onBack={handleCloseEditor} 
        />
      ) : (
        // Standard Dashboard View
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
                onEditRequirements={handleOpenEditor} // Pass the handler
            />
        </>
      )}

    </div>
  );
}