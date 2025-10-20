// src/components/layout/AppLayout.tsx

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { FloatingActionButton } from "./FloatingActionButton";
import { cn } from "@/lib/utils"; // <-- Import cn

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          {/* --- Perbaikan Padding --- */}
          <main className={cn(
              "flex-1 p-4 md:p-6 animate-fade-in", // Padding default (p-4 mobile, p-6 desktop)
              // "px-4 md:px-6 py-6" // Alternatif: Atur padding X dan Y terpisah jika perlu
          )}>
            {children}
          </main>
          {/* --- Akhir Perbaikan Padding --- */}
          <FloatingActionButton />
        </div>
      </div>
    </SidebarProvider>
  );
}