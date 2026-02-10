import { Suspense } from "react";
import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import { AuthProvider } from "../context/AuthContext";
import QueryProvider from "./providers";

export const metadata = {
  title: "D-BEST ERP",
  description: "Ticket workflow dashboard",
};

import { UploadProvider } from "../context/UploadContext";
import { SearchProvider } from "../context/SearchContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[hsl(var(--bg))] text-[rgb(var(--text))] " style={{
        fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
      }}>
        <AuthProvider>
          <QueryProvider>
            <UploadProvider>
              <SearchProvider>
                {/* 1. Screen Container: Locks the app to the viewport size */}
                <div className="flex h-screen w-screen overflow-hidden">
                  <Suspense fallback={<div className="w-64 bg-[rgb(13,15,19)] border-r h-full shrink-0" />}>
                    <Sidebar />
                  </Suspense>


                  <div className="flex flex-1 flex-col overflow-hidden">

                    {/* TopBar stays fixed width because the parent is locked */}
                    <TopBar />

                    {/* 3. Main Content Area: Passes the remaining space to the page */}
                    <main className="flex-1 overflow-y-auto bg-[hsl(var(--bg))]">
                      {children}
                    </main>
                  </div>
                </div>
              </SearchProvider>
            </UploadProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}