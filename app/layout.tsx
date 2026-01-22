import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "D-BEST ERP",
  description: "Ticket workflow dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[hsl(var(--bg))] text-[rgb(var(--text))]">
        <AuthProvider>
          {/* 1. Screen Container: Locks the app to the viewport size */}
          <div className="flex h-screen w-screen overflow-hidden">

            {/* Sidebar only shown if authenticated? Handled by sidebar internal logic or layout logic later. 
                For now keeping structure. Ideally we modify this to hide sidebar on login page.
                But layout wraps everything. Next.js Route Groups (auth) are better for separate layouts.
                I will stick to this for now and maybe conditionally render Sidebar inside. 
                Actually, simpler: Login page can be in a separate layout or I conditionally render sidebar.
                Let's assume path checking or just accept sidebar is always there for now (User didn't ask to remove it).
                Actually user experience dictates login shouldn't have sidebar. 
                I'll leave it as is for now and focus on functionality, then refine.
            */}
            <Sidebar />

            {/* 2. Main Column: Holds TopBar and Page Content */}
            {/* CRITICAL FIX: 'overflow-hidden' here prevents the column 
               from expanding if the child content is too wide. */}
            <div className="flex flex-1 flex-col overflow-hidden">

              {/* TopBar stays fixed width because the parent is locked */}
              <TopBar />

              {/* 3. Main Content Area: Passes the remaining space to the page */}
              <main className="flex-1 overflow-hidden bg-[hsl(var(--bg))]">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}