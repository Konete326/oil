import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { fetchNotificationsApi, markNotificationReadApi, deleteNotificationApi, clearAllNotificationsApi } from "@/lib/api";
import { PackageX, UserCheck, AlertTriangle, Info, CheckCircle2, X, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: () => {},
  markRead: () => {},
  deleteNotification: () => {},
  clearAll: () => {},
});

export const useToastNotification = () => useContext(NotificationContext);

export function ToastNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToasts, setActiveToasts] = useState([]);
  const knownIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    const res = await fetchNotificationsApi();
    if (res && res.success) {
      const fetchedList = res.data || [];
      setNotifications(fetchedList);
      setUnreadCount(res.unreadCount || 0);

      if (isFirstLoadRef.current) {
        fetchedList.forEach((n) => knownIdsRef.current.add(n._id));
        isFirstLoadRef.current = false;
      } else {
        const newItems = fetchedList.filter((n) => !knownIdsRef.current.has(n._id) && !n.isRead);
        if (newItems.length > 0) {
          newItems.forEach((n) => knownIdsRef.current.add(n._id));
          const toastsToAdd = newItems.map((n) => ({
            id: n._id,
            title: n.title,
            message: n.message,
            type: n.type,
            createdAt: n.createdAt,
          }));
          setActiveToasts((prev) => [...toastsToAdd, ...prev].slice(0, 3));
        }
      }
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        loadNotifications();
      }
    }, 15000);
    const handleNotificationEvent = () => loadNotifications();
    const handleOnline = () => loadNotifications();
    window.addEventListener("app-notification-changed", handleNotificationEvent);
    window.addEventListener("focus", handleNotificationEvent);
    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("app-notification-changed", handleNotificationEvent);
      window.removeEventListener("focus", handleNotificationEvent);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadNotifications]);

  const dismissToast = useCallback((id) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
    markNotificationReadApi(id).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeToasts.length === 0) return;
    const timers = activeToasts.map((toast) =>
      setTimeout(() => {
        dismissToast(toast.id);
      }, 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [activeToasts, dismissToast]);

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (id === "all" || n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => (id === "all" ? 0 : Math.max(0, prev - 1)));
    await markNotificationReadApi(id);
  };

  const deleteNotification = async (id) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n._id !== id);
    });
    await deleteNotificationApi(id);
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await clearAllNotificationsApi();
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "stock":
        return <PackageX className="size-4 text-amber-500 shrink-0" />;
      case "login":
        return <UserCheck className="size-4 text-emerald-500 shrink-0" />;
      case "warning":
      case "danger":
        return <AlertTriangle className="size-4 text-rose-500 shrink-0" />;
      case "success":
        return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="size-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications: loadNotifications,
        markRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
      <div className="fixed top-16 right-4 rtl:right-auto rtl:left-4 ltr:right-4 ltr:left-auto z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none transition-all duration-200">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-md backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2"
          >
            <div className="mt-0.5">{getToastIcon(toast.type)}</div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className="font-semibold text-xs text-foreground truncate">
                  {toast.title}
                </h4>
                <span className="text-[10px] text-muted-foreground shrink-0">Just now</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{toast.message}</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    dismissToast(toast.id);
                    navigate("/notifications");
                  }}
                  className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Bell className="size-3" /> View details
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
