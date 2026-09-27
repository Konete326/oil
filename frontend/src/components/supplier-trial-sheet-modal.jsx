import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  XIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  PhoneIcon,
  MapPinIcon,
  ScaleIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Share2Icon,
  CheckCircle2Icon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OilDropLogo } from "@/components/logo";
import {
  fetchSupplierLedgerApi,
  fetchSupplierDetailApi,
  fetchCashTransactionsApi,
  fetchDetailedPartyLedgerApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function SupplierTrialSheetModal({ isOpen, onClose, supplier }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [supInfo, setSupInfo] = useState(supplier || {});

  useEffect(() => {
    if (!isOpen || !supplier) {
      setEntries([]);
      return;
    }
    setSupInfo(supplier);
    loadSupplierLedger();
  }, [isOpen, supplier]);

  const loadSupplierLedger = async () => {
    setLoading(true);
    try {
      const sId = supplier._id || supplier.id || "";
      const sName = (supplier.name || "").trim().toLowerCase();

      const [ledgerRes, detailRes, cashRes, partyRes] = await Promise.all([
        sId ? fetchSupplierLedgerApi(sId).catch(() => null) : Promise.resolve(null),
        sId ? fetchSupplierDetailApi(sId).catch(() => null) : Promise.resolve(null),
        fetchCashTransactionsApi({ limit: 1000 }).catch(() => null),
        supplier.name
          ? fetchDetailedPartyLedgerApi({ partyName: supplier.name, partyType: "Supplier" }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (detailRes?.data?.supplier) {
        setSupInfo((prev) => ({ ...prev, ...detailRes.data.supplier }));
      }

      const rawLedger = [
        ...(ledgerRes?.success && Array.isArray(ledgerRes.data) ? ledgerRes.data : []),
        ...(detailRes?.data?.ledgerEntries && Array.isArray(detailRes.data.ledgerEntries) ? detailRes.data.ledgerEntries : []),
        ...(partyRes?.success && Array.isArray(partyRes.data) ? partyRes.data : []),
      ];

      const rawCash = cashRes?.success && Array.isArray(cashRes.data) ? cashRes.data : [];

      const list = [];
      const seen = new Set();

      const isNameMatch = (name) => {
        if (!name || !sName) return false;
        const n = name.trim().toLowerCase();
        return n === sName || n.includes(sName) || sName.includes(n);
      };

      rawLedger.forEach((entry) => {
        const key = entry._id ? String(entry._id) : `${entry.referenceNumber}-${entry.amount}-${entry.createdAt || entry.date}`;
        if (seen.has(key)) return;
        seen.add(key);

        const amount = Number(entry.amount) || Number(entry.debit) || Number(entry.credit) || 0;
        const transType = String(entry.transactionType || entry.type || "").toLowerCase();
        const isPurchase = transType.includes("purchase") || transType.includes("bill") || Number(entry.credit) > 0;
        const isPayment = transType.includes("payment") || transType.includes("paid") || Number(entry.debit) > 0;

        const credit = isPurchase ? amount || Number(entry.credit) || 0 : 0;
        const debit = isPayment ? amount || Number(entry.debit) || 0 : 0;

        list.push({
          id: key,
          date: entry.createdAt || entry.date || new Date().toISOString(),
          type: isPurchase ? "Purchase Bill" : "Payment Voucher",
          reference: entry.referenceNumber || entry.reference || "REF",
          particulars: entry.notes || entry.particulars || (isPurchase ? "Stock Purchase Inflow" : "Supplier Payment"),
          mode: entry.paymentMode || entry.mode || "Cash",
          debit: debit,
          credit: credit,
        });
      });

      rawCash.forEach((tx) => {
        if (!isNameMatch(tx.party || tx.partyName || tx.supplierName)) return;
        const key = `cash-${tx._id || tx.referenceNo || Math.random()}`;
        if (seen.has(key)) return;
        seen.add(key);

        const amount = Number(tx.amount) || 0;
        const isPaid = tx.type === "Paid" || (tx.category || "").toLowerCase().includes("supplier");

        list.push({
          id: key,
          date: tx.transactionDate || tx.date || tx.createdAt || new Date().toISOString(),
          type: isPaid ? "Payment Voucher" : "Adjustment",
          reference: tx.referenceNo || `CSH-${String(tx._id || "").slice(-5)}`,
          particulars: tx.notes || tx.description || "Cash Payment Outflow",
          mode: tx.paymentMode || "Cash",
          debit: isPaid ? amount : 0,
          credit: isPaid ? 0 : amount,
        });
      });

      const openingBal = Number(supplier.openingBalance) || 0;
      if (openingBal > 0) {
        list.unshift({
          id: `opening-${sId || "0"}`,
          date: supplier.createdAt || new Date().toISOString(),
          type: "Opening Balance",
          reference: "OPENING",
          particulars: "Initial Balance Carried Forward",
          mode: "System Balance",
          debit: 0,
          credit: openingBal,
        });
      }

      if (list.length === 0 && Number(supplier.currentBalance) > 0) {
        list.push({
          id: `curr-bal-${sId || "0"}`,
          date: supplier.updatedAt || supplier.createdAt || new Date().toISOString(),
          type: "Balance Record",
          reference: "BAL-REC",
          particulars: "Recorded Supplier Khata Balance Due",
          mode: "System Record",
          debit: 0,
          credit: Number(supplier.currentBalance),
        });
      }

      list.sort((a, b) => new Date(a.date) - new Date(b.date));

      let running = 0;
      const calculated = list.map((item) => {
        running = running + (Number(item.credit) || 0) - (Number(item.debit) || 0);
        return {
          ...item,
          runningBalance: running,
        };
      });

      setEntries(calculated);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCredit = useMemo(() => {
    return entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  }, [entries]);

  const totalDebit = useMemo(() => {
    return entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  }, [entries]);

  const currentPayable = totalCredit - totalDebit;

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.reference || "").toLowerCase().includes(q) ||
        (item.particulars || "").toLowerCase().includes(q) ||
        (item.mode || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q);

      if (filterType === "purchases") return matchesSearch && Number(item.credit) > 0;
      if (filterType === "payments") return matchesSearch && Number(item.debit) > 0;
      return matchesSearch;
    });
  }, [entries, searchTerm, filterType]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Supplier_Trial_Sheet_${(supInfo.name || "Supplier").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
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
      "Reference #": e.reference || "-",
      "Particulars / Details": e.particulars || "-",
      "Payment Mode": e.mode || "-",
      "Debit / Paid (PKR)": Number(e.debit || 0),
      "Credit / Billed (PKR)": Number(e.credit || 0),
      "Running Balance (PKR)": Number(e.runningBalance || 0),
    }));

    rows.push({
      "Sr #": "TOTAL",
      Date: "-",
      "Transaction Type": "Grand Totals",
      "Reference #": "-",
      "Particulars / Details": "-",
      "Payment Mode": "-",
      "Debit / Paid (PKR)": totalDebit,
      "Credit / Billed (PKR)": totalCredit,
      "Running Balance (PKR)": currentPayable,
    });

    exportTransactionsToExcel(
      rows,
      `Supplier_Trial_Sheet_${(supInfo.name || "Supplier").replace(/\s+/g, "_")}.xlsx`
    );
  };

  const handleWhatsAppShare = () => {
    const phoneClean = (supInfo.phone || "").replace(/\D/g, "");
    const dateStr = new Date().toLocaleDateString();

    const msg =
      `Dear ${supInfo.name || "Supplier"},\n` +
      `Trial Balance Statement from Al Khaleej Lubricants (${dateStr}):\n\n` +
      `▪ Total Purchases (Credit): Rs ${totalCredit.toLocaleString()}\n` +
      `▪ Total Payments (Debit): Rs ${totalDebit.toLocaleString()}\n` +
      `------------------------------------\n` +
      `▪ Net Balance Payable: Rs ${currentPayable.toLocaleString()}\n\n` +
      `Thank you for your partnership!`;

    const encoded = encodeURIComponent(msg);
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  if (!isOpen || !supplier || typeof window === "undefined") return null;

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
        }
      `}</style>

      <div className="relative w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 print-card animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b pb-3.5 print-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <OilDropLogo className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Supplier Trial Balance Statement
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {supInfo.code || "SUPPLIER"}
                </Badge>
                <Badge
                  className={`text-[10px] font-semibold ${
                    currentPayable > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {currentPayable > 0
                    ? `Balance Payable: Rs. ${currentPayable.toLocaleString()}`
                    : "Account Settled (Nil)"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Al-Khaleej Lubricants — Complete Vendor Ledger &amp; Trial Balance Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="text-xs h-8 px-3 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
              title="Share statement on WhatsApp"
            >
              <Share2Icon className="size-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="text-xs h-8 px-3 gap-1.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
              <span>Export Excel</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-3 gap-1.5 cursor-pointer"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print A4</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{supInfo.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Vendor Profile
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground flex-wrap font-mono text-[11px]">
              {supInfo.phone && (
                <span className="flex items-center gap-1">
                  <PhoneIcon className="size-3 text-emerald-600" />
                  <span>{supInfo.phone}</span>
                </span>
              )}
              {supInfo.address && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3 text-blue-500" />
                  <span>{supInfo.address}</span>
                </span>
              )}
              <span>Total Transactions: {entries.length}</span>
            </div>
          </div>

          <div className="text-right sm:border-s sm:ps-4 border-border/80 shrink-0">
            <span className="text-[10.5px] text-muted-foreground block">Statement Date</span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <span className="text-xs font-semibold">Total Purchases / Stock Billed (Credit)</span>
              <ArrowDownLeftIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
              Rs. {totalCredit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              All Purchases &amp; Goods Inward
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Total Payments Made (Debit)</span>
              <ArrowUpRightIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Rs. {totalDebit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Cash &amp; Bank Disbursed
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-xs font-semibold">Net Balance Due (Payable)</span>
              <ScaleIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-500">
              Rs. {currentPayable.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Current Outstanding Payable
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 no-print pt-1">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/80 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "all"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Records ({entries.length})
            </button>
            <button
              onClick={() => setFilterType("purchases")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "purchases"
                  ? "bg-background text-blue-500 shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Purchases (Credit)
            </button>
            <button
              onClick={() => setFilterType("payments")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "payments"
                  ? "bg-background text-emerald-500 shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Payments (Debit)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search reference, details, mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs h-8 pl-8 bg-muted/30"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[42vh] print:max-h-none">
            <table className="w-full text-left text-xs print-table">
              <thead className="bg-muted/60 sticky top-0 border-b border-border font-medium text-muted-foreground uppercase text-[10.5px] tracking-wider z-10">
                <tr>
                  <th className="p-2.5 ps-3 w-10">#</th>
                  <th className="p-2.5">Date &amp; Time</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Reference #</th>
                  <th className="p-2.5">Particulars / Details</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                    Debit (Paid)
                  </th>
                  <th className="p-2.5 text-right text-blue-600 dark:text-blue-400">
                    Credit (Billed)
                  </th>
                  <th className="p-2.5 pe-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading supplier trial balance records...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No transaction entries found for this supplier.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 ps-3 font-mono text-muted-foreground text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-mono text-muted-foreground text-[11px]">
                        {new Date(e.date).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            e.type?.includes("Purchase") || e.type?.includes("Bill")
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {e.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-foreground text-[11px]">
                        {e.reference}
                      </td>
                      <td className="p-2.5 max-w-[220px] truncate text-[11px] text-muted-foreground">
                        {e.particulars}
                      </td>
                      <td className="p-2.5 text-muted-foreground text-[11px]">{e.mode}</td>
                      <td className="p-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {e.debit > 0 ? `Rs. ${Number(e.debit).toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                        {e.credit > 0 ? `Rs. ${Number(e.credit).toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2.5 pe-3 text-right font-mono font-bold text-foreground">
                        Rs. {Number(e.runningBalance).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="bg-muted/40 font-bold border-t-2 border-border text-xs">
                  <td colSpan={6} className="p-2.5 ps-3 uppercase tracking-wider text-foreground">
                    Trial Totals
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {totalDebit.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono text-blue-600 dark:text-blue-400">
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

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/80">
          <p>
            Showing {filteredEntries.length} transaction entries. All totals are calculated automatically.
          </p>

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
              <span>Print Trial Statement</span>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
