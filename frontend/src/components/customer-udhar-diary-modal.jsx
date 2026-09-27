import { useState, useEffect, useMemo } from "react";
import {
  BookOpenIcon,
  HandCoinsIcon,
  PrinterIcon,
  PlusIcon,
  Share2Icon,
  PhoneIcon,
  CheckCircle2Icon,
  SearchIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [udharItemName, setUdharItemName] = useState("Engine Oil 20W50");
  const [udharLiters, setUdharLiters] = useState("4");
  const [udharRate, setUdharRate] = useState("1200");
  const [udharTotal, setUdharTotal] = useState("4800");
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
          fetchCashTransactionsApi({ limit: 1000 }),
          fetchCustomers({ search: customerName }),
        ]);

        if (isMounted) {
          if (cashRes?.data && Array.isArray(cashRes.data)) {
            setCashTxList(cashRes.data);
          }
          if (custRes?.data && Array.isArray(custRes.data)) {
            const found = custRes.data.find(
              (c) => (c.name || "").trim().toLowerCase() === customerName.trim().toLowerCase()
            );
            if (found) setCustomerProfile(found);
          }
        }
      } catch (err) {
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

    if (customerProfile && Number(customerProfile.openingBalance) > 0) {
      entries.push({
        id: `opening-${customerProfile._id}`,
        date: customerProfile.createdAt || new Date().toISOString(),
        tafseel: "Opening Balance",
        safha: "OPN-01",
        naam: Number(customerProfile.openingBalance),
        jama: 0,
        type: "Opening",
      });
    }

    salesHistory.forEach((sale) => {
      const sCust = (sale.customerName || "").trim().toLowerCase();
      if (sCust !== trimmed) return;

      const grandTotal = Number(sale.grandTotal) || 0;
      const cashRec = Number(sale.cashReceived) || 0;
      const isCredit = sale.isCredit || (sale.paymentMode || "").toLowerCase().includes("credit") || (sale.paymentMode || "").toLowerCase().includes("khata");

      const itemsDesc = (sale.items || [])
        .map((it) => `${it.quantity}L ${it.productName}`)
        .join(", ") || "Oil Products";

      if (isCredit || grandTotal > cashRec) {
        entries.push({
          id: `sale-${sale._id}`,
          rawId: sale._id,
          date: sale.createdAt,
          tafseel: itemsDesc,
          safha: sale.saleNumber || "BILL",
          naam: grandTotal,
          jama: 0,
          type: "Udhar Maal",
          rawSale: sale,
        });

        if (cashRec > 0) {
          entries.push({
            id: `sale-part-${sale._id}`,
            date: sale.updatedAt || sale.createdAt,
            tafseel: `Payment received for Bill ${sale.saleNumber}`,
            safha: sale.saleNumber || "VOUCH",
            naam: 0,
            jama: cashRec,
            type: "Wasooli",
          });
        }
      } else if (!isCredit && cashRec >= grandTotal) {
        entries.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          tafseel: `${itemsDesc} (Cash Sale)`,
          safha: sale.saleNumber || "BILL",
          naam: grandTotal,
          jama: grandTotal,
          type: "Cash Settled",
        });
      }
    });

    cashTxList.forEach((tx) => {
      const pName = (tx.partyName || "").trim().toLowerCase();
      if (pName.includes(trimmed) || trimmed.includes(pName)) {
        if (tx.type === "Received" || tx.category === "Customer Collection") {
          const alreadyIncluded = entries.some(
            (e) => e.safha === tx.referenceNo && e.jama === Number(tx.amount)
          );
          if (!alreadyIncluded) {
            entries.push({
              id: `cashtx-${tx._id}`,
              date: tx.transactionDate || tx.createdAt,
              tafseel: `${tx.paymentMode || "Cash"} Receipt ${tx.notes ? `- ${tx.notes}` : ""}`,
              safha: tx.referenceNo || `VCH-${String(tx._id).slice(-4)}`,
              naam: 0,
              jama: Number(tx.amount) || 0,
              type: "Wasooli",
            });
          }
        }
      }
    });

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    return entries.map((e) => {
      running = running + (e.naam || 0) - (e.jama || 0);
      return {
        ...e,
        baqaya: running,
      };
    });
  }, [customerName, customerProfile, salesHistory, cashTxList]);

  const totalNaam = useMemo(() => {
    return khataEntries.reduce((acc, row) => acc + (row.naam || 0), 0);
  }, [khataEntries]);

  const totalJama = useMemo(() => {
    return khataEntries.reduce((acc, row) => acc + (row.jama || 0), 0);
  }, [khataEntries]);

  const kulBaqaya = totalNaam - totalJama;

  const filteredEntries = useMemo(() => {
    if (!searchFilter.trim()) return khataEntries;
    const q = searchFilter.toLowerCase().trim();
    return khataEntries.filter(
      (e) =>
        e.tafseel.toLowerCase().includes(q) ||
        e.safha.toLowerCase().includes(q) ||
        new Date(e.date).toLocaleDateString().includes(q)
    );
  }, [khataEntries, searchFilter]);

  if (!isOpen || !customerName) return null;

  const handleVasooliSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(vasooliAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    try {
      setSubmitting(true);

      const targetCreditSale = khataEntries.find((r) => r.rawSale && r.naam > r.jama)?.rawSale;

      if (targetCreditSale) {
        await updatePosSaleApi(targetCreditSale._id, {
          isVasooli: true,
          vasooliAmount: amt,
          vasooliPaymentMode: vasooliMode,
          notes: vasooliNotes ? `Khata Vasooli: ${vasooliNotes}` : `Khata Vasooli from ${customerName}`,
        });
      } else {
        await createCashTransactionApi({
          type: "Received",
          partyName: customerName,
          amount: amt,
          category: "Customer Collection",
          paymentMode: vasooliMode,
          transactionDate: vasooliDate,
          notes: `Khata Wasooli for ${customerName} | ${vasooliNotes}`,
        });
      }

      toast.success(`Rs ${amt.toLocaleString()} payment received and khata updated!`);
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
    const ltr = Number(udharLiters);
    const rate = Number(udharRate);
    const tot = Number(udharTotal) || ltr * rate;

    if (!tot || tot <= 0) {
      toast.error("Please enter a valid credit purchase amount.");
      return;
    }

    try {
      setSubmitting(true);
      await createPosSale({
        customerName: customerName.trim(),
        customerPhone: customerProfile?.phone || "",
        saleType: "Retail",
        paymentMode: "Credit",
        items: [
          {
            productName: udharItemName,
            quantity: ltr,
            sellingPrice: rate,
            totalPrice: tot,
          },
        ],
        subTotal: tot,
        grandTotal: tot,
        cashReceived: 0,
        notes: udharNotes ? `Khata Udhar: ${udharNotes}` : `Udhar entry from Khata Book`,
      });

      toast.success(`Rs ${tot.toLocaleString()} credit purchase added to khata!`);
      setActiveForm(null);
      setUdharNotes("");
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Failed to record credit purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    const phoneClean = (customerProfile?.phone || "").replace(/\D/g, "");
    const dateStr = new Date().toLocaleDateString();

    const msg = `Dear ${customerName},\nLedger Statement from Al Khaleej Lubricants (${dateStr}):\n\n` +
      `▪ Total Debit (Billed): Rs ${totalNaam.toLocaleString()}\n` +
      `▪ Total Credit (Received): Rs ${totalJama.toLocaleString()}\n` +
      `------------------------------------\n` +
      `▪ Net Balance Due: Rs ${kulBaqaya.toLocaleString()}\n\n` +
      `Thank you! For any questions, please contact us.`;

    const encoded = encodeURIComponent(msg);
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-card border border-border/80 shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
        
        <div className="border-b-2 border-red-500/40 bg-red-500/5 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4 sm:p-5 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <BookOpenIcon className="size-6" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-mono flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400 text-lg">Account Title:</span>
                    <span className="underline decoration-red-500/50 underline-offset-4">{customerName}</span>
                  </h2>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
                    Folio No: {customerProfile?.folioNumber || "75"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap font-mono">
                  {customerProfile?.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="size-3 text-emerald-600" />
                      <span>{customerProfile.phone}</span>
                    </span>
                  )}
                  {customerProfile?.city && (
                    <span>City: {customerProfile.city}</span>
                  )}
                  <span>Total Bills: {khataEntries.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsAppShare}
                className="h-8 gap-1.5 text-xs px-2.5 border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                title="Send Khata statement via WhatsApp"
              >
                <Share2Icon className="size-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs px-2.5 cursor-pointer"
                title="Print Khata statement"
              >
                <PrinterIcon className="size-3.5 text-primary" />
                <span>Print Ledger</span>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-bold text-red-700 dark:text-red-400 block font-mono">
                Total Debit (Billed)
              </span>
              <p className="text-xl font-black font-mono text-red-600 dark:text-red-400 mt-0.5">
                Rs {totalNaam.toLocaleString()}
              </p>
            </div>
            <div className="size-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <ArrowDownLeftIcon className="size-4" />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                Total Credit (Received)
              </span>
              <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                Rs {totalJama.toLocaleString()}
              </p>
            </div>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowUpRightIcon className="size-4" />
            </div>
          </div>

          <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300 block font-mono">
                Net Balance Due
              </span>
              <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                Rs {kulBaqaya.toLocaleString()}
              </p>
            </div>
            <div className="size-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <WalletIcon className="size-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap border-y border-border/80 py-2.5">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setVasooliAmount(kulBaqaya > 0 ? String(kulBaqaya) : "");
                setActiveForm(activeForm === "vasooli" ? null : "vasooli");
              }}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              <HandCoinsIcon className="size-3.5" />
              <span>+ Record Payment Received</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveForm(activeForm === "udhar" ? null : "udhar")}
              className="h-8 text-xs font-bold border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 gap-1.5 cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              <span>+ Record New Credit / Bill</span>
            </Button>
          </div>

          <div className="relative w-full sm:w-60">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3 text-muted-foreground" />
            <Input
              placeholder="Search by date or bill number..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-8 ps-7.5 text-xs bg-muted/30 focus:bg-background"
            />
          </div>
        </div>

        {activeForm === "vasooli" && (
          <form
            onSubmit={handleVasooliSubmit}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <HandCoinsIcon className="size-4 text-emerald-600" />
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
                <label className="block font-semibold mb-1">Received Amount (PKR) *</label>
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
                <label className="block font-semibold mb-1">Payment Mode *</label>
                <select
                  value={vasooliMode}
                  onChange={(e) => setVasooliMode(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium cursor-pointer"
                >
                  <option value="Cash">Cash (Shop Drawer)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Date *</label>
                <Input
                  type="date"
                  required
                  value={vasooliDate}
                  onChange={(e) => setVasooliDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Receipt Note / Voucher</label>
                <Input
                  type="text"
                  value={vasooliNotes}
                  onChange={(e) => setVasooliNotes(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Note or voucher reference..."
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
                className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {submitting ? "Recording..." : "Record Payment & Update Khata"}
              </Button>
            </div>
          </form>
        )}

        {activeForm === "udhar" && (
          <form
            onSubmit={handleUdharSubmit}
            className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
              <h4 className="font-bold text-xs text-red-800 dark:text-red-300 flex items-center gap-1.5">
                <PlusIcon className="size-4 text-red-600" />
                <span>Record New Credit Sale for {customerName}</span>
              </h4>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Product / Item Description *</label>
                <Input
                  type="text"
                  required
                  value={udharItemName}
                  onChange={(e) => setUdharItemName(e.target.value)}
                  className="h-8 text-xs font-medium"
                  placeholder="e.g. Engine Oil 20W50 / Rimula R4"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity (Liters) *</label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={udharLiters}
                  onChange={(e) => {
                    setUdharLiters(e.target.value);
                    const l = Number(e.target.value) || 0;
                    const r = Number(udharRate) || 0;
                    setUdharTotal(String(l * r));
                  }}
                  className="h-8 text-xs font-mono font-bold"
                  placeholder="Liters"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Rate per Liter (PKR)</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={udharRate}
                  onChange={(e) => {
                    setUdharRate(e.target.value);
                    const l = Number(udharLiters) || 0;
                    const r = Number(e.target.value) || 0;
                    setUdharTotal(String(l * r));
                  }}
                  className="h-8 text-xs font-mono"
                  placeholder="Rate"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Total Amount (PKR) *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={udharTotal}
                  onChange={(e) => setUdharTotal(e.target.value)}
                  className="h-8 text-xs font-mono font-bold text-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              <div>
                <label className="block font-semibold mb-1">Date *</label>
                <Input
                  type="date"
                  required
                  value={udharDate}
                  onChange={(e) => setUdharDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Additional Note / Remarks</label>
                <Input
                  type="text"
                  value={udharNotes}
                  onChange={(e) => setUdharNotes(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Vehicle number or remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-red-500/20">
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
                className="h-7 text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {submitting ? "Adding..." : "Add to Customer Khata"}
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-border/80 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/70 text-xs">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-[105px] text-xs h-9 font-bold text-foreground">
                  Date
                </TableHead>
                <TableHead className="text-xs h-9 font-bold text-foreground">
                  Description (Particulars / Items)
                </TableHead>
                <TableHead className="w-[100px] text-xs h-9 font-bold text-foreground">
                  Ref / Bill #
                </TableHead>
                <TableHead className="w-[115px] text-xs h-9 text-right font-bold text-red-600 dark:text-red-400">
                  Debit (Billed)
                </TableHead>
                <TableHead className="w-[115px] text-xs h-9 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  Credit (Received)
                </TableHead>
                <TableHead className="w-[125px] text-xs h-9 text-right font-extrabold text-foreground">
                  Balance (PKR)
                </TableHead>
                <TableHead className="w-[75px] text-xs h-9 text-right pe-3 font-bold text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    No ledger records found for this customer.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/20 text-xs border-b border-border/40 transition-colors",
                      row.naam > 0 && "bg-red-500/2",
                      row.jama > 0 && "bg-emerald-500/2"
                    )}
                  >
                    <TableCell className="font-mono text-muted-foreground text-[11px] py-2.5">
                      {new Date(row.date).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <p className="font-semibold text-foreground text-xs">{row.tafseel}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">{row.type}</span>
                    </TableCell>

                    <TableCell className="font-mono font-bold text-primary py-2.5 text-[11px]">
                      {row.safha}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-red-600 dark:text-red-400 py-2.5 text-xs">
                      {row.naam > 0 ? `Rs ${row.naam.toLocaleString()}` : "-"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 py-2.5 text-xs">
                      {row.jama > 0 ? `Rs ${row.jama.toLocaleString()}` : "-"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-black text-foreground py-2.5 text-xs">
                      Rs {row.baqaya.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right py-2.5 pe-3">
                      {row.naam > 0 && row.rawSale && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-6 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          onClick={() => {
                            setVasooliAmount(String(row.naam));
                            setVasooliNotes(`Wasooli for bill ${row.safha}`);
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
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/80 pt-3">
          <p className="font-mono text-[11px]">
            All ledger records are fully synchronized with the shop's cash register and POS system.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs px-3 cursor-pointer self-end sm:self-auto"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
