import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useTickets } from "../../../hooks/useTickets";
import { EmailExtraction } from "../../../types/email";
import { formatUae } from "../../../app/lib/time";
import { useSearch } from "../../../context/SearchContext";
import { ticketMatchesSearch } from "../../../app/lib/searchUtils"; // Ensure correct path

export default function SearchInput() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const { data: tickets = [] } = useTickets();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchQuery) return [];
    return tickets.filter((ticket: EmailExtraction) => ticketMatchesSearch(ticket, searchQuery));
  }, [searchQuery, tickets]);

  const handleSelectTicket = (ticket: EmailExtraction) => {
    // Navigate or select ticket logic here (e.g., open sidebar)
    console.log("Selected ticket:", ticket);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-[450px]" ref={dropdownRef}>
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search tickets, clients, quotations (DBQ-XX-XXXX)..."
          className="w-full rounded-xl border border-gray-800 bg-[#0f1115] py-3 pl-10 pr-10 text-sm text-white outline-none ring-2 ring-transparent focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && searchQuery && (
        <div className="absolute mt-2 w-full rounded-2xl bg-[#16191d] p-4 shadow-2xl border border-gray-800 z-50 max-h-[600px] overflow-y-auto custom-scrollbar">
          <p className="mb-4 text-xs font-medium text-gray-500">
            {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"} found
          </p>

          <div className="space-y-3">
            {filteredResults.map((ticket) => {
              const quotation = ticket.quotation_files?.[0];
              const formattedDate = ticket.received_at
                ? formatUae(ticket.received_at, { month: 'short', day: 'numeric', year: 'numeric' })
                : "No Date";

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="group cursor-pointer rounded-xl bg-[#1c2025] p-4 transition-colors hover:bg-[#23282e] border border-transparent hover:border-gray-700"
                >
                  {/* Top Row: Badges and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-300 border border-gray-700">
                        {ticket.ticket_number}
                      </span>
                      {quotation?.reference_id && (
                        <span className="rounded bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-800/50">
                          {quotation.name.substring(0, 11)} {/* Truncate if too long */}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${ticket.ticket_status === 'SENT' ? 'bg-emerald-500' :
                        ticket.ticket_status === 'OPEN' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                      <span className="text-[10px] font-medium text-gray-400 capitalize">
                        {ticket.ticket_status?.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Company Name */}
                  <h3 className="text-sm font-bold text-white mb-1 truncate">
                    {ticket.company_name || ticket.sender || "Unknown Sender"}
                  </h3>

                  {/* Bottom Row: Metadata */}
                  <div className="flex items-center flex-wrap gap-2 text-[11px] text-gray-500">
                    <span className="truncate max-w-[120px]" title={ticket.extraction_result?.email}>
                      {ticket.extraction_result?.email}
                    </span>
                    <span>•</span>
                    <span>{formattedDate}</span>
                    {quotation?.amount && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-emerald-500">
                          AED {quotation.amount}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Footer: Assignment */}
                  {ticket.assigned_to && (
                    <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-800 pt-2 flex items-center gap-1">
                      <span>Assigned:</span>
                      <span className="text-gray-400 font-medium">{ticket.assigned_to}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Search size={24} className="mb-2 opacity-20" />
              <p className="text-sm">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}