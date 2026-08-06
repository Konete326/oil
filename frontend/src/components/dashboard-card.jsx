import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function DashboardCard({
    className,
    ...props
}) {
	return (
        <Card
            className={cn("rounded-xl border border-border bg-card shadow-xs outline-none", className)}
            {...props} />
    );
}
