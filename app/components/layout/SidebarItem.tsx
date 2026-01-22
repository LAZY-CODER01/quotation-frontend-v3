"use client";

import { useAuth } from "../../context/AuthContext";

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

export default function SidebarItem({
    icon,
    label,
    active,
    onClick,
}: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "text-[rgb(var(--muted))] hover:bg-[hsl(var(--bg))] hover:text-white"
                }`}
        >
            {icon}
            <span>{label}</span>
            {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
        </button>
    );
}