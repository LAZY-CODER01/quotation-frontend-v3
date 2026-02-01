"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { CheckCircle, XCircle, Mail, RotateCw } from "lucide-react";

export default function GmailSettings() {
    const [status, setStatus] = useState<{ connected: boolean; monitoring: boolean; company_gmail_id: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/gmail/status");
            setStatus(response.data);
            setError("");
        } catch (err) {
            console.error("Failed to fetch status", err);
            setError("Failed to load Gmail status. Are you an Admin?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

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

    if (loading && !status) return <div className="text-gray-400 p-4">Loading Gmail settings...</div>;

    return (
        <div className="bg-[#181A1F] rounded-xl border border-white/10 p-6">
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                    <XCircle size={18} /> {error}
                </div>
            )}

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
    );
}
