import { useMemo } from "react";
import {
  BanknoteIcon,
  DropletIcon,
  PackageIcon,
  CheckCircle2Icon,
} from "lucide-react";

export function InventoryKpiSummary({ products = [] }) {
  const stats = useMemo(() => {
    let totalValue = 0;
    let totalLiters = 0;
    let inStock = 0;
    let outOfStock = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const qty = Number(p.stockQuantity) || 0;
      const cost = Number(p.costPrice) || 0;
      totalValue += qty * cost;
      totalLiters += qty;
      if (qty > 0) inStock++;
      else outOfStock++;
    }

    return {
      totalValue: Math.round(totalValue),
      totalLiters: Number(totalLiters.toFixed(2)),
      totalCount: products.length,
      inStock,
      outOfStock,
    };
  }, [products]);

  const cards = [
    {
      title: "Total Stock Value",
      value: `Rs ${stats.totalValue.toLocaleString()}`,
      subtitle: "Kharid Rate Valuation",
      icon: BanknoteIcon,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Stock Volume",
      value: `${stats.totalLiters.toLocaleString()} L`,
      subtitle: "Warehouse Inventory",
      icon: DropletIcon,
      accent: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Oil Articles",
      value: `${stats.totalCount} Products`,
      subtitle: "Active Catalog",
      icon: PackageIcon,
      accent: "text-primary bg-primary/10 border-primary/20",
    },
    {
      title: "Stock Status",
      value: `${stats.inStock} In Stock`,
      subtitle: stats.outOfStock > 0 ? `${stats.outOfStock} Zero Stock` : "All Items In Stock",
      icon: CheckCircle2Icon,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      {cards.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="rounded-xl border border-border/70 bg-card p-2.5 px-3.5 shadow-2xs hover:border-border transition-all flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block truncate">
                {item.title}
              </span>
              <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground truncate">
                {item.value}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
            </div>
            <div className={`p-2 rounded-lg border shrink-0 ${item.accent}`}>
              <Icon className="size-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
