import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { XIcon, PrinterIcon, SendIcon, CheckCircle2Icon } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { numberToWords } from "@/lib/number-to-words";
import { COMPANY_CONFIG } from "@/lib/company-config";

export function PosReceiptModal({ isOpen, onClose, sale }) {
  if (!isOpen || !sale || typeof window === "undefined") return null;

  const handlePrint = () => {
    const orig = document.title;
    const invNo = (sale.saleNumber || sale.challanNumber || "INV-001").replace(/[^a-zA-Z0-9-_]/g, "_");
    const client = (sale.customerName || sale.millName || "Customer").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `Al_Khaleej_Invoice_${invNo}_${client}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const grandTotal = sale.grandTotal || sale.totalAmount || 0;
  const items = sale.items || [
    {
      productName: sale.productName || "MINERAL LUBRICANT OIL",
      unitType: sale.unitType || "Liters",
      quantity: sale.quantityLiters || sale.quantity || 1,
      unitPrice: sale.overrideRate || sale.unitPrice || grandTotal,
      subtotal: grandTotal,
      hsCode: "2710.19.31",
    },
  ];

  const totalQuantityLiters = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleShareWhatsApp = () => {
    const text = `*${COMPANY_CONFIG.name}*\n*PROFORMA / SALES INVOICE*\n*Invoice No:* ${sale.saleNumber || sale.challanNumber || "INV-001"}\n*Buyer:* ${sale.customerName || sale.millName || "Client"}\n*Date:* ${new Date(sale.createdAt || Date.now()).toLocaleDateString()}\n*Total Liters / Qty:* ${totalQuantityLiters}\n*Grand Total:* Rs ${grandTotal.toLocaleString()}\n*Amount in Words:* ${numberToWords(grandTotal)}\n*Proprietor:* ${COMPANY_CONFIG.proprietor}\n*Contact:* ${COMPANY_CONFIG.mobiles}\nThank you for your business!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 6mm;
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
          .a4-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:p-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            <span>Proforma & Commercial Invoice (A4 Standard)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <SendIcon className="size-3.5" />
              <span>Share WhatsApp</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs cursor-pointer bg-primary text-primary-foreground font-medium"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print A4 Invoice</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center print:overflow-visible print:p-0 print:m-0">
          <div className="w-full max-w-[210mm] bg-white text-black p-6 md:p-8 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 print:m-0 a4-sheet relative notranslate" dir="ltr" lang="en">

          <div className="border-b-2 border-black pb-3 mb-3 print:pb-2 print:mb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="Al Khaleej Logo" className="size-12 object-contain" />
                <div>
                  <div className="flex items-baseline gap-2">
                    <h1 className="font-extrabold text-xl tracking-tight text-black uppercase">
                      {COMPANY_CONFIG.name}
                    </h1>
                    <span className="font-bold text-base text-emerald-800" dir="rtl">
                      {COMPANY_CONFIG.nameUrdu}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-800 font-semibold italic">
                    {COMPANY_CONFIG.tagline}
                  </p>
                </div>
              </div>

              <div className="text-right text-[10px] leading-tight">
                <p className="font-bold text-xs text-black uppercase">{COMPANY_CONFIG.proprietor}</p>
                <p className="text-gray-700">{COMPANY_CONFIG.phoneDisplay}</p>
                <p className="text-gray-700">{COMPANY_CONFIG.mobiles}</p>
                <p className="text-gray-700 font-mono text-[9px]">{COMPANY_CONFIG.email}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-300 mt-2 flex justify-between items-center text-[10px] text-gray-700 font-medium">
              <span>{COMPANY_CONFIG.address}</span>
              <span className="font-semibold text-gray-900">Karachi, Pakistan</span>
            </div>
          </div>

          <div className="text-center py-1.5 mb-3">
            <span className="font-black text-sm tracking-wider uppercase underline underline-offset-4 decoration-2">
              SALES INVOICE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-black p-2.5 rounded-xs space-y-1 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-800">
                CUSTOMER / BUYER:
              </p>
              <p className="font-bold text-sm text-black uppercase">
                {sale.customerName || sale.millName || "DIRECT CUSTOMER"}
              </p>
              <p className="text-[11px] text-gray-700 leading-tight">
                {sale.customerAddress || sale.deliveryAddress || "Karachi, Pakistan."}
              </p>
              {sale.customerPhone && (
                <p className="text-[11px] text-gray-800 font-medium">
                  Phone: {sale.customerPhone}
                </p>
              )}
            </div>

            <div className="border border-black p-2.5 rounded-xs space-y-1 bg-white text-right font-mono">
              <p className="text-xs font-bold text-black">
                INVOICE #: {sale.saleNumber || sale.challanNumber || "INV-001"}
              </p>
              <p className="text-[11px] text-gray-800">
                DATE: {new Date(sale.createdAt || Date.now()).toLocaleDateString("en-GB")}
              </p>
              <p className="text-[10px] text-gray-700 font-sans">
                PAYMENT: <strong className="text-black uppercase">{sale.paymentMode || "CASH"}</strong>
              </p>
              <p className="text-[10px] text-gray-700 font-sans">
                TOTAL QUANTITY: <strong>{totalQuantityLiters} UNITS / LTR</strong>
              </p>
            </div>
          </div>

          <div className="mb-4 overflow-hidden border border-black">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200 text-black border-b border-black font-bold uppercase text-[11px]">
                  <th className="py-2 px-3 w-12 text-center border-r border-black">#</th>
                  <th className="py-2 px-3 border-r border-black">PRODUCT / ITEM</th>
                  <th className="py-2 px-3 text-center border-r border-black w-24">QUANTITY</th>
                  <th className="py-2 px-3 text-right border-r border-black w-28">RATE (RS)</th>
                  <th className="py-2 px-3 text-right w-32">TOTAL (RS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-sans">
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="py-2 px-3 text-center font-bold border-r border-black font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-bold text-black uppercase border-r border-black">
                      {item.productName} {item.unitType ? `(${item.unitType})` : ""}
                    </td>
                    <td className="py-2 px-3 text-center font-bold font-mono border-r border-black">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right font-mono border-r border-black">
                      {Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-black">
                      {Number(item.subtotal || item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold border-t-2 border-black">
                  <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider border-r border-black">
                    TOTAL
                  </td>
                  <td className="py-2 px-3 text-center font-mono border-r border-black text-black">
                    {totalQuantityLiters}
                  </td>
                  <td className="py-2 px-3 border-r border-black"></td>
                  <td className="py-2 px-3 text-right font-mono text-sm text-black">
                    Rs {Number(grandTotal).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border border-black p-2.5 rounded-xs bg-gray-50 mb-4 font-mono text-[11px] font-semibold text-black">
            <span>Amount in Words: </span>
            <span className="font-bold underline decoration-1">{numberToWords(grandTotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 items-end">
            <div className="border border-black p-2.5 rounded-xs space-y-0.5 bg-white text-[10px] font-mono leading-relaxed">
              <p className="font-bold text-[11px] text-black">Bank Account Details:</p>
              <p>Account Title: <strong>{COMPANY_CONFIG.bankDetails.accountTitle}</strong></p>
              <p>Account #: <strong>{COMPANY_CONFIG.bankDetails.accountNumber}</strong></p>
              <p>Bank: {COMPANY_CONFIG.bankDetails.bankName} / {COMPANY_CONFIG.bankDetails.branch}</p>
            </div>

            <div className="space-y-8 text-right">
              <div className="flex justify-between items-end gap-4">
                <div className="text-center">
                  <div className="size-14 rounded-full border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-1 text-[7px] font-bold text-gray-800 uppercase tracking-tighter transform -rotate-12 mx-auto mb-1">
                    <span>AL KHALEEJ</span>
                    <span className="text-[5px]">LUBRICANTS</span>
                    <span>OFFICIAL</span>
                  </div>
                  <div className="border-t border-black pt-1 w-32 text-center font-bold text-[9px] uppercase">
                    <p>AL KHALEEJ LUBRICANTS</p>
                    <p className="text-[8px] text-gray-600">SALES DEPARTMENT</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="h-10"></div>
                  <div className="border-t border-black pt-1 w-36 text-center font-bold text-[9px] uppercase">
                    Customer Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-end gap-2 p-3.5 border-t border-border bg-card rounded-b-2xl print:hidden shrink-0">
        <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
          Close Preview
        </Button>
        <Button
          size="sm"
          onClick={handlePrint}
          className="cursor-pointer text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
        >
          <PrinterIcon className="size-3.5" />
          <span>Print A4 Invoice</span>
        </Button>
      </div>
    </div>
  </div>
);

return createPortal(modalContent, document.body);
}
