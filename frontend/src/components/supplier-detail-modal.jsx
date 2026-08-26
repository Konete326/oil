import { useState, useEffect } from "react";
import { fetchSupplierDetailApi, fetchSupplierLedgerApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CloudLoader } from "@/components/ui/cloud-loader";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import {
  XIcon,
  TruckIcon,
  PhoneIcon,
  MapPinIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  Building2Icon,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                <TruckIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  {currentSup.name}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-mono font-medium">
                    Vendor / Refinery
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentSup.phone ? `Phone: ${currentSup.phone}` : "No phone registered"} | {currentSup.address || "Address not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
                <span>Export Excel</span>
              </Button>

              <Button
                onClick={() => setIsPrintOpen(true)}
                size="sm"
                className="gap-1.5 cursor-pointer text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PrinterIcon className="size-3.5" />
                <span>Print A4 Statement</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={onClose} className="size-8 cursor-pointer">
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <CloudLoader label="Loading vendor transactions & ledger history..." />
            </div>
          ) : (
            <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ArrowUpRightIcon className="size-3.5 text-amber-500" /> Total Purchases
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    Rs. {totalPurchases.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ArrowDownLeftIcon className="size-3.5 text-emerald-500" /> Total Payments Paid
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    Rs. {totalPayments.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1">
                  <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                    <WalletIcon className="size-3.5 text-rose-500" /> Net Balance Owed
                  </span>
                  <div className="text-base font-bold font-mono text-rose-500">
                    Rs. {(currentSup.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ClockIcon className="size-3.5 text-primary" /> Total Entries
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    {ledgerEntries.length} Transactions
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                    Supplier Khata Ledger Transactions
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Showing all chronological records
                  </span>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 ps-4">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Amount (PKR)</th>
                        <th className="p-3 text-right">Running Balance</th>
                        <th className="p-3">Payment Mode</th>
                        <th className="p-3 pe-4">Ref No / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ledgerEntries.length > 0 ? (
                        ledgerEntries.map((entry, idx) => (
                          <tr key={entry._id || idx} className="hover:bg-muted/10">
                            <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                              {new Date(entry.createdAt || entry.date).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-semibold text-foreground">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  entry.transactionType?.includes("Purchase")
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                }`}
                              >
                                {entry.transactionType || entry.type}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-foreground">
                              Rs. {(entry.amount || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-rose-500">
                              Rs. {(entry.runningBalance || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-muted-foreground">{entry.paymentMode || "Cash"}</td>
                            <td className="p-3 pe-4 text-muted-foreground text-[11px]">
                              {entry.referenceNumber || entry.reference || entry.notes || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
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
            phone: currentSup.phone,
            address: currentSup.address || "Supplier Refinery Depot",
            city: "Karachi",
            openingBalance: 0,
          }}
          ledgerEntries={ledgerEntries}
        />
      )}
    </>
  );
}
