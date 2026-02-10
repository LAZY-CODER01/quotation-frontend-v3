"use client";

import { useEffect, useMemo } from "react";
import TicketColumn from "./TicketColumn";
import { EmailExtraction } from "../../../types/email";
import { FilterState } from "../../../types/filters";
import { useInfiniteTickets } from "../../../hooks/useTickets";
import { formatUae } from "../../../app/lib/time";
import { useSearch } from "../../../context/SearchContext";
import { ticketMatchesSearch } from "../../../app/lib/searchUtils";

interface TicketsBoardProps {
  onTicketClick?: (ticket: EmailExtraction) => void;
  activeFilters?: FilterState;
  loadMoreTrigger?: number; // Prop from Dashboard
}

export default function TicketsBoard({ onTicketClick, activeFilters, loadMoreTrigger }: TicketsBoardProps) {
  // 1. Refactored to use useInfiniteTickets
  // 1. Refactored to use useInfiniteTickets
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage
  } = useInfiniteTickets(10, { refetchInterval: 30000 });

  // 2. Listen for Load More Trigger from Header
  useEffect(() => {
    if (loadMoreTrigger && loadMoreTrigger > 0 && hasNextPage) {
      fetchNextPage();
    }
  }, [loadMoreTrigger, fetchNextPage, hasNextPage]);

  // 3. Flatten data for display
  const emails = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  // 4. Filtering Logic (same as before, but operating on cached data)
  const { searchQuery } = useSearch();

  const filteredEmails = useMemo(() => {
    let result = emails.filter(e => e.extraction_status === "VALID");

    // Global Search Filtering
    if (searchQuery) {
      result = result.filter(ticket => ticketMatchesSearch(ticket, searchQuery));
    }

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

      // Urgency, Date, and Search filters (Legacy search filter removed/ignored if unused)
      if (activeFilters.urgency !== 'ALL') {
        if ((ticket.ticket_priority?.toUpperCase() || 'NON_URGENT') !== activeFilters.urgency.toUpperCase()) return false;
      }
      if (activeFilters.clientEmail && !ticket.sender?.toLowerCase().includes(activeFilters.clientEmail.toLowerCase())) return false;
      if (activeFilters.assignedEmployeeName && !ticket.assigned_to?.toLowerCase().includes(activeFilters.assignedEmployeeName.toLowerCase())) return false;
      // if (activeFilters.ticketNumber && !ticket.ticket_number?.toLowerCase().includes(activeFilters.ticketNumber.toLowerCase())) return false;

      return true;
    });
  }, [emails, activeFilters, searchQuery]);

  // 5. Columns Segregation
  const getCol = (statusArray: string[]) =>
    filteredEmails.filter(e => statusArray.includes(e.ticket_status?.toUpperCase() || 'OPEN'));

  const todayDate = formatUae(new Date(), {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  if (isLoading && emails.length === 0) return <div className="p-8 text-center text-zinc-500">Loading tickets...</div>;

  return (
    <div className="flex h-full gap-6 pb-4 overflow-x-auto bg-[#0F1115]">
      {/* Inbox Column */}
      <TicketColumn
        title="Inbox"
        count={getCol(['OPEN', 'INBOX']).length}
        color="blue"
        date={todayDate}
        tickets={getCol(['OPEN', 'INBOX'])}
        onTicketClick={onTicketClick}
        slug="inbox"
      />
      {/* Sent Column */}
      <TicketColumn
        title="Sent"
        count={getCol(['SENT']).length}
        color="yellow"
        tickets={getCol(['SENT'])}
        onTicketClick={onTicketClick}
        slug="sent"
      />
      {/* Order Confirmed Column */}
      <TicketColumn
        title="Order Confirmed"
        count={getCol(['ORDER_CONFIRMED']).length}
        color="purple"
        tickets={getCol(['ORDER_CONFIRMED'])}
        onTicketClick={onTicketClick}
        slug="confirmed"
      />
      {/* Order Completed Column */}
      <TicketColumn
        title="Order Completed"
        count={getCol(['ORDER_COMPLETED']).length}
        color="green"
        tickets={getCol(['ORDER_COMPLETED'])}
        onTicketClick={onTicketClick}
        slug="completed"
      />
      {/* Closed Column */}
      <TicketColumn
        title="Closed"
        count={getCol(['CLOSED']).length}
        color="red"
        tickets={getCol(['CLOSED'])}
        onTicketClick={onTicketClick}
        slug="closed"
      />

      {/* Load More Indicator (Optional UX improvement if manual trigger is not enough) */}
      {isFetchingNextPage && (
        <div className="min-w-[200px] flex items-center justify-center text-zinc-500">
          Loading more...
        </div>
      )}
    </div>
  );
}