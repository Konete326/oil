import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  XIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  Building2Icon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ScaleIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ReceiptIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OilDropLogo } from "@/components/logo";
import { fetchDetailedPartyLedgerApi } from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function SupplierTrialSheetModal({ isOpen, onClose, supplier }) {
  const [loading, setLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (!isOpen || !supplier?.name) {
      setLedgerEntries([]);
      return;
    }
    loadSupplierLedger();
  }, [isOpen, supplier]);

  const loadSupplierLedger = async () => {
    setLoading(true);
    try {
      const res = await fetchDetailedPartyLedgerApi({
        partyName: supplier.name,
        partyType: "Supplier",
      });
      if (res?.success && Array.isArray(res.data)) {
        setLedgerEntries(res.data);
      } else {
        setLedgerEntries([]);
      }
    } catch {
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !supplier || typeof window === "undefined") return null;

  const totalCredit = ledgerEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0) || Number(supplier.totalPurchases || supplier.credit || 0);
  const totalDebit = ledgerEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0) || Number(supplier.totalPaid || supplier.debit || 0);
  const currentPayable = Number(supplier.currentBalance ?? (totalCredit - totalDebit));

  const filteredEntries = ledgerEntries.filter((item) => {
    const matchesSearch =
      (item.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.mode || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "purchases") return matchesSearch && Number(item.credit) > 0;
    if (filterType === "payments") return matchesSearch && Number(item.debit) > 0;
    return matchesSearch;
  });

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Supplier_Trial_Balance_${supplier.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const rows = filteredEntries.map((e, idx) => ({
      "Sr #": idx + 1,
      Date: new Date(e.date).toLocaleDateString(),
      "Transaction Type": e.type,
      Reference: e.reference || "-",
      "Payment Mode": e.mode || "-",
      "Debit / Payment (PKR)": Number(e.debit || 0),
      "Credit / Maal Purchase (PKR)": Number(e.credit || 0),
      "Running Balance (PKR)": Number(e.runningBalance || 0),
      Remarks: e.notes || "-",
    }));

    rows.push({
      "Sr #": "TOTAL",
      Date: "-",
      "Transaction Type": "Grand Totals",
      Reference: "-",
      "Payment Mode": "-",
      "Debit / Payment (PKR)": totalDebit,
      "Credit / Maal Purchase (PKR)": totalCredit,
      "Running Balance (PKR)": currentPayable,
      Remarks: `Net Balance Payable: Rs. ${currentPayable.toLocaleString()}`,
    });

    exportTransactionsToExcel(
      rows,
      `Trial_Sheet_${supplier.name.replace(/\s+/g, "_")}.xlsx`
    );
  };

  return createPortal(
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto animate-in fade-in duration-150">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-portal, .print-portal * { visibility: visible !important; }
          .print-portal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          .print-header { border-bottom: 2px solid #000 !important; margin-bottom: 12px !important; padding-bottom: 8px !important; }
          .print-table { width: 100% !important; border-collapse: collapse !important; }
          .print-table th, .print-table td { border: 1px solid #333 !important; padding: 6px 8px !important; color: #000 !important; }
          .print-table th { background-color: #f0f0f0 !important; font-weight: bold !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-badge { border: 1px solid #000 !important; color: #000 !important; }
        }
      `}</style>

      <div className="relative w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 print-card animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b pb-3 print-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <OilDropLogo className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Supplier Individual Trial Balance Sheet
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {supplier.code || "SUPPLIER"}
                </Badge>
                <Badge
                  className={`text-[10px] font-semibold ${
                    currentPayable > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {currentPayable > 0 ? "Udhar Baqaya (Payable)" : "Hisab Barabar (Cleared)"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Al-Khaleej Lubricants — Makhsoos Supplier Ka Mukammal Khata wa Trial Tawazun.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print Sheet</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/70 text-xs">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2Icon className="size-3.5 text-primary" />
              Supplier Profile
            </div>
            <div className="font-bold text-sm text-foreground">{supplier.name}</div>
            {supplier.phone && (
              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <PhoneIcon className="size-3" />
                {supplier.phone}
              </div>
            )}
            {supplier.address && (
              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <MapPinIcon className="size-3" />
                {supplier.address}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-blue-500" />
              Statement Information
            </div>
            <div className="text-foreground">
              Statement Date: <span className="font-semibold">{new Date().toLocaleDateString("en-GB")}</span>
            </div>
            <div className="text-muted-foreground text-[11px]">
              Total Records: {ledgerEntries.length} Ledger Postings
            </div>
            <div className="text-muted-foreground text-[11px]">
              Currency: PKR (Pakistani Rupee)
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ReceiptIcon className="size-3.5 text-emerald-500" />
              Closing Balance Status
            </div>
            <div className="text-sm font-extrabold font-mono text-amber-500">
              Rs. {currentPayable.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {currentPayable > 0 ? "Total payable remaining to be paid." : "All supplier dues cleared."}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <span className="text-xs font-semibold">Kul Maal Khareeda (Credit)</span>
              <ArrowDownLeftIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
              Rs. {totalCredit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Total Purchases / Stock Inflow
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Kul Adaigi Ki (Debit)</span>
              <ArrowUpRightIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
              Rs. {totalDebit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Total Payments Made (Cash/Bank)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-xs font-semibold">Khatmi Udhar / Dena Hai (Balance)</span>
              <ScaleIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-500">
              Rs. {currentPayable.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Net Balance Dues (Credit - Debit)
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 no-print pt-1">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/80 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Records ({ledgerEntries.length})
            </button>
            <button
              onClick={() => setFilterType("purchases")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "purchases" ? "bg-background text-blue-500 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Purchases (Maal)
            </button>
            <button
              onClick={() => setFilterType("payments")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "payments" ? "bg-background text-emerald-500 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Payments (Adaigi)
            </button>
          </div>

          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search reference, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs h-8 bg-muted/30"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[42vh] print:max-h-none">
            <table className="w-full text-left text-xs print-table">
              <thead className="bg-muted/60 sticky top-0 border-b border-border font-medium text-muted-foreground uppercase text-[10.5px] tracking-wider z-10">
                <tr>
                  <th className="p-2.5 ps-3 w-10">#</th>
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Transaction Type</th>
                  <th className="p-2.5">Ref / Inv No.</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Debit (Adaigi)</th>
                  <th className="p-2.5 text-right text-blue-600 dark:text-blue-400">Credit (Maal)</th>
                  <th className="p-2.5 pe-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading supplier trial balance postings...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No matching transaction entries found for this supplier.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => (
                    <tr key={e._id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 ps-3 font-mono text-muted-foreground text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-muted-foreground text-[11px]">
                        {new Date(e.date).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            e.type?.includes("Purchase")
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {e.type}
                        </span>
                        {e.notes && <div className="text-[10px] text-muted-foreground truncate max-w-xs">{e.notes}</div>}
                      </td>
                      <td className="p-2.5 font-mono text-muted-foreground text-[11px]">
                        {e.reference || "-"}
                      </td>
                      <td className="p-2.5 text-muted-foreground text-[11px]">{e.mode || "Cash"}</td>
                      <td className="p-2.5 text-right font-mono font-medium text-emerald-500">
                        {Number(e.debit) > 0 ? `Rs. ${Number(e.debit).toLocaleString()}` : "-"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-blue-500">
                        {Number(e.credit) > 0 ? `Rs. ${Number(e.credit).toLocaleString()}` : "-"}
                      </td>
                      <td className="p-2.5 pe-3 text-right font-mono font-bold text-foreground">
                        Rs. {Number(e.runningBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="bg-muted/50 font-bold border-t-2 border-border text-xs">
                  <td colSpan={5} className="p-2.5 ps-3 text-foreground uppercase tracking-wider">
                    Total Trial Balance (Supplier Summary)
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-500">
                    Rs. {totalDebit.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono text-blue-500">
                    Rs. {totalCredit.toLocaleString()}
                  </td>
                  <td className="p-2.5 pe-3 text-right font-mono text-amber-500">
                    Rs. {currentPayable.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            {currentPayable === 0 ? (
              <>
                <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Supplier accounts are balanced. No pending liabilities.</span>
              </>
            ) : (
              <>
                <AlertCircleIcon className="size-3.5 text-amber-500 shrink-0" />
                <span>Net liability payable of Rs. {currentPayable.toLocaleString()} to {supplier.name}.</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-4 cursor-pointer"
            >
              Close
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-4 gap-1.5 cursor-pointer"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print Supplier Trial Sheet</span>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
