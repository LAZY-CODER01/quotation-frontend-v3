import { EmailExtraction } from "../../types/email";

export function ticketMatchesSearch(ticket: EmailExtraction, query: string): boolean {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();

    // Helper to safely check a string value
    const matches = (value: string | number | undefined | null) => {
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(lowerQuery);
    };

    // 1. Top-level fields
    if (matches(ticket.id)) return true;
    if (matches(ticket.gmail_id)) return true;
    if (matches(ticket.ticket_number)) return true;
    if (matches(ticket.ticket_status)) return true; // e.g. "OPEN"
    if (matches(ticket.ticket_status?.replace(/_/g, " "))) return true; // e.g. "ORDER CONFIRMED"
    if (matches(ticket.ticket_priority)) return true;
    if (matches(ticket.quotation_amount)) return true;
    if (matches(ticket.sender)) return true;
    if (matches(ticket.company_name)) return true;
    if (matches(ticket.subject)) return true;
    if (matches(ticket.body_text)) return true;
    if (matches(ticket.extraction_status)) return true;
    if (matches(ticket.assigned_to)) return true;

    // 2. Dates (check string representation)
    if (matches(ticket.received_at)) return true;
    if (matches(ticket.created_at)) return true;
    if (matches(ticket.updated_at)) return true;

    // 3. Extraction Result
    if (ticket.extraction_result) {
        if (matches(ticket.extraction_result.email)) return true;
        if (matches(ticket.extraction_result.mobile)) return true;
        if (matches(ticket.extraction_result.to)) return true;

        // Check requirements inside extraction result
        if (ticket.extraction_result.Requirements?.some(req =>
            matches(req.Description) || matches(req.Quantity) || matches(req.Unit) || matches(req["Unit price"])
        )) return true;
    }

    // 4. Files (Quotation & CPO)
    const checkFiles = (files: any[] | undefined) => {
        return files?.some(file =>
            matches(file.name) ||
            matches(file.reference_id) ||
            matches(file.amount) ||
            matches(file.po_number)
        );
    };

    if (checkFiles(ticket.quotation_files)) return true;
    if (checkFiles(ticket.cpo_files)) return true;

    // 5. Activity Logs
    if (ticket.activity_logs?.some(log =>
        matches(log.action) ||
        matches(log.description) ||
        matches(log.user)
    )) return true;

    // 6. Internal Notes
    // Assuming internal notes might have a 'content' or 'text' field, or just be strings
    if (ticket.internal_notes?.some(note =>
        (typeof note === 'string' && matches(note)) ||
        (typeof note === 'object' && (matches(note.content) || matches(note.text)))
    )) return true;

    // 7. Fuzzy ID matching (e.g. "002" -> "TKT-002")
    const ticketIdParts = ticket.ticket_number?.split('-') || [];
    if (ticketIdParts.some(part => part.toLowerCase().includes(lowerQuery))) return true;

    return false;
}
