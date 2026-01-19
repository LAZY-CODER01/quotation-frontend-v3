import TicketsBoard from "./components/tickets/TicketBoard";

export default function DashboardPage() {
  return (
    // 1. This container fills the specific space left by the layout
    // 2. 'overflow-x-auto' enables the horizontal scrollbar ONLY here
    <div className="h-full w-full overflow-x-auto overflow-y-hidden p-6">
      
      {/* 3. 'min-w-max' forces this inner div to be wide enough 
         to fit all your columns side-by-side without squishing. 
         This width triggers the scroll on the parent div above. */}
      <div className="h-full min-w-max">
        <TicketsBoard />
      </div>
    
    </div>
  );
}