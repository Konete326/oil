import { useState, useMemo, useEffect } from "react";
import { useToastNotification } from "@/components/toast-notification-provider";
import { markNotificationReadApi, deleteNotificationApi, clearAllNotificationsApi } from "@/lib/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/confirm-modal";
import { NotificationItem } from "@/components/notification-item";
import { NotificationFilter } from "@/components/notification-filter";
import { PaginationControl } from "@/components/pagination-control";
import {
  BellIcon,
  RefreshCwIcon,
  CheckCheckIcon,
  Trash2Icon,
  InboxIcon,
  PackageXIcon,
  UserCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";

const PAGE_SIZE = 10;

export function NotificationManager({ user }) {
  const { notifications, unreadCount, refreshNotifications } = useToastNotification();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isAdmin = user?.role === "admin";

  const counts = useMemo(() => {
    return {
      total: notifications.length,
      stock: notifications.filter((n) => n.type === "stock").length,
      login: notifications.filter((n) => n.type === "login").length,
      unread: unreadCount,
    };
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleMarkAllRead = async () => {
    setLoadingAction(true);
    try {
      await markNotificationReadApi("all");
      await refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkSingleRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await markNotificationReadApi(id);
      await refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId || !isAdmin) return;
    setLoadingAction(true);
    try {
      await deleteNotificationApi(deleteTargetId);
      await refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTargetId(null);
      setLoadingAction(false);
    }
  };

  const handleConfirmClearAll = async () => {
    if (!isAdmin) return;
    setLoadingAction(true);
    try {
      await clearAllNotificationsApi();
      await refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setShowClearModal(false);
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BellIcon className="size-6 text-primary" />
            Notification Center
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time audit events, inventory stock warnings, and authentication alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNotifications}
            className="cursor-pointer gap-1.5 text-xs h-8"
          >
            <RefreshCwIcon className="size-3.5 text-muted-foreground" /> Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={loadingAction}
              className="cursor-pointer gap-1.5 text-xs h-8 font-medium"
            >
              <CheckCheckIcon className="size-3.5 text-primary" /> Mark All Read
            </Button>
          )}

          {isAdmin && notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearModal(true)}
              disabled={loadingAction}
              className="cursor-pointer gap-1.5 text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2Icon className="size-3.5" /> Clear History
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BellIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Notifications</p>
            <p className="text-xl font-bold text-foreground">{counts.total}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <PackageXIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Low Stock Warnings</p>
            <p className="text-xl font-bold text-foreground">{counts.stock}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <UserCheckIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Session Logins</p>
            <p className="text-xl font-bold text-foreground">{counts.login}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-500">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Unread Messages</p>
            <p className="text-xl font-bold text-foreground">{counts.unread}</p>
          </div>
        </div>
      </div>

      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="p-4 border-b border-border/40">
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
            <div className="flex flex-col items-center justify-center py-14 text-center p-6">
              <div className="p-3 rounded-full bg-muted/60 mb-3 text-muted-foreground">
                <InboxIcon className="size-6" />
              </div>
              <h3 className="text-xs font-semibold text-foreground">No notifications</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                There are no notifications matching your current filter.
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
