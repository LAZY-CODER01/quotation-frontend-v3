"use client";

import { useEffect, useState, useRef } from "react";
import api from "../../../lib/api";
import {
    Loader2, Eye, ShoppingCart, FileText, MessageSquare,
    Monitor, ArrowDown
} from "lucide-react";
import TicketSidebar from "../tickets/TicketSidebar";
import { EmailExtraction } from "../../../types/email";
import { io } from "socket.io-client";

// Adjust based on your backend URL/Environment
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:5001";

export default function TicketMonitor() {
    const [tickets, setTickets] = useState<EmailExtraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // ✅ Delta Sync State
    const [lastSync, setLastSync] = useState<string | null>(null);
    const lastSyncRef = useRef<string | null>(null); // Ref to access inside interval closure

    // Update ref when state changes
    useEffect(() => {
        lastSyncRef.current = lastSync;
    }, [lastSync]);

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

    const fetchTickets = async (pageNum: number, isPolling = false) => {
        try {
            // Only show loader on initial full fetch, not background polling
            if (pageNum === 1 && !isPolling) setLoading(true);
            if (pageNum > 1) setIsFetchingMore(true);

            const params: any = { page: pageNum, limit: 50 };

            // ✅ DELTA SYNC REQUEST
            // Only send 'since' if polling page 1 and we have a lastSync time
            if (isPolling && pageNum === 1 && lastSyncRef.current) {
                params.since = lastSyncRef.current;
            }

            const res = await api.get('/emails', { params });

            if (res.data.success) {
                const newData = res.data.data;
                const isDelta = res.data.is_delta;

                // ✅ UPDATE LAST SYNC TIME
                // Find the latest updated_at or received_at in the fetched data
                if (newData.length > 0) {
                    const maxDate = newData.reduce((max: string, t: EmailExtraction) => {
                        const tDate = t.updated_at || t.received_at;
                        // specific comparison needed? string ISO comparison works fine
                        return (!max || tDate > max) ? tDate : max;
                    }, lastSyncRef.current || "");

                    if (maxDate) setLastSync(maxDate);
                }

                // Logic:
                // 1. If Delta Sync (isDelta=true): Merge.
                // 2. If Polling (isPolling=true): Merge (even if backend returned full page 1, we just update those items).
                // 3. If Initial Load (pageNum=1 && !isPolling): Replace.
                // 4. If Load More (pageNum > 1): Append.

                if (isDelta || (isPolling && pageNum === 1)) {
                    // ✅ MERGE LOGIC (Delta Sync / Polling Update)
                    setTickets(prev => {
                        const ticketMap = new Map(prev.map(t => [t.gmail_id, t]));

                        newData.forEach((t: EmailExtraction) => {
                            ticketMap.set(t.gmail_id, t);
                        });

                        // Convert back to array and sort (descending time)
                        return Array.from(ticketMap.values()).sort((a, b) => {
                            const dateA = new Date(a.received_at || 0).getTime();
                            const dateB = new Date(b.received_at || 0).getTime();
                            return dateB - dateA;
                        });
                    });

                    if (isDelta) console.log(`Delta Sync: Merged ${newData.length} updates.`);
                } else {
                    // Normal Pagination / Initial Load
                    if (pageNum === 1) {
                        setTickets(newData);
                        // Initialize lastSync if not set
                        if (!lastSyncRef.current && newData.length > 0) {
                            const maxDate = newData.reduce((max: string, t: EmailExtraction) => {
                                const tDate = t.updated_at || t.received_at;
                                return (!max || tDate > max) ? tDate : max;
                            }, "");
                            setLastSync(maxDate);
                        }
                    } else {
                        setTickets(prev => [...prev, ...newData]);
                    }

                    // Handle "Load More" visibility
                    if (newData.length < 50) {
                        setHasMore(false);
                    } else {
                        setHasMore(true);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    // Initial Load & Polling Interval
    useEffect(() => {
        // Initial Fetch
        fetchTickets(1);

        // ✅ Setup Polling (30s)
        const interval = setInterval(() => {
            fetchTickets(1, true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Socket.IO Connection (Keep as complementary or fallback mechanism)
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket'], // ✅ Force WebSocket
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log("Connected to WebSocket");
        });

        socket.on('ticket_update', (event: { type: string, data: EmailExtraction }) => {
            console.log("Socket Update:", event);
            // We can reuse the same merge logic implicitly by updating state
            if (event.type === 'NEW') {
                setTickets(prev => {
                    if (prev.find(t => t.gmail_id === event.data.gmail_id)) return prev;
                    return [event.data, ...prev];
                });
            } else if (event.type === 'UPDATE') {
                setTickets(prev => prev.map(t =>
                    t.gmail_id === event.data.gmail_id ? event.data : t
                ));
                setSelectedTicket(curr => curr?.gmail_id === event.data.gmail_id ? event.data : curr);
            }

            // Also update lastSync from socket events to keep polling efficient
            const tDate = event.data.updated_at || event.data.received_at;
            if (tDate) {
                setLastSync(prev => (!prev || tDate > prev) ? tDate : prev);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTickets(nextPage);
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return { time: '--:--', date: '--' };
        const date = new Date(dateString);
        return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            date: date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
        };
    };

    // Helper for Status Badge
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SENT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'ORDER_CONFIRMED': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'ORDER_COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'COMPLETION_REQUESTED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'CLOSED': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default: return 'bg-blue-400/10 text-blue-400 border-blue-400/20'; // Inbox / Default
        }
    };

    return (
        <div className="bg-[#181A1F] rounded-xl border border-white/10 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
            <div className="p-4 border-b border-white/10 bg-[#181A1F] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-white">Live Monitor</h2>
                    {/* Live Indicator */}
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Real-time
                    </span>
                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                        {tickets.length} Loaded
                    </span>
                </div>
                <button onClick={() => fetchTickets(1, true)} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Loader2 size={16} className={loading && !isFetchingMore ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-[#0F1115] text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm shadow-black/20">
                        <tr>
                            <th className="px-4 py-3 border-b border-white/10 w-24">Time / Date</th>
                            <th className="px-4 py-3 border-b border-white/10 w-40">Assigned To</th>
                            <th className="px-4 py-3 border-b border-white/10 w-48">Company</th>
                            <th className="px-4 py-3 border-b border-white/10 flex-1">Email / Subject</th>
                            <th className="px-4 py-3 border-b border-white/10 w-20 text-center">View</th>
                            <th className="px-4 py-3 border-b border-white/10 w-32">Status</th>
                            <th className="px-4 py-3 border-b border-white/10 w-64">Commercial Refs</th>
                            <th className="px-4 py-3 border-b border-white/10 w-16 text-center">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : tickets.map((t) => {
                            const { time, date } = formatDate(t.received_at || t.created_at);
                            const latestQuote = getLatestQuoteInfo(t);
                            return (
                                <tr
                                    key={t.gmail_id}
                                    onClick={() => setSelectedTicket(t)}
                                    className="bg-[#0F1115] hover:bg-[#181A1F] cursor-pointer transition-colors group"
                                >
                                    {/* Time / Date */}
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-white font-mono text-xs">{time}</div>
                                        <div className="text-[10px] text-gray-600 font-mono">{date}</div>
                                    </td>

                                    {/* Assigned To */}
                                    <td className="px-4 py-3">
                                        {t.assigned_to ? (
                                            <div className="border border-white/10 bg-[#181A1F] px-2 py-1 rounded text-xs text-gray-300 flex items-center justify-between">
                                                <span className="truncate max-w-[100px]">{t.assigned_to}</span>
                                            </div>
                                        ) : (
                                            <div className="border border-yellow-500/20 bg-yellow-500/5 px-2 py-1 rounded text-xs text-yellow-500/80">
                                                Unassigned
                                            </div>
                                        )}
                                    </td>

                                    {/* Company */}
                                    <td className="px-4 py-3">
                                        <div className="text-white font-medium truncate max-w-[180px]" title={t.sender}>
                                            {/* Extracting name from "Name <email>" if possible, purely presentational logic */}
                                            {t.sender && t.sender.includes('<') ? t.sender.split('<')[0].replace(/"/g, '') : (t.sender ? t.sender.split('@')[0] : 'Unknown')}
                                        </div>
                                    </td>

                                    {/* Email / Subject */}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 truncate max-w-[250px]">
                                                {t.sender && t.sender.includes('<') ? t.sender.match(/<([^>]+)>/)?.[1] : t.sender}
                                            </span>
                                            <span className="text-white text-xs truncate max-w-[300px] group-hover:text-blue-400 transition-colors">
                                                {t.subject}
                                            </span>
                                        </div>
                                    </td>

                                    {/* View */}
                                    <td className="px-4 py-3 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-1 group-hover:text-white transition-colors">
                                            <Eye size={14} />
                                            <span className="text-[10px]">({t.activity_logs?.length || 0})</span>
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
                                                <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1">
                                                    {latestQuote.type === 'PO' ? <ShoppingCart size={8} /> : <FileText size={8} />}
                                                    {latestQuote.ref}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700 text-xs font-mono">—</span>
                                        )}
                                    </td>

                                    {/* Notes */}
                                    <td className="px-4 py-3 text-center">
                                        {t.internal_notes && t.internal_notes.length > 0 ? (
                                            <div className="flex items-center justify-center gap-0.5 text-gray-400">
                                                <MessageSquare size={12} />
                                                <span className="text-[10px]">{t.internal_notes.length}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700 text-[10px]">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Load More Button */}
                {hasMore && !loading && (
                    <div className="p-4 flex justify-center border-t border-white/5">
                        <button
                            onClick={loadMore}
                            disabled={isFetchingMore}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
                        >
                            {isFetchingMore ? <Loader2 size={16} className="animate-spin" /> : <ArrowDown size={16} />}
                            Load More Tickets
                        </button>
                    </div>
                )}
            </div>

            {/* Ticket Sidebar Modal */}
            {selectedTicket && (
                <TicketSidebar
                    ticket={selectedTicket}
                    isOpen={!!selectedTicket}
                    onClose={() => {
                        setSelectedTicket(null);
                        // No need to fetchTickets here if socket updates things, but strictly safe to do so?
                        // Actually, socket updates local state. fetching might overwrite recent changes if they lag.
                        // Best to rely on socket or just update the single item if Sidebar returns it.
                        // But Sidebar usage often involves complex updates.
                        // Let's just rely on socket updates for the Monitor list.
                        // Ideally Sidebar updates trigger an event emission from backend which updates this list.
                    }}
                    onUpdate={() => {
                        // Do nothing, let socket handle it
                    }}
                />
            )}
        </div>
    );
}
