"use client";

import SidebarItem from "./SidebarItem";
import { Ticket, BarChart3, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    return (
        <aside className="w-64 shrink-0 border-r bg-[rgb(13 15 19)]">
            <div className="flex h-full flex-col p-4">
                <div className="mb-6 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                        DB
                    </div>
                    <div>
                        <p className="font-semibold">D-BEST</p>
                        <p className="text-xs text-[rgb(var(--muted))]">ERP System</p>
                    </div>
                </div>

                {user && (
                    <div className="mb-6 rounded-lg bg-[hsl(var(--bg))] p-3">
                        <p className="text-sm font-medium">{user.username}</p>
                        <p className="text-xs text-[rgb(var(--muted))] capitalize">{user.role}</p>
                    </div>
                )}

                <nav className="flex-1 space-y-1">
                    <SidebarItem
                        icon={<Ticket size={18} />}
                        label="Tickets"
                        onClick={() => router.push('/')}
                        active={pathname === '/'}
                    />
                    {/* Placeholders for now */}
                    {/* <SidebarItem icon={<BarChart3 size={18} />} label="Analytics" /> */}
                    {/* <SidebarItem icon={<Users size={18} />} label="Clients" /> */}

                    {user?.role === 'ADMIN' && (
                        <SidebarItem
                            icon={<Settings size={18} />}
                            label="Admin Settings"
                            onClick={() => router.push('/admin')}
                            active={pathname === '/admin'}
                        />
                    )}
                </nav>


                {/* Footer */}
                <div className="mt-6 border-t pt-4">
                    <SidebarItem icon={<LogOut size={18} />} label="Sign Out" onClick={logout} />
                </div>
            </div>
        </aside>
    );
}