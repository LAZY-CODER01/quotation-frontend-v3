"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data remains fresh for 1 minute to prevent immediate refetching on navigation
                        staleTime: 60 * 1000,
                        // Avoid refetching when window gains focus to reduce API spam
                        refetchOnWindowFocus: false,
                        // Retry failed queries 1 time
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    );
}
