
import React, { useState } from "react";
import { X, Ticket, Save, Loader2, Building, User, Mail } from "lucide-react";
import { useCreateTicket } from "../../../hooks/useTickets";

interface NewTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NewTicketModal({ isOpen, onClose }: NewTicketModalProps) {
    const [subject, setSubject] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [senderName, setSenderName] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");

    const { mutate: createTicket, isPending } = useCreateTicket();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !companyName.trim() || !senderName.trim() || !senderEmail.trim()) {
            return;
        }

        createTicket({
            subject,
            company_name: companyName,
            sender_name: senderName,
            sender_email: senderEmail,
            priority
        }, {
            onSuccess: () => {
                setSubject("");
                setCompanyName("");
                setSenderName("");
                setSenderEmail("");
                setPriority("NORMAL");
                onClose();
            },
            onError: (err) => {
                alert("Failed to create ticket: " + err.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[rgb(var(--panel))] border border-[rgb(var(--border))] rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
                    <div className="flex items-center gap-2 text-[rgb(var(--text))] font-semibold">
                        <Ticket size={18} className="text-emerald-500" />
                        <span>Create New Ticket</span>
                    </div>
                    <button onClick={onClose} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter ticket subject"
                            className="w-full bg-[hsl(var(--bg))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5 text-sm text-[rgb(var(--text))] focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[rgb(var(--muted))]"
                            required
                        />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider flex items-center gap-1">
                            <Building size={12} /> Company Name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter company name"
                            className="w-full bg-[hsl(var(--bg))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5 text-sm text-[rgb(var(--text))] focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[rgb(var(--muted))]"
                            required
                        />
                    </div>

                    {/* Sender Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider flex items-center gap-1">
                                <User size={12} /> Sender Name
                            </label>
                            <input
                                type="text"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="Enter name"
                                className="w-full bg-[hsl(var(--bg))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5 text-sm text-[rgb(var(--text))] focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[rgb(var(--muted))]"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider flex items-center gap-1">
                                <Mail size={12} /> Sender Email
                            </label>
                            <input
                                type="email"
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                                placeholder="Enter email"
                                className="w-full bg-[hsl(var(--bg))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5 text-sm text-[rgb(var(--text))] focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[rgb(var(--muted))]"
                                required
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as "NORMAL" | "URGENT")}
                            className="w-full bg-[hsl(var(--bg))] border border-[rgb(var(--border))] rounded-lg px-3 py-2.5 text-sm text-[rgb(var(--text))] focus:outline-none focus:border-emerald-500/50 transition-colors"
                        >
                            <option value="NORMAL">Normal</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:bg-[hsl(var(--bg))] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Create Ticket
                                </>
                            )}
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
}
