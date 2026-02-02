"use client";

import { useEffect, useState, useMemo } from "react";
import TicketColumn from "./TicketColumn";
import api from "../../../lib/api";
import { EmailExtraction } from "../../../types/email";
import { FilterState } from "../../../types/filters";

interface TicketsBoardProps {
  onTicketClick?: (ticket: EmailExtraction) => void;
  activeFilters?: FilterState;
  loadMoreTrigger?: number; // Prop from Dashboard
}

export default function TicketsBoard({ onTicketClick, activeFilters, loadMoreTrigger }: TicketsBoardProps) {
  const [emails, setEmails] = useState<EmailExtraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // --- 1. Initial Fetch ---
  useEffect(() => {
    fetchInitialBatch();
  }, []);

  // --- 2. Listen for Load More Trigger from Header ---
  useEffect(() => {
    if (loadMoreTrigger && loadMoreTrigger > 0) {
      loadMoreOlderTickets();
    }
  }, [loadMoreTrigger]);

  const fetchInitialBatch = async () => {
    try {
      setLoading(true);
      const response = await api.get("/emails", { params: { days: 10 } });
      if (response.data.success) {
        setEmails(response.data.data);
        setLastSyncTime(new Date().toISOString());
      } else {
        setError("Failed to load tickets");
      }
    } catch (err) {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOlderTickets = async () => {
    if (emails.length === 0) return;

    // Find oldest date for the 'before' cursor
    const oldestDate = emails.reduce((oldest, current) => {
      return new Date(current.received_at) < new Date(oldest) ? current.received_at : oldest;
    }, emails[0].received_at);

    try {
      const response = await api.get("/emails", {
        params: { before: oldestDate, limit: 20 }
      });

      if (response.data.success) {
        const olderTickets = response.data.data;
        setEmails(prevEmails => {
          const emailMap = new Map(prevEmails.map(e => [e.gmail_id, e]));
          olderTickets.forEach((update: EmailExtraction) => {
            emailMap.set(update.gmail_id, update);
          });
          return Array.from(emailMap.values()).sort((a, b) =>
            new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
          );
        });
      }
    } catch (err) {
      console.error("Pagination error:", err);
    }
  };

  // --- 3. Polling for Delta Sync ---
  useEffect(() => {
    if (!lastSyncTime) return;
    const intervalId = setInterval(async () => {
      try {
        const response = await api.get("/emails", { params: { since: lastSyncTime } });
        if (response.data.success && response.data.data.length > 0) {
          const updates = response.data.data as EmailExtraction[];
          setEmails(prevEmails => {
            const emailMap = new Map(prevEmails.map(e => [e.gmail_id, e]));
            updates.forEach(update => emailMap.set(update.gmail_id, update));
            return Array.from(emailMap.values()).sort((a, b) =>
              new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
            );
          });
          setLastSyncTime(new Date().toISOString());
        }
      } catch (e) { console.error("Polling error:", e); }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [lastSyncTime]);

  // --- 4. Filtering Logic ---
  const filteredEmails = useMemo(() => {
    let result = emails.filter(e => e.extraction_status === "VALID");
    if (!activeFilters) return result;

    return result.filter((ticket) => {
      // Status Filter logic
      if (activeFilters.statuses.length > 0) {
        const acceptableStatuses: string[] = [];
        const norm = (s: string) => s?.toUpperCase() || '';
        if (activeFilters.statuses.includes('Inbox')) acceptableStatuses.push('OPEN', 'INBOX');
        if (activeFilters.statuses.includes('Sent')) acceptableStatuses.push('SENT');
        if (activeFilters.statuses.includes('Order Confirmed')) acceptableStatuses.push('ORDER_CONFIRMED');
        if (activeFilters.statuses.includes('Order Completed')) acceptableStatuses.push('ORDER_COMPLETED');
        if (activeFilters.statuses.includes('Closed')) acceptableStatuses.push('CLOSED');
        const currentStatus = ticket.ticket_status ? norm(ticket.ticket_status) : 'OPEN';
        if (!acceptableStatuses.some(status => norm(status) === currentStatus)) return false;
      }
      
      // Urgency, Date, and Search filters
      if (activeFilters.urgency !== 'ALL') {
        if ((ticket.ticket_priority?.toUpperCase() || 'NON_URGENT') !== activeFilters.urgency.toUpperCase()) return false;
      }
      if (activeFilters.clientEmail && !ticket.sender?.toLowerCase().includes(activeFilters.clientEmail.toLowerCase())) return false;
      if (activeFilters.ticketNumber && !ticket.ticket_number?.toLowerCase().includes(activeFilters.ticketNumber.toLowerCase())) return false;

      return true;
    });
  }, [emails, activeFilters]);

  // --- 5. Columns Segregation ---
  const getCol = (statusArray: string[]) => 
    filteredEmails.filter(e => statusArray.includes(e.ticket_status?.toUpperCase() || 'OPEN'));

  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

  if (loading && emails.length === 0) return <div className="p-8 text-center text-zinc-500">Loading tickets...</div>;

  return (
    <div className="flex h-full gap-6 pb-4 overflow-x-auto bg-[#0F1115]">
      <TicketColumn title="Inbox" count={getCol(['OPEN', 'INBOX']).length} color="blue" date={todayDate} tickets={getCol(['OPEN', 'INBOX'])} onTicketClick={onTicketClick} />
      <TicketColumn title="Sent" count={getCol(['SENT']).length} color="yellow" tickets={getCol(['SENT'])} onTicketClick={onTicketClick} />
      <TicketColumn title="Order Confirmed" count={getCol(['ORDER_CONFIRMED']).length} color="emerald" tickets={getCol(['ORDER_CONFIRMED'])} onTicketClick={onTicketClick} />
      <TicketColumn title="Order Completed" count={getCol(['ORDER_COMPLETED']).length} color="green" tickets={getCol(['ORDER_COMPLETED'])} onTicketClick={onTicketClick} />
      <TicketColumn title="Closed" count={getCol(['CLOSED']).length} color="blue" tickets={getCol(['CLOSED'])} onTicketClick={onTicketClick} />
    </div>
  );
}