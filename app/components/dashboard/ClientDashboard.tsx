'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    ShoppingCart,
    MoreHorizontal,
    Plus,
    Search,
    Building,
    Phone,
    Mail,
    Calendar,
    X,
    Loader2
} from 'lucide-react';
import api from '../../../lib/api';

interface ClientStat {
    id: string;
    name: string;
    company: string;
    contact: {
        email: string;
        phone: string;
    };
    tags: string[];
    stats: {
        quotations: number;
        orders: number;
    };
    since: string;
    last_active: string | null;
}

export default function ClientDashboard() {
    const [clients, setClients] = useState<ClientStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        business_name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const [clientsResponse, ticketsResponse] = await Promise.all([
                api.get('/admin/clients'),
                api.get('/emails?limit=1000') // Fetch recent 1000 tickets to aggregate
            ]);

            if (clientsResponse.data.success) {
                let clientsData: ClientStat[] = clientsResponse.data.clients;

                if (ticketsResponse.data.success) {
                    const tickets = ticketsResponse.data.data;

                    // Map client emails to ticket counts
                    const ticketCounts = new Map<string, number>();

                    tickets.forEach((ticket: any) => {
                        // Extract email from sender field if possible, or matches company name
                        const sender = ticket.sender || '';
                        const company = ticket.company_name || '';

                        // We need to match tickets to clients. 
                        // Strategy: Iterate clients and check if ticket belongs to them
                        // This is O(N*M), but with <1000 items it's fine. 
                        // Better: Pre-process tickets?? 
                        // Actually, let's iterate clients and filter tickets for each.
                    });

                    // Update clients with local counts
                    clientsData = clientsData.map(client => {
                        const clientEmail = client.contact.email?.toLowerCase();
                        const clientCompany = client.company?.toLowerCase();
                        const clientName = client.name?.toLowerCase();

                        // Count tickets that match this client
                        const clientTicketCount = tickets.filter((ticket: any) => {
                            const tSender = (ticket.sender || '').toLowerCase();
                            const tCompany = (ticket.company_name || '').toLowerCase();

                            // Match Logic:
                            // 1. Email match (most accurate)
                            if (clientEmail && tSender.includes(clientEmail)) return true;

                            // 2. Exact Company Name match
                            if (clientCompany && tCompany === clientCompany) return true;

                            // 3. Sender Name approximate match?? (Risky, skip for now)

                            return false;
                        }).length;

                        return {
                            ...client,
                            stats: {
                                ...client.stats,
                                orders: clientTicketCount // Override with actual ticket count
                            }
                        };
                    });
                }

                setClients(clientsData);
            } else {
                throw new Error(clientsResponse.data.error || 'Failed to fetch clients');
            }
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post('/admin/clients', newClient);
            if (response.data.success) {
                setIsModalOpen(false);
                setNewClient({ name: '', business_name: '', email: '', phone: '' });
                fetchClients(); // Refresh list
            } else {
                alert(response.data.error || "Failed to add client");
            }
        } catch (error: any) {
            console.error("Error adding client:", error);
            alert(error.response?.data?.error || "Error adding client");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] w-full bg-zinc-950 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    // Aggregates
    const totalClients = clients.length;
    const totalQuotations = clients.reduce((acc, curr) => acc + curr.stats.quotations, 0);
    const totalOrders = clients.reduce((acc, curr) => acc + curr.stats.orders, 0);

    return (
        <div className="min-h-screen bg-zinc-950 p-6 md:p-8 text-zinc-100 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
                        <p className="text-zinc-400 text-sm">Manage client relationships and history</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={18} /> Add Client
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Clients</p>
                            <h3 className="text-3xl font-bold text-white">{totalClients}</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Quotations</p>
                            <h3 className="text-3xl font-bold text-white">{totalQuotations}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Orders</p>
                            <h3 className="text-3xl font-bold text-white">{totalOrders}</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Client Directory */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-base font-semibold text-white">Client Directory</h2>
                        {/* Valid Search Placeholder */}
                        {/* <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Search clients..." className="bg-black/20 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700 w-64" />
            </div> */}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
                                    <th className="px-6 py-4 font-medium">Client</th>
                                    <th className="px-6 py-4 font-medium">Company</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium text-center">Quotations</th>
                                    <th className="px-6 py-4 font-medium text-center">Orders</th>
                                    <th className="px-6 py-4 font-medium">Since</th>
                                    <th className="px-6 py-4 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {clients.length > 0 ? (
                                    clients.map((client) => (
                                        <tr key={client.id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                        <Building size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{client.name}</p>
                                                        {/* Tags fallback */}
                                                        {/* <p className="text-xs text-zinc-500">Preferred client</p> */}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-300">
                                                {client.company || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-zinc-400 space-y-1">
                                                    {client.contact.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={12} /> {client.contact.email}
                                                        </div>
                                                    )}
                                                    {client.contact.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={12} /> {client.contact.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                    {client.stats.quotations}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    {client.stats.orders}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} /> {client.since}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                            No clients found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h2 className="text-lg font-semibold text-white">Add New Client</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Client Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newClient.name}
                                    onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-black/20 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    placeholder="e.g. John Smith"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Company Name</label>
                                <input
                                    type="text"
                                    value={newClient.business_name}
                                    onChange={e => setNewClient(prev => ({ ...prev, business_name: e.target.value }))}
                                    className="w-full bg-black/20 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={newClient.email}
                                    onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-black/20 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    placeholder="e.g. john@acme.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newClient.phone}
                                    onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-black/20 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    placeholder="e.g. +971 50 123 4567"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {isSubmitting ? 'Adding...' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
