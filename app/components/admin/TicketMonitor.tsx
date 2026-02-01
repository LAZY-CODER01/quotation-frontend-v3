"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import {
    Loader2, Eye, ShoppingCart, FileText, MessageSquare,
    Monitor
} from "lucide-react";
import TicketSidebar from "../tickets/TicketSidebar";
import { EmailExtraction } from "../../../types/email";

export default function TicketMonitor() {
    const [tickets, setTickets] = useState<EmailExtraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/emails');
            if (res.data.success) {
                setTickets(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        // Optional: Poll every 30 seconds for real-time monitoring feel
        const interval = setInterval(fetchTickets, 30000);
        return () => clearInterval(interval);
    }, []);

    // Helper to format date
    const formatDate = (dateString: string) => {
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
                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                        {tickets.length} Tickets
                    </span>
                </div>
                <button onClick={fetchTickets} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Loader2 size={16} className={loading ? "animate-spin" : ""} />
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
                        {loading && tickets.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : tickets.map((t) => {
                            const { time, date } = formatDate(t.received_at || t.created_at);
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
                                            {t.sender.includes('<') ? t.sender.split('<')[0].replace(/"/g, '') : t.sender.split('@')[0]}
                                        </div>
                                    </td>

                                    {/* Email / Subject */}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 truncate max-w-[250px]">
                                                {t.sender.includes('<') ? t.sender.match(/<([^>]+)>/)?.[1] : t.sender}
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
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {t.quotation_files?.map((f, i) => (
                                                <span key={i} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                    <FileText size={10} />
                                                    DBQ-{f.id || 'NEW'}
                                                </span>
                                            ))}
                                            {t.quotation_amount && (
                                                <span className="bg-emerald-900/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                                                    AED {t.quotation_amount}
                                                </span>
                                            )}
                                            {/* Placeholder for POs if data available, using mock logic if no explicit PO field yet */}
                                            {t.cpo_files?.map((f, i) => (
                                                <span key={i} className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                    <ShoppingCart size={10} />
                                                    PO-2026-{i + 1}
                                                </span>
                                            ))}
                                            {!t.quotation_files?.length && !t.cpo_files?.length && (
                                                <span className="text-gray-600 text-[10px]">—</span>
                                            )}
                                        </div>
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
            </div>

            {/* Ticket Sidebar Modal */}
            {selectedTicket && (
                <TicketSidebar
                    ticket={selectedTicket}
                    isOpen={!!selectedTicket}
                    onClose={() => {
                        setSelectedTicket(null);
                        fetchTickets(); // Refresh data on close
                    }}
                    onUpdate={() => {
                        fetchTickets(); // Refresh on update
                    }}
                />
            )}
        </div>
    );
}
