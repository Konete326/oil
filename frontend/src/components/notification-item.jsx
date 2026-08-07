import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PackageX,
  UserCheck,
  AlertTriangle,
  Info,
  Trash2,
  Clock,
  User,
  ShieldAlert,
} from "lucide-react";

export function NotificationItem({ notification, isAdmin, onMarkRead, onDeleteTarget }) {
  const getTypeBadge = (type) => {
    switch (type) {
      case "stock":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[11px] font-medium px-2 py-0.5">
            <PackageX className="size-3" /> Low Stock
          </Badge>
        );
      case "login":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px] font-medium px-2 py-0.5">
            <UserCheck className="size-3" /> Session
          </Badge>
        );
      case "warning":
      case "danger":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1 text-[11px] font-medium px-2 py-0.5">
            <AlertTriangle className="size-3" /> Alert
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 gap-1 text-[11px] font-medium px-2 py-0.5">
            <Info className="size-3" /> System
          </Badge>
        );
    }
  };

  return (
    <div
      onClick={() => onMarkRead(notification._id, notification.isRead)}
      className={`group relative flex items-start justify-between gap-4 p-4 transition-all cursor-pointer border-l-2 ${
        !notification.isRead
          ? "border-l-primary bg-primary/[0.03] hover:bg-primary/[0.06]"
          : "border-l-transparent hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="mt-0.5 shrink-0">{getTypeBadge(notification.type)}</div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-xs tracking-tight truncate ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="size-1.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed break-words">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground/75">
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground/60" />
              {new Date(notification.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {notification.userName && (
              <span className="flex items-center gap-1">
                <User className="size-3 text-muted-foreground/60" />
                {notification.userName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-center">
        {isAdmin ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTarget(notification._id);
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-opacity"
            title="Delete notification"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : (
          <div title="Only Admin can delete notifications">
            <ShieldAlert className="size-3.5 text-muted-foreground/30 opacity-40" />
          </div>
        )}
      </div>
    </div>
  );
}
