"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Loader2,
    Monitor, Filter, Search,
} from "lucide-react";
import TicketSidebar from "../tickets/TicketSidebar";
import FilterSidebar from "../layout/FilterSidebar";
import { EmailExtraction } from "../../../types/email";
import { useTickets } from "../../../hooks/useTickets";
import { formatUae, formatUaeTime } from "../../../app/lib/time";
import { FilterState, INITIAL_FILTERS } from "../../../types/filters";
import { useSearch } from "../../../context/SearchContext";
import { ticketMatchesSearch } from "../../../app/lib/searchUtils";

const STATUS_TABS = ["All", "Inbox", "Sent", "Order Confirmed", "Closed"] as const;

export default function TicketMonitor() {
    const { data: tickets = [], isLoading, refetch, isFetching } = useTickets({
        refetchInterval: 30000,
    });

    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
    const [activeTab, setActiveTab] = useState<string>("All");
    const [localSearch, setLocalSearch] = useState("");
    const { searchQuery } = useSearch();

    // Keep selectedTicket in sync with latest data
    useEffect(() => {
        if (selectedTicket && tickets.length > 0) {
            const updated = tickets.find(t => t.gmail_id === selectedTicket.gmail_id);
            if (updated && updated !== selectedTicket) {
                setSelectedTicket(updated);
            }
        }
    }, [tickets, selectedTicket]);

    // Combined filtering: global search + tab + filter sidebar + local search
    const filteredTickets = useMemo(() => {
        let result = tickets.filter(e => e.extraction_status === "VALID");

        // Global search
        if (searchQuery) {
            result = result.filter(ticket => ticketMatchesSearch(ticket, searchQuery));
        }

        // Tab filter
        if (activeTab !== "All") {
            result = result.filter(ticket => {
                const status = (ticket.ticket_status || "OPEN").toUpperCase();
                if (activeTab === "Inbox") return status === "OPEN" || status === "INBOX";
                if (activeTab === "Sent") return status === "SENT";
                if (activeTab === "Order Confirmed") return status === "ORDER_CONFIRMED";
                if (activeTab === "Closed") return status === "CLOSED" || status === "ORDER_COMPLETED";
                return true;
            });
        }

        // Local search
        if (localSearch.trim()) {
            const q = localSearch.toLowerCase();
            result = result.filter(t =>
                (t.company_name || "").toLowerCase().includes(q) ||
                t.sender.toLowerCase().includes(q) ||
                String(t.id).includes(q) ||
                (t.assigned_to || "").toLowerCase().includes(q)
            );
        }

        if (!activeFilters) return result;

        return result.filter((ticket) => {
            if (activeFilters.statuses.length > 0) {
                const acceptableStatuses: string[] = [];
                const norm = (s: string) => s?.toUpperCase() || "";
                if (activeFilters.statuses.includes("Inbox")) acceptableStatuses.push("OPEN", "INBOX");
                if (activeFilters.statuses.includes("Sent")) acceptableStatuses.push("SENT");
                if (activeFilters.statuses.includes("Order Confirmed")) acceptableStatuses.push("ORDER_CONFIRMED");
                if (activeFilters.statuses.includes("Order Completed")) acceptableStatuses.push("ORDER_COMPLETED");
                if (activeFilters.statuses.includes("Closed")) acceptableStatuses.push("CLOSED");
                const currentStatus = ticket.ticket_status ? norm(ticket.ticket_status) : "OPEN";
                if (!acceptableStatuses.some(status => norm(status) === currentStatus)) return false;
            }

            if (activeFilters.urgency !== "ALL") {
                if ((ticket.ticket_priority?.toUpperCase() || "NON_URGENT") !== activeFilters.urgency.toUpperCase()) return false;
            }
            if (activeFilters.clientEmail && !ticket.sender?.toLowerCase().includes(activeFilters.clientEmail.toLowerCase())) return false;
            if (activeFilters.assignedEmployeeName && !ticket.assigned_to?.toLowerCase().includes(activeFilters.assignedEmployeeName.toLowerCase())) return false;
            if (activeFilters.ticketNumber && !String(ticket.id).includes(activeFilters.ticketNumber)) return false;
            if (activeFilters.quotationReference) {
                const hasRef = ticket.quotation_files?.some(q => (q.reference_id || "").toLowerCase().includes(activeFilters.quotationReference.toLowerCase()));
                if (!hasRef) return false;
            }

            if (activeFilters.startDate || activeFilters.endDate) {
                const dateToCheckStr = activeFilters.dateType === "updated" ? ticket.updated_at : (ticket.received_at || ticket.created_at);
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
    }, [tickets, activeFilters, searchQuery, activeTab, localSearch]);

    const getLatestQuoteInfo = (t: EmailExtraction) => {
        if (t.ticket_status === "ORDER_CONFIRMED" || t.ticket_status === "ORDER_COMPLETED") {
            if (!t.cpo_files || t.cpo_files.length === 0) return null;
            const latestCPO = [...t.cpo_files].reverse()[0];
            return {
                ref: latestCPO.po_number || latestCPO.reference_id || `PO-${latestCPO.id}`,
                amount: latestCPO.amount || "N/A",
                type: "PO",
            };
        }
        if (!t.quotation_files || t.quotation_files.length === 0) return null;
        const latest = [...t.quotation_files].reverse()[0];
        return {
            ref: latest.reference_id || `DBQ-${latest.id}`,
            amount: latest.amount || "N/A",
            type: "QUOTE",
        };
    };

    const formatDate = (dateString: string) => ({
        time: formatUaeTime(dateString),
        date: formatUae(dateString, { day: "2-digit", month: "2-digit", year: "2-digit" }),
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "SENT": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "ORDER_CONFIRMED": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "ORDER_COMPLETED": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "COMPLETION_REQUESTED": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "CLOSED": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-blue-400/20 text-blue-400 border-blue-400/30";
        }
    };

    const hasActiveFilters = Object.keys(activeFilters).some(
        k => k !== "dateType" && JSON.stringify(activeFilters[k as keyof FilterState]) !== JSON.stringify(INITIAL_FILTERS[k as keyof FilterState])
    );

    return (
        <div className="min-h-screen bg-[hsl(var(--bg))] text-[rgb(var(--text-primary))]">
            <div className="max-w-[1440px] mx-auto p-5 space-y-5">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-900/30">
                            <Monitor size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight leading-tight">Ticket Monitor</h1>
                            <p className="text-[11px] text-[rgb(var(--text-secondary))] tracking-wide">SnapQuote · Live View</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm px-3 ${hasActiveFilters
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "hover:bg-[rgb(var(--hover-bg))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"}`}
                        >
                            <Filter size={16} /> Filters
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="p-1.5 hover:bg-[rgb(var(--hover-bg))] rounded-lg text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                        >
                            <Loader2 size={16} className={isFetching ? "animate-spin" : ""} />
                        </button>
                    </div>
                </header>

                {/* ── Ticket Drilldown Card ──────────────────────────────── */}
                <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">

                    {/* Card Header: Title + Tabs + Search */}
                    <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold tracking-tight">Ticket Drilldown</h3>
                            <span className="text-xs text-[rgb(var(--text-secondary))] px-2 py-0.5 bg-[rgb(var(--bg-tertiary))] rounded-full border border-[rgb(var(--border-primary))]">
                                {filteredTickets.length} / {tickets.filter(e => e.extraction_status === "VALID").length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Status Tabs */}
                            <div className="flex items-center bg-[rgb(var(--bg-tertiary))] rounded-lg p-0.5">
                                {STATUS_TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${activeTab === tab
                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                            : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            {/* Search */}
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    className="w-36 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-emerald-500/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-t border-b border-[rgb(var(--border-primary))] text-[10px] text-[rgb(var(--text-tertiary))] uppercase tracking-widest bg-[rgb(var(--bg-tertiary))]/50">
                                    <th className="px-5 py-3 font-semibold">Ticket ID</th>
                                    <th className="px-4 py-3 font-semibold">Company</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Quote Ref</th>
                                    <th className="px-4 py-3 font-semibold">CPO Ref</th>
                                    <th className="px-4 py-3 font-semibold text-right">Quote Amt</th>
                                    <th className="px-4 py-3 font-semibold text-right">CPO Amt</th>
                                    <th className="px-4 py-3 font-semibold">Assigned</th>
                                    <th className="px-4 py-3 font-semibold">Sent</th>
                                    <th className="px-4 py-3 font-semibold">Confirmed</th>
                                    <th className="px-4 py-3 font-semibold">Closed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                                {isLoading && tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-5 py-8 text-center text-xs text-[rgb(var(--text-secondary))]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 size={16} className="animate-spin" /> Loading data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-5 py-8 text-center text-xs text-[rgb(var(--text-tertiary))]">
                                            No tickets match the current filter.
                                        </td>
                                    </tr>
                                ) : filteredTickets.map((t) => {
                                    const { time, date } = formatDate(t.received_at || t.created_at);
                                    const latestQuote = getLatestQuoteInfo(t);
                                    const status = t.ticket_status || "INBOX";
                                    const sentDate = t.quotation_files?.length
                                        ? formatUae([...t.quotation_files].reverse()[0]?.uploaded_at || "", { day: "2-digit", month: "2-digit", year: "2-digit" })
                                        : "—";
                                    const confirmedDate = t.cpo_files?.length
                                        ? formatUae([...t.cpo_files].reverse()[0]?.uploaded_at || "", { day: "2-digit", month: "2-digit", year: "2-digit" })
                                        : "—";
                                    const quoteRef = t.quotation_files?.length
                                        ? ([...t.quotation_files].reverse()[0]?.reference_id || `DBQ-${[...t.quotation_files].reverse()[0]?.id}`)
                                        : "—";
                                    const cpoRef = t.cpo_files?.length
                                        ? ([...t.cpo_files].reverse()[0]?.po_number || [...t.cpo_files].reverse()[0]?.reference_id || `PO-${[...t.cpo_files].reverse()[0]?.id}`)
                                        : "—";

                                    return (
                                        <tr
                                            key={t.gmail_id}
                                            onClick={() => setSelectedTicket(t)}
                                            className="hover:bg-[rgb(var(--hover-bg))] cursor-pointer transition-colors group"
                                        >
                                            {/* Ticket ID */}
                                            <td className="px-5 py-3.5">
                                                <div className="text-xs font-semibold text-emerald-400 leading-tight">{t.id}</div>
                                                <div className="text-[10px] text-[rgb(var(--text-tertiary))] font-mono mt-0.5">{date}</div>
                                            </td>

                                            {/* Company + Email */}
                                            <td className="px-4 py-3.5 text-xs max-w-[200px]">
                                                <div className="font-medium truncate" title={t.company_name || t.sender}>
                                                    {t.company_name || (t.sender.includes("<") ? t.sender.split("<")[0].replace(/"/g, "").trim() : t.sender.split("@")[0])}
                                                </div>
                                                <div className="text-[10px] text-[rgb(var(--text-tertiary))] truncate mt-0.5" title={t.sender}>
                                                    {t.sender.includes("<") ? t.sender.match(/<([^>]+)>/)?.[1] : t.sender}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusStyle(status)}`}>
                                                    {status.replace("_", " ")}
                                                </span>
                                            </td>

                                            {/* Quote Ref */}
                                            <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-secondary))] font-mono">{quoteRef}</td>

                                            {/* CPO Ref */}
                                            <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-secondary))] font-mono">{cpoRef}</td>

                                            {/* Quote Amt */}
                                            <td className="px-4 py-3.5 text-xs text-right font-medium text-amber-400">
                                                {latestQuote && latestQuote.type === "QUOTE" ? `AED ${latestQuote.amount}` : "—"}
                                            </td>

                                            {/* CPO Amt */}
                                            <td className="px-4 py-3.5 text-xs text-right font-medium text-emerald-400">
                                                {latestQuote && latestQuote.type === "PO" ? `AED ${latestQuote.amount}` : "—"}
                                            </td>

                                            {/* Assigned */}
                                            <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))]">
                                                {t.assigned_to || "—"}
                                            </td>

                                            {/* Sent */}
                                            <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))] font-mono">{sentDate}</td>

                                            {/* Confirmed */}
                                            <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))] font-mono">{confirmedDate}</td>

                                            {/* Closed */}
                                            <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))] font-mono">
                                                {(status === "CLOSED" || status === "ORDER_COMPLETED") ? date : "—"}
                                            </td>


                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

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
                        refetch();
                    }}
                    onUpdate={() => {
                        refetch();
                    }}
                />
            )}
        </div>
    );
}