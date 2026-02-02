// components/dashboard/FilterSidebar.tsx
"use client";

import { X, Filter, DollarSign, Calendar, Hash, Mail, Building, User } from "lucide-react";
import { useState } from "react";
import { FilterState, INITIAL_FILTERS } from "../../../types/filters";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
}

export default function FilterSidebar({ isOpen, onClose, currentFilters, onApply }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  // Helper to handle simple text/select changes
  const handleChange = (field: keyof FilterState, value: any) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  // Helper for Status Toggle (Multi-select)
  const toggleStatus = (status: string) => {
    setLocalFilters(prev => {
      const exists = prev.statuses.includes(status);
      return {
        ...prev,
        statuses: exists
          ? prev.statuses.filter(s => s !== status)
          : [...prev.statuses, status]
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-[#0F1115] border-l border-white/10 shadow-2xl z-50 flex flex-col">

      {/* --- Header --- */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-emerald-500">
          <Filter size={20} />
          <h2 className="font-semibold text-white">Filters</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* --- Scrollable Content --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">

        {/* 1. Status Column */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
            Status / Column
          </label>
          <div className="flex flex-wrap gap-2">
            {['Inbox', 'Sent', 'Order Confirmed', 'Order Completed', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${localFilters.statuses.includes(status)
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-gray-600'}
                `}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${localFilters.statuses.includes(status) ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Urgency */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Urgency</label>
          <div className="grid grid-cols-3 gap-2">
            {['ALL', 'URGENT', 'NON_URGENT'].map((u) => (
              <button
                key={u}
                onClick={() => handleChange('urgency', u)}
                className={`
                  py-2 rounded-lg text-xs font-medium border transition-all
                  ${localFilters.urgency === u
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-white/10 text-gray-400 hover:bg-white/5'}
                `}
              >
                {u.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Date Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase">
            <Calendar size={14} /> Date Range
          </div>
          <select
            value={localFilters.dateType}
            onChange={(e) => handleChange('dateType', e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:border-emerald-500 outline-none"
          >
            <option value="received">Received Date</option>
            <option value="updated">Updated Date</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={localFilters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:border-emerald-500 outline-none"
            />
            <input
              type="date"
              value={localFilters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <hr className="border-white/5" />

        {/* 4. Company & Employee */}
        {/* <div className="space-y-4">
           <div>
             <label className="text-xs text-gray-400 mb-1.5 block">Company</label>
             <div className="relative">
                <Building className="absolute left-3 top-2.5 text-gray-500" size={14} />
                <select 
                    value={localFilters.companyId}
                    onChange={(e) => handleChange('companyId', e.target.value)}
                    className="w-full pl-9 bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:border-emerald-500 outline-none appearance-none"
                >
                    <option value="all">All Companies</option>
                    <option value="comp_1">Company A</option>
                </select>
             </div>
           </div>

           <div>
             <label className="text-xs text-gray-400 mb-1.5 block">Assigned Employee</label>
             <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-500" size={14} />
                <select 
                    value={localFilters.assignedEmployeeId}
                    onChange={(e) => handleChange('assignedEmployeeId', e.target.value)}
                    className="w-full pl-9 bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:border-emerald-500 outline-none appearance-none"
                >
                    <option value="all">All Employees</option>
                    <option value="emp_1">John Doe</option>
                </select>
             </div>
           </div>
        </div> */}

        {/* 5. Inputs (Email, Ticket #, Quotation) */}
        <div className="space-y-4">
          <InputGroup
            label="Client Email"
            icon={<Mail size={14} />}
            placeholder="Search email..."
            value={localFilters.clientEmail}
            onChange={(v: string) => handleChange('clientEmail', v)}
          />
          <InputGroup
            label="Ticket Number"
            icon={<Hash size={14} />}
            placeholder="TKT-XXX"
            value={localFilters.ticketNumber}
            onChange={(v: string) => handleChange('ticketNumber', v)}
          />
          <InputGroup
            label="Quotation Reference"
            icon={<Hash size={14} />}
            placeholder="DBQ-XX-XXXX"
            value={localFilters.quotationReference}
            onChange={(v: string) => handleChange('quotationReference', v)}
          />
        </div>

        {/* 6. Quotation Status & Amount */}
        <div className="space-y-3">
          <label className="text-xs text-gray-400 uppercase">Quotation Status</label>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {['ALL', 'HAS_QUOTATION', 'NO_QUOTATION'].map(s => (
              <button
                key={s}
                onClick={() => handleChange('quotationStatus', s)}
                className={`flex-1 py-2 text-[10px] font-medium transition-colors 
                        ${localFilters.quotationStatus === s ? 'bg-emerald-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
              >
                {s === 'ALL' ? 'All' : s === 'HAS_QUOTATION' ? 'Has Quotation' : 'No Quotation'}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <InputGroup placeholder="Min Amount" icon={<DollarSign size={12} />} value={localFilters.quotationMinAmount} onChange={(v: string) => handleChange('quotationMinAmount', v)} />
            <InputGroup placeholder="Max Amount" icon={<DollarSign size={12} />} value={localFilters.quotationMaxAmount} onChange={(v: string) => handleChange('quotationMaxAmount', v)} />
          </div>
        </div>

        {/* 7. CPO Section */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
            Customer Purchase Order (CPO)
          </h3>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {['ALL', 'HAS_CPO', 'NO_CPO'].map(s => (
              <button
                key={s}
                onClick={() => handleChange('cpoStatus', s)}
                className={`flex-1 py-2 text-[10px] font-medium transition-colors 
                        ${localFilters.cpoStatus === s ? 'bg-blue-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
              >
                {s === 'ALL' ? 'All' : s === 'HAS_CPO' ? 'Has CPO' : 'No CPO'}
              </button>
            ))}
          </div>
          <InputGroup
            label="CPO Reference"
            placeholder="CPO-XXXX"
            value={localFilters.cpoReference}
            onChange={(v: string) => handleChange('cpoReference', v)}
          />
        </div>

      </div>

      {/* --- Footer --- */}
      <div className="p-4 border-t border-white/5 bg-[#0F1115] flex gap-3">
        <button
          onClick={() => setLocalFilters(INITIAL_FILTERS)}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
        >
          Clear All
        </button>
        <button
          onClick={() => onApply(localFilters)}
          className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// Sub-component for Inputs to keep code clean
function InputGroup({ label, icon, placeholder, value, onChange }: any) {
  return (
    <div className="w-full">
      {label && <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-500">{icon}</div>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:border-emerald-500 outline-none ${icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  )
}