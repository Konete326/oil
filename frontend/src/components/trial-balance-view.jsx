import { useState, useMemo } from "react";
import {
  ScaleIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  FileSpreadsheetIcon,
  PrinterIcon,
  UsersIcon,
  EyeIcon,
  SearchIcon,
  Building2Icon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  FilterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrialBalancePrintModal } from "@/components/trial-balance-print-modal";
import { SupplierTrialSheetModal } from "@/components/supplier-trial-sheet-modal";
import { CustomerTrialSheetModal } from "@/components/customer-trial-sheet-modal";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function TrialBalanceView({
  accounts = [],
  summary = {},
  suppliersTrial = [],
  customersTrial = [],
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedSupplierForTrial, setSelectedSupplierForTrial] = useState(null);
  const [selectedCustomerForTrial, setSelectedCustomerForTrial] = useState(null);

  const displayedAccounts = useMemo(() => {
    if (activeTab === "all" || activeTab === "suppliers" || activeTab === "customers") return accounts;
    return accounts.filter((a) => a.category?.toLowerCase() === activeTab.toLowerCase());
  }, [accounts, activeTab]);

  const displayedSummary = useMemo(() => {
    if (activeTab === "all" || activeTab === "suppliers" || activeTab === "customers") return summary;
    const totalDebit = displayedAccounts.reduce((sum, a) => sum + (Number(a.debit) || 0), 0);
    const totalCredit = displayedAccounts.reduce((sum, a) => sum + (Number(a.credit) || 0), 0);
    return {
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit,
    };
  }, [displayedAccounts, activeTab, summary]);

  const filteredSuppliers = useMemo(() => {
    return suppliersTrial.filter((s) => {
      const q = supplierSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.name || "").toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q);

      if (supplierFilter === "payable") return matchesSearch && (s.currentBalance || 0) > 0;
      if (supplierFilter === "cleared") return matchesSearch && (s.currentBalance || 0) <= 0;
      return matchesSearch;
    });
  }, [suppliersTrial, supplierSearch, supplierFilter]);

  const totalSupplierPurchases = useMemo(
    () => suppliersTrial.reduce((sum, s) => sum + (Number(s.totalPurchases || s.credit) || 0), 0),
    [suppliersTrial]
  );
  const totalSupplierPayments = useMemo(
    () => suppliersTrial.reduce((sum, s) => sum + (Number(s.totalPaid || s.debit) || 0), 0),
    [suppliersTrial]
  );
  const totalSupplierPayables = useMemo(
    () => suppliersTrial.reduce((sum, s) => sum + (Number(s.currentBalance) || 0), 0),
    [suppliersTrial]
  );

  const filteredCustomers = useMemo(() => {
    return customersTrial.filter((c) => {
      const q = customerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q);

      if (customerFilter === "receivable") return matchesSearch && (c.currentBalance || 0) > 0;
      if (customerFilter === "cleared") return matchesSearch && (c.currentBalance || 0) <= 0;
      return matchesSearch;
    });
  }, [customersTrial, customerSearch, customerFilter]);

  const totalCustomerSales = useMemo(
    () => customersTrial.reduce((sum, c) => sum + (Number(c.totalSales || c.debit) || 0), 0),
    [customersTrial]
  );
  const totalCustomerPayments = useMemo(
    () => customersTrial.reduce((sum, c) => sum + (Number(c.totalPaid || c.credit) || 0), 0),
    [customersTrial]
  );
  const totalCustomerReceivables = useMemo(
    () => customersTrial.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0),
    [customersTrial]
  );

  const handleExportExcel = () => {
    if (activeTab === "customers") {
      const data = filteredCustomers.map((c, idx) => ({
        "Sr #": idx + 1,
        "Customer Code": c.code || `CUST-${101 + idx}`,
        "Customer Name": c.name,
        Phone: c.phone || "-",
        City: c.city || "-",
        Type: c.customerType || "Retail",
        "Kul Maal Liya / Debit (PKR)": Number(c.totalSales || c.debit || 0),
        "Kul Wasooli / Credit (PKR)": Number(c.totalPaid || c.credit || 0),
        "Baqaya Lena Hai (PKR)": Number(c.currentBalance || 0),
        Status: (c.currentBalance || 0) > 0 ? "RECEIVABLE" : "CLEARED",
      }));

      data.push({
        "Sr #": "TOTAL",
        "Customer Code": "TOTALS",
        "Customer Name": "Total Across Customers",
        Phone: "-",
        City: "-",
        Type: "-",
        "Kul Maal Liya / Debit (PKR)": totalCustomerSales,
        "Kul Wasooli / Credit (PKR)": totalCustomerPayments,
        "Baqaya Lena Hai (PKR)": totalCustomerReceivables,
        Status: "SUMMARY",
      });

      exportTransactionsToExcel(data, "Customers_Trial_Balance_Sheet.xlsx");
      return;
    }

    if (activeTab === "suppliers") {
      const data = filteredSuppliers.map((s, idx) => ({
        "Sr #": idx + 1,
        "Supplier Code": s.code || `SUP-${101 + idx}`,
        "Supplier Name": s.name,
        Phone: s.phone || "-",
        Address: s.address || "-",
        "Kul Maal Khareeda / Credit (PKR)": Number(s.totalPurchases || s.credit || 0),
        "Kul Adaigi Ki / Debit (PKR)": Number(s.totalPaid || s.debit || 0),
        "Baqaya Udhar / Dena Hai (PKR)": Number(s.currentBalance || 0),
        Status: (s.currentBalance || 0) > 0 ? "PAYABLE" : "CLEARED",
      }));

      data.push({
        "Sr #": "TOTAL",
        "Supplier Code": "TOTALS",
        "Supplier Name": "Total Across Suppliers",
        Phone: "-",
        Address: "-",
        "Kul Maal Khareeda / Credit (PKR)": totalSupplierPurchases,
        "Kul Adaigi Ki / Debit (PKR)": totalSupplierPayments,
        "Baqaya Udhar / Dena Hai (PKR)": totalSupplierPayables,
        Status: "SUMMARY",
      });

      exportTransactionsToExcel(data, "Suppliers_Trial_Balance_Sheet.xlsx");
      return;
    }

    const data = displayedAccounts.map((a) => ({
      "Account Code": a.code,
      "Account Title": a.accountName,
      Category: a.category,
      "Debit (PKR)": a.debit,
      "Credit (PKR)": a.credit,
    }));

    data.push({
      "Account Code": "TOTAL",
      "Account Title": `Grand Total (${activeTab.toUpperCase()})`,
      Category: displayedSummary.isBalanced ? "BALANCED" : "UNBALANCED",
      "Debit (PKR)": displayedSummary.totalDebit || 0,
      "Credit (PKR)": displayedSummary.totalCredit || 0,
    });

    exportTransactionsToExcel(data, `Trial_Balance_${activeTab.toUpperCase()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ScaleIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Trial Balance Sheet (Khatey Ka Tawazun)
            </h3>
            <p className="text-xs text-muted-foreground">
              Property-wise Trial Balance & Har Supplier Ki Alag-Alag Trial Sheet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
              displayedSummary.isBalanced
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
            }`}
          >
            {displayedSummary.isBalanced ? (
              <CheckCircle2Icon className="size-3.5" />
            ) : (
              <AlertCircleIcon className="size-3.5" />
            )}
            <span>
              {activeTab === "suppliers"
                ? `${suppliersTrial.length} Suppliers Active`
                : displayedSummary.isBalanced
                ? "Accounts Balanced"
                : "Balance Difference"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs cursor-pointer h-8"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          {activeTab !== "suppliers" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="gap-1.5 text-xs cursor-pointer h-8"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print Sheet</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center border-b border-border overflow-x-auto gap-1">
        {[
          { id: "all", label: "All Accounts" },
          { id: "asset", label: "Assets" },
          { id: "liability", label: "Liabilities" },
          { id: "revenue", label: "Revenue" },
          { id: "expense", label: "Expenses" },
          {
            id: "customers",
            label: "Customer Trial Balance",
            count: customersTrial.length,
          },
          {
            id: "suppliers",
            label: "Supplier Trial Balance",
            count: suppliersTrial.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === "customers" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Kul Customers</span>
                <UsersIcon className="size-3.5 text-primary" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                {customersTrial.length} Parties
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Registered buyers &amp; mills
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs mb-1">
                <span>Kul Maal Liya (Debit)</span>
                <ArrowDownLeftIcon className="size-3.5" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                Rs. {totalCustomerSales.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Total invoiced sales
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs mb-1">
                <span>Kul Wasooli (Credit)</span>
                <ArrowUpRightIcon className="size-3.5" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                Rs. {totalCustomerPayments.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Total payments recovered
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs mb-1">
                <span>Baqaya Lena Hai (Udhar)</span>
                <ScaleIcon className="size-3.5" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-500">
                Rs. {totalCustomerReceivables.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Current net receivables
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-card p-2 rounded-xl border border-border">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customer name, code, phone, city..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="ps-8 text-xs h-8 bg-muted/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <FilterIcon className="size-3.5 text-muted-foreground shrink-0" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground cursor-pointer focus:outline-none"
              >
                <option value="all">All Customers ({customersTrial.length})</option>
                <option value="receivable">Udhar Baqaya (Receivable)</option>
                <option value="cleared">Hisab Clear (Zero Due)</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 ps-4">Code</th>
                    <th className="p-3">Customer Name &amp; Contact</th>
                    <th className="p-3 text-right">Total Purchases (Debit)</th>
                    <th className="p-3 text-right">Total Received (Credit)</th>
                    <th className="p-3 text-right">Net Receivable (Due)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pe-4 text-right">Individual Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading customer trial sheets...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No customer records found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c._id || c.code} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 ps-4 font-mono text-muted-foreground font-semibold">
                          {c.code}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Building2Icon className="size-3 text-primary shrink-0" />
                            <span>{c.name}</span>
                          </div>
                          {(c.phone || c.city) && (
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {[c.phone, c.city].filter(Boolean).join(" • ")}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-blue-500">
                          Rs. {(c.totalSales || c.debit || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-500">
                          Rs. {(c.totalPaid || c.credit || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-500">
                          Rs. {(c.currentBalance || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-semibold ${
                              (c.currentBalance || 0) > 0
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            }`}
                          >
                            {(c.currentBalance || 0) > 0 ? "Receivable" : "Clear"}
                          </span>
                        </td>
                        <td className="p-3 pe-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomerForTrial(c)}
                            className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium"
                            title="Customer Individual Trial Balance Sheet & PDF Print"
                          >
                            <ScaleIcon className="size-3 text-amber-600" />
                            <span>Trial Sheet (PDF)</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}

                  <tr className="bg-muted/40 font-bold border-t-2 border-border text-xs">
                    <td colSpan={2} className="p-3 ps-4 text-foreground uppercase tracking-wider">
                      Grand Total (Customers Khata Summary)
                    </td>
                    <td className="p-3 text-right font-mono text-blue-500">
                      Rs. {totalCustomerSales.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-500">
                      Rs. {totalCustomerPayments.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-500">
                      Rs. {totalCustomerReceivables.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "suppliers" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                <span>Kul Suppliers</span>
                <UsersIcon className="size-3.5 text-primary" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                {suppliersTrial.length} Parties
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Registered vendors
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs mb-1">
                <span>Kul Maal Khareeda (Credit)</span>
                <ArrowDownLeftIcon className="size-3.5" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                Rs. {totalSupplierPurchases.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Total stock billed
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs mb-1">
                <span>Total Payments (Debit)</span>
                <ArrowUpRightIcon className="size-3.5" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                Rs. {totalSupplierPayments.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Total paid out
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs mb-1">
                <span>Total Payable (Due)</span>
                <ScaleIcon className="size-3.5" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-500">
                Rs. {totalSupplierPayables.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Current net dues
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-card p-2 rounded-xl border border-border">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search supplier name, code, phone..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="ps-8 text-xs h-8 bg-muted/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <FilterIcon className="size-3.5 text-muted-foreground shrink-0" />
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground cursor-pointer focus:outline-none"
              >
                <option value="all">All Suppliers ({suppliersTrial.length})</option>
                <option value="payable">Net Payable (Due)</option>
                <option value="cleared">Cleared (Zero Due)</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 ps-4">Code</th>
                    <th className="p-3">Supplier Name & Contact</th>
                    <th className="p-3 text-right">Total Purchases (Credit)</th>
                    <th className="p-3 text-right">Total Payments (Debit)</th>
                    <th className="p-3 text-right">Net Payable (Due)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pe-4 text-right">Individual Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading supplier trial sheets...
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No supplier records found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s._id || s.code} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 ps-4 font-mono text-muted-foreground font-semibold">
                          {s.code}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Building2Icon className="size-3 text-primary shrink-0" />
                            <span>{s.name}</span>
                          </div>
                          {s.phone && (
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {s.phone}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-blue-500">
                          Rs. {(s.totalPurchases || s.credit || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-500">
                          Rs. {(s.totalPaid || s.debit || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-500">
                          Rs. {(s.currentBalance || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-semibold ${
                              (s.currentBalance || 0) > 0
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            }`}
                          >
                            {(s.currentBalance || 0) > 0 ? "Payable" : "Clear"}
                          </span>
                        </td>
                        <td className="p-3 pe-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSupplierForTrial(s)}
                            className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium"
                            title="Supplier Individual Trial Balance Sheet & PDF Print"
                          >
                            <ScaleIcon className="size-3 text-amber-600" />
                            <span>Trial Sheet (PDF)</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}

                  <tr className="bg-muted/40 font-bold border-t-2 border-border text-xs">
                    <td colSpan={2} className="p-3 ps-4 text-foreground uppercase tracking-wider">
                      Grand Total (Suppliers Khata Summary)
                    </td>
                    <td className="p-3 text-right font-mono text-blue-500">
                      Rs. {totalSupplierPurchases.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-500">
                      Rs. {totalSupplierPayments.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-500">
                      Rs. {totalSupplierPayables.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 ps-4">Account Code</th>
                  <th className="p-3">Account Title / Description</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Debit Balance (PKR)</th>
                  <th className="p-3 pe-4 text-right">Credit Balance (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Generating trial balance sheet...
                    </td>
                  </tr>
                ) : displayedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No account records available for this classification.
                    </td>
                  </tr>
                ) : (
                  <>
                    {displayedAccounts.map((acc) => (
                      <tr key={acc.code} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 ps-4 font-mono text-muted-foreground">{acc.code}</td>
                        <td className="p-3 font-semibold text-foreground">{acc.accountName}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            {acc.category}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-500">
                          {acc.debit > 0 ? `Rs. ${acc.debit.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 pe-4 text-right font-mono font-medium text-amber-500">
                          {acc.credit > 0 ? `Rs. ${acc.credit.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-muted/40 font-bold border-t-2 border-border text-sm">
                      <td
                        colSpan={3}
                        className="p-3 ps-4 text-foreground uppercase tracking-wider text-xs"
                      >
                        Total ({activeTab.toUpperCase()})
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-500">
                        Rs. {(displayedSummary.totalDebit || 0).toLocaleString()}
                      </td>
                      <td className="p-3 pe-4 text-right font-mono text-amber-500">
                        Rs. {(displayedSummary.totalCredit || 0).toLocaleString()}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TrialBalancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        accounts={displayedAccounts}
        summary={displayedSummary}
      />

      <SupplierTrialSheetModal
        isOpen={Boolean(selectedSupplierForTrial)}
        onClose={() => setSelectedSupplierForTrial(null)}
        supplier={selectedSupplierForTrial}
      />

      <CustomerTrialSheetModal
        isOpen={Boolean(selectedCustomerForTrial)}
        onClose={() => setSelectedCustomerForTrial(null)}
        customer={selectedCustomerForTrial}
      />
    </div>
  );
}
