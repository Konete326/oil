import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PackageX, UserCheck, Bell } from "lucide-react";

export function NotificationFilter({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  totalCount,
  stockCount,
  loginCount,
  unreadCount,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-muted/20 rounded-lg border border-border/40">
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0">
        <Button
          variant={activeTab === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className="text-[11px] cursor-pointer h-7 px-2.5 rounded-md font-medium"
        >
          All ({totalCount})
        </Button>
        <Button
          variant={activeTab === "stock" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("stock")}
          className="text-[11px] cursor-pointer h-7 px-2.5 gap-1.5 rounded-md font-medium"
        >
          <PackageX className="size-3 text-amber-500" />
          <span>Stock ({stockCount})</span>
        </Button>
        <Button
          variant={activeTab === "login" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("login")}
          className="text-[11px] cursor-pointer h-7 px-2.5 gap-1.5 rounded-md font-medium"
        >
          <UserCheck className="size-3 text-emerald-500" />
          <span>Logins ({loginCount})</span>
        </Button>
        <Button
          variant={activeTab === "unread" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("unread")}
          className="text-[11px] cursor-pointer h-7 px-2.5 gap-1.5 rounded-md font-medium"
        >
          <Bell className="size-3 text-primary" />
          <span>Unread ({unreadCount})</span>
        </Button>
      </div>

      <div className="relative w-full md:w-56">
        <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-7.5 text-xs h-7 bg-background/80 border-border/50 focus-visible:ring-1"
        />
      </div>
    </div>
  );
}
