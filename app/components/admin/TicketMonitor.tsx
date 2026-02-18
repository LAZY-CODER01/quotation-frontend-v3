"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Loader2, Eye, ShoppingCart, FileText, MessageSquare,
    Monitor, Filter
} from "lucide-react";
import TicketSidebar from "../tickets/TicketSidebar";
import FilterSidebar from "../layout/FilterSidebar";
import { EmailExtraction } from "../../../types/email";
import { useTickets } from "../../../hooks/useTickets";
import { formatUae, formatUaeTime } from "../../../app/lib/time";
import { FilterState, INITIAL_FILTERS } from "../../../types/filters";
import { useSearch } from "../../../context/SearchContext";
import { ticketMatchesSearch } from "../../../app/lib/searchUtils";

export default function TicketMonitor() {
    // 1. Replaced separate state and useEffect with useTickets hook via React Query
    const { data: tickets = [], isLoading, refetch, isFetching } = useTickets({
        refetchInterval: 30000, // Poll every 30s
    });

    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
    const { searchQuery } = useSearch();

    // ✅ FIX: Keep selectedTicket in sync with latest data
    useEffect(() => {
        if (selectedTicket && tickets.length > 0) {
            const updated = tickets.find(t => t.gmail_id === selectedTicket.gmail_id);
            if (updated) {
                // Only update if actually changed to avoid loop (though React compares ref mostly)
                // Since this object comes from React Query, it's a new ref if data changed.
                if (updated !== selectedTicket) {
                    setSelectedTicket(updated);
                }
            }
        }
    }, [tickets, selectedTicket]);

    // Filtering Logic
    const filteredTickets = useMemo(() => {
        let result = tickets.filter(e => e.extraction_status === "VALID");

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

            // Urgency, Date, and Search filters
            if (activeFilters.urgency !== 'ALL') {
                if ((ticket.ticket_priority?.toUpperCase() || 'NON_URGENT') !== activeFilters.urgency.toUpperCase()) return false;
            }
            if (activeFilters.clientEmail && !ticket.sender?.toLowerCase().includes(activeFilters.clientEmail.toLowerCase())) return false;
            if (activeFilters.assignedEmployeeName && !ticket.assigned_to?.toLowerCase().includes(activeFilters.assignedEmployeeName.toLowerCase())) return false;
            if (activeFilters.ticketNumber && !String(ticket.id).includes(activeFilters.ticketNumber)) return false;
            if (activeFilters.quotationReference) {
                const hasRef = ticket.quotation_files?.some(q => (q.reference_id || '').toLowerCase().includes(activeFilters.quotationReference.toLowerCase()));
                if (!hasRef) return false;
            }

            // Date Range Filter
            if (activeFilters.startDate || activeFilters.endDate) {
                const dateToCheckStr = activeFilters.dateType === 'updated' ? ticket.updated_at : (ticket.received_at || ticket.created_at);
                if (dateToCheckStr) {
                    const ticketDate = new Date(dateToCheckStr);
                    if (activeFilters.startDate) {
                        const start = new Date(activeFilters.startDate);
                        start.setHours(0, 0, 0, 0);
                        if (ticketDate < start) return false;
                    }
                    if (activeFilters.endDate) {
                        const end = new Date(activeFilters.endDate);
                        end.setHours(23, 59, 59, 999);
                        if (ticketDate > end) return false;
                    }
                }
            }

            return true;
        });
    }, [tickets, activeFilters, searchQuery]);


    const getLatestQuoteInfo = (t: EmailExtraction) => {
        // Case 1: Order Confirmed -> Show CPO Amount (Blue)
        if (t.ticket_status === 'ORDER_CONFIRMED' || t.ticket_status === 'ORDER_COMPLETED') {
            if (!t.cpo_files || t.cpo_files.length === 0) return null;
            const latestCPO = [...t.cpo_files].reverse()[0];
            return {
                ref: latestCPO.po_number || latestCPO.reference_id || `PO-${latestCPO.id}`,
                amount: latestCPO.amount || "N/A",
                type: 'PO'
            };
        }


        // Case 2: Sent / Inbox / Others -> Show Quotation Amount (Green)
        if (!t.quotation_files || t.quotation_files.length === 0) return null;

        const sorted = [...t.quotation_files].reverse(); // Latest is usually last
        const latest = sorted[0];

        return {
            ref: latest.reference_id || `DBQ-${latest.id}`,
            amount: latest.amount || "N/A",
            type: 'QUOTE'
        };
    };

    // Helper to format date in UAE time
    const formatDate = (dateString: string) => {
        return {
            time: formatUaeTime(dateString),
            date: formatUae(dateString, {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            }),
        };
    };

    // Helper for Status Badge
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SENT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'ORDER_CONFIRMED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'ORDER_COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'COMPLETION_REQUESTED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'CLOSED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-blue-400/10 text-blue-400 border-blue-400/20'; // Inbox / Default
        }
    };

    return (
        <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden flex flex-col h-[calc(100vh-140px)] shadow-sm">
            <div className="p-4 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Live Monitor</h2>
                    <span className="text-xs text-[rgb(var(--text-secondary))] px-2 py-0.5 bg-[rgb(var(--bg-tertiary))] rounded-full border border-[rgb(var(--border-primary))]">
                        {filteredTickets.length} / {tickets.length} Tickets
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm px-3
                            ${Object.keys(activeFilters).some(k => k !== 'dateType' && JSON.stringify(activeFilters[k as keyof FilterState]) !== JSON.stringify(INITIAL_FILTERS[k as keyof FilterState]))
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'hover:bg-[rgb(var(--hover-bg))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'}`}
                    >
                        <Filter size={16} /> Filters
                    </button>
                    <button onClick={() => refetch()} className="p-1.5 hover:bg-[rgb(var(--hover-bg))] rounded-lg text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
                        <Loader2 size={16} className={isFetching ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="overflow-auto flex-1 bg-[rgb(var(--bg-primary))]">
                <table className="w-full text-left text-sm text-[rgb(var(--muted))]">
                    <thead className="bg-[rgb(var(--bg-secondary))] text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-24">Time / Date</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-40">Assigned To</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-48">Company</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] flex-1">Email / Subject</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-20 text-center">View</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-32">Status</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-64">Commercial Refs</th>
                            <th className="px-4 py-3 border-b border-[rgb(var(--border-secondary))] w-16 text-center">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
                        {isLoading && tickets.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-[rgb(var(--text-secondary))]">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-[rgb(var(--text-secondary))]">
                                    No tickets found matching filters.
                                </td>
                            </tr>
                        ) : filteredTickets.map((t) => {
                            const { time, date } = formatDate(t.received_at || t.created_at);
                            const latestQuote = getLatestQuoteInfo(t);
                            return (
                                <tr
                                    key={t.gmail_id}
                                    onClick={() => setSelectedTicket(t)}
                                    className="bg-[hsl(var(--bg))] hover:bg-[hsl(var(--bg))]/80 cursor-pointer transition-colors group"
                                >
                                    {/* Time / Date */}
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-[rgb(var(--text-primary))] font-mono text-xs">{time}</div>
                                        <div className="text-[10px] text-[rgb(var(--text-secondary))] font-mono">{date}</div>
                                    </td>

                                    {/* Assigned To */}
                                    <td className="px-4 py-3">
                                        {t.assigned_to ? (
                                            <div className="border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-tertiary))] px-2 py-1 rounded text-xs text-[rgb(var(--text-primary))] flex items-center justify-between">
                                                <span className="truncate max-w-[100px] text-[rgb(var(--text-primary))]">{t.assigned_to}</span>
                                            </div>
                                        ) : (
                                            <div className="border border-yellow-500/20 bg-yellow-500/5 px-2 py-1 rounded text-xs text-yellow-500/80">
                                                Unassigned
                                            </div>
                                        )}
                                    </td>

                                    {/* Company */}
                                    <td className="px-4 py-3">
                                        <div className="text-[rgb(var(--text-primary))] font-medium truncate max-w-[180px]" title={t.sender}>
                                            {/* Extracting name from "Name <email>" if possible, purely presentational logic */}
                                            {t.sender.includes('<') ? t.sender.split('<')[0].replace(/"/g, '') : t.sender.split('@')[0]}
                                        </div>
                                    </td>

                                    {/* Email / Subject */}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-[rgb(var(--text-secondary))] truncate max-w-[250px]">
                                                {t.sender.includes('<') ? t.sender.match(/<([^>]+)>/)?.[1] : t.sender}
                                            </span>
                                            <span className="text-[rgb(var(--text-primary))] text-xs truncate max-w-[300px] group-hover:text-blue-400 transition-colors">
                                                {t.subject}
                                            </span>
                                        </div>
                                    </td>

                                    {/* View */}
                                    <td className="px-4 py-3 text-center text-[rgb(var(--text-secondary))]">
                                        <div className="flex items-center justify-center gap-1 group-hover:text-[rgb(var(--text-primary))] transition-colors">
                                            <Eye size={14} />
                                            <span className="text-[10px]">({t.extraction_result.Requirements?.length || 0})</span>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(t.ticket_status)}`}>
                                            {t.ticket_status || 'INBOX'}
                                        </span>
                                    </td>

                                    {/* Commercial Refs */}
                                    <td className="px-6 py-3 text-right">

                                        {latestQuote ? (
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`font-bold font-mono text-xs px-1.5 rounded border ${latestQuote.type === 'PO'
                                                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                    }`}>
                                                    AED {latestQuote.amount}
                                                </span>
                                                <span className="text-[9px] text-[rgb(var(--text-secondary))] font-mono flex items-center gap-1">
                                                    {latestQuote.type === 'PO' ? <ShoppingCart size={8} /> : <FileText size={8} />}
                                                    {latestQuote.ref}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[rgb(var(--text-secondary))] text-xs font-mono">—</span>
                                        )}
                                    </td>

                                    {/* Notes */}
                                    <td className="px-4 py-3 text-center">
                                        {t.internal_notes && t.internal_notes.length > 0 ? (
                                            <div className="flex items-center justify-center gap-0.5 text-[rgb(var(--text-secondary))]">
                                                <MessageSquare size={12} />
                                                <span className="text-[10px]">{t.internal_notes.length}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[rgb(var(--text-secondary))] text-[10px]">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Filter Sidebar */}
            <FilterSidebar
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentFilters={activeFilters}
                onApply={(newFilters) => {
                    setActiveFilters(newFilters);
                    setIsFilterOpen(false);
                }}
            />

            {/* Ticket Sidebar Modal */}
            {selectedTicket && (
                <TicketSidebar
                    ticket={selectedTicket}
                    isOpen={!!selectedTicket}
                    onClose={() => {
                        setSelectedTicket(null);
                        refetch(); // Refresh data on close
                    }}
                    onUpdate={() => {
                        refetch(); // Refresh on update
                    }}
                />
            )}
        </div>
    );
}