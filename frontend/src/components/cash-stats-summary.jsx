import { ArrowUpRightIcon, ArrowDownLeftIcon, WalletIcon, UsersIcon } from "lucide-react";

export function CashStatsSummary({ totalPaid = 0, totalReceived = 0, partyCount = 0 }) {
  const netFlow = totalReceived - totalPaid;

  const stats = [
    {
      title: "Total Paid Cash",
      value: `Rs. ${totalPaid.toLocaleString()}`,
      subtitle: "Total Outflow",
      icon: ArrowUpRightIcon,
      accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Total Received Cash",
      value: `Rs. ${totalReceived.toLocaleString()}`,
      subtitle: "Total Inflow",
      icon: ArrowDownLeftIcon,
      accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Net Cash Flow",
      value: `Rs. ${netFlow.toLocaleString()}`,
      subtitle: netFlow >= 0 ? "Positive Balance" : "Negative Balance",
      icon: WalletIcon,
      accent: netFlow >= 0 ? "text-primary bg-primary/10 border-primary/20" : "text-destructive bg-destructive/10 border-destructive/20",
    },
    {
      title: "Active Parties",
      value: partyCount,
      subtitle: "Recorded Parties",
      icon: UsersIcon,
      accent: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:border-border transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{item.title}</span>
              <div className={`p-2 rounded-lg border ${item.accent}`}>
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-foreground">{item.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
