
import React, { useState } from "react";
import { X, Calendar, Search } from "lucide-react";

interface DateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DateRangeModal({ isOpen, onClose }: DateRangeModalProps) {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    if (!isOpen) return null;

    const handleSearch = () => {
        if (!fromDate || !toDate) {
            alert("Please select both From and To dates.");
            return;
        }

        // Open new tab with range parameters
        const url = `/tickets/range?from=${fromDate}&to=${toDate}`;
        window.open(url, "_blank");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181A1F] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Calendar size={18} className="text-emerald-500" />
                        <span>Select Date Range</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-[#0A0B0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-[#0A0B0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSearch}
                            disabled={!fromDate || !toDate}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <Search size={16} />
                            <span>Search Tickets</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
