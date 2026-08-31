import { useNavigate } from "react-router-dom";
import { AlertTriangleIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveGallaWidget({ lowStockItems = [] }) {
  const navigate = useNavigate();

  if (!lowStockItems || lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-card p-3 sm:p-3.5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/30">
          <AlertTriangleIcon className="size-4 animate-pulse" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="font-bold text-amber-800 dark:text-amber-200 text-xs">
            ⚠️ {lowStockItems.length} Products Low in Stock:
          </span>
          {lowStockItems.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => navigate("/products", { state: { search: item.name } })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 hover:bg-background border border-amber-500/40 text-[11px] font-semibold text-foreground hover:text-primary transition-all cursor-pointer shadow-2xs active:scale-95"
              title={`Click to open ${item.name} in Products`}
            >
              <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium">{item.name}</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                (Only {item.quantity} {item.unit} Left)
              </span>
            </button>
          ))}
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate("/products", { state: { stockStatus: "low" } })}
        className="border-amber-500/50 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-bold h-8 px-3 shrink-0 cursor-pointer gap-1 shadow-2xs"
      >
        <span>View All Low Stock</span>
        <ChevronRightIcon className="size-3.5" />
      </Button>
    </div>
  );
}
