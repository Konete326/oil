import { useState, useEffect } from "react";
import { ScaleIcon, CalculatorIcon, BookOpenIcon, PrinterIcon, FileSpreadsheetIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TrialBalanceView } from "@/components/trial-balance-view";
import { ProfitLossWidget } from "@/components/profit-loss-widget";
import { PartyLedgerReportView } from "@/components/party-ledger-report-view";
import { fetchTrialBalanceApi } from "@/lib/api";

export function FinancialReportsManager() {
  const [activeTab, setActiveTab] = useState("trialBalance");
  const [tbAccounts, setTbAccounts] = useState([]);
  const [tbSummary, setTbSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await fetchTrialBalanceApi();
      if (res?.success) {
        setTbAccounts(res.data);
        setTbSummary(res.summary);
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
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Reports & Ledger (Maliyaati Reports)</h1>
          <p className="text-xs text-muted-foreground">Trial Balance Sheet, Profit & Loss Income Statement, and Specific Party Khata Reports.</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { id: "trialBalance", label: "Trial Balance Sheet" },
            { id: "profitLoss", label: "Profit & Loss Statement" },
            { id: "partyLedger", label: "Party Ledger Report" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "trialBalance" && (
        <TrialBalanceView accounts={tbAccounts} summary={tbSummary} loading={loading} />
      )}

      {activeTab === "profitLoss" && (
        <ProfitLossWidget />
      )}

      {activeTab === "partyLedger" && (
        <PartyLedgerReportView />
      )}
    </div>
  );
}
