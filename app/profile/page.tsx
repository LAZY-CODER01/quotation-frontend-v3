"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
    UserCog, Hash, Lock, CheckCircle, XCircle,
    Loader2, Save, Eye, EyeOff, ShieldCheck
} from "lucide-react";

interface MeData {
    id: string;
    username: string;
    role: string;
    employee_code: string;
    password_hash: string;
}

export default function ProfilePage() {
    const { user } = useAuth();

    const [me, setMe] = useState<MeData | null>(null);
    const [form, setForm] = useState({
        username: "",
        password: "",
        employee_code: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    // Fetch fresh user data from /auth/me (same as UserManagement does)
    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await api.get("/auth/me");
                if (res.data.success) {
                    const data: MeData = res.data.user;
                    setMe(data);
                    setForm({
                        username: data.username || "",
                        password: "",
                        employee_code: data.employee_code || "",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchMe();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!me?.id) return;
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const payload: any = { username: form.username };
            if (form.password) payload.password = form.password;
            if (form.employee_code) payload.employee_code = form.employee_code;

            const res = await api.put(`/users/${me.id}`, payload);
            if (res.data.success) {
                setSuccess("Profile updated successfully!");
                setMe(prev => prev ? { ...prev, username: form.username, employee_code: form.employee_code } : prev);
                setForm(prev => ({ ...prev, password: "" }));
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    const empSuffix = form.employee_code.startsWith('DBSQ')
        ? form.employee_code.slice(4)
        : form.employee_code;

    return (
        <div className="h-full w-full bg-[rgb(var(--bg-primary))] overflow-y-auto">
            <div className="max-w-2xl mx-auto p-8 space-y-8 animate-in fade-in duration-300">

                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <UserCog size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">My Profile</h1>
                        <p className="text-sm text-[rgb(var(--text-secondary))]">View and manage your account details</p>
                    </div>
                </div>

                {/* Identity Cards — read-only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))] text-xs font-bold uppercase tracking-wider">
                            <Hash size={13} /> Employee ID
                        </div>
                        {me ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 w-fit font-mono">
                                {me.employee_code || "—"}
                            </span>
                        ) : (
                            <div className="h-6 w-24 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
                        )}
                    </div>

                    <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))] text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck size={13} /> Role
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 w-fit">
                            <CheckCircle size={12} /> {me?.role || user.role}
                        </span>
                    </div>

                    {/* Current Password — full width */}
                    <div className="sm:col-span-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))] text-xs font-bold uppercase tracking-wider">
                                <Lock size={13} /> Current Password
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {me ? (
                            <p className="text-sm font-mono text-[rgb(var(--text-primary))] break-all">
                                {showCurrentPassword ? me.password_hash : "••••••••••••"}
                            </p>
                        ) : (
                            <div className="h-5 w-48 bg-[rgb(var(--bg-tertiary))] rounded animate-pulse" />
                        )}
                    </div>
                </div>


                {/* Edit Form */}
                <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-[rgb(var(--border-primary))]">
                        <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">Edit Details</h2>
                        <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">Update your name, employee ID, or password</p>
                    </div>

                    <form onSubmit={handleSave} className="p-5 space-y-5">
                        {/* Alerts */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <XCircle size={15} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                                <CheckCircle size={15} /> {success}
                            </div>
                        )}

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <UserCog size={12} /> Name / Username
                            </label>
                            <input
                                type="text"
                                className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50 transition-colors"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                placeholder="Your display name"
                            />
                        </div>

                        {/* Employee Code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <Hash size={12} /> Employee ID
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 py-2.5 text-sm text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] border border-r-0 border-[rgb(var(--border-primary))] rounded-l-lg select-none font-mono">
                                    DBSQ
                                </span>
                                <input
                                    type="text"
                                    placeholder="XXX"
                                    className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-r-lg px-3 py-2.5 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                                    value={empSuffix}
                                    onChange={e => setForm({ ...form, employee_code: 'DBSQ' + e.target.value })}
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <Lock size={12} /> New Password
                                <span className="font-normal text-[rgb(var(--text-secondary))]">— leave blank to keep current</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2.5 pr-10 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50 transition-colors"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || !me}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
