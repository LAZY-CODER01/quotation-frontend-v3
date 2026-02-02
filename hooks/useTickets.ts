import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { EmailExtraction } from "../types/email";

// Helper to fetch tickets
const fetchTickets = async (params: any) => {
    const response = await api.get("/emails", { params });
    if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch tickets");
    }
    return response.data.data;
};

// --- Hook for Monitor (Simple List) ---
export function useTickets(
    options: {
        refetchInterval?: number | false;
        enabled?: boolean
    } = {}
) {
    return useQuery<EmailExtraction[]>({
        queryKey: ["tickets", "monitor"],
        queryFn: () => fetchTickets({}), // Fetch all/default
        refetchInterval: options.refetchInterval ?? 30000, // Default 30s poll
        enabled: options.enabled ?? true,
    });
}

// --- Hook for Ticket Board (Infinite Scroll / Pagination) ---
// Note directly handling "days" logic. 
// Ideally "pageParam" should be the date cursor.
export function useInfiniteTickets(
    days: number = 10,
    options: { refetchInterval?: number | false } = {}
) {
    return useInfiniteQuery<EmailExtraction[], Error>({
        queryKey: ["tickets", "infinite", days],
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
            const params: any = {};

            if (pageParam) {
                // If we have a cursor, we are fetching OLDER tickets
                params.before = pageParam;
                params.limit = 20; // Page size
            } else {
                // Initial fetch: get last N days
                params.days = days;
            }

            return fetchTickets(params);
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length === 0) return undefined;

            // Find the oldest date in the last page to be the next cursor
            const oldestDate = lastPage.reduce((oldest, current) => {
                return new Date(current.received_at) < new Date(oldest)
                    ? current.received_at
                    : oldest;
            }, lastPage[0].received_at);

            return oldestDate;
        },
        // Keep data fresh for 1 min
        staleTime: 60 * 1000,
        // Add polling support
        refetchInterval: options.refetchInterval ?? 30000,
    });
}
