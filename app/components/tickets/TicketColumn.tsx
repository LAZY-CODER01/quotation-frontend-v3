import React, { useMemo } from "react";
import TicketCard from "./TicketCard";
import { EmailExtraction } from "../../../types/email";
import { format, isToday, isYesterday } from "date-fns";

interface TicketColumnProps {
  title: string;
  count: number;
  color: "blue" | "green" | "yellow" | "emerald";
  date?: string; // Keep this if it's for the column header itself
  tickets: EmailExtraction[];
  onTicketClick?: (ticket: EmailExtraction) => void;
}

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  emerald: "bg-emerald-500",
};

export default function TicketColumn({
  title,
  count,
  color,
  date,
  tickets,
  onTicketClick,
}: TicketColumnProps) {

  // 1. Group tickets by Date
  const groupedTickets = useMemo(() => {
    const groups: { [key: string]: EmailExtraction[] } = {};

    tickets.forEach((ticket) => {
      if (!ticket.received_at) return;

      const dateObj = new Date(ticket.received_at);
      // Create a sortable key (YYYY-MM-DD)
      const dateKey = format(dateObj, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(ticket);
    });

    // Sort keys descending (Newest date first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [tickets]);

  // Helper to format the date header nicely
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy"); // e.g. "Jan 24, 2025"
  };

  return (
    <div className="flex h-full  w-[280px] shrink-0 flex-col rounded-xl bg-[rgb(var(--panel))]">

      {/* Header Area */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${colorMap[color]}`} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--bg))] px-1.5 text-xs text-[rgb(var(--muted))]">
            {count}
          </span>
        </div>
        <div className="mt-2 h-[1px] w-full bg-[rgb(var(--border))]" />
        {/* Optional: Keep global column date or remove if redundant */}
        {/* <p className="mt-2 text-center text-xs text-[rgb(var(--muted))]">{date}</p> */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 pt-0 custom-scrollbar">
        <div className="flex flex-col gap-3">

          {groupedTickets.length > 0 ? (
            groupedTickets.map(([dateKey, groupTickets]) => (
              <div key={dateKey} className="flex flex-col gap-3">

                {/* 2. Date Separator Line */}
                <div className="flex items-center gap-2 py-2 opacity-60">
                  <div className="h-[1px] flex-1 bg-[rgb(var(--border))]" />
                  <span className="text-[10px] font-medium text-[rgb(var(--muted))] uppercase tracking-wider whitespace-nowrap">
                    {getDateLabel(dateKey)}
                  </span>
                  <div className="h-[1px] flex-1 bg-[rgb(var(--border))]" />
                </div>

                {/* Tickets for this date */}
                {groupTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onTicketClick?.(ticket)}
                    className="cursor-pointer transition-transform duration-200 active:scale-[0.98]"
                  >
                    <TicketCard data={ticket} />
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-zinc-500 py-4">No tickets</div>
          )}

        </div>
      </div>
    </div>
  );
}