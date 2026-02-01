"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { RotateCw, User, Loader2 } from "lucide-react";
import TicketSidebar from "../tickets/TicketSidebar";

export default function TicketRequests() {
    const [completionRequests, setCompletionRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    const fetchCompletionRequests = async () => {
        try {
            setLoadingRequests(true);
            const res = await api.get('/emails?status=COMPLETION_REQUESTED');
            if (res.data.success) {
                setCompletionRequests(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchCompletionRequests();
    }, []);

    return (
        <div className="bg-[#181A1F] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <RotateCw className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Ticket Completion Requests</h2>
                        <p className="text-sm text-gray-400">Tickets awaiting Admin approval to close or complete</p>
                    </div>
                </div>
                <button onClick={fetchCompletionRequests} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                    <RotateCw size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {loadingRequests ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-500" /></div>
                ) : completionRequests.length > 0 ? (
                    completionRequests.map(ticket => (
                        <div key={ticket.gmail_id} className="flex items-center justify-between p-4 bg-[#0F1115] border border-white/5 rounded-lg hover:border-white/10 transition-colors group">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                        {ticket.ticket_number || ticket.id}
                                    </span>
                                    <span className="text-sm font-medium text-white truncate max-w-[300px]">{ticket.subject}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><User size={12} /> {ticket.assigned_to || "Unassigned"}</span>
                                    <span>•</span>
                                    <span>{new Date(ticket.updated_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded text-xs font-medium border border-emerald-500/20 transition-colors"
                            >
                                Review
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 text-sm bg-[#0F1115] rounded-lg border border-dashed border-white/10">
                        No pending completion requests.
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
                        fetchCompletionRequests(); // Refresh list on close
                    }}
                    onUpdate={() => {
                        fetchCompletionRequests(); // Refresh on any update
                    }}
                />
            )}
        </div>
    );
}
