"use client";
import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { User, Hash, Lock, CheckCircle, UserPlus, Users, Loader2, XCircle, RefreshCw, Trash2, Key, X, Save } from "lucide-react";

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
        role: "user",
        employee_code: "DBSQ"
    });
    const [creatingUser, setCreatingUser] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);

    // Edit User State
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editForm, setEditForm] = useState({
        username: "",
        password: "",
        role: "user",
        employee_code: ""
    });
    const [updatingUser, setUpdatingUser] = useState(false);

    // Fetch users
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Get Current User
                const meRes = await api.get("/auth/me");
                if (meRes.data.success) {
                    const me = meRes.data.user;
                    setCurrentUser(me);

                    // 2. Fetch Data based on Role
                    if (me.role === 'ADMIN') {
                        const response = await api.get("/admin/users");
                        if (response.data.success) {
                            setUsers(response.data.users);
                        }
                    } else {
                        // Regular user sees only themselves
                        // Try to get full details? /auth/me might be limited.
                        // Ideally we have an endpoint to get full self details or just use what we have.
                        // Let's assume meRes.data.user has enough, or we might need to fetch /api/users/<my_id> if we implemented get_user
                        // For now, construct a list with just me
                        // Note: /auth/me returns what's in the token usually, checks backend.
                        // backend_app.py: /api/auth/me returns request.user which comes from token.
                        // Token has: id, username, role. Missing employee_code?
                        // Let's check backend... /api/auth/me -> request.user.
                        // DuckDBService.get_user_by_username returns employee_code too. 
                        // create_jwt includes it? 
                        // Let's assume we might need to rely on what we have or fetch freshness.
                        // Actually, since we didn't add GET /api/users/me or similar full detail fetch, 
                        // let's try to use what we have. If employee_code is missing in token, it might be blank.
                        setUsers([me as UserData]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };
        init();
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
            const payload = {
                ...userForm,
                // If code is just "DBSQ" or empty, send undefined to let backend auto-generate
                employee_code: (userForm.employee_code && userForm.employee_code !== 'DBSQ')
                    ? userForm.employee_code.trim()
                    : undefined
            };

            const response = await api.post("/admin/users", payload);
            if (response.data.success) {
                setSuccessMsg(`User ${userForm.username} created successfully!`);
                // Reset form
                setUserForm({
                    username: "",
                    password: "",
                    role: "user",
                    employee_code: ""
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

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const response = await api.delete(`/admin/users/${userId}`);
            if (response.data.success) {
                setSuccessMsg("User deleted successfully");
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (err: any) {
            console.error("Delete user error", err);
            setError(err.response?.data?.error || "Failed to delete user");
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Use global error or local? Let's use global for simplicity or new state
        setSuccessMsg("");

        if (!editingUser) return;

        setUpdatingUser(true);
        try {
            const payload: any = {
                username: editForm.username,
            };
            if (editForm.password) payload.password = editForm.password;

            // Include employee_code for everyone (if provided)
            if (editForm.employee_code && editForm.employee_code !== 'DBSQ') {
                payload.employee_code = editForm.employee_code;
            }

            // Only Admin can send role
            if (currentUser?.role === 'ADMIN') {
                payload.role = editForm.role;
            }

            const response = await api.put(`/users/${editingUser.id}`, payload);

            if (response.data.success) {
                setSuccessMsg(`User updated successfully!`);
                setEditingUser(null);
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (err: any) {
            console.error("Update error", err);
            setError(err.response?.data?.error || "Failed to update user");
        } finally {
            setUpdatingUser(false);
        }
    };

    const openEditModal = (user: UserData) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            password: "", // Don't show hash
            role: user.role,
            employee_code: user.employee_code || "DBSQ"
        });
        setError("");
        setSuccessMsg("");
    };

    return (
        <div className="space-y-6">
            {/* Create User Section - ADMIN ONLY */}
            {currentUser?.role === 'ADMIN' && (
                <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 dark:text-red-400 flex items-center gap-2">
                            <XCircle size={18} /> {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle size={18} /> {successMsg}
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Create User</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">Add new employees or admins. Employee Code is optional (auto-generated if empty).</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Employee Code (Optional) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <Hash size={12} /> Employee Code (Opt)
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 py-2 text-sm text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] border border-r-0 border-[rgb(var(--border-primary))] rounded-l-lg select-none">
                                    DBSQ
                                </span>
                                <input
                                    type="text"
                                    placeholder="XXX"
                                    className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-r-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                    value={userForm.employee_code.startsWith('DBSQ') ? userForm.employee_code.slice(4) : userForm.employee_code}
                                    onChange={e => setUserForm({ ...userForm, employee_code: 'DBSQ' + e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <User size={12} /> Username
                            </label>
                            <input
                                type="text"
                                placeholder="valid.username"
                                className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                value={userForm.username}
                                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <Lock size={12} /> Password
                            </label>
                            <input
                                type="text"
                                placeholder="SecretPassword123"
                                className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                value={userForm.password}
                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                                <CheckCircle size={12} /> Role
                            </label>
                            <select
                                className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50 appearance-none"
                                value={userForm.role}
                                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                            >
                                <option value="user">User (Employee)</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div className="md:col-span-4 mt-2">
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
            )}

            {/* User List Section */}
            <div className="bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden">
                <div className="p-6 border-b border-[rgb(var(--border-primary))] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{currentUser?.role === 'ADMIN' ? 'Existing Users' : 'My Profile'}</h2>
                        <p className="text-sm text-[rgb(var(--text-secondary))]">{currentUser?.role === 'ADMIN' ? 'List of all registered users' : 'Manage your account details'}</p>
                    </div>
                    <button
                        onClick={() => setRefreshTrigger(p => p + 1)}
                        className="p-2 hover:bg-[rgb(var(--hover-bg))] rounded-lg text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] text-sm border-b border-[rgb(var(--border-primary))]">
                                <th className="p-4 font-medium">Employee Code</th>
                                <th className="p-4 font-medium">Username</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium text-right">Passwd</th>
                                <th className="p-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                            {users.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[rgb(var(--text-tertiary))]">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-[rgb(var(--hover-bg))] transition-colors group">
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                                                <Hash size={12} />
                                                {user.employee_code || "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[rgb(var(--text-primary))] font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                                    {user.username ? user.username.slice(0, 2) : "??"}
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
                                        <td className="p-4 text-right text-[rgb(var(--text-tertiary))] text-xs italic">
                                            {user.password_hash}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--hover-bg))] rounded-lg transition-colors" title="Edit User"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                {currentUser?.role === 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User / Change Password Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-primary))]">
                            <h3 className="text-[rgb(var(--text-primary))] font-semibold">Edit User: {editingUser.username}</h3>
                            <button onClick={() => setEditingUser(null)} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleEditUser} className="p-6 space-y-4">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Username</label>
                                <input
                                    type="text"
                                    className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                    value={editForm.username}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>

                            {/* Password (Optional) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">New Password (leave blank to keep current)</label>
                                <input
                                    type="text"
                                    className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="Min 6 chars"
                                />
                            </div>

                            {/* Employee Code */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Employee Code</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 py-2 text-sm text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] border border-r-0 border-[rgb(var(--border-primary))] rounded-l-lg select-none">
                                        DBSQ
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="XXX"
                                        className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-r-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                        value={editForm.employee_code.startsWith('DBSQ') ? editForm.employee_code.slice(4) : editForm.employee_code}
                                        onChange={e => setEditForm({ ...editForm, employee_code: 'DBSQ' + e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Admin Only Fields */}
                            {currentUser?.role === 'ADMIN' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-[rgb(var(--text-secondary))]">Role</label>
                                        <select
                                            className="w-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:border-purple-500/50"
                                            value={editForm.role}
                                            onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        >
                                            <option value="user">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={updatingUser}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingUser ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                <span>Save Changes</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
