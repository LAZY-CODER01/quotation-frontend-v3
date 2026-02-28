'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../lib/api';
import {
    BarChart3,
    Search,
    ChevronDown,
    User,
    Ticket,
    Send,
    CheckCircle2,
    PackageCheck,
    DollarSign,
    TrendingUp,
    Percent,
    Calendar,
    ArrowRight,
    Loader2,
    AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
    id: string;
    username: string;
    employee_code: string;
    role: string;
}

interface KPIData {
    ticketsCameIn: number;
    quotesSent: number;
    ordersConfirmed: number;
    closedDelivered: number;
    lineItemsQuoted: number;
    quoteValue: string;
    orderValue: string;
    sentRate: string;
    convRate: string;
}

interface FunnelStage {
    label: string;
    value: number;
    sub: string | null;
    color: string;
}

interface WorkloadData {
    lineItems: { value: string; avg: string };
    quoteValue: { value: string; avg: string };
    orderValue: { value: string; avg: string };
}

interface TicketRow {
    id: string;
    company: string;
    email: string;
    status: string;
    statusColor: string;
    quoteRef: string;
    cpoRef: string;
    lines: number;
    quoteAmt: string;
    cpoAmt: string;
    assigned: string;
    sent: string;
    confirmed: string;
    closed: string;
}

interface AnalyticsData {
    kpis: KPIData;
    funnel: FunnelStage[];
    workload: WorkloadData;
    tickets: TicketRow[];
}

