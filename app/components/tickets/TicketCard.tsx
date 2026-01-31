import { AlertTriangle, Box, ExternalLink, Ticket, Clock, CheckCircle2 } from "lucide-react";
import { EmailExtraction } from "../../../types/email";
import { format } from "date-fns";
import api from "../../../lib/api";

interface TicketCardProps {
  data: EmailExtraction;
}

export default function TicketCard({ data }: TicketCardProps) {
  const senderName = data.sender.split("<")[0].trim() || "Unknown Sender";

  let timeDisplay = "";
  try {
    timeDisplay = format(new Date(data.received_at), "HH:mm");
  } catch (e) {
    timeDisplay = data.received_at;
  }

  const itemsCount = data.extraction_result?.Requirements?.length || 0;
  const isUrgent = data.ticket_priority === 'URGENT';

  return (
    <div
      className={`
        group relative flex cursor-pointer flex-col gap-1 rounded-xl p-2 transition-all duration-200
        bg-[rgb(var(--panel))] hover:shadow-lg 
        
        /* 1. Added Green Background Tint on Hover for the 'Whole Ticket' feel */
     
        
        ${isUrgent 
          /* 2. Urgent: Default is Black Border + Red Left. 
                HOVER is now Emerald Border + Emerald Shadow */
          ? 'border border border-l-red-500 border-l-4 hover:border-red-500 hover:shadow-red-500/10    hover:bg-red-500/5' 
          
          /* 3. Normal: Default is Gray Border. 
                HOVER is Emerald Border + Emerald Shadow */
          : 'border border-[rgb(var(--border))] hover:border-emerald-500 hover:shadow-emerald-500/10  hover:bg-emerald-500/5'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <span className="font-mono text-xs font-bold text-[rgb(var(--muted))] bg-white/5 px-2 py-1 rounded border border-white/5">
            {data.ticket_number || `ID-${data.id}`}
           </span>
        </div>

        <span className="text-xs font-medium text-[rgb(var(--muted))] whitespace-nowrap">
          {timeDisplay}
        </span>
      </div>

      <div>
        <h4 className="text-base font-semibold text-white group-hover:text-emerald-50 transition-colors truncate" title={data.sender}>
          {senderName}
        </h4>
     
        <p className="text-xs text-[rgb(var(--muted))] truncate mt-0.5">
          {data.subject || "No Subject"}
        </p>
      </div>

      <div className="mt-1 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            {data.extraction_status === "VALID" && (
                <div className="flex text-[10px] items-center gap-1 text-[rgb(var(--muted))] group-hover:text-gray-300 transition-colors">
                    <Box size={12} strokeWidth={2} />
                    <span className="text-xs">
                    {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                    </span>
                </div>
            )}
            {isUrgent && (
             <span className="flex items-center gap-1 text-[10px] w-[70px] font-bold text-[hsl(0_72%_51%)] bg-[hsl(0_72%_51%/0.1)] border border-[hsl(0_72%_51%/0.3)] px-2 py-0.5 rounded-full animate-pulse">
               <AlertTriangle size={10} /> URGENT
             </span>
           )}
        </div>
      </div>
    </div>
  );
}