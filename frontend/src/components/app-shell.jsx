import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useLanguage } from "@/context/language-context";

export function AppShell({ user, onLogout, children }) {
  const { language, runDOMTranslationPass } = useLanguage();
  const location = useLocation();
  const isPos = location.pathname === "/pos";

  useEffect(() => {
    const timer = setTimeout(() => {
      runDOMTranslationPass();
    }, 30);
    return () => clearTimeout(timer);
  }, [location.pathname, language, runDOMTranslationPass]);

  return (
    <SidebarProvider key={language}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={user} onLogout={onLogout} />
        <div
          className={cn(
            "flex flex-1 flex-col w-full",
            isPos
              ? "p-1.5 sm:p-2 md:p-2.5 lg:h-[calc(100vh-3.5rem)] lg:max-h-[calc(100vh-3.5rem)] lg:overflow-hidden overflow-y-auto"
              : "p-2.5 sm:p-3 md:p-4 lg:p-5"
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
