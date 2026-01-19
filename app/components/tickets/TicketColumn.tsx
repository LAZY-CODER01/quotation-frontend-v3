import TicketCard from "./TicketCard";

interface TicketColumnProps {
  title: string;
  count: number;
  color: "blue" | "green" | "yellow" | "emerald";
  date: string;
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
}: TicketColumnProps) {
  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col rounded-xl  bg-[rgb(var(--panel))]">
      
      {/* 1. Header Area (Fixed - does not scroll) */}
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

   
      <div className="flex-1 min-h-0 overflow-y-auto p-3 pt-0">
        <div className="flex flex-col gap-3">
          {/* Add many cards to test the scroll */}
          <TicketCard />
          <TicketCard company="ACME Corp" amount="AED 32,500" />
          <TicketCard company="Global Imports" amount="AED 8,500" urgent={false} />
          <TicketCard company="Demo Item 4" />
          <TicketCard company="Demo Item 5" />
          <TicketCard company="Demo Item 6" />
        </div>
      </div>
    </div>
  );
}