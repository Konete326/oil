import {
  BanknoteIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  WalletIcon,
} from "lucide-react";

export function CashStatsSummary({
  openingCash = 0,
  todayReceived = 0,
  todayPaid = 0,
  currentDrawerCash = 0,
}) {
  const stats = [
    {
      title: "Opening Cash",
      value: `Rs. ${openingCash.toLocaleString()}`,
      subtitle: "Day Start Drawer Cash",
      icon: BanknoteIcon,
      accent: "text-sky-500 bg-sky-500/10 border-sky-500/20",
      highlight: false,
    },
    {
      title: "Today Received (+)",
      value: `+ Rs. ${todayReceived.toLocaleString()}`,
      subtitle: "Cash Inflow Today",
      icon: ArrowDownLeftIcon,
      accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      highlight: false,
    },
    {
      title: "Today Paid (-)",
      value: `- Rs. ${todayPaid.toLocaleString()}`,
      subtitle: "Cash Outflow & Expenses",
      icon: ArrowUpRightIcon,
      accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      highlight: false,
    },
    {
      title: "Current Drawer Cash",
      value: `Rs. ${currentDrawerCash.toLocaleString()}`,
      subtitle: "Live Cash on Hand",
      icon: WalletIcon,
      accent: "text-primary bg-primary/10 border-primary/30",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      {stats.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={`rounded-xl border p-2.5 px-3.5 shadow-xs transition-all flex items-center justify-between gap-2.5 ${
              item.highlight
                ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-xs"
                : "bg-card border-border/80 hover:border-border"
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {item.title}
              </span>
              <div
                className={`text-sm sm:text-base font-bold font-mono tracking-tight truncate ${
                  item.highlight
                    ? "text-primary font-extrabold"
                    : i === 1
                    ? "text-emerald-600 dark:text-emerald-400"
                    : i === 2
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground"
                }`}
              >
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
