"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import api from "../../../lib/api";
import { EmailExtraction, QuotationFile, ActivityLog } from "../../../types/email";
import TicketCard from "../../components/tickets/TicketCard";
import TicketSidebar from "../../components/tickets/TicketSidebar";
import RequirementsEditor from "../../components/dashboard/RequirementsEditor";

export default function TicketRangePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<EmailExtraction[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // --- Handlers ---
    const handleBack = () => router.push("/");

    const handleFileAdded = (newFile: QuotationFile) => {
        if (!selectedTicket) return;
        setSelectedTicket(prev => prev ? ({
            ...prev,
            quotation_files: [...(prev.quotation_files || []), newFile]
        }) : null);
    };

    const handleCPOAdded = (newFile: QuotationFile) => {
        if (!selectedTicket) return;
        setSelectedTicket(prev => prev ? ({
            ...prev,
            cpo_files: [...(prev.cpo_files || []), newFile]
        }) : null);
    };

    const handleNoteAdded = (newNote: any) => {
        if (!selectedTicket) return;
        setSelectedTicket(prev => prev ? ({
            ...prev,
            internal_notes: [...(prev.internal_notes || []), newNote]
        }) : null);
    };

    const handleStatusChanged = (newStatus: string) => {
        if (!selectedTicket) return;
        setSelectedTicket(prev => prev ? ({ ...prev, ticket_status: newStatus }) : null);
        setTickets(prev => prev.map(t => t.gmail_id === selectedTicket.gmail_id ? { ...t, ticket_status: newStatus } : t));
    };

    const handleActivityLogAdded = (newLog: ActivityLog) => {
        if (!selectedTicket) return;
        setSelectedTicket(prev => prev ? ({ ...prev, activity_logs: [...(prev.activity_logs || []), newLog] }) : null);
    };

    const handlePriorityChanged = (newPriority: string) => {
        if (!selectedTicket) return;
        setSelectedTicket(prev => prev ? ({ ...prev, ticket_priority: newPriority }) : null);
        setTickets(prev => prev.map(t => t.gmail_id === selectedTicket.gmail_id ? { ...t, ticket_priority: newPriority } : t));
    };

    // --- Data Fetching ---
    useEffect(() => {
        if (!fromDate || !toDate) return;

        const fetchTickets = async () => {
            setLoading(true);
            try {
                // Auto-swap dates if backwards
                let start = fromDate;
                let end = toDate;
                if (new Date(start) > new Date(end)) {
                    [start, end] = [end, start];
                }

                const response = await api.get("/emails", {
                    params: { start_date: start, end_date: end, limit: 100 } // Increased limit for archive view
                });

                if (response.data.success) {
                    setTickets(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch tickets by range", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [fromDate, toDate]);

    return (
        <div className="min-h-screen bg-[#0F1115] text-white">

            {/* Header */}
            <div className="bg-black border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Calendar size={18} className="text-emerald-500" />
                            Ticket Archive
                        </h1>
                        <p className="text-xs text-gray-500">
                            Showing {tickets.length} tickets from <span className="text-emerald-400 font-mono">{fromDate}</span> to <span className="text-emerald-400 font-mono">{toDate}</span>
                        </p>
                    </div>
                </div>
            </div>

            {isEditorOpen && selectedTicket ? (
                <RequirementsEditor
                    ticket={selectedTicket}
                    onBack={() => setIsEditorOpen(false)}
                    onSave={(newReq) => {
                        setSelectedTicket(prev => prev ? ({ ...prev, extraction_result: { ...prev.extraction_result, Requirements: newReq } }) : null);
                    }}
                />
            ) : (
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
                            <p>Fetching tickets...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                            <p className="text-lg">No tickets found in this range.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {tickets.map((ticket) => (
                                /* FIX START: Wrap in div and use data={ticket} */
                                <div 
                                    key={ticket.gmail_id} 
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="cursor-pointer transition-transform duration-200 active:scale-[0.98]"
                                >
                                    <TicketCard data={ticket} />
                                </div>
                                /* FIX END */
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sidebar */}
            <TicketSidebar
                ticket={selectedTicket}
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                onEditRequirements={() => setIsEditorOpen(true)}
                onFileAdded={handleFileAdded}
                onCPOAdded={handleCPOAdded}
                onNoteAdded={handleNoteAdded}
                onStatusChanged={handleStatusChanged}
                onActivityLogAdded={handleActivityLogAdded}
                onPriorityChanged={handlePriorityChanged}
            />
        </div>
    );
}