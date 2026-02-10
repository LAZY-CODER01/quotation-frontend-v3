"use client";

import UserManagement from "../components/admin/UserManagement";

export default function ProfilePage() {
    return (
        <div className="h-full w-full bg-[#0F1115] overflow-y-auto">
            <div className="space-y-6 max-w-4xl mx-auto p-8 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Profile</h2>
                    <p className="text-gray-400 text-sm">Manage your account details and password.</p>
                </div>
                <UserManagement />
            </div>
        </div>
    );
}
