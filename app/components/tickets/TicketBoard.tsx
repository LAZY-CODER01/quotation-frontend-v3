"use client";

import { useEffect, useState, useMemo } from "react";
import TicketColumn from "./TicketColumn";
import api from "../../../lib/api";
import { EmailExtraction } from "../../../types/email";
import { FilterState } from "../../../types/filters";


interface TicketsBoardProps {
  onTicketClick?: (ticket: EmailExtraction) => void;
  activeFilters?: FilterState;
}

export default function TicketsBoard({ onTicketClick, activeFilters }: TicketsBoardProps) {
  const [emails, setEmails] = useState<EmailExtraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await api.get("/emails");
      if (response.data.success) {
        setEmails(response.data.data);
      } else {
        setError("Failed to load emails");
      }
    } catch (err) {
      console.error("Error fetching emails:", err);
      setError("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Centralized Filtering Logic ---
  const filteredEmails = useMemo(() => {
    // Start with all VALID emails (exclude irrelevant ones immediately)
    let result = emails.filter(e => e.extraction_status === "VALID");

    if (!activeFilters) return result;

    return result.filter((ticket) => {
      // A. Status Filter (Mapping UI labels to Backend values)
      if (activeFilters.statuses.length > 0) {
        // Create a flat list of acceptable backend statuses based on UI selection
        const acceptableStatuses: string[] = [];
        
        // Helper to normalize status for comparison
        const norm = (s: string) => s?.toUpperCase() || '';

        if (activeFilters.statuses.includes('Inbox')) acceptableStatuses.push('OPEN', 'INBOX');
        if (activeFilters.statuses.includes('Sent')) acceptableStatuses.push('SENT');
        if (activeFilters.statuses.includes('Order Confirmed')) acceptableStatuses.push('ORDER_CONFIRMED');
        if (activeFilters.statuses.includes('Order Completed')) acceptableStatuses.push('ORDER_COMPLETED');
        if (activeFilters.statuses.includes('Closed')) acceptableStatuses.push('CLOSED');

        // Allow ticket if its status is in the list, OR if it's undefined and we are looking for Inbox (default)
        const currentStatus = ticket.ticket_status ? norm(ticket.ticket_status) : 'OPEN';
        
        // Check if any acceptable status matches the current status
        const isMatch = acceptableStatuses.some(status => norm(status) === currentStatus);
        if (!isMatch) return false;
      }

      // B. Urgency Filter
      if (activeFilters.urgency !== 'ALL') {
        const ticketPriority = ticket.ticket_priority?.toUpperCase() || 'NON_URGENT';
        const filterUrgency = activeFilters.urgency.toUpperCase();
        if (ticketPriority !== filterUrgency) return false;
      }

      // C. Date Range Filter
      if (activeFilters.startDate || activeFilters.endDate) {
        // Create date object from ticket timestamp
        const ticketDateRaw = new Date(ticket.received_at);
        // Reset time to 00:00:00 to compare just dates if needed, 
        // OR keep time if ranges are inclusive. 
        // Here we just compare timestamps against the range boundaries.
        const ticketTime = ticketDateRaw.getTime();

        if (activeFilters.startDate) {
          const start = new Date(activeFilters.startDate);
          start.setHours(0, 0, 0, 0); // Start of selected day
          if (ticketTime < start.getTime()) return false;
        }
        if (activeFilters.endDate) {
          const end = new Date(activeFilters.endDate);
          end.setHours(23, 59, 59, 999); // End of selected day
          if (ticketTime > end.getTime()) return false;
        }
      }

      // D. Company / Employee
      // NOTE: Company ID is not currently available in the EmailExtraction interface.
      // Skipping company filter until backend provides this field.
      
      if (activeFilters.assignedEmployeeId !== 'all') {
         if (ticket.assigned_to !== activeFilters.assignedEmployeeId) return false;
      }

      // E. Text Search (Email & Ticket #)
      if (activeFilters.clientEmail) {
        const sender = ticket.sender || '';
        if (!sender.toLowerCase().includes(activeFilters.clientEmail.toLowerCase())) return false;
      }
      if (activeFilters.ticketNumber) {
        const tktNum = ticket.ticket_number || `ID-${ticket.id}`; // Fallback check
        if (!tktNum.toLowerCase().includes(activeFilters.ticketNumber.toLowerCase())) return false;
      }

      // F. Quotation Filters
      if (activeFilters.quotationStatus !== 'ALL') {
        const hasQuote = (ticket.quotation_files?.length || 0) > 0;
        if (activeFilters.quotationStatus === 'HAS_QUOTATION' && !hasQuote) return false;
        if (activeFilters.quotationStatus === 'NO_QUOTATION' && hasQuote) return false;
      }
      if (activeFilters.quotationReference) {
        const matches = ticket.quotation_files?.some(f => 
           f.name.toLowerCase().includes(activeFilters.quotationReference.toLowerCase())
        );
        if (!matches) return false;
      }

      // G. CPO Filters
      if (activeFilters.cpoStatus !== 'ALL') {
        const hasCPO = (ticket.cpo_files?.length || 0) > 0;
        if (activeFilters.cpoStatus === 'HAS_CPO' && !hasCPO) return false;
        if (activeFilters.cpoStatus === 'NO_CPO' && hasCPO) return false;
      }
      
      // H. Amount Range Filters (Quotation)
      // Parsing amounts can be tricky if they contain currency symbols.
      // Assuming naive string comparison or simple parsing for now.
      if (activeFilters.quotationMinAmount || activeFilters.quotationMaxAmount) {
         const amountStr = ticket.quotation_amount || '0';
         // Simple cleanup: remove currency symbols and commas
         const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g,""));
         
         if (activeFilters.quotationMinAmount) {
             const min = parseFloat(activeFilters.quotationMinAmount);
             if (!isNaN(min) && !isNaN(amount) && amount < min) return false;
         }
         if (activeFilters.quotationMaxAmount) {
             const max = parseFloat(activeFilters.quotationMaxAmount);
             if (!isNaN(max) && !isNaN(amount) && amount > max) return false;
         }
      }

      return true;
    });
  }, [emails, activeFilters]);

  // --- 3. Segregation Logic (Uses filteredEmails now) ---
  
  const inboxTickets = filteredEmails.filter(e => !e.ticket_status || e.ticket_status === "OPEN" || e.ticket_status === "INBOX");
  const sentTickets = filteredEmails.filter(e => e.ticket_status === "SENT");
  const confirmedTickets = filteredEmails.filter(e => e.ticket_status === "ORDER_CONFIRMED");
  const completedTickets = filteredEmails.filter(e => e.ticket_status === "ORDER_COMPLETED");
  const closedTickets = filteredEmails.filter(e => e.ticket_status === "CLOSED");

  // Irrelevant emails (Separate bucket, usually not filtered by main filters, but kept as is from original source)
  const irrelevantTickets = emails.filter(e => e.extraction_status !== "VALID");

  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading tickets...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-full gap-6 pb-4 " >
      
      {/* 1. Inbox Column */}
      <TicketColumn
        title="Inbox"
        count={inboxTickets.length}
        color="blue"
        date={todayDate}
        tickets={inboxTickets}
        onTicketClick={onTicketClick}
      />

      {/* 2. Sent Column */}
      <TicketColumn
        title="Sent"
        count={sentTickets.length}
        color="yellow" 
        date="-"
        tickets={sentTickets}
        onTicketClick={onTicketClick}
      />

      {/* 3. Order Confirmed Column */}
      <TicketColumn
        title="Order Confirmed"
        count={confirmedTickets.length}
        color="emerald"
        date="-"
        tickets={confirmedTickets}
        onTicketClick={onTicketClick}
      />

      {/* 4. Order Completed Column */}
      <TicketColumn
        title="Order Completed"
        count={completedTickets.length}
        color="green"
        date="-"
        tickets={completedTickets}
        onTicketClick={onTicketClick}
      />

      {/* 5. Closed Column */}
      <TicketColumn
        title="Closed"
        count={closedTickets.length}
        color="blue"
        date="-"
        tickets={closedTickets}
        onTicketClick={onTicketClick}
      />

    </div>
  );
}