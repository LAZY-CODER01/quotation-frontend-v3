"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, XCircle, Mail, RotateCw } from "lucide-react";

export default function AdminPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<{ connected: boolean; monitoring: boolean; company_gmail_id: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/gmail/status");
            setStatus(response.data);
        } catch (err) {
            console.error("Failed to fetch status", err);
            // If 403, it means not admin, handled by backend but UI should show something? 
            // Assuming layout handles protection or we show error here.
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

    // Callback handling should technically be on a separate route or here if param present.
    // User flow: Connect -> Google -> Redirect Config.OAUTH_REDIRECT_URI -> Frontend Route.
    // We need to know what the Redirect URI is set to. 
    // Based on backend config: OAUTH_REDIRECT_URI = "http://localhost:3000/admin" (Assumption) or similar.
    // I should add a check for query params 'code' here just in case.

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorParam = params.get("error");

        if (code) {
            // Exchange code
            connectGmail(code);
        } else if (errorParam) {
            setError(`OAuth Error: ${errorParam}`);
        }
    }, []);

    const connectGmail = async (code: string) => {
        try {
            setLoading(true);
            // Backend expects callback? No, backend has /api/admin/gmail/callback
            // But usually backend callback handles the exchange if the redirect URI pointed to backend.
            // If redirect URI points to frontend, frontend must send code to backend.
            // The previous conversation log suggests:
            // @app.route('/api/admin/gmail/callback', methods=['GET'])
            // This route takes 'code' from query params. 
            // So if I call logic here, I should call that API with the code.

            await api.get(`/admin/gmail/callback?code=${code}`);
            // Clear query params
            window.history.replaceState({}, document.title, "/admin");
            fetchStatus();
            alert("Gmail connected successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to complete Gmail connection");
        } finally {
            setLoading(false);
        }
    }

    if (loading && !status) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-white">Admin Settings</h1>

            {error && (
                <div className="p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {/* Gmail Connection Card */}
                <div className="bg-[rgb(var(--panel))] rounded-xl border border-[rgb(var(--border))] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Mail className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Company Gmail</h2>
                                <p className="text-sm text-[rgb(var(--muted))]">Connect the main company account for email monitoring</p>
                            </div>
                        </div>
                        {status?.connected ? (
                            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium">
                                <CheckCircle size={16} /> Connected
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-medium">
                                <XCircle size={16} /> Disconnected
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[hsl(var(--bg))] rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-white">Monitoring Status</p>
                                <p className="text-xs text-[rgb(var(--muted))]">
                                    {status?.monitoring ? "Active - Scanning for emails" : "Inactive"}
                                </p>
                            </div>
                            <button onClick={fetchStatus} className="p-2 hover:bg-[rgb(var(--panel))] rounded-full transition-colors text-[rgb(var(--muted))]">
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
                                    className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg font-medium transition-colors"
                                >
                                    Disconnect Gmail
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
