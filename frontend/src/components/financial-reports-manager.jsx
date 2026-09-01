import { useState, useEffect } from "react";
import { ScaleIcon, CalculatorIcon, BookOpenIcon } from "lucide-react";
import { toast } from "sonner";
import { TrialBalanceView } from "@/components/trial-balance-view";
import { ProfitLossWidget } from "@/components/profit-loss-widget";
import { PartyLedgerReportView } from "@/components/party-ledger-report-view";
import { fetchTrialBalanceApi } from "@/lib/api";

export function FinancialReportsManager() {
  const [activeTab, setActiveTab] = useState("profitLoss");
  const [tbAccounts, setTbAccounts] = useState([]);
  const [tbSummary, setTbSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await fetchTrialBalanceApi();
      if (res?.success) {
        setTbAccounts(res.data || []);
        setTbSummary(res.summary || {});
      }
    } catch (err) {
      toast.error("Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "trialBalance") {
      loadTrialBalance();
    }
  }, [activeTab]);

  return (
    <div className="w-full space-y-4 p-3 md:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8.5 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <CalculatorIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-none">
              Profit & Financial Reports
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 overflow-x-auto min-w-0">
          {[
            { id: "profitLoss", label: "Profit & Loss Statement", icon: CalculatorIcon },
            { id: "trialBalance", label: "Trial Balance Sheet", icon: ScaleIcon },
            { id: "partyLedger", label: "Party Ledger Summary", icon: BookOpenIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "profitLoss" && (
        <ProfitLossWidget />
      )}

      {activeTab === "trialBalance" && (
        <TrialBalanceView accounts={tbAccounts} summary={tbSummary} loading={loading} />
      )}

      {activeTab === "partyLedger" && (
        <PartyLedgerReportView />
      )}
    </div>
  );
}
