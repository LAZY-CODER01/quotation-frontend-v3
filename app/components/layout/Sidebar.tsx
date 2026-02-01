"use client";

import SidebarItem from "./SidebarItem";
import { 
    Ticket, LogOut, ClipboardCheck, Mail, 
    Users as UsersIcon, Monitor 
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext"; // Adjust path as needed
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Helper to check active state including query params
    const isActive = (path: string, view?: string) => {
        if (pathname !== path) return false;
        if (view) return searchParams.get("view") === view;
        return true;
    };

    return (
        <aside className="w-64 shrink-0 border-r bg-[rgb(13 15 19)] flex flex-col h-full">
            <div className="p-4 flex-1 flex flex-col">
                {/* Logo Section */}
                <div className="mb-6 flex items-center gap-3 px-2">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-900/20">
                        DB
                    </div>
                    <div>
                        <p className="font-semibold text-white tracking-wide">D-BEST</p>
                        <p className="text-[10px] text-gray-500 font-medium tracking-wider">ERP SYSTEM</p>
                    </div>
                </div>

                {/* User Profile Snippet */}
                {user && (
                    <div className="mb-6 mx-2 rounded-xl bg-[#181A1F] border border-white/5 p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                            {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role}</p>
                        </div>
                    </div>
                )}

                <nav className="flex-1 space-y-1">
                    <SidebarItem
                        icon={<Ticket size={18} />}
                        label="All Tickets"
                        onClick={() => router.push('/')}
                        active={pathname === '/' && !searchParams.get("view")}
                    />

                    {/* Admin Section - Only visible to Admins */}
                    {user?.role === 'ADMIN' && (
                        <>
                            <div className="mt-8 mb-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Admin Controls
                            </div>

                            <SidebarItem
                                icon={<Monitor size={18} />}
                                label="Ticket Monitor"
                                onClick={() => router.push('/admin?view=monitor')}
                                active={isActive('/admin', 'monitor')}
                            />
                            
                            <SidebarItem
                                icon={<ClipboardCheck size={18} />}
                                label="Completion Requests"
                                onClick={() => router.push('/admin?view=requests')}
                                active={isActive('/admin', 'requests')}
                            />
                            
                            <SidebarItem
                                icon={<UsersIcon size={18} />}
                                label="User Management"
                                onClick={() => router.push('/admin?view=users')}
                                active={isActive('/admin', 'users')}
                            />

                            <SidebarItem
                                icon={<Mail size={18} />}
                                label="Gmail Service"
                                onClick={() => router.push('/admin?view=gmail')}
                                active={isActive('/admin', 'gmail')}
                            />
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="mt-auto border-t border-white/5 pt-4">
                    <SidebarItem 
                        icon={<LogOut size={18} className="text-red-400" />} 
                        label="Sign Out" 
                        onClick={logout} 
                    />
                </div>
            </div>
        </aside>
    );
}