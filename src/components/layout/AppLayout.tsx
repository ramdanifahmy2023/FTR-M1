// src/components/layout/AppLayout.tsx

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { FloatingActionButton } from "./FloatingActionButton"; // <-- IMPORT BARU

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 animate-fade-in">
            {children}
          </main>
          <FloatingActionButton /> {/* <-- TAMBAHKAN DI SINI */}
        </div>
      </div>
    </SidebarProvider>
  );
}