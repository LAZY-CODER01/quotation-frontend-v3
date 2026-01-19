interface BadgeProps {
children: React.ReactNode;
color?: "red" | "blue" | "green";
icon?: React.ReactNode;
}


const colorMap = {
red: "bg-red-500/10 text-red-500",
blue: "bg-blue-500/10 text-blue-500",
green: "bg-emerald-500/10 text-emerald-500",
};


export default function Badge({ children, color = "blue", icon }: BadgeProps) {
return (
<span
className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
colorMap[color]
}`}
>
{icon}
{children}
</span>
);
}