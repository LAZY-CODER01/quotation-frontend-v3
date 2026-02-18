import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, startOfWeek, endOfWeek, isBefore, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, ArrowRight } from 'lucide-react';

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface DateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (range: DateRange) => void;
    className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDateClick = (date: Date) => {
        if (!startDate || (startDate && endDate)) {
            // Start new range
            onChange({ startDate: date, endDate: null });
        } else if (startDate && !endDate) {
            if (isBefore(date, startDate)) {
                // If clicked before start, strict reset to new start
                onChange({ startDate: date, endDate: null });
            } else {
                // Complete range
                onChange({ startDate, endDate: date });
                setIsOpen(false);
            }
        }
    };

    const handlePreset = (days: number) => {
        const end = new Date(); // Today
        const start = new Date();
        start.setDate(end.getDate() - days);
        onChange({ startDate: start, endDate: end });
        setIsOpen(false);
    };

    const handleAllTime = () => {
        onChange({ startDate: null, endDate: null });
        setIsOpen(false);
    }

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateCalendar = startOfWeek(monthStart);
    const endDateCalendar = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDateCalendar,
        end: endDateCalendar,
    });

    const isInRange = (date: Date) => {
        if (startDate && endDate) {
            return isWithinInterval(date, { start: startDate, end: endDate });
        }
        if (startDate && hoverDate && isAfter(hoverDate, startDate)) {
            return isWithinInterval(date, { start: startDate, end: hoverDate });
        }
        return false;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button - Split UI */}
            <div
                className="flex items-center gap-0 bg-gray-900/50 rounded-lg border border-emerald-500/30 overflow-hidden cursor-pointer hover:border-emerald-500/60 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* From Section */}
                <div className="flex flex-col px-3 py-1.5 border-r border-gray-700/50 min-w-[90px]">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">From</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${startDate ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {startDate ? format(startDate, 'dd MMM yy') : 'Select'}
                        </span>
                        <CalendarIcon className="w-3 h-3 text-gray-600" />
                    </div>
                </div>

                {/* To Section */}
                <div className="flex flex-col px-3 py-1.5 min-w-[90px]">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">To</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${endDate ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {endDate ? format(endDate, 'dd MMM yy') : 'Select'}
                        </span>
                        <CalendarIcon className="w-3 h-3 text-gray-600" />
                    </div>
                </div>

                {/* Clear/Chevron */}
                <div className="px-2 flex items-center justify-center border-l border-gray-700/50 h-full bg-gray-900/30 hover:bg-gray-800 transition-colors"
                    onClick={(e) => {
                        if (startDate || endDate) {
                            e.stopPropagation();
                            onChange({ startDate: null, endDate: null });
                        }
                    }}>
                    {(startDate || endDate) ? (
                        <X className="w-3 h-3 text-gray-400 hover:text-white" />
                    ) : (
                        <ChevronRight className="w-3 h-3 text-gray-500 rotate-90" />
                    )}
                </div>
            </div>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 z-50 bg-[#0f172a] border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col md:flex-row w-[500px] max-w-[90vw] origin-top-right">

                    {/* Sidebar Presets */}
                    <div className="w-full md:w-32 bg-gray-900/50 p-2 border-b md:border-b-0 md:border-r border-gray-700 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 hidden md:block">Quick Select</h3>
                        <button onClick={handleAllTime} className="text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">All Time</button>
                        <button onClick={() => handlePreset(0)} className="text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">Today</button>
                        <button onClick={() => handlePreset(1)} className="text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">Yesterday</button>
                        <button onClick={() => handlePreset(7)} className="text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">Last 7 Days</button>
                        <button onClick={() => handlePreset(30)} className="text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">Last 30 Days</button>
                        <button onClick={() => handlePreset(90)} className="text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">Last 3 Months</button>
                    </div>

                    {/* Calendar */}
                    <div className="flex-1 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <button onClick={prevMonth} className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                            <h2 className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
                            <button onClick={nextMonth} className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-0.5">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-px">
                            {calendarDays.map((day, idx) => {
                                const isSelectedStart = startDate && isSameDay(day, startDate);
                                const isSelectedEnd = endDate && isSameDay(day, endDate);
                                const isBetween = isInRange(day);
                                const isCurrentMonth = isSameMonth(day, currentMonth);

                                let bgClass = "";
                                let textClass = "text-gray-300";

                                if (isSelectedStart || isSelectedEnd) {
                                    bgClass = "bg-emerald-500 text-white shadow-md shadow-emerald-500/40 z-10 scale-105 rounded-md";
                                    textClass = "text-white font-bold";
                                } else if (isBetween) {
                                    bgClass = "bg-emerald-500/20 rounded-none";
                                    textClass = "text-emerald-200";
                                    if (isSelectedStart) bgClass += " rounded-l-md";
                                } else if (!isCurrentMonth) {
                                    textClass = "text-gray-600";
                                }

                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => handleDateClick(day)}
                                        onMouseEnter={() => setHoverDate(day)}
                                        onMouseLeave={() => setHoverDate(null)}
                                        disabled={false}
                                        className={`
                      relative h-7 w-full flex items-center justify-center text-xs transition-all duration-150 rounded-sm
                      ${bgClass}
                      ${textClass}
                      ${!isSelectedStart && !isSelectedEnd && !isBetween && isCurrentMonth ? 'hover:bg-gray-800 hover:text-emerald-400 rounded-md' : ''}
                    `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500">
                            <div>
                                {startDate && format(startDate, 'MMM d, yyyy')}
                                {endDate && ` - ${format(endDate, 'MMM d, yyyy')}`}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
