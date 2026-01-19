"use client"
import { Bell, Sun, Moon, Plus } from "lucide-react";
import SearchInput from "../ui/SearchInput";
import Button from "../ui/Button";
import { useEffect, useState } from "react";
export default function TopBar() {
const [dark, setDark] = useState(false);
useEffect(() => {
const isDark = document.documentElement.classList.contains("dark");
setDark(isDark);
}, []);
const toggleTheme = () => {
document.documentElement.classList.toggle("dark");
setDark(!dark);
};
return (
<header className="flex w-full items-center justify-between border-b bg-[rgb(var(--panel))] px-6 py-4">

<div className="flex items-center gap-4">
<SearchInput />
<Button variant="ghost">Filters</Button>
</div>



<div className="flex items-center gap-4">
<button
onClick={toggleTheme}
className="rounded-lg p-2 hover:bg-[hsl(var(--bg))]"
>
{dark ? <Sun size={18} /> : <Moon size={18} />}
</button>


<button className="relative rounded-lg p-2 hover:bg-[hsl(var(--bg))]">
<Bell size={18} />
<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
</button>


<div className="flex items-center gap-2">
<div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold">
AH
</div>
<div className="text-sm">
<p className="font-medium">Ahmed Hassan</p>
<p className="text-xs text-[rgb(var(--muted))]">Employee</p>
</div>
</div>


<Button variant="primary" icon={<Plus size={16} />}>
New Ticket
</Button>
</div>
</header>
);
}

