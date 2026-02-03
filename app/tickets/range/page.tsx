"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import api from "../../../lib/api";
import { EmailExtraction, QuotationFile, ActivityLog } from "../../../types/email";
import TicketSidebar from "../../components/tickets/TicketSidebar";
import TicketColumn from "../../components/tickets/TicketColumn";
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
                    params: { start_date: start, end_date: end, limit: 100 }
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
        <div className="h-screen flex flex-col bg-[#0F1115] text-white">

            {/* Header */}
            <div className="bg-black border-b border-white/10 px-6 py-4 flex-none z-30">
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
                <div className="flex-1 overflow-hidden flex flex-col relative w-full">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
                            <p>Fetching tickets...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                            <p className="text-lg">No tickets found in this range.</p>
                        </div>
                    ) : (
                        <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-6 bg-[#0F1115]">
                            <div className="flex h-full gap-6 min-w-max px-6">
                                {/* Inbox Column */}
                                <TicketColumn
                                    title="Inbox"
                                    count={tickets.filter(t => ['OPEN', 'INBOX'].includes(t.ticket_status?.toUpperCase() || 'OPEN')).length}
                                    color="blue"
                                    date="-"
                                    tickets={tickets.filter(t => ['OPEN', 'INBOX'].includes(t.ticket_status?.toUpperCase() || 'OPEN'))}
                                    onTicketClick={setSelectedTicket}
                                    slug="inbox"
                                />
                                {/* Sent Column */}
                                <TicketColumn
                                    title="Sent"
                                    count={tickets.filter(t => t.ticket_status === 'SENT').length}
                                    color="yellow"
                                    date="-"
                                    tickets={tickets.filter(t => t.ticket_status === 'SENT')}
                                    onTicketClick={setSelectedTicket}
                                    slug="sent"
                                />
                                {/* Order Confirmed Column */}
                                <TicketColumn
                                    title="Order Confirmed"
                                    count={tickets.filter(t => t.ticket_status === 'ORDER_CONFIRMED').length}
                                    color="emerald"
                                    date="-"
                                    tickets={tickets.filter(t => t.ticket_status === 'ORDER_CONFIRMED')}
                                    onTicketClick={setSelectedTicket}
                                    slug="confirmed"
                                />
                                {/* Order Completed Column */}
                                <TicketColumn
                                    title="Order Completed"
                                    count={tickets.filter(t => t.ticket_status === 'ORDER_COMPLETED').length}
                                    color="green"
                                    date="-"
                                    tickets={tickets.filter(t => t.ticket_status === 'ORDER_COMPLETED')}
                                    onTicketClick={setSelectedTicket}
                                    slug="completed"
                                />
                                {/* Closed Column */}
                                <TicketColumn
                                    title="Closed"
                                    count={tickets.filter(t => t.ticket_status === 'CLOSED').length}
                                    color="blue"
                                    date="-"
                                    tickets={tickets.filter(t => t.ticket_status === 'CLOSED')}
                                    onTicketClick={setSelectedTicket}
                                    slug="closed"
                                />
                            </div>
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
//