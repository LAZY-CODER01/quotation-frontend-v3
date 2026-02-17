import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useTickets } from "../../../hooks/useTickets";
import { EmailExtraction } from "../../../types/email";
import { formatUae } from "../../../app/lib/time";
import { useSearch } from "../../../context/SearchContext";
import { ticketMatchesSearch } from "../../../app/lib/searchUtils"; // Ensure correct path

export default function SearchInput() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 450 });
  const { data: tickets = [] } = useTickets();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownRect({
        left: rect.left,
        top: rect.bottom + 8,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!isOpen || !searchQuery) return;
    updateDropdownPosition();
    const onScrollOrResize = () => updateDropdownPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, searchQuery]);

  // Close dropdown when clicking outside (container or portal dropdown)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchQuery) return [];
    return tickets.filter((ticket: EmailExtraction) => ticketMatchesSearch(ticket, searchQuery));
  }, [searchQuery, tickets]);

  const handleSelectTicket = (ticket: EmailExtraction) => {
    console.log("Selected ticket:", ticket);
    setIsOpen(false);
    setSearchQuery("");
  };

  const dropdownContent = isOpen && searchQuery && typeof document !== "undefined" && createPortal(
    <div
      ref={dropdownRef}
      className="rounded-2xl p-4 shadow-2xl border max-h-[600px] overflow-y-auto custom-scrollbar"
      style={{
        position: "fixed",
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: dropdownRect.width,
        zIndex: 9999,
        backgroundColor: "rgb(var(--panel))",
        borderColor: "rgb(var(--border))",
      }}
    >
      <p className="mb-4 text-xs font-medium text-[rgb(var(--muted))]">
        {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"} found
      </p>

      <div className="space-y-3">
        {filteredResults.map((ticket) => {
          const quotation = ticket.quotation_files?.[0];
          const formattedDate = ticket.received_at
            ? formatUae(ticket.received_at, { month: "short", day: "numeric", year: "numeric" })
            : "No Date";

          return (
            <div
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket)}
              className="group cursor-pointer rounded-xl p-4 transition-colors border"
              style={{
                backgroundColor: "hsl(var(--bg))",
                borderColor: "rgb(var(--border))",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-bold border"
                    style={{
                      backgroundColor: "hsl(var(--bg))",
                      color: "rgb(var(--text))",
                      borderColor: "rgb(var(--border))",
                    }}
                  >
                    {ticket.ticket_number}
                  </span>
                  {quotation?.reference_id && (
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/40">
                      {quotation.name.substring(0, 11)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${ticket.ticket_status === "SENT" ? "bg-[rgb(var(--color-emerald))]" : ticket.ticket_status === "OPEN" ? "bg-[rgb(var(--color-blue))]" : "bg-[rgb(var(--text-tertiary))]"}`} />
                  <span className="text-[10px] font-medium text-[rgb(var(--muted))] capitalize">
                    {ticket.ticket_status?.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[rgb(var(--text-primary))] mb-1 truncate">
                {ticket.company_name || ticket.sender || "Unknown Sender"}
              </h3>

              <div className="flex items-center flex-wrap gap-2 text-[11px]" style={{ color: "rgb(var(--muted))" }}>
                <span className="truncate max-w-[120px]" title={ticket.extraction_result?.email}>
                  {ticket.extraction_result?.email}
                </span>
                <span>•</span>
                <span>{formattedDate}</span>
                {quotation?.amount && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-emerald-500">AED {quotation.amount}</span>
                  </>
                )}
              </div>

              {ticket.assigned_to && (
                <div className="mt-2 text-[10px] pt-2 flex items-center gap-1" style={{ color: "rgb(var(--muted))", borderTop: "1px solid rgb(var(--border))" }}>
                  <span>Assigned:</span>
                  <span className="font-medium">{ticket.assigned_to}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8" style={{ color: "rgb(var(--muted))" }}>
          <Search size={24} className="mb-2 opacity-20" />
          <p className="text-sm">No results found for &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div className="relative w-[450px]" ref={containerRef}>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
        />
        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            updateDropdownPosition();
          }}
          placeholder="Search tickets, clients, quotations (DBQ-XX-XXXX)..."
          className="w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500/20 transition-all"
          style={{
            backgroundColor: "hsl(var(--bg))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {dropdownContent}
    </div>
  );
}