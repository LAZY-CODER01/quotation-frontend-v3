import React, { useMemo } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import TicketCard from "./TicketCard";
import { EmailExtraction } from "../../../types/email";
import { format } from "date-fns";
import { getUaeDayKey, getUaeFriendlyDayLabel, toUaeDate } from "../../../app/lib/time";

interface TicketColumnProps {
  title: string;
  count: number;
  color: "blue" | "green" | "yellow" | "emerald" | "purple" | "red";
  date?: string; // Keep this if it's for the column header itself
  tickets: EmailExtraction[];
  onTicketClick?: (ticket: EmailExtraction) => void;
  slug: string;
}

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  emerald: "bg-emerald-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
};

export default function TicketColumn({
  title,
  count,
  color,
  date,
  tickets,
  onTicketClick,
  slug,
}: TicketColumnProps) {

  // 1. Group tickets by Date (Updated or Received)
  const groupedTickets = useMemo(() => {
    const groups: { [key: string]: EmailExtraction[] } = {};

    tickets.forEach((ticket) => {
      // Use updated_at if available, else received_at
      const relevantDate = ticket.updated_at || ticket.received_at;
      if (!relevantDate) return;

      // Create a sortable key (YYYY-MM-DD) in UAE time
      const dateKey = getUaeDayKey(relevantDate);
      if (!dateKey) return;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(ticket);
    });

    // Sort tickets within each group by time (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = toUaeDate(a.updated_at || a.received_at)?.getTime() ?? 0;
        const dateB = toUaeDate(b.updated_at || b.received_at)?.getTime() ?? 0;
        return dateB - dateA;
      });
    });

    // Sort keys descending (Newest date first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [tickets]);

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col rounded-xl bg-[#0F1115] border border-[rgb(var(--border))] shadow-sm">

      {/* Header Area */}
      <div className="p-4 pb-2 sticky top-0 z-10 bg-[#0F1115]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${colorMap[color]}`} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--bg))] px-1.5 text-xs text-[rgb(var(--muted))] shadow-inner">
              {count}
            </span>
            <Link
              href={`/tickets/status/${slug}`}
              target="_blank"
              className="text-gray-500 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
            </Link>
          </div>
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
                <div className="flex items-center gap-2 py-2 opacity-70">
                  <div className="h-[1px] flex-1 bg-[rgb(var(--border))]" />
                  <span className="text-[10px] font-medium text-[rgb(var(--muted))] uppercase tracking-wider whitespace-nowrap">
                    {getUaeFriendlyDayLabel(dateKey)}
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