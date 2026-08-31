import { useState, useEffect } from "react";
import { SearchIcon, BookOpenIcon, PrinterIcon, FileSpreadsheetIcon, CalendarIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDetailedPartyLedgerApi, fetchMills, fetchSuppliersApi } from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { COMPANY_CONFIG } from "@/lib/company-config";

const PAGE_SIZE = 10;

export function PartyLedgerReportView() {
  const [partyType, setPartyType] = useState("Customer");
  const [partyName, setPartyName] = useState("");
  const [partiesList, setPartiesList] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    async function loadParties() {
      try {
        if (partyType === "Customer") {
          const res = await fetchMills();
          const items = res?.data || res || [];
          setPartiesList(items.map(m => m.name));
          if (items.length > 0 && !partyName) setPartyName(items[0].name);
        } else {
          const res = await fetchSuppliersApi();
          const items = res?.data || res || [];
          setPartiesList(items.map(s => s.name));
          if (items.length > 0 && !partyName) setPartyName(items[0].name);
        }
      } catch (err) {
        console.error("Error loading parties list", err);
      }
    }
    loadParties();
  }, [partyType]);

  const handleSearch = async () => {
    if (!partyName) {
      toast.error("Please enter or select a party name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchDetailedPartyLedgerApi({
        partyName,
        partyType,
        startDate,
        endDate,
      });
      const entries = res?.data || res?.ledger || res || [];
      setLedgerData(Array.isArray(entries) ? entries : []);
      setPage(1);
    } catch (err) {
      toast.error("Failed to load party ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partyName) {
      handleSearch();
    }
  }, [partyName, partyType]);

  let runningBalance = 0;
  const processedRows = ledgerData.map((row) => {
    const isDebit = row.type === "debit" || row.transactionType?.toLowerCase().includes("debit") || (row.debit && row.debit > 0);
    const debit = isDebit ? Number(row.amount || row.debit || 0) : 0;
    const credit = !isDebit ? Number(row.amount || row.credit || 0) : 0;
    runningBalance += (debit - credit);

    return {
      ...row,
      dateFormatted: new Date(row.createdAt || row.date || Date.now()).toLocaleDateString("en-GB"),
      docNo: row.referenceNo || row.voucherNumber || row.saleNumber || row.purchaseNumber || row._id?.slice(-6) || "-",
      debit,
      credit,
      balance: runningBalance,
    };
  });

  const totalDebit = processedRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = processedRows.reduce((sum, r) => sum + r.credit, 0);
  const closingBalance = runningBalance;

  const handleExportExcel = () => {
    if (processedRows.length === 0) {
      toast.error("No ledger rows to export");
      return;
    }

    const data = processedRows.map((r, idx) => ({
      "Sr #": idx + 1,
      "Date": r.dateFormatted,
      "Document #": r.docNo,
      "Description / Particulars": r.description || r.notes || "-",
      "Debit (PKR)": r.debit,
      "Credit (PKR)": r.credit,
      "Running Balance (PKR)": r.balance,
    }));

    exportTransactionsToExcel(data, `${partyName}_Detailed_Ledger.xlsx`);
    toast.success("Party ledger exported to Excel!");
  };

  const handleShareWhatsApp = () => {
    if (!partyName) return;
    const text = `*${COMPANY_CONFIG.name} - ${partyType.toUpperCase()} LEDGER STATEMENT*\n*Party Name:* ${partyName}\n*Total Debits:* Rs ${totalDebit.toLocaleString()}\n*Total Credits:* Rs ${totalCredit.toLocaleString()}\n*Closing Balance:* Rs ${closingBalance.toLocaleString()}\n*Proprietor:* ${COMPANY_CONFIG.proprietor}\n*Contact:* ${COMPANY_CONFIG.mobiles}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/40 text-xs">
            <button
              onClick={() => setPartyType("Customer")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                partyType === "Customer"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer / Mill Ledger
            </button>
            <button
              onClick={() => setPartyType("Supplier")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                partyType === "Supplier"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Supplier / Refinery Ledger
            </button>
          </div>

          <select
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {partiesList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
            <CalendarIcon className="size-3.5" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-foreground outline-none text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-foreground outline-none text-xs"
            />
          </div>

          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Share on WhatsApp
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs cursor-pointer">
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(true)} className="gap-1.5 text-xs cursor-pointer">
            <PrinterIcon className="size-3.5" />
            <span>Print Statement</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Debits</span>
          <div className="text-xl font-bold font-mono text-emerald-500">
            Rs. {totalDebit.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Billed / Payments Paid</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Credits</span>
          <div className="text-xl font-bold font-mono text-amber-500">
            Rs. {totalCredit.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Payments Received / Purchases</p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Closing Running Balance</span>
          <div className="text-xl font-bold font-mono text-primary">
            Rs. {closingBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Current Net Balance Owed</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/30 font-semibold text-xs text-foreground flex items-center justify-between">
          <span>{partyName} — Detailed Khata Ledger Statement</span>
          <span className="text-muted-foreground font-mono text-[11px]">{ledgerData.length} Total Ledger Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Date</th>
                <th className="p-3">Particulars / Transaction Type</th>
                <th className="p-3 text-right">Debit (PKR)</th>
                <th className="p-3 text-right">Credit (PKR)</th>
                <th className="p-3 text-right">Running Balance (PKR)</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 pe-4">Ref No / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading party ledger details...
                  </td>
                </tr>
              ) : ledgerData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No ledger entries found for this party.
                  </td>
                </tr>
              ) : (
                ledgerData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item, idx) => (
                  <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-semibold text-foreground">{item.type}</td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-500">
                      {item.debit > 0 ? `Rs. ${item.debit.toLocaleString()}` : "-"}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-amber-500">
                      {item.credit > 0 ? `Rs. ${item.credit.toLocaleString()}` : "-"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      Rs. {item.runningBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{item.mode || "Cash"}</td>
                    <td className="p-3 pe-4 text-muted-foreground text-[11px]">
                      {item.reference || item.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={Math.ceil(ledgerData.length / PAGE_SIZE) || 1}
          totalItems={ledgerData.length}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <CustomerPrintStatement
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        customer={{ name: partyName, city: "KARACHI", openingBalance: 0 }}
        ledgerEntries={ledgerData}
      />
    </div>
  );
}
