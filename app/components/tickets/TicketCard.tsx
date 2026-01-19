 import { AlertTriangle, Box, User } from "lucide-react";
import Badge from "../ui/Badge";

interface TicketCardProps {
  company?: string;
  email?: string;
  time?: string;
  amount?: string;
  items?: number;
  assignee?: string;
  urgent?: boolean;
  tag?: string;
}

export default function TicketCard({
  company = "MegaCorp Industries",
  email = "sarah@megacorp.com",
  time = "17:19",
  amount = "AED 32,500",
  items = 2,
  assignee = "Ahmed",
  urgent = false,
  tag = "CPO",
}: TicketCardProps) {
  return (
    <div
      className={`
        group relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all duration-200
        bg-[rgb(var(--panel))] hover:shadow-lg
        ${
          urgent
            ? "border-red-500/50 hover:border-red-500 hover:shadow-red-500/10"
            : "border-[rgb(var(--border))] hover:border-emerald-500 hover:shadow-emerald-500/10"
        }
      `}
    >
      {/* Top Row: Company Name & Time */}
      <div className="flex items-start justify-between">
        <h4 className="text-base font-semibold text-white group-hover:text-emerald-50 transition-colors">
          {company}
        </h4>
        <span className="text-sm font-medium text-[rgb(var(--muted))]">
          {time}
        </span>
      </div>

      {/* Second Row: Email */}
      <p className="-mt-2 text-sm text-[rgb(var(--muted))]">{email}</p>

      {/* Third Row: Amount (Only shows if amount exists) */}
      {amount && (
        <div className="mt-1">
          <p className="text-sm font-bold text-emerald-500">
            {amount}
            {tag && <span className="ml-1 text-xs text-blue-500">({tag})</span>}
          </p>
        </div>
      )}

      {/* Footer: Items, Assignee, Urgent Badge */}
      <div className="mt-2 flex items-center justify-between text-sm text-[rgb(var(--muted))]">
        <div className="flex items-center gap-4">
          {/* Items Section */}
          <div className="flex items-center gap-1.5 transition-colors group-hover:text-gray-300">
            <Box size={16} strokeWidth={2} />
            <span>
              {items} item{items > 1 ? "s" : ""}
            </span>
          </div>

          {/* Assignee Section */}
          <div className="flex items-center gap-1.5 transition-colors group-hover:text-gray-300">
            <User size={16} strokeWidth={2} />
            <span>{assignee}</span>
          </div>
        </div>

        {/* Urgent Badge (Right side of footer) */}
        {urgent && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertTriangle size={14} />
            <span className="text-xs font-medium">Urgent</span>
          </div>
        )}
      </div>
    </div>
  );
}