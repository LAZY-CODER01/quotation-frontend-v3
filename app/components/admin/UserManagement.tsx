"use client";

import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { User, Hash, Lock, CheckCircle, UserPlus, Users, Loader2, XCircle, RefreshCw } from "lucide-react";

interface UserData {
    id: string;
    username: string;
    employee_code: string;
    role: string;
    password_hash: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        role: "user"

    });
    const [creatingUser, setCreatingUser] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await api.get("/admin/users");
                if (response.data.success) {
                    setUsers(response.data.users);
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [refreshTrigger]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!userForm.username || !userForm.password) {
            setError("Username and password are required");
            return;
        }

        setCreatingUser(true);
        try {
            // Note: employee_code is now auto-generated on the backend
            const response = await api.post("/admin/users", userForm);
            if (response.data.success) {
                setSuccessMsg(`User ${userForm.username} created successfully!`);
                // Reset form
                setUserForm({
                    username: "",
                    password: "",
                    role: "user"
                });
                // Refresh list
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (err: any) {
            console.error("Create user error", err);
            setError(err.response?.data?.error || "Failed to create user");
        } finally {
            setCreatingUser(false);
        }
    };
    console.log("Users:", users);

    return (
        <div className="space-y-6">
            {/* Create User Section */}
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
                        <p className="text-sm text-gray-400">Add new employees or admins. Employee Code will be auto-generated.</p>
                    </div>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                            <User size={12} /> Username
                        </label>
                        <input
                            type="text"
                            placeholder="valid.username"
                            className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                            value={userForm.username}
                            onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                            <Lock size={12} /> Password
                        </label>
                        <input
                            type="text"
                            placeholder="SecretPassword123"
                            className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                            value={userForm.password}
                            onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-500">Visible for initial setup only</p>
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
                    <div className="md:col-span-3 mt-2">
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
                            <span>{creatingUser ? "Creating and Auto-Generating ID..." : "Create User"}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* User List Section */}
            <div className="bg-[#181A1F] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Existing Users</h2>
                        <p className="text-sm text-gray-400">List of all registered users</p>
                    </div>
                    <button
                        onClick={() => setRefreshTrigger(p => p + 1)}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm border-b border-white/10">
                                <th className="p-4 font-medium">Employee Code</th>
                                <th className="p-4 font-medium">Username</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium text-right">Passwd</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {users.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                                                <Hash size={12} />
                                                {user.employee_code}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                                    {user.username.slice(0, 2)}
                                                </div>
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.role === 'ADMIN' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
                                                    <Lock size={12} /> ADMIN
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                    <CheckCircle size={12} /> Employee
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-gray-500 text-xs italic">
                                            {user.password_hash}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
