import SidebarItem from "./SidebarItem";
import { Ticket, BarChart3, Users, Settings, LogOut } from "lucide-react";


export default function Sidebar() {
return (
<aside className="w-64 shrink-0 border-r bg-[rgb(13 15 19)]">
<div className="flex h-full flex-col p-4">
<div className="mb-6 flex items-center gap-3">
<div className="h-9 w-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">

</div>
<div>
<p className="font-semibold">D-BEST</p>
<p className="text-xs text-[rgb(var(--muted))]">ERP System</p>
</div>
</div>



<div className="mb-6 rounded-lg bg-[hsl(var(--bg))] p-3">
<p className="text-sm font-medium">Avinash Maurya</p>
<p className="text-xs text-[rgb(var(--muted))]">avinash@dbest.com</p>
</div>

<nav className="flex-1 space-y-1">
<SidebarItem icon={<Ticket size={18} />} label="Tickets" active />
<SidebarItem icon={<BarChart3 size={18} />} label="Analytics" />
<SidebarItem icon={<Users size={18} />} label="Clients" />
<SidebarItem icon={<Settings size={18} />} label="Settings" />
</nav>


{/* Footer */}
<div className="mt-6 border-t pt-4">
<SidebarItem icon={<LogOut size={18} />} label="Sign Out" />
</div>
</div>
</aside>
);
}