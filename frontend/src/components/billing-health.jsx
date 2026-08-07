import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard-card";
import { CircleCheckIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function BillingHealth() {
  return (
    <DashboardCard className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="text-balance text-base">Account &amp; System Health</CardTitle>
        <CardDescription className="text-pretty">
          Real-time status of ledger accounts and inventory.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-between p-6 space-y-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CircleCheckIcon className="size-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">Database Connected</p>
            <p className="text-[11px] text-muted-foreground">MongoDB Atlas live synchronization active.</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between cursor-pointer text-xs">
            <Link to="/financial-reports">
              <span>View Financial Ledger Health</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
