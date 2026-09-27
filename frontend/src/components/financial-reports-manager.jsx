import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TrialBalanceView } from "@/components/trial-balance-view";
import { ProfitLossWidget } from "@/components/profit-loss-widget";
import { PartyLedgerReportView } from "@/components/party-ledger-report-view";
import { MasterPlatformReportView } from "@/components/master-platform-report-view";
import { fetchTrialBalanceApi } from "@/lib/api";

export function FinancialReportsManager() {
  const [activeTab, setActiveTab] = useState("masterReport");
  const [tbAccounts, setTbAccounts] = useState([]);
  const [tbSummary, setTbSummary] = useState({});
  const [tbSuppliers, setTbSuppliers] = useState([]);
  const [tbCustomers, setTbCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await fetchTrialBalanceApi();
      if (res?.success) {
        setTbAccounts(res.data || []);
        setTbSummary(res.summary || {});
        setTbSuppliers(res.suppliersTrial || []);
        setTbCustomers(res.customersTrial || []);
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial & Platform Reports</h1>
          <p className="text-xs text-muted-foreground">Consolidated Master Platform Report, Trial Balance Sheet, Profit & Loss, and Party Khatas.</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max pb-1">
          {[
            { id: "masterReport", label: "Master Platform Report" },
            { id: "trialBalance", label: "Trial Balance Sheet" },
            { id: "profitLoss", label: "Profit & Loss Statement" },
            { id: "partyLedger", label: "Party Ledger Report" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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

      {activeTab === "masterReport" && (
        <MasterPlatformReportView />
      )}

      {activeTab === "trialBalance" && (
        <TrialBalanceView
          accounts={tbAccounts}
          summary={tbSummary}
          suppliersTrial={tbSuppliers}
          customersTrial={tbCustomers}
          loading={loading}
        />
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
