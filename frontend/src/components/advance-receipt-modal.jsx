import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { XIcon, PrinterIcon, SendIcon, CheckCircle2Icon, HandCoinsIcon } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { numberToWords } from "@/lib/number-to-words";
import { COMPANY_CONFIG } from "@/lib/company-config";

export function AdvanceReceiptModal({ isOpen, onClose, voucher }) {
  if (!isOpen || !voucher || typeof window === "undefined") return null;

  const handlePrint = () => {
    const orig = document.title;
    const vNo = (voucher.voucherNumber || "ADV-VOUCHER").replace(/[^a-zA-Z0-9-_]/g, "_");
    const emp = (voucher.employeeName || "Employee").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `Al_Khaleej_Advance_Voucher_${vNo}_${emp}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const advanceAmount = Number(voucher.amount || 0);

  const handleShareWhatsApp = () => {
    const text = `*${COMPANY_CONFIG.name}*\n*STAFF ADVANCE CASH VOUCHER*\n*Voucher #:* ${voucher.voucherNumber}\n*Date:* ${new Date(voucher.date || Date.now()).toLocaleDateString("en-GB")}\n*Employee:* ${voucher.employeeName} (${voucher.designation || "Staff"})\n*Advance Amount:* Rs. ${advanceAmount.toLocaleString()}\n*Amount in Words:* ${numberToWords(advanceAmount)}\n*Payment Mode:* ${voucher.paymentMode || "Cash"}\n*Reason:* ${voucher.reason || "Staff Advance Salary"}\n*New Advance Balance:* Rs. ${(voucher.newAdvanceBalance || 0).toLocaleString()}\n*Proprietor:* ${COMPANY_CONFIG.proprietor}\n*Contact:* ${COMPANY_CONFIG.mobiles}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 6mm;
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
          .advance-slip {
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

      <div className="w-full max-w-lg max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:my-0 print:p-0 print:block print:bg-white">
        <div className="w-full flex items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <HandCoinsIcon className="size-4 text-amber-500" />
            <span>Staff Advance Cash Payment Voucher</span>
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
              <span>Print Voucher</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center print:overflow-visible print:p-0 print:m-0">
          <div className="w-full bg-white text-black p-6 rounded-xl border border-black font-sans text-xs print:border-none print:p-0 print:m-0 advance-slip relative notranslate" dir="ltr" lang="en">
            
            <div className="border-b-2 border-black pb-3 mb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2.5">
                  <img src={logoImg} alt="Al Khaleej Logo" className="size-10 object-contain" />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <h1 className="font-extrabold text-base tracking-tight text-black uppercase">
                        {COMPANY_CONFIG.name}
                      </h1>
                      <span className="font-bold text-xs text-emerald-800" dir="rtl">
                        {COMPANY_CONFIG.nameUrdu}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-700 font-semibold italic">
                      {COMPANY_CONFIG.tagline}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[9px] leading-tight">
                  <p className="font-bold text-xs text-black uppercase">{COMPANY_CONFIG.proprietor}</p>
                  <p className="text-gray-700">{COMPANY_CONFIG.phoneDisplay}</p>
                  <p className="text-gray-700">{COMPANY_CONFIG.mobiles}</p>
                </div>
              </div>

              <div className="pt-1.5 border-t border-gray-300 mt-2 flex justify-between items-center text-[9px] text-gray-700 font-medium">
                <span>{COMPANY_CONFIG.address}</span>
                <span className="font-semibold text-gray-900">Karachi, Pakistan</span>
              </div>
            </div>

            <div className="text-center py-1 mb-3 bg-gray-100 border border-black">
              <span className="font-black text-xs tracking-wider uppercase">
                STAFF ADVANCE CASH PAYMENT VOUCHER
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 border border-black p-2.5 rounded-xs bg-white text-[11px]">
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-gray-600">Employee Details:</p>
                <p className="font-bold text-xs text-black uppercase">{voucher.employeeName}</p>
                <p className="text-[10px] text-gray-700">{voucher.designation || "Staff"} · {voucher.department || "General"}</p>
                {voucher.phone && <p className="text-[10px] text-gray-700">Phone: {voucher.phone}</p>}
              </div>

              <div className="space-y-1 text-right font-mono">
                <p className="text-xs font-bold text-black">VOUCHER #: {voucher.voucherNumber}</p>
                <p className="text-[10px] text-gray-800">Date: {new Date(voucher.date || Date.now()).toLocaleDateString("en-GB")}</p>
                <p className="text-[10px] text-gray-800">Payment: <strong className="text-black uppercase">{voucher.paymentMode || "Cash"}</strong></p>
              </div>
            </div>

            <div className="border-2 border-black p-3 bg-amber-50/60 rounded-xs mb-3 space-y-1 text-center">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">Advance Amount Paid</span>
              <div className="text-xl font-bold font-mono text-black">
                Rs. {advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] font-semibold text-gray-800 italic pt-0.5">
                ({numberToWords(advanceAmount)})
              </p>
            </div>

            <div className="border border-black p-2.5 rounded-xs bg-white mb-4 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Purpose / Reason:</span>
                <span className="font-semibold text-black">{voucher.reason || voucher.notes || "Personal / Emergency Advance"}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-mono">
                <span className="text-gray-700">New Total Outstanding Advance Balance:</span>
                <span className="font-bold text-amber-700">Rs. {(voucher.newAdvanceBalance || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 items-end text-center text-[9px] uppercase font-bold">
              <div>
                <div className="border-t border-black pt-1 w-36 mx-auto">
                  Employee Signature
                </div>
              </div>
              <div>
                <div className="border-t border-black pt-1 w-36 mx-auto">
                  Authorized Sign / Cashier
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
