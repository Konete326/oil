import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  XIcon,
  PrinterIcon,
  SendIcon,
  CheckCircle2Icon,
  CreditCardIcon,
} from "lucide-react";
import { OilDropLogo } from "@/components/logo";
import { cn } from "@/lib/utils";

function getProcessedItems(sale) {
  const grandTotal = Number(sale.grandTotal || sale.totalAmount || 0);
  const rawItems = sale.items || [
    {
      productName: sale.productName || "MINERAL LUBRICANT OIL",
      unitType: sale.unitType || "4L",
      quantity: sale.quantityLiters || sale.quantity || 1,
      unitPrice: sale.overrideRate || sale.unitPrice || grandTotal,
      subtotal: grandTotal,
    },
  ];

  return rawItems.map((item) => {
    let packing = item.packing || item.unitType || "";
    const qty = Number(item.quantity) || 1;
    let qtyDisplay = String(qty);

    if (qty < 1) {
      qtyDisplay = `${Math.round(qty * 1000)} ML`;
      packing = "ML";
    } else if (qty % 1 !== 0) {
      qtyDisplay = `${qty} L (${Math.round(qty * 1000)} ML)`;
      if (!packing || packing === "Ltr" || packing === "Liters") packing = "Ltr / ML";
    } else if (!packing) {
      const match = (item.productName || "").match(/(\d+\s*(?:L|Ltr|Liter|Litre|KG|Can|Drum))/i);
      packing = match ? match[1].toUpperCase() : "Ltr";
    }

    const rate = Number(item.unitPrice || item.sellingPrice || item.price || 0) || (item.subtotal ? Math.round(item.subtotal / qty) : 0);
    const amount = Number(item.subtotal || item.totalPrice) || (qty * rate) || 0;
    return {
      qty: qtyDisplay,
      packing,
      name: item.productName || "Lubricant Product",
      rate,
      amount,
    };
  });
}

