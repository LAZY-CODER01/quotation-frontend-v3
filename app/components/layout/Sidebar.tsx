"use client";

import SidebarItem from "./SidebarItem";
import {
    Ticket, LogOut, ClipboardCheck, Mail,
    Users as UsersIcon, Monitor, ChevronLeft, ChevronRight, Building
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext"; // Adjust path as needed
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Fix Hydration mismatch
    const [isMounted, setIsMounted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Load collapsed state from local storage if needed
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState) setIsCollapsed(savedState === "true");
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebarCollapsed", String(newState));
    };

    // Helper to check active state including query params
    const isActive = (path: string, view?: string) => {
        if (pathname !== path) return false;
        if (view) return searchParams.get("view") === view;
        return true;
    };

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} shrink-0 border-r bg-[rgb(13 15 19)] flex flex-col h-full transition-all duration-300 ease-in-out`}>
            <div className="p-4 flex-1 flex flex-col items-center w-full">
                {/* Logo Section */}
                <div className={`mb-6 flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-900/20">
                        DB
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <p className="font-semibold text-white tracking-wide">D-BEST</p>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wider">ERP SYSTEM</p>
                        </div>
                    )}
                </div>

                {/* User Profile Snippet */}
                {isMounted && user && (
                    <div className={`mb-6 rounded-xl bg-[#181A1F] border border-white/5 p-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 mx-2'}`}>
                        <div className="h-8 w-8 shrink-0 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                            {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate w-32">{user.username}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role}</p>
                            </div>
                        )}
                    </div>
                )}

                <nav className="flex-1 space-y-1 w-full">
                    <SidebarItem
                        icon={<Ticket size={18} />}
                        label="All Tickets"
                        onClick={() => router.push('/')}
                        active={pathname === '/' && !searchParams.get("view")}
                        collapsed={isCollapsed}
                    />
                    {user?.role === 'USER' && (
                        <SidebarItem
                            icon={<UsersIcon size={18} />}
                            label="My Profile"
                            onClick={() => router.push('/profile')}
                            active={pathname === '/profile'}
                            collapsed={isCollapsed}
                        />
                    )}
                    {/* Admin Section - Only visible to Admins */}
                    {isMounted && user?.role === 'ADMIN' && (
                        <>
                            {!isCollapsed && (
                                <div className="mt-8 mb-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-in fade-in duration-300">
                                    Admin Controls
                                </div>
                            )}
                            {isCollapsed && <div className="my-4 h-[1px] bg-white/5 mx-2" />}

                            <SidebarItem
                                icon={<Monitor size={18} />}
                                label="Ticket Monitor"
                                onClick={() => router.push('/admin?view=monitor')}
                                active={isActive('/admin', 'monitor')}
                                collapsed={isCollapsed}
                            />

                            <SidebarItem
                                icon={<UsersIcon size={18} />}
                                label="Employees"
                                onClick={() => router.push('/admin/employees')}
                                active={pathname === '/admin/employees'}
                                collapsed={isCollapsed}
                            />

                            <SidebarItem
                                icon={<Building size={18} />}
                                label="Clients"
                                onClick={() => router.push('/admin/clients')}
                                active={pathname === '/admin/clients'}
                                collapsed={isCollapsed}
                            />

                            <SidebarItem
                                icon={<ClipboardCheck size={18} />}
                                label="Completion Requests"
                                onClick={() => router.push('/admin?view=requests')}
                                active={isActive('/admin', 'requests')}
                                collapsed={isCollapsed}
                            />

                            <SidebarItem
                                icon={<UsersIcon size={18} />}
                                label="User Management"
                                onClick={() => router.push('/admin?view=users')}
                                active={isActive('/admin', 'users')}
                                collapsed={isCollapsed}
                            />

                            <SidebarItem
                                icon={<Mail size={18} />}
                                label="Gmail Service"
                                onClick={() => router.push('/admin?view=gmail')}
                                active={isActive('/admin', 'gmail')}
                                collapsed={isCollapsed}
                            />
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className={`mt-auto border-t border-white/5 pt-4 w-full flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
                    <SidebarItem
                        icon={<LogOut size={18} className="text-red-400" />}
                        label="Sign Out"
                        onClick={logout}
                        collapsed={isCollapsed}
                    />

                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-white/5 hover:text-white transition-colors ${isCollapsed ? 'justify-center w-full' : 'w-full'}`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        {!isCollapsed && <span>Collapse Sidebar</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}