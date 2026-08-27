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
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[10px] font-medium px-1.5 py-0">
            <PackageX className="size-2.5" /> Low Stock
          </Badge>
        );
      case "login":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[10px] font-medium px-1.5 py-0">
            <UserCheck className="size-2.5" /> Session
          </Badge>
        );
      case "warning":
      case "danger":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1 text-[10px] font-medium px-1.5 py-0">
            <AlertTriangle className="size-2.5" /> Alert
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 gap-1 text-[10px] font-medium px-1.5 py-0">
            <Info className="size-2.5" /> System
          </Badge>
        );
    }
  };

  return (
    <div
      onClick={() => onMarkRead(notification._id, notification.isRead)}
      className={`group relative flex items-start justify-between gap-3 p-2.5 sm:p-3 transition-all cursor-pointer border-l-2 ${
        !notification.isRead
          ? "border-l-primary bg-primary/[0.03] hover:bg-primary/[0.06]"
          : "border-l-transparent hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <div className="mt-0.5 shrink-0">{getTypeBadge(notification.type)}</div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className={`text-xs tracking-tight truncate ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="size-1.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight break-words">
            {notification.message}
          </p>
          <div className="flex items-center gap-2.5 pt-0.5 text-[10px] text-muted-foreground/75">
            <span className="flex items-center gap-1">
              <Clock className="size-2.5 text-muted-foreground/60" />
              {new Date(notification.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {notification.userName && (
              <span className="flex items-center gap-1">
                <User className="size-2.5 text-muted-foreground/60" />
                {notification.userName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-center">
        {isAdmin ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTarget(notification._id);
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-opacity size-6"
            title="Delete notification"
          >
            <Trash2 className="size-3" />
          </Button>
        ) : (
          <div title="Only Admin can delete notifications">
            <ShieldAlert className="size-3 text-muted-foreground/30 opacity-40" />
          </div>
        )}
      </div>
    </div>
  );
}
