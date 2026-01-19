import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";

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
        {/* 1. Screen Container: Locks the app to the viewport size */}
        <div className="flex h-screen w-screen overflow-hidden">
          
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
      </body>
    </html>
  );
}