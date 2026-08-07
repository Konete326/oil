import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PackageX, UserCheck, Bell, Sparkles } from "lucide-react";

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-muted/20 rounded-lg border border-border/40">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        <Button
          variant={activeTab === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className="text-xs cursor-pointer h-8 px-3 rounded-md font-medium"
        >
          All ({totalCount})
        </Button>
        <Button
          variant={activeTab === "stock" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("stock")}
          className="text-xs cursor-pointer h-8 px-3 gap-1.5 rounded-md font-medium"
        >
          <PackageX className="size-3.5 text-amber-500" />
          Stock ({stockCount})
        </Button>
        <Button
          variant={activeTab === "login" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("login")}
          className="text-xs cursor-pointer h-8 px-3 gap-1.5 rounded-md font-medium"
        >
          <UserCheck className="size-3.5 text-emerald-500" />
          Logins ({loginCount})
        </Button>
        <Button
          variant={activeTab === "unread" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("unread")}
          className="text-xs cursor-pointer h-8 px-3 gap-1.5 rounded-md font-medium"
        >
          <Bell className="size-3.5 text-primary" />
          Unread ({unreadCount})
        </Button>
      </div>

      <div className="relative w-full md:w-64">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 text-xs h-8 bg-background/80 border-border/50 focus-visible:ring-1"
        />
      </div>
    </div>
  );
}
