import { AlertTriangle, Box, ExternalLink, Ticket, Clock, CheckCircle2 } from "lucide-react";
import { EmailExtraction } from "../../../types/email";
import { format } from "date-fns";
import api from "../../../lib/api";

interface TicketCardProps {
  data: EmailExtraction;
}

export default function TicketCard({ data }: TicketCardProps) {
  // Parse sender to get name
  const senderName = data.sender.split("<")[0].trim() || "Unknown Sender";
  // const senderEmail = data.sender.match(/<([^>]+)>/)?.[1] || data.sender; // Optional: Hide email to save space if needed

  // Format time
  let timeDisplay = "";
  try {
    timeDisplay = format(new Date(data.received_at), "MMM d, HH:mm");
  } catch (e) {
    timeDisplay = data.received_at;
  }

  const itemsCount = data.extraction_result?.Requirements?.length || 0;
  const isUrgent = data.ticket_priority === 'URGENT';

  
  // Status Color Logic
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'CLOSED': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'IN_PROGRESS': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-[rgb(var(--muted))] bg-white/5 border-white/10';
    }
  };

  return (
    <div
      className={`
        group relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all duration-200
        bg-[rgb(var(--panel))] hover:shadow-lg
        ${isUrgent ? 'border-red-500/50 hover:border-red-500 hover:shadow-red-500/10' : 'border-[rgb(var(--border))] hover:border-emerald-500 hover:shadow-emerald-500/10'}
      `}
    >
      {/* --- Row 1: Ticket Header --- */}
      <div className="flex items-center justify-between">
        {/* Ticket ID Badge */}
        <div className="flex items-center gap-2">
           <span className="font-mono text-xs font-bold text-[rgb(var(--muted))] bg-white/5 px-2 py-1 rounded border border-white/5">
            {data.ticket_number || `ID-${data.id}`}
           </span>
           
           {/* Urgent Badge */}
           
        </div>

        <span className="text-xs font-medium text-[rgb(var(--muted))] whitespace-nowrap">
          {timeDisplay}
        </span>
      </div>

      {/* --- Row 2: Sender Info --- */}
      <div>
           {isUrgent && (
             <span className="flex items-center gap-1 text-[10px] w-[70px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 animate-pulse">
               <AlertTriangle size={10} /> URGENT
             </span>
           )}
        <h4 className="text-base font-semibold text-white group-hover:text-emerald-50 transition-colors truncate" title={data.sender}>
          {senderName}
        </h4>
     
        <p className="text-xs text-[rgb(var(--muted))] truncate mt-0.5">
          {data.subject || "No Subject"}
        </p>
      </div>

      {/* --- Row 3: Status & Requirements Footer --- */}
      <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(data.ticket_status)}`}>
                {data.ticket_status === 'OPEN' ? <Clock size={10}/> : <CheckCircle2 size={10}/>}
                {data.ticket_status || 'OPEN'}
            </div>

            {/* Item Count */}
            {data.extraction_status === "VALID" && (
                <div className="flex items-center gap-1 text-[rgb(var(--muted))] group-hover:text-gray-300 transition-colors">
                    <Box size={12} strokeWidth={2} />
                    <span className="text-xs">
                    {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                    </span>
                </div>
            )}
        </div>

        {/* Action: Generate Icon */}
        
      </div>
    </div>
  );
}