"use client";

import { useState } from "react";
import api from "../../../lib/api";
import { User, Hash, Lock, CheckCircle, UserPlus, Users, Loader2, XCircle } from "lucide-react";

export default function UserManagement() {
    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        employee_code: "",
        role: "user"
    });
    const [creatingUser, setCreatingUser] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

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

    return (
        <div className="bg-[#181A1F] rounded-xl border border-white/10 p-6">
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                    <XCircle size={18} /> {error}
                </div>
            )}
            {successMsg && (
                <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 flex items-center gap-2">
                    <CheckCircle size={18} /> {successMsg}
                </div>
            )}

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
                        onChange={e => setUserForm({ ...userForm, username: e.target.value })}
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
                        onChange={e => setUserForm({ ...userForm, employee_code: e.target.value })}
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
                        onChange={e => setUserForm({ ...userForm, password: e.target.value })}
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
                        onChange={e => setUserForm({ ...userForm, role: e.target.value })}
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
    );
}
