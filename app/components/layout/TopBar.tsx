"use client"
import { Bell, Sun, Moon, Plus } from "lucide-react";
import SearchInput from "../ui/SearchInput";
import Button from "../ui/Button";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "next-themes";

export default function TopBar() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <header className="flex w-full items-center justify-between border-b bg-[rgb(var(--bg-primary))] backdrop-blur-xl px-6 py-4">
                <div className="flex items-center gap-4">
                    <SearchInput />
                </div>
                <div className="flex items-center gap-4" />
            </header>
        );
    }

    return (
        <header className="flex w-full items-center justify-between border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] backdrop-blur-xl px-6 py-4">
            {/* Left: Search & Filters */}
            <div className="flex items-center gap-4">
                <SearchInput />
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--text-secondary))] shadow-sm hover:bg-[rgb(var(--hover-bg))] transition-colors"
                >
                    <span className="flex h-5 w-10 items-center rounded-full bg-[rgb(var(--border-primary))] p-0.5">
                        <span
                            className={`h-4 w-4 rounded-full bg-emerald-500 shadow-sm transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
                        />
                    </span>
                    <span className="hidden sm:inline">
                        {theme === "dark" ? "Dark mode" : "Light mode"}
                    </span>
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {user && (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold uppercase">
                            {user.username.substring(0, 2)}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-[rgb(var(--text-primary))]">{user.username}</p>
                            <p className="text-xs text-[rgb(var(--text-secondary))] capitalize">{user.role}</p>
                        </div>
                    </div>
                )}

                {/* <Button variant="primary" icon={<Plus size={16} />}>
          New Ticket
        </Button> */}
            </div>
        </header>
    );
}
