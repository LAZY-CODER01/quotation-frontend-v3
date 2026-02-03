"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/api";
import { EmailExtraction } from "../../../../types/email";
import TicketCard from "../../../components/tickets/TicketCard";
import TicketSidebar from "../../../components/tickets/TicketSidebar";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

    // Sidebar State
    const [selectedTicket, setSelectedTicket] = useState<EmailExtraction | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch Tickets
    const { data: tickets = [], isLoading, refetch } = useQuery({
        queryKey: ["tickets", "status", slug],
        queryFn: async () => {
            // User requested explicitly: Fetch all tickets using api.get('/emails')
            // Then filter based on mapped status.
            // We pass some params to avoid fetching literally everything if the backend supports it,
            // but sticking to instructions:
            const response = await api.get("/emails");
            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to fetch tickets");
            }
            return response.data.data as EmailExtraction[];
        },
        // Filter locally as per plan
        select: (allTickets) => {
            if (!targetStatuses.length) return [];
            return allTickets.filter((t) => {
                const s = t.ticket_status?.toUpperCase() || "OPEN";
                return targetStatuses.includes(s);
            });
        },
        refetchInterval: 30000, // Poll every 30s
    });

    const handleTicketClick = (ticket: EmailExtraction) => {
        setSelectedTicket(ticket);
        setIsSidebarOpen(true);
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => handleTicketClick(ticket)}
                            className="cursor-pointer transition-transform duration-200 active:scale-[0.98]"
                        >
                            <TicketCard data={ticket} />
                        </div>
                    ))}
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
                onUpdate={() => {
                    // Ideally refetch or optimistic update
                    // For now, just refetch
                    refetch();
                }}
                // Add other handlers if needed, utilizing refetch or query client updates
                onStatusChanged={() => refetch()}
                onPriorityChanged={() => refetch()}
                onAssignmentChanged={() => refetch()}
            />
        </div>
    );
}
