import { Search } from "lucide-react";


export default function SearchInput() {
return (
<div className="relative w-[360px]">
<Search
size={16}
className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
/>
<input
placeholder="Search tickets, clients, quotations (DBQ-XX-XXXX)..."
className="w-full rounded-lg border bg-[hsl(var(--bg))] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
/>
</div>
);
}