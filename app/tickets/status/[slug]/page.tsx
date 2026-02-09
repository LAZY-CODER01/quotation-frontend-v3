"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/api";
import { EmailExtraction } from "../../../../types/email";
import TicketCard from "../../../components/tickets/TicketCard";
import TicketSidebar from "../../../components/tickets/TicketSidebar";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  getUaeFriendlyDayLabel,
  toUaeDate,
} from "../../../lib/time";

// Map slug to backend statuses
const STATUS_MAP: Record<string, string[]> = {
    inbox: ["OPEN", "INBOX"],
    sent: ["SENT"],
    confirmed: ["ORDER_CONFIRMED"],
    completed: ["ORDER_COMPLETED"],
    closed: ["CLOSED"],
};

const STATUS_TITLES: Record<string, string> = {
    inbox: "Inbox",
    sent: "Sent",
    confirmed: "Order Confirmed",
    completed: "Order Completed",
    closed: "Closed",
};

export default function StatusPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const statusKey = slug?.toLowerCase();

    const targetStatuses = STATUS_MAP[statusKey] || [];
    const title = STATUS_TITLES[statusKey] || "Tickets";

    const queryClient = useQueryClient();

    // Sidebar State
    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch Tickets
    const queryKey = ["tickets", "status", slug];
    const { data: tickets = [], isLoading, refetch } = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            // User requested explicitly: Fetch all tickets using api.get('/emails')
            // Then filter based on mapped status.
            const response = await api.get("/emails");
            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to fetch tickets");
            }
            return response.data.data as EmailExtraction[];
        },
        // Filter locally as per plan
        select: (allTickets) => {
            if (!targetStatuses.length) return [];
            return allTickets.filter((t: EmailExtraction) => {
                const s = t.ticket_status?.toUpperCase() || "OPEN";
                return targetStatuses.includes(s);
            }).sort((a, b) => {
                const tb = toUaeDate(b.received_at)?.getTime() ?? 0;
                const ta = toUaeDate(a.received_at)?.getTime() ?? 0;
                return tb - ta;
            });
        },
        refetchInterval: 30000, // Poll every 30s
    });

    // Helper: Update local cache
    const updateTicketInCache = (ticketId: string, updater: (t: EmailExtraction) => EmailExtraction) => {
        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldData) => {
            if (!oldData) return oldData;
            return oldData.map(ticket => {
                const tId = ticket.ticket_number || `TKT-${ticket.id}`;
                const targetId = ticketId; // Assuming ticketId passed is compatible, or we check both id and ticket_number?
                // Actually the ticket objects have 'id' (int or string).
                // Let's match by id since that's what we have in selectedTicket.
                if (String(ticket.id) === String(ticketId) || ticket.gmail_id === ticketId) {
                    return updater(ticket);
                }
                return ticket;
            });
        });
    };

    const handleTicketClick = (ticket: EmailExtraction) => {
        setSelectedTicket(ticket);
        setIsSidebarOpen(true);
    };

    // Optimistic Handlers
    const handleStatusChanged = (newStatus: string) => {
        if (!selectedTicket) return;

        // 1. Update Selected Ticket State
        const updatedTicket = { ...selectedTicket, ticket_status: newStatus };
        setSelectedTicket(updatedTicket);

        // 2. Update Query Cache
        // Note: modify the *source* data (allTickets) is tricky with 'select'.
        // useQuery cache usually stores what queryFn returns.
        // But here we are using 'select'. queryClient.setQueryData updates the data returned by queryFn (the unfiltered list).
        // Wait, if we use 'select', setQueryData might need to match the structure of queryFn result.
        // Yes, queryFn returns EmailExtraction[].

        // We need to update the cache for the raw data.
        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t =>
                (t.id === selectedTicket.id) ? { ...t, ticket_status: newStatus } : t
            );
        });

        // Refetch to be safe/consistent eventually
        refetch();
    };

    const handlePriorityChanged = (newPriority: string) => {
        if (!selectedTicket) return;
        const updatedTicket = { ...selectedTicket, ticket_priority: newPriority };
        setSelectedTicket(updatedTicket);

        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t =>
                (t.id === selectedTicket.id) ? { ...t, ticket_priority: newPriority } : t
            );
        });
        refetch();
    };

    const handleAssignmentChanged = (newAssignee: string) => {
        if (!selectedTicket) return;
        const updatedTicket = { ...selectedTicket, assigned_to: newAssignee };
        setSelectedTicket(updatedTicket);

        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t =>
                (t.id === selectedTicket.id) ? { ...t, assigned_to: newAssignee } : t
            );
        });
        refetch();
    };

    const handleFileAdded = (newFile: any) => { // Using any for QuotationFile to avoid import issues if not handy, but ideally strictly typed
        if (!selectedTicket) return;

        // Determine if quotation or cpo based on some property or just try to push to both?
        // Actually the callback distinguishes in Sidebar, but here we just get a file.
        // Wait, Sidebar has onFileAdded and onCPOAdded.
        // We need to implement both in Page or handle generic.
        // Let's separate them in the props passed to Sidebar.

        // BUT, for now, let's implement a generic updater or specific ones.
        // The Sidebar calls onFileAdded for Quotations and onCPOAdded for CPO.
        // We need to update the prop passed to TicketSidebar.
    };

    // We'll define specific handlers for Sidebar props:

    const onQuotationAdded = (newFile: any) => {
        if (!selectedTicket) return;
        const updatedFiles = [...(selectedTicket.quotation_files || []), newFile];
        const updatedTicket = { ...selectedTicket, quotation_files: updatedFiles };
        setSelectedTicket(updatedTicket);

        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t => (t.id === selectedTicket.id) ? updatedTicket : t);
        });
        refetch();
    };

    const onCPOAdded = (newFile: any) => {
        if (!selectedTicket) return;
        const updatedFiles = [...(selectedTicket.cpo_files || []), newFile];
        const updatedTicket = { ...selectedTicket, cpo_files: updatedFiles };
        setSelectedTicket(updatedTicket);

        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t => (t.id === selectedTicket.id) ? updatedTicket : t);
        });
        refetch();
    };

    const onFileDeleted = (fileId: string) => {
        if (!selectedTicket) return;
        // Search in both arrays

        const newQuotations = selectedTicket.quotation_files?.filter(f => f.id !== fileId) || [];
        const newCPOs = selectedTicket.cpo_files?.filter(f => f.id !== fileId) || []; // Assuming CPO files also have IDs and might match?
        // Note: IDs should be unique.

        const updatedTicket = {
            ...selectedTicket,
            quotation_files: newQuotations,
            cpo_files: newCPOs
        };
        setSelectedTicket(updatedTicket);

        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t => (t.id === selectedTicket.id) ? updatedTicket : t);
        });
        refetch();
    };

    const onFileUpdated = (fileId: string, newAmount: string) => {
        if (!selectedTicket) return;

        const updateFile = (f: any) => f.id === fileId ? { ...f, amount: newAmount } : f;

        const newQuotations = selectedTicket.quotation_files?.map(updateFile) || [];
        const newCPOs = selectedTicket.cpo_files?.map(updateFile) || [];

        const updatedTicket = {
            ...selectedTicket,
            quotation_files: newQuotations,
            cpo_files: newCPOs
        };
        setSelectedTicket(updatedTicket);

        queryClient.setQueryData<EmailExtraction[]>(queryKey, (oldRawData) => {
            if (!oldRawData) return [];
            return oldRawData.map(t => (t.id === selectedTicket.id) ? updatedTicket : t);
        });
        refetch();
    };

    return (
        <div className="min-h-screen bg-[#0F1115] text-white p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-gray-400 text-sm">
                        {isLoading ? "Loading..." : `${tickets.length} tickets`}
                    </p>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
            ) : tickets.length > 0 ? (
                <div className="space-y-8">
                    {(() => {
                        const groups: { title: string; tickets: EmailExtraction[] }[] = [];
                        tickets.forEach((ticket) => {
                            const date = toUaeDate(ticket.received_at);
                            if (!date) return;

                            const groupTitle = getUaeFriendlyDayLabel(date);
                            const lastGroup = groups[groups.length - 1];
                            if (lastGroup && lastGroup.title === groupTitle) {
                                lastGroup.tickets.push(ticket);
                            } else {
                                groups.push({ title: groupTitle, tickets: [ticket] });
                            }
                        });

                        return groups.map((group) => (
                            <div key={group.title}>
                                <h2 className="text-lg font-semibold text-gray-400 mb-4 sticky top-0 bg-[#0F1115] py-2 z-10 border-b border-white/5 flex items-center">
                                    {group.title}
                                    <span className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                                        {group.tickets.length}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {group.tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => handleTicketClick(ticket)}
                                            className="cursor-pointer transition-transform duration-200 active:scale-[0.98]"
                                        >
                                            <TicketCard data={ticket} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
                    <p>No tickets found in {title}</p>
                </div>
            )}

            {/* Sidebar */}
            <TicketSidebar
                ticket={selectedTicket}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onUpdate={() => refetch()} // Fallback
                onStatusChanged={handleStatusChanged}
                onPriorityChanged={handlePriorityChanged}
                onAssignmentChanged={handleAssignmentChanged}
                onFileAdded={onQuotationAdded}
                onCPOAdded={onCPOAdded}
                onFileDeleted={onFileDeleted}
                onFileUpdated={onFileUpdated}
            />
        </div>
    );
}
