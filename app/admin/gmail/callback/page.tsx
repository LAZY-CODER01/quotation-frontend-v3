"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../../../lib/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function GmailCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [message, setMessage] = useState("Connecting your Gmail account...");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setMessage(`Connection failed: ${error}`);
            setTimeout(() => router.push("/admin"), 3000);
            return;
        }

        if (code) {
            connectGmail(code);
        } else {
            // No code, no error -> invalid visit
            router.push("/admin");
        }
    }, [searchParams, router]);

    const connectGmail = async (code: string) => {
        try {
            const response = await api.get(`/admin/gmail/callback?code=${code}`);
            if (response.data.success) {
                setStatus("success");
                setMessage("Gmail connected successfully! Redirecting...");
                setTimeout(() => router.push("/admin"), 2000);
            } else {
                setStatus("error");
                setMessage("Failed to connect. Please try again.");
                setTimeout(() => router.push("/admin"), 3000);
            }
        } catch (err: any) {
            setStatus("error");
            setMessage(err.response?.data?.error || "An unexpected error occurred.");
            setTimeout(() => router.push("/admin"), 3000);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[hsl(var(--bg))] text-[rgb(var(--text))]">
            <div className="text-center space-y-4 p-8 bg-[#181A1F] rounded-xl border border-white/10 shadow-2xl max-w-md w-full">

                {status === "processing" && (
                    <>
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                        <h2 className="text-xl font-semibold">Processing...</h2>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-emerald-400">Success!</h2>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-red-400">Error</h2>
                    </>
                )}

                <p className="text-gray-400">{message}</p>
            </div>
        </div>
    );
}
