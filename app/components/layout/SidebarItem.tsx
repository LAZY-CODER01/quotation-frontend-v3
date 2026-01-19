interface SidebarItemProps {
icon: React.ReactNode;
label: string;
active?: boolean;
}


export default function SidebarItem({ icon, label, active }: SidebarItemProps) {
return (
<button
className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition
${
active
? "bg-emerald-500/10 text-emerald-500"
: "text-[rgb(var(--muted))] hover:bg-[hsl(var(--bg))]"
}`}
>
{icon}
<span>{label}</span>
</button>
);
}