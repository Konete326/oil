import { ArrowUpRightIcon, ArrowDownLeftIcon, WalletIcon, UsersIcon } from "lucide-react";

export function CashStatsSummary({ totalPaid = 0, totalReceived = 0, partyCount = 0 }) {
  const netFlow = totalReceived - totalPaid;

  const stats = [
    {
      title: "Total Paid Cash",
      value: `Rs. ${totalPaid.toLocaleString()}`,
      subtitle: "Total Outflow",
      icon: ArrowUpRightIcon,
      accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-2.5 px-3.5 shadow-xs hover:border-border transition-all flex items-center justify-between gap-2"
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground block">{item.title}</span>
              <div className="text-base font-bold font-mono tracking-tight text-foreground">{item.value}</div>
              <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
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
