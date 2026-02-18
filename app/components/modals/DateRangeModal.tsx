
import React, { useState } from "react";
import { X, Calendar, Search } from "lucide-react";
import DateRangePicker, { DateRange } from "../ui/DateRangePicker";

interface DateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DateRangeModal({ isOpen, onClose }: DateRangeModalProps) {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    if (!isOpen) return null;

    const handleSearch = () => {
        if (!startDate || !endDate) {
            alert("Please select both From and To dates.");
            return;
        }

        // Open new tab with range parameters
        const url = `/tickets/range?from=${startDate}&to=${endDate}`;
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
                    <DateRangePicker
                        startDate={startDate ? new Date(startDate) : null}
                        endDate={endDate ? new Date(endDate) : null}
                        onChange={(range: DateRange) => {
                            setStartDate(range.startDate ? range.startDate.toISOString() : '');
                            setEndDate(range.endDate ? range.endDate.toISOString() : '');
                        }}
                    />
                    <div className="pt-2">
                        <button
                            onClick={handleSearch}
                            disabled={!startDate || !endDate}
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
