// types/filters.ts

export interface FilterState {
  // Status & Urgency
  statuses: string[];
  urgency: 'ALL' | 'URGENT' | 'NON_URGENT';

  // Date Range
  dateType: 'received' | 'updated';
  startDate: string;
  endDate: string;

  // General Info
  companyId: string;
  clientEmail: string;
  assignedEmployeeName: string;
  assignedEmployeeId: string;
  ticketNumber: string;

  // Quotation
  quotationReference: string;
  quotationStatus: 'ALL' | 'HAS_QUOTATION' | 'NO_QUOTATION';
  quotationMinAmount: string;
  quotationMaxAmount: string;

  // CPO
  cpoStatus: 'ALL' | 'HAS_CPO' | 'NO_CPO';
  cpoReference: string;
  cpoMinAmount: string;
  cpoMaxAmount: string;
}

export const INITIAL_FILTERS: FilterState = {
  statuses: [],
  urgency: 'ALL',
  dateType: 'received',
  startDate: '',
  endDate: '',
  companyId: 'all',
  clientEmail: '',
  assignedEmployeeName: '',
  assignedEmployeeId: 'all',
  ticketNumber: '',
  quotationReference: '',
  quotationStatus: 'ALL',
  quotationMinAmount: '',
  quotationMaxAmount: '',
  cpoStatus: 'ALL',
  cpoReference: '',
  cpoMinAmount: '',
  cpoMaxAmount: '',
};