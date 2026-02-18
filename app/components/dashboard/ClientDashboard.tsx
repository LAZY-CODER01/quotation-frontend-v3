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
    Loader2,
    Send,
    CheckCircle2,
    PackageCheck
} from 'lucide-react';
import api from '../../../lib/api';
import DateRangePicker from '../ui/DateRangePicker';

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
        sent_count: number;
        confirmed_count: number;
        completed_count: number;
    };
    since: string;
}

export default function ClientDashboard() {
    const [clients, setClients] = useState<ClientStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date Range State
    const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
        startDate: null,
        endDate: null
    });

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
        const isRangeComplete = (dateRange.startDate && dateRange.endDate) || (!dateRange.startDate && !dateRange.endDate);
        if (isRangeComplete) {
            fetchClients();
        }
    }, [dateRange]); // Refetch when date range changes

    const fetchClients = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('start_date', dateRange.startDate.toISOString());
            if (dateRange.endDate) params.append('end_date', dateRange.endDate.toISOString());
            if (!dateRange.startDate && !dateRange.endDate) params.append('range', 'all');

            const response = await api.get(`/admin/clients?${params.toString()}`);

            if (response.data.success) {
                setClients(response.data.clients);
            } else {
                throw new Error(response.data.error || 'Failed to fetch clients');
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
    const totalSent = clients.reduce((acc, curr) => acc + curr.stats.sent_count, 0);
    const totalOrders = clients.reduce((acc, curr) => acc + curr.stats.confirmed_count, 0);

    return (
        <div className="min-h-screen bg-zinc-950 p-6 md:p-8 text-zinc-100 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
                        <p className="text-zinc-400 text-sm">Manage client relationships and history</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <DateRangePicker
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            onChange={(range) => setDateRange(range)}
                        />
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={18} /> Add Client
                        </button>
                    </div>
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
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Sent</p>
                            <h3 className="text-3xl font-bold text-white">{totalSent}</h3>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <Send className="w-5 h-5 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Orders</p>
                            <h3 className="text-3xl font-bold text-white">{totalOrders}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Client Directory */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-base font-semibold text-white">Client Directory</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
                                    <th className="px-6 py-4 font-medium">Company</th>
                                    <th className="px-6 py-4 font-medium">Contact</th>
                                    <th className="px-6 py-4 font-medium text-center">Quotations (Sent)</th>
                                    <th className="px-6 py-4 font-medium text-center">Orders Received</th>
                                    <th className="px-6 py-4 font-medium text-center">Orders Completed</th>
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
                                                        <p className="text-sm font-medium text-white">{client.company || 'Unknown Company'}</p>
                                                        {/* Optional: Show client Name as secondary text if needed, but request said remove client name column */}
                                                        {client.name && <p className="text-xs text-zinc-500">{client.name}</p>}
                                                    </div>
                                                </div>
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
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                    {client.stats.sent_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                    {client.stats.confirmed_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    {client.stats.completed_count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
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
