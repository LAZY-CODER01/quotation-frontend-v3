import { AlertTriangle, Box, User } from "lucide-react";
import { EmailExtraction } from "../../../types/email";
import { formatUaeTime, toUaeDate } from "../../../app/lib/time";

interface TicketCardProps {
  data: EmailExtraction;
}

export default function TicketCard({ data }: TicketCardProps) {
  // 1. Extract Name (e.g., "Avinash")
  const senderName = data.sender.split("<")[0].trim() || "Unknown Sender";

  // 2. Extract Email (e.g., "avinashmaurya430@gmail.com")
  const senderEmail = data.sender.match(/<([^>]+)>/)?.[1] || data.sender;
  const companyName = data.company_name ? ` ${data.company_name}` : "No Company Name";
  // 3. Extract Assignee First Name
  const assigneeName = data.assigned_to
    ? data.assigned_to.split(" ")[0] // Take first word
    : "Unassigned";

  let timeDisplay = "";
  try {
    // For card display, always show the original email received time in UAE
    const timeValue = data.received_at || data.updated_at;
    const date = toUaeDate(timeValue);
    if (date) {
      const adjustedDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));
      timeDisplay = formatUaeTime(adjustedDate);
    } else {
      timeDisplay = "";
    }
  } catch (e) {
    timeDisplay = data.updated_at || data.received_at || "";
  }

  const itemsCount = data.extraction_result?.Requirements?.length || 0;
  const isUrgent = data.ticket_priority === 'URGENT';

  return (
    <div
      className={`
        group relative flex cursor-pointer flex-col gap-1 rounded-xl p-3 transition-all duration-200
        bg-[rgb(var(--panel))] hover:shadow-lg 
        
        ${isUrgent
          ? 'border border-l-red-500 border-l-4 hover:border-red-500 hover:shadow-red-500/10 hover:bg-red-500/5'
          : 'border border-[rgb(var(--border))] hover:border-emerald-500 hover:shadow-emerald-500/10 hover:bg-emerald-500/5'
        }
      `}
    >

      {/* Header: Name and Time */}
      <div className="flex justify-between items-start">
        <h4 className="text-base font-semibold text-[rgb(var(--text))] group-hover:text-emerald-50 transition-colors truncate pr-2" title={companyName}>
          {companyName}
        </h4>
        <span className="text-xs font-medium text-[rgb(var(--muted))] whitespace-nowrap shrink-0">
          {timeDisplay}
        </span>
      </div>

      <div>
        {/* Changed: Show Email instead of Subject */}
        <p className="text-xs text-[rgb(var(--muted))] truncate mt-0.5" title={senderEmail}>
          {senderEmail}
        </p>

        {/* Price Display Logic */}
        {(() => {
          let amountDisplay = null;
          let isCPO = false;

          if (data.ticket_status === 'ORDER_CONFIRMED' || data.ticket_status === 'ORDER_COMPLETED') {
            if (data.cpo_files && data.cpo_files.length > 0) {
              const latest = [...data.cpo_files].reverse()[0];
              if (latest.amount) {
                amountDisplay = latest.amount;
                isCPO = true;
              }
            }
          }

          if (!amountDisplay && data.quotation_files && data.quotation_files.length > 0) {
            const latest = [...data.quotation_files].reverse()[0];
            if (latest.amount) {
              amountDisplay = latest.amount;
              isCPO = false;
            }
          }

          if (amountDisplay) {
            return (
              <div className={`mt-2 text-sm font-bold truncate ${isCPO ? 'text-blue-400' : 'text-emerald-400'}`}>
                AED {amountDisplay} {isCPO && <span className="text-[10px] font-normal opacity-70">(CPO)</span>}
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Footer: Items, Priority, and Assignee */}
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Items Count */}
          {data.extraction_status === "VALID" && (
            <div className="flex text-[10px] items-center gap-1 text-[rgb(var(--muted))] group-hover:text-gray-300 transition-colors">
              <Box size={12} strokeWidth={2} />
              <span className="text-xs">
                {itemsCount} item{itemsCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Urgent Badge */}
          {isUrgent && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[hsl(0_72%_51%)] bg-[hsl(0_72%_51%/0.1)] border border-[hsl(0_72%_51%/0.3)] px-2 py-0.5 rounded-full ">
              <AlertTriangle size={10} /> URGENT
            </span>
          )}
        </div>

        {/* Assigned User (First Name) */}
        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${data.assigned_to ? "text-blue-400 bg-blue-500/10" : "text-gray-600"}`}>
          <User size={10} />
          <span className="font-medium truncate max-w-[80px]">
            {assigneeName}
          </span>
        </div>

      </div>
    </div>
  );
}