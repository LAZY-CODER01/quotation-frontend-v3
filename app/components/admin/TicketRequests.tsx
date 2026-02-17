"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { RotateCw, User, Loader2 } from "lucide-react";
import TicketSidebar from "../tickets/TicketSidebar";
import { formatUaeDateTime } from "../../../app/lib/time";

export default function TicketRequests() {
    const [completionRequests, setCompletionRequests] = useState<any[]>([]);
    const [closureRequests, setClosureRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    const fetchRequests = async () => {
        try {
            setLoadingRequests(true);
            const [completionRes, closureRes] = await Promise.all([
                api.get('/emails?status=COMPLETION_REQUESTED'),
                api.get('/emails?status=CLOSURE_REQUESTED')
            ]);

            if (completionRes.data.success) {
                setCompletionRequests(completionRes.data.data);
            }
            if (closureRes.data.success) {
                setClosureRequests(closureRes.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // ✅ FIX: Keep selectedTicket in sync with latest data
    useEffect(() => {
        if (selectedTicket) {
            const allRequests = [...completionRequests, ...closureRequests];
            if (allRequests.length > 0) {
                const updated = allRequests.find(t => t.gmail_id === selectedTicket.gmail_id);
                if (updated && updated !== selectedTicket) {
                    setSelectedTicket(updated);
                }
            }
        }
    }, [completionRequests, closureRequests, selectedTicket]);

    const renderTicketList = (tickets: any[], emptyMessage: string, badgeColor: string) => {
        if (tickets.length === 0) {
            return (
                <div className="text-center py-4 text-[rgb(var(--text-tertiary))] text-xs bg-[rgb(var(--bg-primary))] rounded-lg border border-dashed border-[rgb(var(--border-primary))]">
                    {emptyMessage}
                </div>
            );
        }
        return tickets.map(ticket => (
            <div key={ticket.gmail_id} className="flex items-center justify-between p-3 bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-secondary))] rounded-lg hover:border-[rgb(var(--hover-border))] transition-colors group">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] px-2 py-0.5 rounded border border-[rgb(var(--border-primary))]">
                            {ticket.ticket_number || ticket.id}
                        </span>
                        <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate max-w-[250px]">{ticket.subject}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[rgb(var(--text-tertiary))]">
                        <span className="flex items-center gap-1">
                            <User size={10} /> {ticket.assigned_to || "Unassigned"}
                        </span>
                        <span>•</span>
                        <span>{formatUaeDateTime(ticket.updated_at || ticket.received_at)}</span>
                    </div>
                </div>
                <button
                    onClick={() => setSelectedTicket(ticket)}
                    className={`px-3 py-1 bg-${badgeColor}-500/10 text-${badgeColor}-500 hover:bg-${badgeColor}-500/20 rounded text-[10px] font-bold border border-${badgeColor}-500/20 transition-colors`}
                >
                    Review
                </button>
            </div>
        ));
    };

    return (
        <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden flex flex-col h-[calc(100vh-140px)]">
            {/* Header - Fixed */}
            <div className="p-6 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <RotateCw className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Ticket Requests</h2>
                        <p className="text-sm text-[rgb(var(--text-secondary))]">Review completion and closure requests</p>
                    </div>
                </div>
                <button onClick={fetchRequests} className="p-2 hover:bg-[rgb(var(--hover-bg))] rounded-full transition-colors text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                    <RotateCw size={16} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {loadingRequests ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-[rgb(var(--text-tertiary))]" /></div>
                ) : (
                    <>
                        {/* Completion Requests Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                Completion Requests ({completionRequests.length})
                            </h3>
                            <div className="space-y-2">
                                {renderTicketList(completionRequests, "No pending completion requests.", "orange")}
                            </div>
                        </div>

                        {/* Closure Requests Section */}
                        <div className="space-y-3 pt-4 border-t border-[rgb(var(--border-secondary))]">
                            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                Closure Requests ({closureRequests.length})
                            </h3>
                            <div className="space-y-2">
                                {renderTicketList(closureRequests, "No pending closure requests.", "red")}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Ticket Sidebar Modal */}
            {selectedTicket && (
                <TicketSidebar
                    ticket={selectedTicket}
                    isOpen={!!selectedTicket}
                    onClose={() => {
                        setSelectedTicket(null);
                        fetchRequests(); // Refresh list on close
                    }}
                    onUpdate={() => {
                        fetchRequests(); // Refresh on any update
                    }}
                />
            )}
        </div>
    );
}
