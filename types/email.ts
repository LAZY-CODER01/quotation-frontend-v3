export interface ExtractionRequirement {
  Description: string;
  Quantity: string;
  Unit: string;
  "Unit price": string;
}

export interface QuotationFile {
  id: string;
  name: string;
  url: string;
  amount: string;
  uploaded_at: string;
  reference_id?: string;
  po_number?: string;
}

export interface ExtractionResult {
  Requirements: ExtractionRequirement[];
  email: string;
  mobile: string;
  status: string;
  to: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  metadata?: any;
}

export interface EmailExtraction {
  id: number;
  gmail_id: string;

  ticket_number: string;
  ticket_status: string;
  ticket_priority: string;

  quotation_files?: QuotationFile[];
  cpo_files?: QuotationFile[];
  quotation_amount?: string;

  sender: string;
  subject: string;
  received_at: string;
  body_text: string;
  extraction_status: string;
  extraction_result: ExtractionResult;
  created_at: string;
  activity_logs?: ActivityLog[];
  internal_notes?: any[];
  assigned_to?: string;
}