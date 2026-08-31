import { useNavigate } from "react-router-dom";
import {
  ShoppingCartIcon,
  ReceiptIcon,
  PackagePlusIcon,
  TruckIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardQuickLauncher({ onOpenExpense }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-muted/20 to-card p-3 sm:p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <SparklesIcon className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Quick Action Shortcuts (1-Click Actions)</h3>
            <p className="text-[10px] text-muted-foreground">Immediate counter workflows for daily operations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/pos")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
          >
            <ShoppingCartIcon className="size-3.5" />
            <span>New POS Sale (F1)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (onOpenExpense) onOpenExpense();
              else navigate("/cash");
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
          >
            <ReceiptIcon className="size-3.5" />
            <span>Record Expense</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/products")}
            className="border-border text-foreground font-semibold text-xs gap-1.5 cursor-pointer hover:bg-muted/50 shadow-xs"
          >
            <PackagePlusIcon className="size-3.5" />
            <span>Add Stock / Product</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/textile")}
            className="border-border text-foreground font-semibold text-xs gap-1.5 cursor-pointer hover:bg-muted/50 shadow-xs"
          >
            <TruckIcon className="size-3.5" />
            <span>Dispatch Challan</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
