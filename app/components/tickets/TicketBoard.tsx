"use client";

import { useEffect, useState } from "react";
import TicketColumn from "./TicketColumn";
import api from "../../../lib/api";
import { EmailExtraction } from "../../../types/email";

// 1. Define Props Interface
interface TicketsBoardProps {
  onTicketClick?: (ticket: EmailExtraction) => void;
}

export default function TicketsBoard({ onTicketClick }: TicketsBoardProps) {
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

  // --- Segregation Logic ---
  // Default to "OPEN" or "INBOX" if status is missing, but exclude IRRELEVANT ones first
  const validEmails = emails.filter(e => e.extraction_status === "VALID");
  
  const inboxTickets = validEmails.filter(e => !e.ticket_status || e.ticket_status === "OPEN" || e.ticket_status === "INBOX");
  const sentTickets = validEmails.filter(e => e.ticket_status === "SENT");
  const confirmedTickets = validEmails.filter(e => e.ticket_status === "ORDER_CONFIRMED");
  const completedTickets = validEmails.filter(e => e.ticket_status === "ORDER_COMPLETED");
  const closedTickets = validEmails.filter(e => e.ticket_status === "CLOSED");

  // Irrelevant emails are based on extraction_status, not ticket_status
  const irrelevantTickets = emails.filter(e => e.extraction_status !== "VALID");

  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading tickets...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-full gap-6 pb-4">
      
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
        color="yellow" // Using yellow for intermediate state
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
        color="blue" // Grey isn't in your map, defaulting to blue or add 'gray' to map
        date="-"
        tickets={closedTickets}
        onTicketClick={onTicketClick}
      />

      {/* 6. Irrelevant / Archived Column */}
      <TicketColumn
        title="Irrelevant / Archived"
        count={irrelevantTickets.length}
        color="blue"
        date="-"
        tickets={irrelevantTickets}
        onTicketClick={onTicketClick}
      />
    </div>
  );
}