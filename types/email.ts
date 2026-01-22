export interface ExtractionRequirement {
  Description: string;
  Quantity: string;
  Unit: string;
  "Unit price": string;
}

export interface ExtractionResult {
  Requirements: ExtractionRequirement[];
  email: string;
  mobile: string;
  status: string;
  to: string;
}

export interface EmailExtraction {
  id: number;
  gmail_id: string;
  sender: string;
  subject: string;
  received_at: string;
  body_text: string;
  
  // New Ticket Fields
  ticket_number: string;   // e.g., "DBQ-2026-01-001"
  ticket_status: string;   // e.g., "OPEN", "CLOSED"
  ticket_priority: string; // e.g., "NORMAL", "URGENT"
  
  extraction_status: string;
  extraction_result: ExtractionResult;
  created_at: string;
  updated_at?: string;
}