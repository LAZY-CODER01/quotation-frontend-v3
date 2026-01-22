"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            // Adjusted to match backend route /api/auth/login
            const response = await api.post("/auth/login", { username, password });

            if (response.data.success && response.data.token) {
                login(response.data.token, response.data.user);
            } else {
                setError("Invalid response from server");
            }
        } catch (err: any) {
            console.error(err);
            if (err.response) {
                setError(err.response.data.error || "Login failed");
            } else {
                setError("Network error. Is the backend running?");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-sm">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-zinc-900 dark:text-zinc-100">
                    Welcome Back
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Enter your credentials to access the ERP
                </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md">
                        {error}
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-100" htmlFor="username">
                        Username
                    </label>
                    <input
                        className="flex h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-900 dark:text-zinc-100"
                        id="username"
                        placeholder="admin"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-100" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="flex h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-900 dark:text-zinc-100"
                        id="password"
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 h-10 w-full"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                </button>
            </form>
        </div>
    );
}
