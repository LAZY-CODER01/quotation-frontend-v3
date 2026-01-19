import TicketColumn from "./TicketColumn";

export default function TicketsBoard() {
  return (
    // gap-6 adds space between columns
    <div className="flex h-full gap-6">
      <TicketColumn title="Inbox" count={3} color="blue" date="19/01/26" />
      <TicketColumn title="Sent" count={2} color="green" date="19/01/26" />
      <TicketColumn title="Order Confirmed" count={1} color="yellow" date="16/01/26" />
      <TicketColumn title="Order Completed" count={1} color="emerald" date="14/01/26" />
      <TicketColumn title="Closed" count={5} color="blue" date="-" />
      <TicketColumn title="Archived" count={0} color="blue" date="-" />
    </div>
  );
}