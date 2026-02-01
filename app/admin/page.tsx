"use client";

import { useSearchParams } from "next/navigation";
import GmailSettings from "../components/admin/GmailSettings";
import UserManagement from "../components/admin/UserManagement";
import TicketRequests from "../components/admin/TicketRequests";

export default function AdminPage() {
    const searchParams = useSearchParams();
    // Default to 'requests' if no view is specified
    const currentView = searchParams.get("view") || "requests";

    const renderContent = () => {
        switch (currentView) {
            case "gmail":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Gmail Configuration</h2>
                            <p className="text-gray-400 text-sm">Manage the connection to the company email server.</p>
                        </div>
                        <GmailSettings />
                    </div>
                );
            case "users":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">User Management</h2>
                            <p className="text-gray-400 text-sm">Create and manage employee accounts.</p>
                        </div>
                        <UserManagement />
                    </div>
                );
            case "requests":
            default:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Ticket Completion Requests</h2>
                            <p className="text-gray-400 text-sm">Review tickets marked for closure by employees.</p>
                        </div>
                        <TicketRequests />
                    </div>
                );
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto w-full">
            {renderContent()}
        </div>
    );
}