const TABS = ['All', 'Inbox', 'Sent', 'Order Confirmed', 'Closed'] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status, color }: { status: string; color: string }) {
    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorMap[color] ?? colorMap.blue}`}>
            {status}
        </span>
    );
}

function toISODate(d: Date): string {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmployeeAnalytics() {
    // Employee list
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Analytics data
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);

    // ── Fetch employee list on mount ──
    useEffect(() => {
        async function fetchEmployees() {
            try {
                setLoading(true);
                const res = await api.get('/admin/users');
                if (res.data?.success && res.data.users) {
                    const allUsers: Employee[] = res.data.users;
                    setEmployees(allUsers);
                    // Select first non-admin user by default (they have tickets)
                    const firstNonAdmin = allUsers.find(u => u.role !== 'ADMIN') || allUsers[0];
                    if (firstNonAdmin) {
                        setSelectedEmployee(firstNonAdmin);
                    }
                }
            } catch (err: any) {
                setError(err?.response?.data?.error || 'Failed to load employees');
            } finally {
                setLoading(false);
            }
        }
        fetchEmployees();
    }, []);

    const fetchAnalytics = useCallback(async () => {
        if (!selectedEmployee) return;
        // Only fetch if both dates are set, or both are empty (All Time)
        if ((startDate && !endDate) || (!startDate && endDate)) return;
        try {
            setAnalyticsLoading(true);
            setError(null);

            const params: Record<string, string> = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await api.get(`/admin/employee-analytics/${selectedEmployee.id}`, { params });

            if (res.data?.success) {
                setAnalyticsData({
                    kpis: res.data.kpis || {},
                    funnel: res.data.funnel || [],
                    workload: res.data.workload || {},
                    tickets: res.data.tickets || [],
                });
            } else {
                setError(res.data?.error || 'Failed to load analytics');
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load analytics');
        } finally {
            setAnalyticsLoading(false);
        }
    }, [selectedEmployee, startDate, endDate]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // ── Client-side ticket filtering ──
    const filteredTickets = (analyticsData?.tickets || []).filter((t) => {
        const matchTab =
            activeTab === 'All' ||
            t.status.toLowerCase() === activeTab.toLowerCase() ||
            (activeTab === 'Order Confirmed' && t.status.toUpperCase() === 'ORDER_CONFIRMED') ||
            (activeTab === 'Closed' && (t.status.toUpperCase() === 'CLOSED' || t.status.toUpperCase() === 'ORDER_COMPLETED'));
        const matchSearch =
            !searchQuery ||
            t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    // Funnel bar widths
    const maxFunnel = analyticsData?.funnel?.[0]?.value || 1;

    // KPI data with defaults - calculate convRate dynamically on frontend
    const rawKpis = analyticsData?.kpis || {
        ticketsCameIn: 0, quotesSent: 0, ordersConfirmed: 0, closedDelivered: 0,
        lineItemsQuoted: 0, quoteValue: 'AED 0', orderValue: 'AED 0',
        sentRate: '0%', convRate: '0%',
    };

    // Total Conv Rate = (Confirmed + Closed) / Sent
    const totalConverted = (rawKpis.ordersConfirmed || 0) + (rawKpis.closedDelivered || 0);
    const sentCount = rawKpis.quotesSent || 0;
    const computedConvRate = sentCount > 0 ? `${((totalConverted / sentCount) * 100).toFixed(1)}%` : '0%';

    const kpis = {
        ...rawKpis,
        convRate: computedConvRate
    };

    const workload = analyticsData?.workload || {
        lineItems: { value: '0', avg: 'No data' },
        quoteValue: { value: 'AED 0', avg: 'No data' },
        orderValue: { value: 'AED 0', avg: 'No data' },
    };

    // ── Quick date filters ──
    const quickDateFilters = [
        { label: 'Today', fn: () => { const d = toISODate(new Date()); setStartDate(d); setEndDate(d); } },
        { label: 'Last 7 Days', fn: () => { setStartDate(toISODate(new Date(Date.now() - 7 * 86400000))); setEndDate(toISODate(new Date())); } },
        { label: 'Last 30 Days', fn: () => { setStartDate(toISODate(new Date(Date.now() - 30 * 86400000))); setEndDate(toISODate(new Date())); } },
        { label: 'This Month', fn: () => { const n = new Date(); setStartDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`); setEndDate(toISODate(n)); } },
        { label: 'All Time', fn: () => { setStartDate(''); setEndDate(''); } },
    ];

    // ── Loading state ──
    if (loading) {
        return (
            <div className="min-h-screen bg-[hsl(var(--bg))] text-[rgb(var(--text-primary))] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-emerald-400" />
                    <p className="text-sm text-[rgb(var(--text-secondary))]">Loading Employee Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--bg))] text-[rgb(var(--text-primary))]">
            <div className="max-w-[1440px] mx-auto p-5 space-y-5">

                {/* ── Header Bar ─────────────────────────────────────────── */}
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight leading-tight">Employee Analytics</h1>
                            <p className="text-[11px] text-[rgb(var(--text-secondary))] tracking-wide">SnapQuote · Admin Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Date pickers */}
                        <div className="flex items-center gap-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-1.5">
                            <Calendar size={14} className="text-[rgb(var(--text-tertiary))] cursor-pointer" onClick={() => startDateRef.current?.showPicker()} />
                            <input
                                ref={startDateRef}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                className="bg-transparent text-xs font-medium text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                            />
                            <ArrowRight size={12} className="text-[rgb(var(--text-tertiary))]" />
                            <input
                                ref={endDateRef}
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                className="bg-transparent text-xs font-medium text-[rgb(var(--text-primary))] focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                            />
                        </div>

                        {/* Quick filters */}
                        {quickDateFilters.map(({ label, fn }) => (
                            <button
                                key={label}
                                onClick={fn}
                                className="hidden lg:inline-flex text-[11px] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--hover-bg))] px-2.5 py-1.5 rounded-md transition-colors"
                            >
                                {label}
                            </button>
                        ))}

                        {/* Employee dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-1.5 text-xs font-medium hover:border-emerald-500/40 transition-colors min-w-[150px]"
                            >
                                <span>{selectedEmployee?.username || 'Select Employee'}</span>
                                <ChevronDown size={14} className="text-[rgb(var(--text-tertiary))] ml-auto" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-56 bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-2xl shadow-black/40 z-50 py-1 overflow-hidden">
                                    {employees.map((emp) => (
                                        <button
                                            key={emp.id}
                                            onClick={() => { setSelectedEmployee(emp); setDropdownOpen(false); }}
                                            className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-[rgb(var(--hover-bg))] transition-colors ${emp.id === selectedEmployee?.id ? 'text-emerald-400 bg-emerald-500/5' : 'text-[rgb(var(--text-secondary))]'}`}
                                        >
                                            <p className="font-medium">{emp.username}</p>
                                            <p className="text-[10px] text-[rgb(var(--text-tertiary))]">{emp.role} · {emp.employee_code}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </header>

                {/* ── Error Banner ──────────────────────────────────────── */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                    </div>
                )}

                {/* ── Analytics Loading Overlay ─────────────────────────── */}
                {analyticsLoading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={20} className="animate-spin text-emerald-400 mr-2" />
                        <span className="text-xs text-[rgb(var(--text-secondary))]">Loading analytics...</span>
                    </div>
                )}

                {/* ── Employee Profile Card ──────────────────────────────── */}
                {selectedEmployee && (
                    <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                <User size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight">{selectedEmployee.username}</h2>
                                <p className="text-[12px] text-[rgb(var(--text-secondary))]">{selectedEmployee.role} · {selectedEmployee.employee_code}</p>
                            </div>
                        </div>
                        <p className="text-[12px] text-[rgb(var(--text-tertiary))] font-medium">
                            {startDate || 'All time'} {startDate && endDate ? '—' : ''} {endDate || ''}
                        </p>
                    </div>
                )}

                {/* ── KPI Row ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        { label: 'Tickets Came In', value: kpis.ticketsCameIn, icon: Ticket, color: 'emerald', sub: '' },
                        { label: 'Quotes Sent', value: kpis.quotesSent, icon: Send, color: 'blue', sub: '' },
                        { label: 'Orders Confirmed', value: kpis.ordersConfirmed, icon: CheckCircle2, color: 'amber', sub: '' },
                        { label: 'Closed / Delivered', value: kpis.closedDelivered, icon: PackageCheck, color: 'emerald', sub: '' },
                        { label: 'Quote Value', value: kpis.quoteValue, icon: DollarSign, color: 'cyan', sub: '' },
                        { label: 'Order Value', value: kpis.orderValue, icon: TrendingUp, color: 'teal', sub: '' },
                        { label: 'Sent Rate', value: kpis.sentRate, icon: Percent, color: 'sky', sub: 'Sent / Total' },
                        { label: 'Conv. Rate', value: kpis.convRate, icon: Percent, color: 'rose', sub: 'Confirmed / Sent' },
                    ].map((kpi) => {
                        const iconColorMap: Record<string, string> = {
                            emerald: 'text-emerald-400',
                            blue: 'text-blue-400',
                            amber: 'text-amber-400',
                            cyan: 'text-cyan-400',
                            teal: 'text-teal-400',
                            sky: 'text-sky-400',
                            rose: 'text-rose-400',
                        };
                        return (
                            <div
                                key={kpi.label}
                                className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-3.5 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors group"
                            >
                                <div className="flex items-center gap-1.5">
                                    <kpi.icon size={13} className={`${iconColorMap[kpi.color]} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                    <span className="text-[10px] text-[rgb(var(--text-tertiary))] font-medium uppercase tracking-wider leading-tight">{kpi.label}</span>
                                </div>
                                <p className="text-xl font-bold tracking-tight mt-0.5">{kpi.value}</p>
                                {kpi.sub && <p className="text-[10px] text-[rgb(var(--text-tertiary))]">{kpi.sub}</p>}
                            </div>
                        );
                    })}
                </div>

                {/* ── Conversion Funnel ──────────────────────────────────── */}
                <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-5 tracking-tight">Conversion Funnel</h3>
                    <div className="grid grid-cols-4 gap-0">
                        {(analyticsData?.funnel || []).map((stage, idx) => {
                            const barColors: Record<string, string> = {
                                emerald: 'bg-emerald-500',
                                blue: 'bg-blue-500',
                                amber: 'bg-amber-500',
                            };
                            const pct = maxFunnel > 0 ? (stage.value / maxFunnel) * 100 : 0;
                            return (
                                <div key={stage.label} className={`px-4 ${idx > 0 ? 'border-l border-[rgb(var(--border-primary))]' : ''}`}>
                                    <p className="text-[11px] text-[rgb(var(--text-secondary))] mb-1">{stage.label}</p>
                                    <p className="text-3xl font-bold tracking-tight">{stage.value}</p>
                                    {stage.sub ? (
                                        <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-0.5">{stage.sub}</p>
                                    ) : (
                                        <p className="text-[10px] mt-0.5">&nbsp;</p>
                                    )}
                                    <div className="mt-3 h-1.5 w-full bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${barColors[stage.color]} transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Workload Depth ─────────────────────────────────────── */}
                <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-4 tracking-tight">Workload Depth</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: DollarSign, label: 'Total Quotation Value Sent', value: workload.quoteValue?.value, avg: workload.quoteValue?.avg },
                            { icon: TrendingUp, label: 'Total Order Value Received', value: workload.orderValue?.value, avg: workload.orderValue?.avg },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="bg-[rgb(var(--bg-tertiary))] rounded-xl p-5 border border-[rgb(var(--border-primary))]"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <item.icon size={15} className="text-emerald-400 opacity-80" />
                                    <span className="text-[11px] text-[rgb(var(--text-secondary))] font-medium">{item.label}</span>
                                </div>
                                <p className="text-2xl font-bold tracking-tight">{item.value || '0'}</p>
                                <p className="text-[11px] text-[rgb(var(--text-tertiary))] mt-1">{item.avg || ''}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Ticket Drilldown ───────────────────────────────────── */}
                <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
                    {/* Header + Tabs + Search */}
                    <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold tracking-tight">Ticket Drilldown</h3>
                        <div className="flex items-center gap-2">
                            {/* Tabs */}
                            <div className="flex items-center bg-[rgb(var(--bg-tertiary))] rounded-lg p-0.5">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${activeTab === tab
                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                            : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            {/* Search */}
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-32 bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-emerald-500/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-t border-b border-[rgb(var(--border-primary))] text-[10px] text-[rgb(var(--text-tertiary))] uppercase tracking-widest bg-[rgb(var(--bg-tertiary))]/50">
                                    <th className="px-5 py-3 font-semibold">Ticket ID</th>
                                    <th className="px-4 py-3 font-semibold">Company</th>
                                    <th className="px-4 py-3 font-semibold">Email</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Quote Ref</th>
                                    <th className="px-4 py-3 font-semibold">CPO Ref</th>
                                    <th className="px-4 py-3 font-semibold text-right">Quote Amt</th>
                                    <th className="px-4 py-3 font-semibold text-right">CPO Amt</th>
                                    <th className="px-4 py-3 font-semibold">Assigned</th>
                                    <th className="px-4 py-3 font-semibold">Sent</th>
                                    <th className="px-4 py-3 font-semibold">Confirmed</th>
                                    <th className="px-4 py-3 font-semibold">Closed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                                {filteredTickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="hover:bg-[rgb(var(--hover-bg))] transition-colors"
                                    >
                                        <td className="px-5 py-3.5 text-xs font-semibold text-emerald-400">{ticket.id}</td>
                                        <td className="px-4 py-3.5 text-xs">{ticket.company}</td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-secondary))]">{ticket.email}</td>
                                        <td className="px-4 py-3.5"><StatusBadge status={ticket.status} color={ticket.statusColor} /></td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-secondary))]">{ticket.quoteRef}</td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-secondary))]">{ticket.cpoRef}</td>
                                        <td className="px-4 py-3.5 text-xs text-right font-medium text-amber-400">{ticket.quoteAmt}</td>
                                        <td className="px-4 py-3.5 text-xs text-right font-medium text-emerald-400">{ticket.cpoAmt}</td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))]">{ticket.assigned}</td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))]">{ticket.sent}</td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))]">{ticket.confirmed}</td>
                                        <td className="px-4 py-3.5 text-xs text-[rgb(var(--text-tertiary))]">{ticket.closed}</td>
                                    </tr>
                                ))}
                                {filteredTickets.length === 0 && (
                                    <tr>
                                        <td colSpan={12} className="px-5 py-8 text-center text-xs text-[rgb(var(--text-tertiary))]">
                                            {analyticsLoading ? 'Loading tickets...' : 'No tickets match the current filter.'}
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
