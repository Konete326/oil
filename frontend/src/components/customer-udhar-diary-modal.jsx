import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  HandCoinsIcon,
  PrinterIcon,
  PlusIcon,
  Share2Icon,
  PhoneIcon,
  SearchIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ScaleIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OilDropLogo } from "@/components/logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  updatePosSaleApi,
  createCashTransactionApi,
  createPosSale,
  fetchCashTransactionsApi,
  fetchCustomers,
  fetchCustomerDetail,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function CustomerUdharDiaryModal({
  isOpen,
  onClose,
  customerName = "",
  salesHistory = [],
  onSuccess,
}) {
  const [cashTxList, setCashTxList] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeForm, setActiveForm] = useState(null);
  const [vasooliAmount, setVasooliAmount] = useState("");
  const [vasooliMode, setVasooliMode] = useState("Cash");
  const [vasooliDate, setVasooliDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vasooliNotes, setVasooliNotes] = useState("");

  const [udharItemName, setUdharItemName] = useState("");
  const [udharQty, setUdharQty] = useState("1");
  const [udharPrice, setUdharPrice] = useState("");
  const [udharDate, setUdharDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [udharNotes, setUdharNotes] = useState("");

  const [searchFilter, setSearchFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerName) return;

    let isMounted = true;
    setIsLoading(true);

    const loadExtraData = async () => {
      try {
        const [cashRes, custRes] = await Promise.all([
          fetchCashTransactionsApi({ limit: 1000 }).catch(() => null),
          fetchCustomers({ search: customerName }).catch(() => null),
        ]);

        if (isMounted) {
          if (cashRes?.data && Array.isArray(cashRes.data)) {
            setCashTxList(cashRes.data);
          }
          if (custRes?.data && Array.isArray(custRes.data)) {
            const found = custRes.data.find(
              (c) => (c.name || "").trim().toLowerCase() === customerName.trim().toLowerCase()
            );
            if (found) {
              setCustomerProfile(found);
              if (found._id) {
                fetchCustomerDetail(found._id)
                  .then((res) => {
                    if (isMounted && res?.customer) {
                      setCustomerProfile(res.customer);
                    }
                  })
                  .catch(() => {});
              }
            }
          }
        }
      } catch {
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadExtraData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, customerName]);

  const khataEntries = useMemo(() => {
    if (!customerName) return [];
    const trimmed = customerName.trim().toLowerCase();

    const entries = [];
    const seenSales = new Set();

    if (customerProfile && Number(customerProfile.openingBalance) > 0) {
      entries.push({
        id: `opening-${customerProfile._id}`,
        date: customerProfile.createdAt || new Date().toISOString(),
        description: "Opening Balance",
        reference: "OPENING",
        debit: Number(customerProfile.openingBalance),
        credit: 0,
        mode: "System Balance",
        type: "Opening Balance",
      });
    }

    salesHistory.forEach((sale) => {
      const sCust = (sale.customerName || "").trim().toLowerCase();
      if (sCust !== trimmed && !sCust.includes(trimmed) && !trimmed.includes(sCust)) return;

      const saleKey = sale.saleNumber || String(sale._id);
      if (seenSales.has(saleKey)) return;
      seenSales.add(saleKey);

      const grandTotal = Number(sale.grandTotal) || 0;
      const cashRec = Number(sale.cashReceived) || 0;
      const isCredit =
        sale.isCredit ||
        (sale.paymentMode || "").toLowerCase().includes("credit") ||
        (sale.paymentMode || "").toLowerCase().includes("khata");

      const itemsDesc =
        (sale.items || [])
          .map((it) => `${it.quantity}L ${it.productName || it.name || "Product"}`)
          .join(", ") || "Oil Products";

      if (isCredit || grandTotal > cashRec) {
        entries.push({
          id: `sale-${sale._id}`,
          rawId: sale._id,
          date: sale.createdAt,
          description: itemsDesc,
          reference: sale.saleNumber || "BILL",
          mode: sale.paymentMode || "Credit / Khata",
          debit: grandTotal,
          credit: 0,
          type: "Credit Sale",
          rawSale: sale,
        });

        if (cashRec > 0) {
          entries.push({
            id: `sale-part-${sale._id}`,
            date: sale.updatedAt || sale.createdAt,
            description: `Payment for Bill ${sale.saleNumber || ""}`,
            reference: `RCP-${sale.saleNumber || "BILL"}`,
            mode: sale.paymentMode || "Cash",
            debit: 0,
            credit: cashRec,
            type: "Payment Received",
          });
        }
      } else {
        entries.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          description: `${itemsDesc} (Cash Sale)`,
          reference: sale.saleNumber || "BILL",
          mode: sale.paymentMode || "Cash",
          debit: grandTotal,
          credit: grandTotal,
          type: "Cash Settled",
        });
      }
    });

    cashTxList.forEach((tx) => {
      const pName = (tx.partyName || tx.party || "").trim().toLowerCase();
      if (pName && (pName.includes(trimmed) || trimmed.includes(pName))) {
        const isReceived =
          tx.type === "Received" ||
          tx.transactionType === "Received" ||
          (tx.category || "").toLowerCase().includes("customer") ||
          (tx.category || "").toLowerCase().includes("collection") ||
          (tx.category || "").toLowerCase().includes("wasooli");

        if (isReceived) {
          const alreadyIncluded = entries.some(
            (e) => e.reference === tx.referenceNo && Math.abs(e.credit - Number(tx.amount)) < 0.01
          );
          if (!alreadyIncluded) {
            entries.push({
              id: `cashtx-${tx._id}`,
              date: tx.transactionDate || tx.date || tx.createdAt,
              description: tx.description || tx.notes || "Khata Recovery Received",
              reference: tx.referenceNo || `RCP-${String(tx._id).slice(-4)}`,
              mode: tx.paymentMode || "Cash",
              debit: 0,
              credit: Number(tx.amount) || 0,
              type: "Payment Received",
            });
          }
        }
      }
    });

    if (entries.length === 0 && customerProfile && Number(customerProfile.currentBalance) > 0) {
      entries.push({
        id: `bal-${customerProfile._id}`,
        date: customerProfile.updatedAt || customerProfile.createdAt || new Date().toISOString(),
        description: "Existing Khata Balance",
        reference: "BALANCE",
        mode: "Recorded Ledger",
        debit: Number(customerProfile.currentBalance),
        credit: 0,
        type: "Balance Record",
      });
    }

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    return entries.map((e) => {
      running = running + (e.debit || 0) - (e.credit || 0);
      return {
        ...e,
        balance: running,
      };
    });
  }, [customerName, customerProfile, salesHistory, cashTxList]);

  const totalDebit = useMemo(() => {
    return khataEntries.reduce((acc, row) => acc + (row.debit || 0), 0);
  }, [khataEntries]);

  const totalCredit = useMemo(() => {
    return khataEntries.reduce((acc, row) => acc + (row.credit || 0), 0);
  }, [khataEntries]);

  const currentBalance = totalDebit - totalCredit;

  const filteredEntries = useMemo(() => {
    if (!searchFilter.trim()) return khataEntries;
    const q = searchFilter.toLowerCase().trim();
    return khataEntries.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q) ||
        (e.mode || "").toLowerCase().includes(q) ||
        new Date(e.date).toLocaleDateString().includes(q)
    );
  }, [khataEntries, searchFilter]);

  if (!isOpen || !customerName || typeof window === "undefined") return null;

  const handleVasooliSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(vasooliAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    try {
      setSubmitting(true);
      const targetCreditSale = khataEntries.find((r) => r.rawSale && r.debit > r.credit)?.rawSale;

      if (targetCreditSale) {
        await updatePosSaleApi(targetCreditSale._id, {
          isVasooli: true,
          vasooliAmount: amt,
          vasooliPaymentMode: vasooliMode,
          notes: vasooliNotes ? `Khata Payment: ${vasooliNotes}` : `Payment from ${customerName}`,
        });
      } else {
        await createCashTransactionApi({
          type: "Received",
          partyName: customerName,
          amount: amt,
          category: "Customer Collection",
          paymentMode: vasooliMode,
          transactionDate: vasooliDate,
          notes: `Khata Payment from ${customerName} ${vasooliNotes ? `| ${vasooliNotes}` : ""}`,
        });
      }

      toast.success(`Rs ${amt.toLocaleString()} payment recorded successfully!`);
      setActiveForm(null);
      setVasooliAmount("");
      setVasooliNotes("");
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUdharSubmit = async (e) => {
    e.preventDefault();
    const price = Number(udharPrice);
    const qty = Number(udharQty) || 1;
    const itemTitle = udharItemName.trim() || "Engine Oil & Lubricant";

    if (!price || price <= 0) {
      toast.error("Please enter a valid bill amount.");
      return;
    }

    try {
      setSubmitting(true);
      await createPosSale({
        customerName: customerName.trim(),
        customerPhone: customerProfile?.phone || "",
        saleType: "Retail",
        paymentMode: "Credit / Khata",
        items: [
          {
            productName: itemTitle,
            quantity: qty,
            sellingPrice: price / qty,
            totalPrice: price,
          },
        ],
        subTotal: price,
        grandTotal: price,
        cashReceived: 0,
        notes: udharNotes ? `Khata Bill: ${udharNotes}` : `Direct credit bill entry`,
      });

      toast.success(`Rs ${price.toLocaleString()} credit bill recorded!`);
      setActiveForm(null);
      setUdharItemName("");
      setUdharPrice("");
      setUdharNotes("");
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Failed to record credit bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    const phoneClean = (customerProfile?.phone || "").replace(/\D/g, "");
    const dateStr = new Date().toLocaleDateString();

    const msg =
      `Dear ${customerName},\n` +
      `Ledger Statement from Al Khaleej Lubricants (${dateStr}):\n\n` +
      `▪ Total Purchases (Debit): Rs ${totalDebit.toLocaleString()}\n` +
      `▪ Total Payments (Credit): Rs ${totalCredit.toLocaleString()}\n` +
      `------------------------------------\n` +
      `▪ Net Balance Due: Rs ${currentBalance.toLocaleString()}\n\n` +
      `Thank you for your business!`;

    const encoded = encodeURIComponent(msg);
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Customer_Ledger_${(customerName || "Customer").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  return createPortal(
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto animate-in fade-in duration-150">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          .print-portal, .print-portal * {
            visibility: visible !important;
          }
          .print-portal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #222 !important;
            padding: 5px 8px !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          .print-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-header {
            border-bottom: 2px solid #000 !important;
            padding-bottom: 8px !important;
            margin-bottom: 12px !important;
          }
          .print-signatures {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 40px !important;
            margin-top: 32px !important;
            padding-top: 8px !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl bg-card border border-border/80 shadow-2xl p-4 sm:p-6 space-y-4 print-card animate-in zoom-in-95 duration-150">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4 print-header">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
              <OilDropLogo className="size-6" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {customerName}
                </h2>
                <Badge
                  className={cn(
                    "text-[10.5px] font-semibold",
                    currentBalance > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  )}
                >
                  {currentBalance > 0
                    ? `Balance Due: Rs. ${currentBalance.toLocaleString()}`
                    : "Account Settled (Nil)"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-mono">
                {customerProfile?.phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="size-3 text-emerald-600" />
                    <span>{customerProfile.phone}</span>
                  </span>
                )}
                {customerProfile?.city && <span>City: {customerProfile.city}</span>}
                <span className="no-print">Total Bills: {khataEntries.length}</span>
                <span className="hidden print:inline">Statement Date: {new Date().toLocaleDateString("en-GB")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="h-8 gap-1.5 text-xs px-2.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
              title="Share ledger statement on WhatsApp"
            >
              <Share2Icon className="size-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs px-3 cursor-pointer shadow-xs"
              title="Print A4 ledger statement"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/80 bg-blue-500/5 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                Total Purchases (Debit)
              </span>
              <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                Rs {totalDebit.toLocaleString()}
              </p>
            </div>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center no-print">
              <ArrowDownLeftIcon className="size-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-emerald-500/5 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                Total Payments (Credit)
              </span>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                Rs {totalCredit.toLocaleString()}
              </p>
            </div>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center no-print">
              <ArrowUpRightIcon className="size-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-amber-500/5 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">
                Net Balance Due
              </span>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                Rs {currentBalance.toLocaleString()}
              </p>
            </div>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center no-print">
              <ScaleIcon className="size-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap border-y border-border/70 py-2.5 no-print">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setVasooliAmount(currentBalance > 0 ? String(currentBalance) : "");
                setActiveForm(activeForm === "vasooli" ? null : "vasooli");
              }}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-2xs"
            >
              <HandCoinsIcon className="size-3.5" />
              <span>+ Record Payment</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveForm(activeForm === "udhar" ? null : "udhar")}
              className="h-8 text-xs font-semibold border-border hover:bg-muted text-foreground gap-1.5 cursor-pointer"
            >
              <PlusIcon className="size-3.5 text-primary" />
              <span>+ Add Credit Bill</span>
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3 text-muted-foreground" />
            <Input
              placeholder="Search by date or bill #..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/30 focus:bg-background"
            />
          </div>
        </div>

        {activeForm === "vasooli" && (
          <form
            onSubmit={handleVasooliSubmit}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-3 animate-in fade-in no-print"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <HandCoinsIcon className="size-3.5 text-emerald-600" />
                <span>Record Payment Received from {customerName}</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Amount (PKR) *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={vasooliAmount}
                  onChange={(e) => setVasooliAmount(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                  placeholder="e.g. 5000"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Payment Mode *</label>
                <select
                  value={vasooliMode}
                  onChange={(e) => setVasooliMode(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Date *</label>
                <Input
                  type="date"
                  required
                  value={vasooliDate}
                  onChange={(e) => setVasooliDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Note / Remarks</label>
                <Input
                  type="text"
                  value={vasooliNotes}
                  onChange={(e) => setVasooliNotes(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Optional note..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveForm(null)}
                className="h-7 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          </form>
        )}

        {activeForm === "udhar" && (
          <form
            onSubmit={handleUdharSubmit}
            className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 animate-in fade-in no-print"
          >
            <div className="flex items-center justify-between border-b border-primary/20 pb-2">
              <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <PlusIcon className="size-3.5 text-primary" />
                <span>Add New Credit Bill for {customerName}</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1 text-muted-foreground">Product / Item Name</label>
                <Input
                  type="text"
                  value={udharItemName}
                  onChange={(e) => setUdharItemName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="e.g. Engine Oil 20W50"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Quantity (Liters / Qty)</label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={udharQty}
                  onChange={(e) => setUdharQty(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Total Bill Amount (PKR) *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={udharPrice}
                  onChange={(e) => setUdharPrice(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                  placeholder="e.g. 4500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Date *</label>
                <Input
                  type="date"
                  required
                  value={udharDate}
                  onChange={(e) => setUdharDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-muted-foreground">Note / Remarks</label>
                <Input
                  type="text"
                  value={udharNotes}
                  onChange={(e) => setUdharNotes(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Vehicle number or remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveForm(null)}
                className="h-7 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="h-7 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                {submitting ? "Saving..." : "Add Credit Bill"}
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
          <Table className="print-table">
            <TableHeader className="bg-muted/70 text-xs">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-[105px] text-xs h-9 font-semibold text-foreground">
                  Date
                </TableHead>
                <TableHead className="w-[110px] text-xs h-9 font-semibold text-foreground">
                  Bill / Ref #
                </TableHead>
                <TableHead className="text-xs h-9 font-semibold text-foreground">
                  Particulars / Items
                </TableHead>
                <TableHead className="w-[100px] text-xs h-9 font-semibold text-foreground">
                  Mode
                </TableHead>
                <TableHead className="w-[115px] text-xs h-9 text-right font-semibold text-foreground">
                  Debit (Billed)
                </TableHead>
                <TableHead className="w-[115px] text-xs h-9 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  Credit (Paid)
                </TableHead>
                <TableHead className="w-[125px] text-xs h-9 text-right font-bold text-foreground">
                  Balance (PKR)
                </TableHead>
                <TableHead className="w-[70px] text-xs h-9 text-right pe-3 font-semibold text-muted-foreground no-print">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Loading customer ledger...
                  </TableCell>
                </TableRow>
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    No ledger records found for this customer.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/20 text-xs border-b border-border/40 transition-colors"
                  >
                    <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                      {new Date(row.date).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="font-mono font-bold text-primary py-2.5 text-[11px]">
                      {row.reference}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span className="font-medium text-foreground text-xs block">{row.description}</span>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-[11px] py-2.5">
                      {row.mode || "Cash"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-medium text-foreground py-2.5 text-xs">
                      {row.debit > 0 ? `Rs ${row.debit.toLocaleString()}` : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 py-2.5 text-xs">
                      {row.credit > 0 ? `Rs ${row.credit.toLocaleString()}` : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-foreground py-2.5 text-xs">
                      Rs {row.balance.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right py-2.5 pe-3 no-print">
                      {row.debit > 0 && row.rawSale && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-6 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          onClick={() => {
                            setVasooliAmount(String(row.debit));
                            setVasooliNotes(`Wasooli for bill ${row.reference}`);
                            setActiveForm("vasooli");
                          }}
                          title="Record payment for this bill"
                        >
                          <HandCoinsIcon className="size-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}

              <TableRow className="bg-muted/40 font-bold border-t-2 border-border text-xs">
                <TableCell colSpan={4} className="py-2.5 uppercase tracking-wider text-foreground">
                  Ledger Totals
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono text-foreground">
                  Rs {totalDebit.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  Rs {totalCredit.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                  Rs {currentBalance.toLocaleString()}
                </TableCell>
                <TableCell className="no-print"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="hidden print:grid print-signatures pt-8 text-center text-xs">
          <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
            Customer Signature
          </div>
          <div className="border-t border-black pt-1 font-bold text-[10px] uppercase">
            Authorized Signature (Al Khaleej)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/80 pt-3 no-print">
          <p className="text-[11px]">
            Showing {filteredEntries.length} ledger entries.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7.5 text-xs px-4 cursor-pointer self-end sm:self-auto"
          >
            Close
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
