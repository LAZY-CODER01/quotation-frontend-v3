"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { 
  CheckCircle, XCircle, Mail, RotateCw, 
  UserPlus, Hash, Lock, User, Users, Loader2 
} from "lucide-react";

export default function AdminPage() {
    const { user } = useAuth();
    
    // --- Gmail State ---
    const [status, setStatus] = useState<{ connected: boolean; monitoring: boolean; company_gmail_id: string } | null>(null);
    const [loading, setLoading] = useState(true);
    
    // --- User Creation State ---
    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        employee_code: "",
        role: "user"
    });
    const [creatingUser, setCreatingUser] = useState(false);
    
    // --- General State ---
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        fetchStatus();
    }, []);

    // ... (Existing Gmail Logic: fetchStatus, handleConnect, handleDisconnect) ...

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/gmail/status");
            setStatus(response.data);
        } catch (err) {
            console.error("Failed to fetch status", err);
            setError("Failed to load Gmail status. Are you an Admin?");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await api.get("/admin/gmail/connect");
            if (response.data.authorization_url) {
                window.location.href = response.data.authorization_url;
            } else {
                setError("Failed to get auth URL");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to initiate connection");
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect the company Gmail? This will stop all monitoring.")) return;
        try {
            await api.post("/admin/gmail/disconnect");
            fetchStatus();
        } catch (err) {
            console.error(err);
            setError("Failed to disconnect");
        }
    };

    // ... (Existing Callback Logic) ...
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorParam = params.get("error");
        if (code) connectGmail(code);
        else if (errorParam) setError(`OAuth Error: ${errorParam}`);
    }, []);

    const connectGmail = async (code: string) => {
        try {
            setLoading(true);
            await api.get(`/admin/gmail/callback?code=${code}`);
            window.history.replaceState({}, document.title, "/admin");
            fetchStatus();
            alert("Gmail connected successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to complete Gmail connection");
        } finally {
            setLoading(false);
        }
    };

    // --- New User Logic ---

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        
        if (!userForm.username || !userForm.password || !userForm.employee_code) {
            setError("All fields are required");
            return;
        }

        setCreatingUser(true);
        try {
            const response = await api.post("/admin/create-user", userForm);
            if (response.data.success) {
                setSuccessMsg(`User ${userForm.username} created successfully!`);
                // Reset form
                setUserForm({
                    username: "",
                    password: "",
                    employee_code: "",
                    role: "user"
                });
            }
        } catch (err: any) {
            console.error("Create user error", err);
            setError(err.response?.data?.error || "Failed to create user");
        } finally {
            setCreatingUser(false);
        }
    };

    if (loading && !status) return <div className="p-8 text-white">Loading settings...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Admin Settings</h1>

            {/* Notifications */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                    <XCircle size={18} /> {error}
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 flex items-center gap-2">
                    <CheckCircle size={18} /> {successMsg}
                </div>
            )}

            <div className="grid gap-8">
                {/* 1. Gmail Connection Card */}
                <div className="bg-[#181A1F] rounded-xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Mail className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Company Gmail</h2>
                                <p className="text-sm text-gray-400">Connect the main company account for email monitoring</p>
                            </div>
                        </div>
                        {status?.connected ? (
                            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium border border-emerald-500/20">
                                <CheckCircle size={14} /> Connected
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-medium border border-red-500/20">
                                <XCircle size={14} /> Disconnected
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#0F1115] rounded-lg border border-white/5">
                            <div>
                                <p className="text-sm font-medium text-white">Monitoring Status</p>
                                <p className="text-xs text-gray-500">
                                    {status?.monitoring ? "Active - Scanning for emails" : "Inactive"}
                                </p>
                            </div>
                            <button onClick={fetchStatus} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                                <RotateCw size={16} />
                            </button>
                        </div>

                        <div className="flex gap-3 mt-6">
                            {!status?.connected ? (
                                <button
                                    onClick={handleConnect}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Connect Gmail
                                </button>
                            ) : (
                                <button
                                    onClick={handleDisconnect}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-medium transition-colors"
                                >
                                    Disconnect Gmail
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. User Management Card (New) */}
                <div className="bg-[#181A1F] rounded-xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Create User</h2>
                            <p className="text-sm text-gray-400">Add new employees or admins to the system</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <User size={12} /> Username
                            </label>
                            <input 
                                type="text"
                                placeholder="john_doe"
                                className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                value={userForm.username}
                                onChange={e => setUserForm({...userForm, username: e.target.value})}
                            />
                        </div>

                        {/* Employee Code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <Hash size={12} /> Employee Code
                            </label>
                            <input 
                                type="text"
                                placeholder="EMP-001"
                                className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                value={userForm.employee_code}
                                onChange={e => setUserForm({...userForm, employee_code: e.target.value})}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <Lock size={12} /> Password
                            </label>
                            <input 
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                value={userForm.password}
                                onChange={e => setUserForm({...userForm, password: e.target.value})}
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                <CheckCircle size={12} /> Role
                            </label>
                            <select 
                                className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                                value={userForm.role}
                                onChange={e => setUserForm({...userForm, role: e.target.value})}
                            >
                                <option value="user">User (Employee)</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div className="md:col-span-2 mt-2">
                            <button
                                type="submit"
                                disabled={creatingUser}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                            >
                                {creatingUser ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <UserPlus size={16} />
                                )}
                                <span>{creatingUser ? "Creating User..." : "Create User"}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}