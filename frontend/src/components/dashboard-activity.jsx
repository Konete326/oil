import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard-card";
import { CreditCardIcon, UserPlusIcon, FileTextIcon, RocketIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getIcon(iconType) {
  switch (iconType) {
    case "card":
      return <CreditCardIcon />;
    case "user":
      return <UserPlusIcon />;
    case "file":
      return <FileTextIcon />;
    case "rocket":
      return <RocketIcon />;
    default:
      return <RocketIcon />;
  }
}

export function DashboardActivity({ activities = [], loading }) {
  const items = activities || [];

  return (
    <DashboardCard className="gap-0">
      <CardHeader className="border-b">
        <CardTitle>System Activity Audit Log</CardTitle>
        <CardDescription>Live workspace operations and user events.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No system audit logs recorded yet.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item, index) => (
              <li className="flex h-16 items-center gap-3 px-6 hover:bg-muted/20" key={item._id || index}>
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4"
                >
                  {getIcon(item.iconType)}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-1 text-pretty text-foreground text-xs font-medium leading-snug">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </DashboardCard>
  );
}
