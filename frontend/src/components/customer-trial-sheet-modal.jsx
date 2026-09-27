import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  XIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ScaleIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Share2Icon,
  ReceiptIcon,
  BookOpenIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OilDropLogo } from "@/components/logo";
import {
  fetchPosSales,
  fetchChallans,
  fetchCashTransactionsApi,
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

export function CustomerTrialSheetModal({ isOpen, onClose, customer }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (!isOpen || !customer?.name) {
      setEntries([]);
      return;
    }
    loadCustomerLedger();
  }, [isOpen, customer]);

  const loadCustomerLedger = async () => {
    setLoading(true);
    try {
      const cName = (customer.name || "").trim().toLowerCase();
      const [posRes, challanRes, cashRes] = await Promise.all([
        fetchPosSales(),
        fetchChallans(),
        fetchCashTransactionsApi({ limit: 1000 }),
      ]);

      const rawSales = (posRes?.success && Array.isArray(posRes.data)) ? posRes.data : [];
      const rawChallans = (challanRes?.success && Array.isArray(challanRes.data)) ? challanRes.data : [];
      const rawCash = (cashRes?.success && Array.isArray(cashRes.data)) ? cashRes.data : [];

      const list = [];

      rawSales.forEach((sale) => {
        const sName = (sale.customerName || "").trim().toLowerCase();
        if (sName !== cName && !sName.includes(cName) && !cName.includes(sName)) return;

        const grandTotal = Number(sale.grandTotal) || 0;
        const cashRec = Number(sale.cashReceived) || 0;
        const isCredit = sale.isCredit || (sale.paymentMode || "").toLowerCase().includes("credit") || (sale.paymentMode || "").toLowerCase().includes("khata");

        const itemsSummary = (sale.items || [])
          .map((it) => `${formatVolumeQty(it.quantity)} ${it.productName}`)
          .join(", ") || "Oil Products";

        list.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          type: isCredit ? "Credit Sale (Udhar)" : "Cash Sale",
          reference: sale.saleNumber || "BILL",
          description: itemsSummary,
          mode: sale.paymentMode || "Cash",
          debit: grandTotal,
          credit: isCredit ? 0 : grandTotal,
          notes: sale.notes || "",
        });

        if (isCredit && cashRec > 0) {
          list.push({
            id: `sale-part-${sale._id}`,
            date: sale.updatedAt || sale.createdAt,
            type: "Payment (Wasooli)",
            reference: `RCP-${sale.saleNumber || "BILL"}`,
            description: `Payment received for Bill ${sale.saleNumber}`,
            mode: sale.paymentMode || "Cash",
            debit: 0,
            credit: cashRec,
            notes: "Partial bill recovery",
          });
        }
      });

      rawChallans.forEach((ch) => {
        const chName = (ch.millName || ch.customerName || "").trim().toLowerCase();
        if (chName !== cName && !chName.includes(cName) && !cName.includes(chName)) return;

        const amount = Number(ch.totalAmount) || 0;
        const qtyFormatted = formatVolumeQty(ch.quantityLiters || ch.quantity);
        list.push({
          id: `challan-${ch._id}`,
          date: ch.deliveryDate || ch.createdAt,
          type: "Challan Delivery",
          reference: ch.challanNumber || "CHL",
          description: `${qtyFormatted} ${ch.product?.name || ch.productName || "Oil"}`,
          mode: "Credit / Delivery",
          debit: amount,
          credit: 0,
          notes: ch.notes || "",
        });
      });

      rawCash.forEach((tx) => {
        const pName = (tx.partyName || "").trim().toLowerCase();
        if (pName !== cName && !pName.includes(cName) && !cName.includes(pName)) return;

        if (tx.type === "Received" || tx.category === "Customer Collection") {
          const already = list.some((e) => e.reference === tx.referenceNo && e.credit === Number(tx.amount));
          if (!already) {
            list.push({
              id: `cashtx-${tx._id}`,
              date: tx.transactionDate || tx.createdAt,
              type: "Payment (Wasooli)",
              reference: tx.referenceNo || `VCH-${String(tx._id).slice(-4)}`,
              description: `Khata Wasooli ${tx.notes ? `- ${tx.notes}` : ""}`,
              mode: tx.paymentMode || "Cash",
              debit: 0,
              credit: Number(tx.amount) || 0,
              notes: tx.notes || "",
            });
          }
        }
      });

      list.sort((a, b) => new Date(a.date) - new Date(b.date));

      let running = 0;
      const calculated = list.map((item) => {
        running = running + (item.debit || 0) - (item.credit || 0);
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

  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const currentReceivable = totalDebit - totalCredit;

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchesSearch =
        (item.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.mode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (filterType === "sales") return matchesSearch && Number(item.debit) > 0;
      if (filterType === "payments") return matchesSearch && Number(item.credit) > 0;
      return matchesSearch;
    });
  }, [entries, searchTerm, filterType]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Customer_Trial_Balance_${(customer.name || "Customer").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
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
      `Trial_Sheet_${(customer.name || "Customer").replace(/\s+/g, "_")}.xlsx`
    );
  };

  const handleWhatsAppShare = () => {
    const phoneClean = (customer.phone || "").replace(/\D/g, "");
    const dateStr = new Date().toLocaleDateString();

    const msg = `Dear ${customer.name},\nTrial Balance Statement from Al Khaleej Lubricants (${dateStr}):\n\n` +
      `▪ Total Purchases (Debit): Rs ${totalDebit.toLocaleString()}\n` +
      `▪ Total Received / Paid (Credit): Rs ${totalCredit.toLocaleString()}\n` +
      `------------------------------------\n` +
      `▪ Net Balance Due: Rs ${currentReceivable.toLocaleString()}\n\n` +
      `Thank you! For any questions, please contact us.`;

    const encoded = encodeURIComponent(msg);
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
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
        <div className="flex items-start justify-between border-b pb-3 print-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <OilDropLogo className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Customer Individual Trial Balance Sheet
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {customer.customerType || "Retail"}
                </Badge>
                <Badge
                  className={`text-[10px] font-semibold ${
                    currentReceivable > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {currentReceivable > 0 ? "Udhar Baqaya (Receivable)" : "Hisab Barabar (Cleared)"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Al-Khaleej Lubricants — Makhsoos Customer Ka Mukammal Khata wa Trial Tawazun.
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
              <span className="font-bold text-sm text-foreground">{customer.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Folio: {customer.folioNumber || "75"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground flex-wrap font-mono text-[11px]">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <PhoneIcon className="size-3 text-emerald-600" />
                  <span>{customer.phone}</span>
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3 text-blue-500" />
                  <span>{customer.city}</span>
                </span>
              )}
              <span>Credit Limit: Rs. {(customer.creditLimit || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right sm:border-s sm:ps-4 border-border/80 shrink-0">
            <span className="text-[10.5px] text-muted-foreground block">Statement Generated</span>
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
              <span className="text-xs font-semibold">Kul Maal Liya / Billed (Debit)</span>
              <ArrowDownLeftIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
              Rs. {totalDebit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Total Invoiced Purchases (Sales & Challans)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Kul Wasooli / Adaigi (Credit)</span>
              <ArrowUpRightIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Rs. {totalCredit.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Total Collections Received (Cash / Bank)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-xs font-semibold">Baqaya Lena Hai / Dues (Balance)</span>
              <ScaleIcon className="size-4" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-500">
              Rs. {currentReceivable.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Net Receivable Balance (Debit - Credit)
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 no-print pt-1">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/80 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "all" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Records ({entries.length})
            </button>
            <button
              onClick={() => setFilterType("sales")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "sales" ? "bg-background text-blue-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Purchases / Bills (Maal)
            </button>
            <button
              onClick={() => setFilterType("payments")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                filterType === "payments" ? "bg-background text-emerald-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Payments (Wasooli)
            </button>
          </div>

          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search reference, items, mode..."
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
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Ref / Bill #</th>
                  <th className="p-2.5">Items & Quantity (L / ML)</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right text-blue-600 dark:text-blue-400">Debit (Maal Liya)</th>
                  <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Credit (Wasooli)</th>
                  <th className="p-2.5 pe-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading customer trial balance postings...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No matching transaction entries found for this customer.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 ps-3 font-mono text-muted-foreground text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-muted-foreground text-[11px]">
                        {new Date(e.date).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            e.type?.includes("Sale") || e.type?.includes("Challan")
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
                      <td className="p-2.5 max-w-[200px] truncate text-[11px] text-muted-foreground">
                        {e.description}
                      </td>
                      <td className="p-2.5 text-muted-foreground text-[11px]">{e.mode}</td>
                      <td className="p-2.5 text-right font-mono font-medium text-blue-500">
                        {e.debit > 0 ? `Rs. ${Number(e.debit).toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-emerald-500">
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
                    Trial Totals (Kul Hisab)
                  </td>
                  <td className="p-2.5 text-right font-mono text-blue-500">
                    Rs. {totalDebit.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-500">
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

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground border-t border-border/80">
          <p>
            System verified automated trial ledger sheet with decimal point &amp; ML volume tracking.
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
              <span>Print Customer Trial Sheet</span>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