function CashMemoBody({ sale, copyLabel = "" }) {
  const isCredit =
    Boolean(sale.isCredit) ||
    (sale.paymentMode || "").toLowerCase().includes("credit") ||
    (sale.paymentMode || "").toLowerCase().includes("khata");

  const grandTotal = Number(sale.grandTotal || sale.totalAmount || 0);
  const cashReceived = Number(sale.cashReceived || (isCredit ? 0 : grandTotal));
  const balanceDue = Math.max(0, grandTotal - cashReceived);

  const items = getProcessedItems(sale);
  const minRows = 3;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  const memoNumber = sale.saleNumber || sale.challanNumber || "7741";
  const memoDate = new Date(sale.createdAt || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-full bg-white text-slate-900 border-2 border-slate-900 rounded-lg p-3 sm:p-5 flex flex-col justify-between font-sans text-xs relative select-none leading-normal overflow-hidden">
      {copyLabel && (
        <span className="absolute top-2 right-2 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 border border-slate-400 rounded text-slate-600 bg-slate-50">
          {copyLabel}
        </span>
      )}

      <div>
        <div className="text-center pb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase border-b border-slate-700 pb-0.5 px-3">
            Bill / Cash Memo
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="size-11 rounded-full border border-slate-900 p-1 flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-2xs">
              <OilDropLogo className="size-8" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase leading-none font-mono">
                AL KHALEEJ LUBRICANTS
              </h1>
              <p className="text-[10px] font-bold text-slate-700 tracking-wide mt-0.5">
                Industrial, Automotive Lubricants & Greases
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-[9.5px] leading-tight text-slate-800">
            <p className="font-semibold">Shop No. 23, Near Fatima Jinnah Girls College,</p>
            <p>Nishter Road, Garden, Karachi.</p>
            <p className="font-mono pt-0.5 font-bold">
              Ph: 32256267 | Mob: 0300-2205541
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-y-1.5 gap-x-2 py-2.5 text-xs border-b border-slate-800">
          <div className="col-span-6 sm:col-span-8 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">No.</span>
            <span className="font-mono font-black text-sm text-slate-950 px-1 border-b border-slate-400 flex-1 truncate">
              {memoNumber}
            </span>
          </div>

          <div className="col-span-6 sm:col-span-4 flex items-baseline gap-1.5 justify-end min-w-0">
            <span className="font-bold text-slate-900 shrink-0">Date:</span>
            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 px-1 text-right min-w-[70px]">
              {memoDate}
            </span>
          </div>

          <div className="col-span-12 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">M/s.</span>
            <span className="font-bold text-slate-950 text-xs border-b border-slate-400 px-1 flex-1 uppercase truncate">
              {sale.customerName || sale.millName || "Walk-in Customer"}
            </span>
          </div>

          <div className="col-span-7 sm:col-span-8 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">Address:</span>
            <span className="text-slate-800 text-[11px] border-b border-slate-400 px-1 flex-1 truncate">
              {sale.customerAddress || sale.customerPhone || "Karachi, Pakistan"}
            </span>
          </div>

          <div className="col-span-5 sm:col-span-4 flex items-baseline gap-1.5 justify-end min-w-0">
            <span className="font-bold text-slate-900 shrink-0">V.No.</span>
            <span className="font-mono text-slate-900 text-[11px] border-b border-slate-400 px-1 text-right min-w-[60px] truncate">
              {sale.vehicleNumber || sale.referenceNo || "-"}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto my-2">
          <table className="w-full text-xs border-collapse border border-slate-900 min-w-[320px] sm:min-w-0">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-950 font-bold">
                <th className="border-r border-slate-900 py-1.5 px-1.5 text-center w-[12%]">Qty.</th>
                <th className="border-r border-slate-900 py-1.5 px-1.5 text-center w-[16%]">Packing</th>
                <th className="border-r border-slate-900 py-1.5 px-2 text-left">Description</th>
                <th className="border-r border-slate-900 py-1.5 px-1.5 text-right w-[18%]">Rate</th>
                <th className="py-1.5 px-2 text-right w-[20%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={i} className="border-b border-slate-300">
                  <td className="border-r border-slate-900 py-1.5 px-1.5 text-center font-mono font-semibold">
                    {row.qty}
                  </td>
                  <td className="border-r border-slate-900 py-1.5 px-1.5 text-center font-medium text-[11px]">
                    {row.packing}
                  </td>
                  <td className="border-r border-slate-900 py-1.5 px-2 font-bold text-slate-950 break-words">
                    {row.name}
                  </td>
                  <td className="border-r border-slate-900 py-1.5 px-1.5 text-right font-mono font-medium whitespace-nowrap">
                    {row.rate.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                    {row.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-slate-200 h-6">
                  <td className="border-r border-slate-900 py-1"></td>
                  <td className="border-r border-slate-900 py-1"></td>
                  <td className="border-r border-slate-900 py-1"></td>
                  <td className="border-r border-slate-900 py-1"></td>
                  <td className="py-1"></td>
                </tr>
              ))}

              <tr className="border-t-2 border-slate-900 bg-slate-50 font-black">
                <td colSpan={4} className="border-r border-slate-900 py-1.5 px-3 text-right text-xs uppercase tracking-wider font-mono">
                  Total (PKR)
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-sm text-slate-950 whitespace-nowrap">
                  Rs {grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-1.5 pt-2 border-t border-dashed border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div>
            {isCredit ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold uppercase px-2 py-0.5 bg-amber-100 border border-amber-400 text-amber-900 rounded text-[10px]">
                  CREDIT / ON ACCOUNT
                </span>
                {cashReceived > 0 && (
                  <span className="font-mono text-slate-700">
                    Paid: Rs {cashReceived.toLocaleString()} | Balance Due: <strong>Rs {balanceDue.toLocaleString()}</strong>
                  </span>
                )}
                {cashReceived === 0 && (
                  <span className="font-mono font-bold text-red-700">
                    Total Due: Rs {grandTotal.toLocaleString()}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-extrabold uppercase px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded text-[10px]">
                PAID IN FULL (CASH)
              </span>
            )}
          </div>

          <div className="font-mono text-[10px] text-slate-600">
            Terms: Goods once sold will not be returned or exchanged.
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 border-t border-slate-900 mt-3">
        <div className="text-[10px] text-slate-600 space-y-0.5">
          <p className="font-semibold text-slate-800">Thank you for your business!</p>
          <p>Computer generated invoice copy.</p>
        </div>

        <div className="text-right ml-auto sm:ml-0">
          <p className="text-[10px] font-bold uppercase text-slate-900 font-mono">
            For: AL KHALEEJ LUBRICANTS
          </p>
          <div className="w-36 border-b border-slate-800 mt-5 ml-auto"></div>
          <p className="text-[9px] text-slate-600 pt-0.5">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
}

function CreditMemoBody({ sale, copyLabel = "" }) {
  const grandTotal = Number(sale.grandTotal || sale.totalAmount || 0);
  const cashReceived = Number(sale.cashReceived || 0);
  const balanceDue = Math.max(0, grandTotal - cashReceived);

  const items = getProcessedItems(sale);
  const minRows = 3;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  const memoNumber = sale.saleNumber || sale.challanNumber || "3546";
  const memoDate = new Date(sale.createdAt || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-full bg-white text-slate-900 border-2 border-red-700 rounded-lg p-3 sm:p-5 flex flex-col justify-between font-sans text-xs relative select-none leading-normal overflow-hidden">
      {copyLabel && (
        <span className="absolute top-2 right-2 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 border border-red-400 rounded text-red-700 bg-red-50">
          {copyLabel}
        </span>
      )}

      <div>
        <div className="text-center pb-1">
          <span className="text-[12px] font-black tracking-wider uppercase text-red-700 border-b-2 border-red-600 pb-0.5 px-4 font-mono">
            Credit Memo
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 pb-3 border-b-2 border-red-700">
          <div className="flex items-center gap-2.5">
            <div className="size-11 rounded-full border-2 border-red-700 p-1 flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-2xs">
              <OilDropLogo className="size-8" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-red-700 uppercase leading-none font-mono">
                AL KHALEEJ LUBRICANTS
              </h1>
              <p className="text-[9.5px] font-bold text-slate-800 tracking-wide mt-0.5">
                Industrial & Automotive Lubricants
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-[9.5px] leading-tight text-slate-800">
            <p className="font-semibold">Shop No. 23, Near Fatima Jinnah Girls College,</p>
            <p>Nishter Road, Garden, Karachi.</p>
            <p className="font-mono pt-0.5 font-bold text-red-700">
              Cell: 0300-2205541, 0334-2878851
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-y-1.5 gap-x-2 py-2.5 text-xs border-b border-red-300">
          <div className="col-span-4 sm:col-span-4 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">No.</span>
            <span className="font-mono font-black text-sm text-red-700 px-1 border-b border-red-300 flex-1 truncate">
              {memoNumber}
            </span>
          </div>

          <div className="col-span-4 sm:col-span-4 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">Vehicle:</span>
            <span className="font-mono text-slate-900 text-[11px] border-b border-red-300 px-1 flex-1 truncate">
              {sale.vehicleNumber || sale.referenceNo || "-"}
            </span>
          </div>

          <div className="col-span-4 sm:col-span-4 flex items-baseline gap-1.5 justify-end min-w-0">
            <span className="font-bold text-slate-900 shrink-0">Date:</span>
            <span className="font-mono font-bold text-slate-950 border-b border-red-300 px-1 text-right min-w-[70px]">
              {memoDate}
            </span>
          </div>

          <div className="col-span-12 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">M/s.</span>
            <span className="font-bold text-slate-950 text-xs border-b border-red-300 px-1 flex-1 uppercase truncate">
              {sale.customerName || sale.millName || "Credit Customer"}
            </span>
          </div>

          <div className="col-span-12 flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 shrink-0">Address:</span>
            <span className="text-slate-800 text-[11px] border-b border-red-300 px-1 flex-1 truncate">
              {sale.customerAddress || sale.customerPhone || "Karachi, Pakistan"}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto my-2">
          <table className="w-full text-xs border-collapse border border-red-700 min-w-[320px] sm:min-w-0">
            <thead>
              <tr className="bg-red-700 text-white font-bold border-b border-red-800">
                <th className="border-r border-red-600 py-1.5 px-1.5 text-center w-[12%]">Qty.</th>
                <th className="border-r border-red-600 py-1.5 px-1.5 text-center w-[16%]">Packing</th>
                <th className="border-r border-red-600 py-1.5 px-2 text-left">Description</th>
                <th className="border-r border-red-600 py-1.5 px-1.5 text-right w-[18%]">Rate</th>
                <th className="py-1.5 px-2 text-right w-[20%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={i} className="border-b border-red-200">
                  <td className="border-r border-red-300 py-1.5 px-1.5 text-center font-mono font-semibold">
                    {row.qty}
                  </td>
                  <td className="border-r border-red-300 py-1.5 px-1.5 text-center font-medium text-[11px]">
                    {row.packing}
                  </td>
                  <td className="border-r border-red-300 py-1.5 px-2 font-bold text-slate-950 break-words">
                    {row.name}
                  </td>
                  <td className="border-r border-red-300 py-1.5 px-1.5 text-right font-mono font-medium whitespace-nowrap">
                    {row.rate.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                    {row.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-red-100 h-6">
                  <td className="border-r border-red-300 py-1"></td>
                  <td className="border-r border-red-300 py-1"></td>
                  <td className="border-r border-red-300 py-1"></td>
                  <td className="border-r border-red-300 py-1"></td>
                  <td className="py-1"></td>
                </tr>
              ))}

              <tr className="border-t-2 border-red-700 bg-red-50 font-black">
                <td colSpan={4} className="border-r border-red-700 py-1.5 px-3 text-right text-xs uppercase tracking-wider font-mono text-red-700">
                  Total
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-sm text-red-700 whitespace-nowrap">
                  Rs {grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-1.5 pt-2 border-t border-dashed border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold uppercase px-2 py-0.5 bg-red-100 border border-red-400 text-red-900 rounded text-[10px]">
              CREDIT MEMO / ON ACCOUNT
            </span>
            {cashReceived > 0 ? (
              <span className="font-mono text-slate-700">
                Paid: Rs {cashReceived.toLocaleString()} | Balance Due: <strong className="text-red-700">Rs {balanceDue.toLocaleString()}</strong>
              </span>
            ) : (
              <span className="font-mono font-bold text-red-700">
                Total Due: Rs {grandTotal.toLocaleString()}
              </span>
            )}
          </div>

          <div className="font-mono text-[10px] text-slate-600">
            Goods delivered on credit terms.
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 border-t border-red-700 mt-3">
        <div className="text-[10px] text-slate-600 space-y-0.5">
          <p className="font-semibold text-red-800">Credit Account Document</p>
          <p>Authorized commercial delivery receipt.</p>
        </div>

        <div className="text-right ml-auto sm:ml-0">
          <p className="text-[10px] font-bold text-red-700 font-mono uppercase">
            Signature / Receiver:
          </p>
          <div className="w-40 border-b-2 border-red-700 mt-5 ml-auto"></div>
          <p className="text-[9px] text-slate-600 pt-0.5">Customer / Receiver Signature</p>
        </div>
      </div>
    </div>
  );
}

export function PosReceiptModal({ isOpen, onClose, sale }) {
  const isSaleCredit = Boolean(
    sale?.isCredit ||
    (sale?.paymentMode || "").toLowerCase().includes("credit") ||
    (sale?.paymentMode || "").toLowerCase().includes("khata")
  );

  const [memoType, setMemoType] = useState(() => (isSaleCredit ? "credit" : "cash"));
  const [printLayout, setPrintLayout] = useState("single");

  if (!isOpen || !sale || typeof window === "undefined") return null;

  const grandTotal = Number(sale.grandTotal || sale.totalAmount || 0);

  const handlePrint = () => {
    const orig = document.title;
    const invNo = (sale.saleNumber || sale.challanNumber || "3546").replace(/[^a-zA-Z0-9-_]/g, "_");
    const client = (sale.customerName || sale.millName || "Customer").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `${memoType === "credit" ? "CreditMemo" : "CashMemo"}_${invNo}_${client}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleShareWhatsApp = () => {
    const invNo = sale.saleNumber || sale.challanNumber || "3546";
    const client = sale.customerName || sale.millName || "Customer";
    const dateStr = new Date(sale.createdAt || Date.now()).toLocaleDateString("en-GB");

    const text =
      `*AL KHALEEJ LUBRICANTS*\n` +
      `*${memoType === "credit" ? "CREDIT MEMO" : "BILL / CASH MEMO"}*\n` +
      `*Memo No:* ${invNo}\n` +
      `*Customer (M/s):* ${client}\n` +
      `*Date:* ${dateStr}\n` +
      `------------------------------------\n` +
      (sale.items || [])
        .map((it) => {
          const qty = Number(it.quantity) || 1;
          const qtyLabel = qty < 1 ? `${Math.round(qty * 1000)} ML` : (qty % 1 !== 0 ? `${qty} L (${Math.round(qty * 1000)} ML)` : `${qty} L`);
          return `• ${qtyLabel} x ${it.productName} = Rs ${(it.subtotal || it.quantity * it.unitPrice || 0).toLocaleString()}`;
        })
        .join("\n") +
      `\n------------------------------------\n` +
      `*Total Amount:* Rs ${grandTotal.toLocaleString()}\n` +
      `*Status:* ${memoType === "credit" ? "CREDIT / UNPAID" : "PAID IN FULL"}\n` +
      `Shop No. 23, Nishter Road, Karachi | Ph: 0300-2205541`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-portal {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-2xl max-h-[94vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:p-0 print:block print:bg-white">
        
        <div className="w-full flex items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            {memoType === "credit" ? (
              <CreditCardIcon className="size-4 text-red-600" />
            ) : (
              <CheckCircle2Icon className="size-4 text-emerald-500" />
            )}
            <span>{memoType === "credit" ? "Credit Memo (Red Pad)" : "Cash Memo (Black Pad)"}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-[11px]">
              <button
                type="button"
                onClick={() => setMemoType("cash")}
                className={cn(
                  "px-2 py-1 rounded font-semibold cursor-pointer transition-colors",
                  memoType === "cash" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Bill / Cash Memo (Black/Blue Pad)"
              >
                Cash Memo
              </button>

              <button
                type="button"
                onClick={() => setMemoType("credit")}
                className={cn(
                  "px-2 py-1 rounded font-bold cursor-pointer transition-colors",
                  memoType === "credit" ? "bg-red-700 text-white shadow-2xs" : "text-red-600 hover:text-red-700"
                )}
                title="Credit Memo (Red Pad for Credit)"
              >
                Credit Memo (Credit)
              </button>
            </div>

            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-[11px]">
              <button
                type="button"
                onClick={() => setPrintLayout("single")}
                className={cn(
                  "px-2 py-1 rounded font-semibold cursor-pointer transition-colors",
                  printLayout === "single" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Single Pad Copy"
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout("duplicate")}
                className={cn(
                  "px-2 py-1 rounded font-semibold cursor-pointer transition-colors",
                  printLayout === "duplicate" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Customer Copy + Office Copy on 1 A4 Page"
              >
                Duplicate (2-in-1)
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white h-7.5"
            >
              <SendIcon className="size-3" />
              <span>WhatsApp</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className={cn(
                "gap-1.5 text-xs cursor-pointer text-white font-semibold h-7.5",
                memoType === "credit" ? "bg-red-700 hover:bg-red-800" : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              <PrinterIcon className="size-3" />
              <span>Print Memo</span>
            </Button>

            <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer size-7.5">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center print:overflow-visible print:p-0 print:m-0 space-y-4">
          {memoType === "credit" ? (
            <CreditMemoBody sale={sale} copyLabel={printLayout === "duplicate" ? "Original / Customer Copy" : ""} />
          ) : (
            <CashMemoBody sale={sale} copyLabel={printLayout === "duplicate" ? "Original / Customer Copy" : ""} />
          )}

          {printLayout === "duplicate" && (
            <>
              <div className="w-full border-t-2 border-dashed border-slate-400 my-2 text-center relative print:block">
                <span className="bg-white px-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest relative -top-2">
                  ✂ Cut Here / Perforated Line
                </span>
              </div>
              {memoType === "credit" ? (
                <CreditMemoBody sale={sale} copyLabel="Office / Shop Copy" />
              ) : (
                <CashMemoBody sale={sale} copyLabel="Office / Shop Copy" />
              )}
            </>
          )}
        </div>

        <div className="w-full flex items-center justify-between p-3 border-t border-border bg-card rounded-b-2xl print:hidden shrink-0 text-xs text-muted-foreground">
          <span className="text-[11px] font-mono">
            {memoType === "credit"
              ? "Red Credit Memo format: Exactly matches Al Khaleej red booklet for Udhar sales."
              : "Black Bill / Cash Memo format: Matches physical booklet for retail cash sales."}
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs h-7">
            Close
          </Button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
