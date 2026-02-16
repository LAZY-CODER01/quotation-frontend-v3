'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    ShoppingCart,
    Clock,
    MoreHorizontal,
    TrendingUp,
    Ticket
} from 'lucide-react';
import api from '../../../lib/api';

interface EmployeeStat {
    id: string;
    employee: {
        name: string;
        email: string;
        avatar: string;
    };
    role: string;
    active_tickets: number;
    quotations: number;
    orders: number;
    avg_turnaround: number;
}

export default function EmployeeDashboard() {
    const [stats, setStats] = useState<EmployeeStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/employee-stats');

            if (response.data.success) {
                setStats(response.data.stats);
            } else {
                throw new Error(response.data.error || 'Failed to fetch stats');
            }
        } catch (err: any) {
            console.error("Error fetching employee stats:", err);
            setError(err.message || 'Failed to load employee data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] w-full bg-zinc-950 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[500px] w-full bg-zinc-950 text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    // Calculate aggregates based on fetched stats
    const totalEmployees = stats.length;
    // Quotations and Orders are already summed per employee, so sum them up for total
    const totalQuotations = stats.reduce((acc, curr) => acc + curr.quotations, 0);
    const totalOrders = stats.reduce((acc, curr) => acc + curr.orders, 0);

    return (
        <div className="min-h-screen bg-zinc-950 p-6 md:p-8 text-zinc-100 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Employees</h1>
                    <p className="text-zinc-400 text-sm">Manage team members and track performance</p>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: Total Employees */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Employees</p>
                            <h3 className="text-3xl font-bold text-white">{totalEmployees}</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>

                    {/* Card 2: Total Quotations */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Quotations Sent</p>
                            <h3 className="text-3xl font-bold text-white">{totalQuotations}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>

                    {/* Card 3: Total Orders */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-start shadow-sm">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium mb-1">Total Orders Closed</p>
                            <h3 className="text-3xl font-bold text-white">{totalOrders}</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>

                </div>

                {/* Team Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-800">
                        <h2 className="text-base font-semibold text-white">Team Members</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
                                    <th className="px-6 py-4 font-medium">Employee</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Active Tickets</th>
                                    <th className="px-6 py-4 font-medium">Quotations</th>
                                    <th className="px-6 py-4 font-medium">Orders</th>
                                    <th className="px-6 py-4 font-medium">Avg Turnaround</th>
                                    <th className="px-6 py-4 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {stats.length > 0 ? (
                                    stats.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-zinc-800/20 transition-colors">
                                            {/* Name & Avatar */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm">
                                                        {emp.employee.avatar}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{emp.employee.name}</p>
                                                        <p className="text-xs text-zinc-500">{emp.employee.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Pill */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
                                                    {emp.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </td>

                                            {/* Active Tickets */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                                    <Ticket className="w-4 h-4 text-zinc-500" />
                                                    <span>{emp.active_tickets}</span>
                                                </div>
                                            </td>

                                            {/* Quotations */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                                    <FileText className="w-4 h-4 text-zinc-500" />
                                                    <span>{emp.quotations}</span>
                                                </div>
                                            </td>

                                            {/* Orders */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-emerald-400 font-medium">{emp.orders}</span>
                                                </div>
                                            </td>

                                            {/* Avg Turnaround */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                                    <Clock className="w-4 h-4 text-zinc-500" />
                                                    <span>{emp.active_tickets >= 0 ? `${emp.avg_turnaround}h` : '-'}</span>
                                                </div>
                                            </td>

                                            {/* Menu Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
