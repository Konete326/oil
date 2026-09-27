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
  ClockIcon,
  ReceiptIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OilDropLogo } from "@/components/logo";
import {
  fetchCustomerDetail,
  fetchPosSales,
  fetchChallans,
  fetchCashTransactionsApi,
  fetchLedgerEntries,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function formatVolumeQty(qty) {
  const num = Number(qty) || 0;
  if (num <= 0) return "0 L";
  if (num < 1) {
    const ml = Math.round(num * 1000);
    return `${ml} ML (${num} L)`;
  }
  if (num % 1 !== 0) {
    const ml = Math.round(num * 1000);
    return `${num} L (${ml.toLocaleString()} ML)`;
  }
  return `${num} L`;
}

export function CustomerTrialSheetModal({
  isOpen,
  onClose,
  customer,
  initialSales = [],
  initialLedger = [],
}) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [custInfo, setCustInfo] = useState(customer || {});

  useEffect(() => {
    if (!isOpen || !customer) {
      setEntries([]);
      return;
    }
    setCustInfo(customer);
    loadCustomerLedger();
  }, [isOpen, customer]);

  const loadCustomerLedger = async () => {
    setLoading(true);
    try {
      const cId = customer._id || customer.id || "";
      const cName = (customer.name || "").trim().toLowerCase();
      const cPhone = (customer.phone || "").trim();

      const [detailRes, posRes, challanRes, cashRes, ledgerRes] = await Promise.all([
        cId ? fetchCustomerDetail(cId).catch(() => null) : Promise.resolve(null),
        fetchPosSales().catch(() => null),
        fetchChallans().catch(() => null),
        fetchCashTransactionsApi({ limit: 1000 }).catch(() => null),
        fetchLedgerEntries().catch(() => null),
      ]);

      if (detailRes?.customer) {
        setCustInfo((prev) => ({ ...prev, ...detailRes.customer }));
      }

      const rawSales = [
        ...(Array.isArray(initialSales) ? initialSales : []),
        ...(detailRes?.posSales && Array.isArray(detailRes.posSales) ? detailRes.posSales : []),
        ...(posRes?.success && Array.isArray(posRes.data) ? posRes.data : Array.isArray(posRes) ? posRes : []),
      ];

      const rawChallans =
        challanRes?.success && Array.isArray(challanRes.data)
          ? challanRes.data
          : Array.isArray(challanRes)
          ? challanRes
          : [];

      const rawCash =
        cashRes?.success && Array.isArray(cashRes.data)
          ? cashRes.data
          : Array.isArray(cashRes)
          ? cashRes
          : [];

      const rawLedger = [
        ...(Array.isArray(initialLedger) ? initialLedger : []),
        ...(detailRes?.ledgerEntries && Array.isArray(detailRes.ledgerEntries) ? detailRes.ledgerEntries : []),
        ...(ledgerRes && Array.isArray(ledgerRes) ? ledgerRes : []),
      ];

      const list = [];
      const seenSales = new Set();
      const seenChallans = new Set();
      const seenCash = new Set();
      const seenLedger = new Set();

      const isNameMatch = (name) => {
        if (!name || !cName) return false;
        const n = name.trim().toLowerCase();
        return n === cName || n.includes(cName) || cName.includes(n);
      };

      const isPhoneMatch = (phone) => {
        if (!phone || !cPhone) return false;
        const cleanP = phone.replace(/\D/g, "");
        const cleanC = cPhone.replace(/\D/g, "");
        return cleanP && cleanC && (cleanP === cleanC || cleanP.endsWith(cleanC) || cleanC.endsWith(cleanP));
      };

      rawSales.forEach((sale) => {
        const saleKey = sale.saleNumber || String(sale._id || "");
        if (seenSales.has(saleKey)) return;

        const sId = sale.customer?._id || sale.customer || sale.customerId;
        const matchesId = cId && (sId === cId || String(sId) === String(cId));
        const matchesName = isNameMatch(sale.customerName || sale.customer?.name);
        const matchesPhone = isPhoneMatch(sale.customerPhone);

        if (!matchesId && !matchesName && !matchesPhone) return;

        seenSales.add(saleKey);

        const grandTotal = Number(sale.grandTotal) || 0;
        const cashRec = Number(sale.cashReceived) || 0;
        const isCredit =
          sale.isCredit ||
          (sale.paymentMode || "").toLowerCase().includes("credit") ||
          (sale.paymentMode || "").toLowerCase().includes("khata");

        const itemsSummary =
          (sale.items || [])
            .map((it) => `${formatVolumeQty(it.quantity)} ${it.productName || it.name || "Product"}`)
            .join(", ") || "Oil Products";

        list.push({
          id: `sale-${sale._id || saleKey}`,
          date: sale.createdAt || new Date().toISOString(),
          type: isCredit ? "Credit Sale (Invoice)" : "Cash Sale",
          reference: sale.saleNumber || "BILL",
          description: itemsSummary,
          mode: sale.paymentMode || (isCredit ? "Credit Khata" : "Cash"),
          debit: grandTotal,
          credit: isCredit ? 0 : grandTotal,
          notes: sale.notes || "",
        });

        if (isCredit && cashRec > 0) {
          list.push({
            id: `sale-part-${sale._id || saleKey}`,
            date: sale.updatedAt || sale.createdAt || new Date().toISOString(),
            type: "Payment Received",
            reference: `RCP-${sale.saleNumber || "BILL"}`,
            description: `Payment received for Bill ${sale.saleNumber || ""}`,
            mode: sale.paymentMode || "Cash",
            debit: 0,
            credit: cashRec,
            notes: "Partial payment received",
          });
        }
      });

      rawChallans.forEach((ch) => {
        const chKey = ch.challanNumber || String(ch._id || "");
        if (seenChallans.has(chKey)) return;

        const matchesName = isNameMatch(ch.millName || ch.customerName || ch.mill?.name);
        const matchesPhone = isPhoneMatch(ch.driverPhone || ch.phone);

        if (!matchesName && !matchesPhone) return;

        seenChallans.add(chKey);

        const amount = Number(ch.totalAmount) || 0;
        const qtyFormatted = formatVolumeQty(ch.quantityLiters || ch.quantity);
        list.push({
          id: `challan-${ch._id || chKey}`,
          date: ch.deliveryDate || ch.createdAt || new Date().toISOString(),
          type: "Delivery Challan",
          reference: ch.challanNumber || "CHL",
          description: `${qtyFormatted} ${ch.product?.name || ch.productName || "Oil Dispatch"}`,
          mode: "Credit Delivery",
          debit: amount,
          credit: 0,
          notes: ch.notes || "",
        });
      });

      rawCash.forEach((tx) => {
        const txKey = tx.referenceNo || String(tx._id || "");
        if (seenCash.has(txKey)) return;

        const matchesName = isNameMatch(tx.party || tx.partyName || tx.customerName);
        if (!matchesName) return;

        seenCash.add(txKey);

        const amount = Number(tx.amount) || 0;
        const isReceived =
          tx.type === "Received" ||
          tx.transactionType === "Received" ||
          (tx.category || "").toLowerCase().includes("customer") ||
          (tx.category || "").toLowerCase().includes("collection") ||
          (tx.category || "").toLowerCase().includes("wasooli");

        if (isReceived) {
          const alreadyLinked = list.some(
            (e) => e.reference === tx.referenceNo && Math.abs(e.credit - amount) < 0.01
          );
          if (!alreadyLinked) {
            list.push({
              id: `cash-${tx._id || txKey}`,
              date: tx.transactionDate || tx.date || tx.createdAt || new Date().toISOString(),
              type: "Payment Received",
              reference: tx.referenceNo || `RCP-${String(tx._id || "").slice(-5)}`,
              description: tx.description || tx.notes || "Khata Recovery Received",
              mode: tx.paymentMode || "Cash",
              debit: 0,
              credit: amount,
              notes: tx.notes || "",
            });
          }
        }
      });

      rawLedger.forEach((entry) => {
        const entryKey = entry._id ? String(entry._id) : entry.referenceNumber;
        if (entryKey && seenLedger.has(entryKey)) return;

        const matchesName = isNameMatch(entry.partyName || entry.clientName);
        if (!matchesName) return;

        if (entryKey) seenLedger.add(entryKey);

        const amount = Number(entry.amount) || 0;
        const isDebit =
          (entry.type || entry.transactionType || "").toLowerCase().includes("debit") ||
          (entry.type || entry.transactionType || "").toLowerCase().includes("sale") ||
          (entry.type || entry.transactionType || "").toLowerCase().includes("challan");

        const alreadyPresent = list.some(
          (e) => e.reference === entry.referenceNumber && (e.debit === amount || e.credit === amount)
        );

        if (!alreadyPresent) {
          list.push({
            id: `ledger-${entryKey || Math.random()}`,
            date: entry.date || entry.createdAt || new Date().toISOString(),
            type: isDebit ? "Debit Entry" : "Credit (Payment)",
            reference: entry.referenceNumber || "ENTRY",
            description: entry.description || entry.particulars || "Khata Ledger Posting",
            mode: entry.paymentMode || "General Ledger",
            debit: isDebit ? amount : 0,
            credit: isDebit ? 0 : amount,
            notes: entry.notes || "",
          });
        }
      });

      const openingBal = Number(customer.openingBalance || customer.initialBalance) || 0;
      if (openingBal > 0) {
        list.unshift({
          id: `opening-${cId || "0"}`,
          date: customer.createdAt || new Date().toISOString(),
          type: "Opening Balance",
          reference: "OPENING",
          description: "Initial Ledger Opening Balance",
          mode: "System Balance",
          debit: openingBal,
          credit: 0,
          notes: "Initial balance brought forward",
        });
      }

      if (list.length === 0 && Number(customer.currentBalance) > 0) {
        list.push({
          id: `current-bal-${cId || "0"}`,
          date: customer.updatedAt || customer.createdAt || new Date().toISOString(),
          type: "Balance Record",
          reference: "BAL-RECORD",
          description: "Existing Customer Khata Balance",
          mode: "System Record",
          debit: Number(customer.currentBalance),
          credit: 0,
          notes: "Recorded Khata balance due",
        });
      }

      list.sort((a, b) => new Date(a.date) - new Date(b.date));

      let running = 0;
      const calculated = list.map((item) => {
        running = running + (Number(item.debit) || 0) - (Number(item.credit) || 0);
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

  const totalDebit = useMemo(() => {
    return entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  }, [entries]);

  const totalCredit = useMemo(() => {
    return entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  }, [entries]);

  const currentReceivable = totalDebit - totalCredit;

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.reference || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.mode || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q);

      if (filterType === "sales") return matchesSearch && Number(item.debit) > 0;
      if (filterType === "payments") return matchesSearch && Number(item.credit) > 0;
      return matchesSearch;
    });
  }, [entries, searchTerm, filterType]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Customer_Trial_Sheet_${(custInfo.name || "Customer").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
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
      "Particulars / Items": e.description || "-",
      "Payment Mode": e.mode || "-",
      "Debit / Billed (PKR)": Number(e.debit || 0),
      "Credit / Received (PKR)": Number(e.credit || 0),
      "Running Balance (PKR)": Number(e.runningBalance || 0),
      Notes: e.notes || "-",
    }));

    rows.push({
      "Sr #": "TOTAL",
      Date: "-",
      "Transaction Type": "Grand Totals",
      Reference: "-",
      "Particulars / Items": "-",
      "Payment Mode": "-",
      "Debit / Billed (PKR)": totalDebit,
      "Credit / Received (PKR)": totalCredit,
      "Running Balance (PKR)": currentReceivable,
      Notes: `Net Balance Due: Rs. ${currentReceivable.toLocaleString()}`,
    });

    exportTransactionsToExcel(
      rows,
      `Customer_Trial_Sheet_${(custInfo.name || "Customer").replace(/\s+/g, "_")}.xlsx`
    );
  };

  const handleWhatsAppShare = () => {
    const phoneClean = (custInfo.phone || "").replace(/\D/g, "");
    const dateStr = new Date().toLocaleDateString();

    const msg =
      `Dear ${custInfo.name || "Customer"},\n` +
      `Trial Balance Statement from Al Khaleej Lubricants (${dateStr}):\n\n` +
      `▪ Total Purchases (Debit): Rs ${totalDebit.toLocaleString()}\n` +
      `▪ Total Payments (Credit): Rs ${totalCredit.toLocaleString()}\n` +
      `------------------------------------\n` +
      `▪ Net Balance Due: Rs ${currentReceivable.toLocaleString()}\n\n` +
      `Thank you for your business!`;

    const encoded = encodeURIComponent(msg);
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  if (!isOpen || !customer || typeof window === "undefined") return null;

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
                  Customer Trial Balance Statement
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {custInfo.customerType || "Retail"}
                </Badge>
                <Badge
                  className={`text-[10px] font-semibold ${
                    currentReceivable > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {currentReceivable > 0
                    ? `Balance Due: Rs. ${currentReceivable.toLocaleString()}`
                    : "Account Cleared (Nil)"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Al-Khaleej Lubricants — Complete Customer Ledger &amp; Trial Balance Report
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
              <span className="font-bold text-sm text-foreground">{custInfo.name}</span>
              {custInfo.folioNumber && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Folio: {custInfo.folioNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground flex-wrap font-mono text-[11px]">
              {custInfo.phone && (
                <span className="flex items-center gap-1">
                  <PhoneIcon className="size-3 text-emerald-600" />
                  <span>{custInfo.phone}</span>
                </span>
              )}
              {custInfo.city && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3 text-blue-500" />
                  <span>{custInfo.city}</span>
                </span>
              )}
              <span>Credit Limit: Rs. {(custInfo.creditLimit || 0).toLocaleString()}</span>
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
              <span className="text-xs font-semibold">Total Purchases / Billed (Debit)</span>
              <ArrowDownLeftIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
              Rs. {totalDebit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              All Invoices &amp; Dispatches
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Total Payments Received (Credit)</span>
              <ArrowUpRightIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Rs. {totalCredit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Cash, Bank &amp; Cheque Collections
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-xs font-semibold">Net Balance Due (Payable)</span>
              <ScaleIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-500">
              Rs. {currentReceivable.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Current Outstanding Balance
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
              onClick={() => setFilterType("sales")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "sales"
                  ? "bg-background text-blue-500 shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Invoices (Debit)
            </button>
            <button
              onClick={() => setFilterType("payments")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "payments"
                  ? "bg-background text-emerald-500 shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Payments (Credit)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search reference, items, mode..."
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
                  <th className="p-2.5">Ref / Bill #</th>
                  <th className="p-2.5">Particulars / Items</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right text-blue-600 dark:text-blue-400">
                    Debit (Billed)
                  </th>
                  <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                    Credit (Paid)
                  </th>
                  <th className="p-2.5 pe-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading customer trial balance records...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No transaction entries found for this customer.
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
                            e.type?.includes("Sale") || e.type?.includes("Challan") || e.type?.includes("Debit")
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
                        {e.description}
                      </td>
                      <td className="p-2.5 text-muted-foreground text-[11px]">{e.mode}</td>
                      <td className="p-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                        {e.debit > 0 ? `Rs. ${Number(e.debit).toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
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
                  <td className="p-2.5 text-right font-mono text-blue-600 dark:text-blue-400">
                    Rs. {totalDebit.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {totalCredit.toLocaleString()}
                  </td>
                  <td className="p-2.5 pe-3 text-right font-mono text-amber-500">
                    Rs. {currentReceivable.toLocaleString()}
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
