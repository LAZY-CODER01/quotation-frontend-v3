interface ButtonProps {
children: React.ReactNode;
variant?: "primary" | "ghost";
icon?: React.ReactNode;
}
export default function Button({ children, variant = "ghost", icon }: ButtonProps) {
if (variant === "primary") {
return (
<button className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
{icon}
{children}
</button>
);
}

return (
<button className="rounded-lg border px-3 py-2 text-sm hover:bg-[hsl(var(--bg))]">
{children}
</button>
);
}