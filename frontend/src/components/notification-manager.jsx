import { useState, useMemo, useEffect } from "react";
import { useToastNotification } from "@/components/toast-notification-provider";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/confirm-modal";
import { NotificationItem } from "@/components/notification-item";
import { NotificationFilter } from "@/components/notification-filter";
import { PaginationControl } from "@/components/pagination-control";
import { toast } from "sonner";
import {
  BellIcon,
  RefreshCwIcon,
  CheckCheckIcon,
  Trash2Icon,
  InboxIcon,
} from "lucide-react";

const PAGE_SIZE = 10;

export function NotificationManager({ user }) {
  const { notifications, unreadCount, refreshNotifications, markRead, deleteNotification, clearAll } = useToastNotification();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isAdmin = user?.role === "admin";

  const counts = useMemo(() => {
    return {
      total: (notifications || []).length,
      stock: (notifications || []).filter((n) => n.type === "stock").length,
      login: (notifications || []).filter((n) => n.type === "login").length,
      unread: unreadCount,
    };
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return (notifications || []).filter((n) => {
      const matchesSearch =
        (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.userName && n.userName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === "unread") return !n.isRead;
      if (activeTab === "stock") return n.type === "stock";
      if (activeTab === "login") return n.type === "login";
      return true;
    });
  }, [notifications, searchTerm, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredNotifications.length / PAGE_SIZE) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, currentPage]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
      toast.success("Notifications refreshed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh notifications");
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    setLoadingAction(true);
    try {
      await markRead("all");
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkSingleRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await markRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId || !isAdmin) return;
    const target = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await deleteNotification(target);
      toast.success("Notification removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notification");
    }
  };

  const handleConfirmClearAll = async () => {
    if (!isAdmin) return;
    setShowClearModal(false);
    setLoadingAction(true);
    try {
      await clearAll();
      toast.success("All notifications cleared");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear notifications");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-3.5 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BellIcon className="size-5 text-primary" />
              <span>Notification Center</span>
            </h2>
            <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/30 font-medium py-0">
              Auto-prunes after 30 Days
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Real-time audit alerts, inventory stock warnings, and authentication session logs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="cursor-pointer gap-1.5 text-xs h-7.5 px-2.5"
          >
            <RefreshCwIcon className={`size-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={loadingAction}
              className="cursor-pointer gap-1 text-xs h-7.5 px-2.5 font-medium"
            >
              <CheckCheckIcon className="size-3 text-primary" />
              <span>Mark All Read</span>
            </Button>
          )}

          {isAdmin && (notifications || []).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearModal(true)}
              disabled={loadingAction}
              className="cursor-pointer gap-1 text-xs h-7.5 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2Icon className="size-3" />
              <span>Clear History</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border shadow-xs bg-card overflow-hidden">
        <CardHeader className="p-2.5 sm:p-3 border-b border-border/40">
          <NotificationFilter
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            totalCount={counts.total}
            stockCount={counts.stock}
            loginCount={counts.login}
            unreadCount={counts.unread}
          />
        </CardHeader>

        <CardContent className="p-0 divide-y divide-border/30">
          {paginatedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center p-4">
              <div className="p-2.5 rounded-full bg-muted/60 mb-2 text-muted-foreground">
                <InboxIcon className="size-5" />
              </div>
              <h3 className="text-xs font-semibold text-foreground">No notifications found</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
                There are no notifications matching your active filter.
              </p>
            </div>
          ) : (
            paginatedNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                isAdmin={isAdmin}
                onMarkRead={handleMarkSingleRead}
                onDeleteTarget={setDeleteTargetId}
              />
            ))
          )}
        </CardContent>

        <PaginationControl
          page={currentPage}
          pages={totalPages}
          total={filteredNotifications.length}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      {isAdmin && (
        <ConfirmModal
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Notification"
          message="Are you sure you want to delete this notification record permanently?"
          confirmText="Delete"
          variant="destructive"
        />
      )}

      {isAdmin && (
        <ConfirmModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={handleConfirmClearAll}
          title="Clear Notification History"
          message="Are you sure you want to clear all notification records permanently?"
          confirmText="Clear All"
          variant="destructive"
        />
      )}
    </div>
  );
}
