import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ user, onLogout, children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={user} onLogout={onLogout} />
        <div className={cn("flex flex-1 flex-col w-full p-3 md:p-4 lg:p-5")}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
