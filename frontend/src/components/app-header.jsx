import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { navLinks } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { NavUser } from "@/components/nav-user";
import { useToastNotification } from "@/components/toast-notification-provider";
import { SendIcon, BellIcon, FileQuestionIcon } from "lucide-react";

export function AppHeader({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useToastNotification();

  const activeItem = navLinks.find((item) => item.path === location.pathname) || {
    title: location.pathname === "/notifications" ? "Notifications" : "Page Not Found",
    icon: location.pathname === "/notifications" ? <BellIcon className="size-3.5" /> : <FileQuestionIcon className="size-3.5" />,
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={activeItem} />
      </div>
      <div className="flex items-center gap-3">
        <Button
          aria-label="Notifications"
          size="icon-sm"
          variant="outline"
          onClick={() => navigate("/notifications")}
          className="cursor-pointer relative"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <Separator
          className="h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <NavUser user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
