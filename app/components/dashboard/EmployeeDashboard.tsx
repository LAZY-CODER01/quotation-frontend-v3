'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Mail,
    Send,
    CheckCircle2,
    PackageCheck,
    Archive,
    Clock,
    MoreVertical
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
    active_tickets: number; // Legacy, kept for now or reused
    inbox_count: number;
    sent_count: number;
    confirmed_count: number;
    completed_count: number;
    closed_count: number;

    quotations: number;     // Legacy
    orders: number;         // Legacy
    completed: number;      // Legacy
    closed: number;         // Legacy
    avg_turnaround: number;
}

export default function TeamWorkflowDashboard() {
    const [stats, setStats] = useState<EmployeeStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all'); // '24h' | '7d' | '30d' | 'all'

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/employee-stats?range=${timeRange}`);
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] w-full bg-[hsl(var(--bg))]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--bg))] p-6 text-[rgb(var(--text))]">
            <div className="max-w-[1600px] mx-auto space-y-6">

                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Team Workflow Monitor</h1>
                        <p className="text-[rgb(var(--muted))] text-sm">Real-time ticket distribution across all stages</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="bg-[rgb(var(--panel))] text-xs font-medium border border-[rgb(var(--border))] rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <div className="text-xs text-[rgb(var(--muted))] font-mono bg-[rgb(var(--panel))] px-3 py-1.5 rounded border border-[rgb(var(--border))]">
                            LIVE TRACKING
                        </div>
                    </div>
                </header>

                <div className="bg-[rgb(var(--panel))] border border-[rgb(var(--border))] rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--muted))] text-[10px] uppercase tracking-widest bg-[hsl(var(--bg))]/50">
                                    <th className="px-6 py-5 font-semibold w-[250px]">Team Member</th>

                                    {/* Status Columns */}
                                    <th className="px-4 py-5 font-semibold text-center border-l border-[rgb(var(--border))] bg-blue-500/5">
                                        <div className="flex flex-col items-center gap-1 text-[rgb(var(--color-blue))]">
                                            <Mail className="w-4 h-4" />
                                            <span>Inbox ({stats.reduce((acc, curr) => acc + curr.inbox_count, 0)})</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-5 font-semibold text-center border-l border-[rgb(var(--border))] bg-yellow-500/5">
                                        <div className="flex flex-col items-center gap-1 text-yellow-500">
                                            <Send className="w-4 h-4" />
                                            <span>Sent ({stats.reduce((acc, curr) => acc + curr.sent_count, 0)})</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-5 font-semibold text-center border-l border-[rgb(var(--border))] bg-purple-500/5">
                                        <div className="flex flex-col items-center gap-1 text-purple-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Confirmed ({stats.reduce((acc, curr) => acc + curr.confirmed_count, 0)})</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-5 font-semibold text-center border-l border-[rgb(var(--border))] bg-emerald-500/5">
                                        <div className="flex flex-col items-center gap-1 text-emerald-500">
                                            <PackageCheck className="w-4 h-4" />
                                            <span>Completed ({stats.reduce((acc, curr) => acc + curr.completed_count, 0)})</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-5 font-semibold text-center border-l border-[rgb(var(--border))] bg-red-500/5">
                                        <div className="flex flex-col items-center gap-1 text-red-400">
                                            <Archive className="w-4 h-4" />
                                            <span>Closed ({stats.reduce((acc, curr) => acc + curr.closed_count, 0)})</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[rgb(var(--border))]">
                                {stats.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-[hsl(var(--bg))]/40 transition-colors">
                                        {/* Employee Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm">
                                                    {emp.employee.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{emp.employee.name}</p>
                                                    <p className="text-[11px] text-[rgb(var(--muted))]">{emp.role}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status Counts */}
                                        <td className="px-4 py-4 text-center border-l border-[rgb(var(--border))]">
                                            <span className={`text-lg font-bold ${emp.inbox_count > 5 ? 'text-orange-500' : 'text-[rgb(var(--text))]'}`}>
                                                {emp.inbox_count}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-center border-l border-[rgb(var(--border))]">
                                            <span className="text-lg font-bold text-yellow-500">{emp.sent_count}</span>
                                        </td>

                                        <td className="px-4 py-4 text-center border-l border-[rgb(var(--border))]">
                                            <span className="text-lg font-bold text-purple-500">{emp.confirmed_count}</span>
                                        </td>

                                        <td className="px-4 py-4 text-center border-l border-[rgb(var(--border))]">
                                            <span className="text-lg font-bold text-emerald-500">{emp.completed_count}</span>
                                        </td>

                                        <td className="px-4 py-4 text-center border-l border-[rgb(var(--border))]">
                                            <span className="text-lg font-bold text-red-500">{emp.closed_count}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}