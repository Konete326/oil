import { useState, useEffect } from "react";
import { fetchSupplierDetailApi, fetchSupplierLedgerApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CloudLoader } from "@/components/ui/cloud-loader";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import {
  XIcon,
  TruckIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  WalletIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ClockIcon,
} from "lucide-react";

export function SupplierDetailModal({ isOpen, onClose, supplier }) {
  const [data, setData] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    if (isOpen && supplier?._id) {
      setLoading(true);
      Promise.all([
        fetchSupplierDetailApi(supplier._id),
        fetchSupplierLedgerApi(supplier._id),
      ])
        .then(([detailRes, ledgerRes]) => {
          if (detailRes?.data?.supplier) {
            setData(detailRes.data.supplier);
          } else {
            setData(supplier);
          }
          if (ledgerRes?.data) {
            setLedgerEntries(ledgerRes.data);
          } else if (detailRes?.data?.ledgerEntries) {
            setLedgerEntries(detailRes.data.ledgerEntries);
          }
          setLoading(false);
        })
        .catch(() => {
          setData(supplier);
          setLoading(false);
        });
    }
  }, [isOpen, supplier]);

  if (!isOpen || !supplier) return null;

  const currentSup = data || supplier;

  const totalPurchases = ledgerEntries
    .filter((e) => e.transactionType?.includes("Purchase") || (e.debit && e.debit > 0))
    .reduce((sum, e) => sum + (Number(e.amount || e.debit) || 0), 0);

  const totalPayments = ledgerEntries
    .filter((e) => e.transactionType?.includes("Payment") || (e.credit && e.credit > 0))
    .reduce((sum, e) => sum + (Number(e.amount || e.credit) || 0), 0);

  const handleExportExcel = () => {
    const rows = ledgerEntries.map((e, idx) => ({
      "S.No": idx + 1,
      Date: new Date(e.createdAt || e.date).toLocaleDateString(),
      "Transaction Type": e.transactionType || e.type,
      "Debit / Purchase (PKR)": e.debit || (e.transactionType?.includes("Purchase") ? e.amount : 0),
      "Credit / Paid (PKR)": e.credit || (e.transactionType?.includes("Payment") ? e.amount : 0),
      "Running Balance (PKR)": e.runningBalance,
      "Payment Mode": e.paymentMode || "Cash",
      Reference: e.referenceNumber || e.reference || "-",
    }));
    exportTransactionsToExcel(rows, `${currentSup.name}_Supplier_Ledger.xlsx`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-primary/5 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                <TruckIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5 truncate">
                  <span>{currentSup.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-500 font-mono font-medium shrink-0">
                    Vendor
                  </span>
                </h3>
                <p className="text-[10.5px] text-muted-foreground truncate">
                  {currentSup.phone ? `Phone: ${currentSup.phone}` : "No phone"} | {currentSup.address || "Address not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1 cursor-pointer text-[11px] h-7 px-2"
              >
                <FileSpreadsheetIcon className="size-3 text-emerald-500" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button
                onClick={() => setIsPrintOpen(true)}
                size="sm"
                className="gap-1 cursor-pointer text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5"
              >
                <PrinterIcon className="size-3" />
                <span>Statement</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={onClose} className="size-7 cursor-pointer">
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <CloudLoader label="Loading vendor transactions..." />
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ArrowUpRightIcon className="size-3 text-amber-500" /> Purchases
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    Rs. {totalPurchases.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ArrowDownLeftIcon className="size-3 text-emerald-500" /> Payments
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    Rs. {totalPayments.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 space-y-0.5">
                  <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                    <WalletIcon className="size-3 text-rose-500" /> Net Balance Owed
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-rose-500">
                    Rs. {(currentSup.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ClockIcon className="size-3 text-primary" /> Total Entries
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    {ledgerEntries.length} Records
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <h4 className="font-semibold text-[11px] text-foreground uppercase tracking-wider">
                    Ledger Transactions History
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {ledgerEntries.length} Records
                  </span>
                </div>

                <div className="rounded-xl border border-border overflow-hidden max-h-[220px] overflow-y-auto shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted/95 backdrop-blur-xs text-muted-foreground uppercase text-[9.5px] tracking-wider z-10 border-b border-border/80">
                      <tr>
                        <th className="py-2 px-2.5 ps-3 font-semibold">Date</th>
                        <th className="py-2 px-2 font-semibold">Type</th>
                        <th className="py-2 px-2 text-right font-semibold">Amount (PKR)</th>
                        <th className="py-2 px-2 text-right font-semibold">Running Balance</th>
                        <th className="py-2 px-2 font-semibold">Payment Mode</th>
                        <th className="py-2 px-2.5 pe-3 font-semibold text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-sans">
                      {ledgerEntries.length > 0 ? (
                        ledgerEntries.map((entry, idx) => (
                          <tr key={entry._id || idx} className="hover:bg-muted/15 transition-colors">
                            <td className="py-1.5 px-2.5 ps-3 text-muted-foreground text-[10.5px]">
                              {new Date(entry.createdAt || entry.date).toLocaleDateString()}
                            </td>
                            <td className="py-1.5 px-2 font-semibold text-foreground">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-semibold border ${
                                  entry.transactionType?.includes("Purchase")
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                }`}
                              >
                                {entry.transactionType || entry.type}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-foreground text-xs">
                              Rs. {(entry.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-rose-500 text-xs">
                              Rs. {(entry.runningBalance || 0).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-2 text-[10.5px]">
                              {entry.bankAccountName || (entry.paymentMode && entry.paymentMode.toLowerCase().includes("bank")) ? (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Bank ({entry.bankAccountName ? entry.bankAccountName.split("-")[0].trim() : entry.bankName || "Transfer"})
                                </span>
                              ) : entry.paymentMode === "Cheque" ? (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Cheque
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-muted text-muted-foreground border border-border/60">
                                  {entry.paymentMode || "Cash"}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 pe-3 text-right text-muted-foreground text-[10.5px]">
                              {entry.referenceNumber || entry.reference || entry.notes || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                            No ledger transactions recorded for this supplier.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPrintOpen && (
        <CustomerPrintStatement
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          customer={{
            name: currentSup.name,
            phone: currentSup.phone || "-",
            address: currentSup.address || "Supplier Depot",
            city: "Karachi",
            openingBalance: 0,
          }}
          ledgerEntries={ledgerEntries}
        />
      )}
    </>
  );
}
