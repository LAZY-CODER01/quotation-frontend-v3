import TicketCard from "./TicketCard";
import { EmailExtraction } from "../../../types/email";

interface TicketColumnProps {
  title: string;
  count: number;
  color: "blue" | "green" | "yellow" | "emerald";
  date: string;
  tickets: EmailExtraction[];
  // 1. Add the click handler prop definition
  onTicketClick?: (ticket: EmailExtraction) => void;
}

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  emerald: "bg-emerald-500",
};

export default function TicketColumn({
  title,
  count,
  color,
  date,
  tickets,
  onTicketClick, // 2. Destructure the prop
}: TicketColumnProps) {
  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col rounded-xl bg-[rgb(var(--panel))]">
      
      {/* Header Area */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${colorMap[color]}`} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--bg))] px-1.5 text-xs text-[rgb(var(--muted))]">
            {count}
          </span>
        </div>
        <div className="mt-2 h-[1px] w-full bg-[rgb(var(--border))]" />
        <p className="mt-2 text-center text-xs text-[rgb(var(--muted))]">
          {date}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 pt-0">
        <div className="flex flex-col gap-3">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              // 3. Wrap TicketCard in a div to handle the click event
              <div 
                key={ticket.id} 
                onClick={() => onTicketClick?.(ticket)}
                className="cursor-pointer transition-transform duration-200 active:scale-[0.98]"
              >
                <TicketCard data={ticket} />
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-zinc-500 py-4">No tickets</div>
          )}
        </div>
      </div>
    </div>
  );
}