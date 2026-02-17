import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { requestStore } from "../../../lib/requestStore";

export default function ApiStatusIndicator() {
    const [activeRequests, setActiveRequests] = useState(0);

    useEffect(() => {
        // Initial sync
        setActiveRequests(requestStore.getCount());

        // Subscribe to changes
        const unsubscribe = requestStore.subscribe((count) => {
            setActiveRequests(count);
        });

        return unsubscribe;
    }, []);

    const isWorking = activeRequests > 0;

    return (
        <div
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs text-[rgb(var(--text-primary))] font-semibold transition-all duration-300
        ${isWorking
                    ? "bg-red-500/10 border-red-500/50 text-red-800"
                    : "bg-emerald-500/10 border-emerald-500/50 text-emerald-800"
                }
      `}
            title={isWorking ? `${activeRequests} active request(s)` : "System Idle"}
        >
            {isWorking ? (
                <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Working...</span>
                </>
            ) : (
                <>
                    <CheckCircle2 size={14} />
                    <span>System Idle</span>
                </>
            )}
        </div>
    );
}
