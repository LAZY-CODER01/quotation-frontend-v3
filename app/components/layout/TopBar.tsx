"use client"
import { Bell, Sun, Moon, Plus } from "lucide-react";
import SearchInput from "../ui/SearchInput";
import Button from "../ui/Button";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function TopBar() {
    const [dark, setDark] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // On mount, sync state with DOM / local preference
        if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem("theme");
            const prefersDark = window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches;

            const shouldUseDark = stored === "dark" || (!stored && prefersDark);

            if (shouldUseDark) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }

            setDark(shouldUseDark);
        }
    }, []);

    const toggleTheme = () => {
        const nextDark = !dark;
        setDark(nextDark);

        if (nextDark) {
            document.documentElement.classList.add("dark");
            window.localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            window.localStorage.setItem("theme", "light");
        }
    };

    return (
        <header className="flex w-full items-center justify-between border-b bg-[#0F1115] backdrop-blur-xl px-6 py-4">
            {/* Left: Search & Filters */}
            <div className="flex items-center gap-4">
                <SearchInput />
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[hsl(var(--bg))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--muted))] shadow-sm hover:bg-[hsl(var(--bg))]/80 transition-colors"
                >
                    <span className="flex h-5 w-10 items-center rounded-full bg-[rgb(var(--border))]/60 p-0.5">
                        <span
                            className={`h-4 w-4 rounded-full bg-emerald-500 shadow-sm transition-transform ${dark ? "translate-x-5" : "translate-x-0"}`}
                        />
                    </span>
                    <span className="hidden sm:inline">
                        {dark ? "Dark mode" : "Light mode"}
                    </span>
                    {dark ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {user && (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold uppercase">
                            {user.username.substring(0, 2)}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-[rgb(var(--muted))] capitalize">{user.role}</p>
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
