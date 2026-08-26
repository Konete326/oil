import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { XIcon, PrinterIcon, SendIcon, CheckCircle2Icon } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { numberToWords } from "@/lib/number-to-words";

export function ChallanPrintModal({ isOpen, onClose, challan }) {
  if (!isOpen || !challan || typeof window === "undefined") return null;

  const handlePrint = () => {
    const orig = document.title;
    const dcNo = (challan.challanNumber || "DC-1001").replace(/[^a-zA-Z0-9-_]/g, "_");
    const mill = (challan.millName || "Mill").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `Al_Khaleej_Gate_Pass_${dcNo}_${mill}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const grandTotal = challan.totalAmount || 0;
  const quantityLiters = challan.quantityLiters || 0;

  const handleShareWhatsApp = () => {
    const text = `*AL KHALEEJ LUBRICANTS*\n*DELIVERY CHALLAN & GATE PASS*\n*Challan No:* ${challan.challanNumber}\n*Consignee Mill:* ${challan.millName}\n*Product:* ${challan.productName}\n*Quantity:* ${quantityLiters.toLocaleString()} Liters\n*Vehicle No:* ${challan.vehicleNumber}\n*Driver:* ${challan.driverName} (${challan.driverPhone || "N/A"})\n*Total Bill Amount:* Rs ${grandTotal.toLocaleString()}\n*Amount in Words:* ${numberToWords(grandTotal)}`;
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
            <span>Delivery Challan & Gate Pass (A4 Standard)</span>
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
              <span>Print A4 Challan</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center print:overflow-visible print:p-0 print:m-0">
          <div className="w-full max-w-[210mm] bg-white text-black p-6 md:p-8 rounded-xl shadow-lg border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 print:m-0 a4-sheet relative notranslate" dir="ltr" lang="en">
          <div className="text-center space-y-1 pb-3 print:pb-2 print:pt-0">
            <div className="flex items-center justify-center gap-3">
              <img src={logoImg} alt="Al Khaleej Logo" className="size-10 object-contain" />
              <h1 className="font-extrabold text-xl tracking-tight text-black uppercase">
                AL KHALEEJ LUBRICANTS
              </h1>
            </div>
            <p className="text-[11px] text-gray-700 font-medium">
              PLOT NO. 44/B, SECTOR 15, KORANGI INDUSTRIAL AREA, KARACHI, PAKISTAN.
            </p>
            <p className="text-[10px] text-gray-600">
              TEL: (021) 35091244, 35091245, FAX: (021) 35091246 | NTN: 7894561-2 | STRN: 3277876123456
            </p>
          </div>

          <div className="text-center py-1.5 mb-3 print:py-1 print:mb-2">
            <span className="font-black text-sm tracking-wider uppercase underline underline-offset-4 decoration-2">
              DELIVERY CHALLAN & OFFICIAL GATE PASS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-black p-3 rounded-xs space-y-1 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-800">
                CONSIGNEE / TEXTILE MILL:
              </p>
              <p className="font-bold text-sm text-black uppercase">
                {challan.millName}
              </p>
              <p className="text-[11px] text-gray-700 leading-tight">
                {challan.mill?.zone || "KARACHI INDUSTRIAL TEXTILE ZONE, SINDH"}
              </p>
              <p className="text-[11px] text-gray-800 font-medium">
                DISPATCH STATUS: {challan.gatePassStatus || "DISPATCHED / VERIFIED"}
              </p>
            </div>

            <div className="border border-black p-3 rounded-xs space-y-1 bg-white text-right font-mono">
              <p className="text-[10px] font-sans text-gray-600">
                Date: {new Date(challan.createdAt || Date.now()).toLocaleDateString("en-GB")}
              </p>
              <p className="text-xs font-bold text-black">
                CHALLAN NO: {challan.challanNumber}
              </p>
              <p className="text-[11px] text-gray-800">
                VEHICLE NO: <strong className="text-black uppercase">{challan.vehicleNumber}</strong>
              </p>
              <p className="text-[10px] text-gray-700 font-sans">
                DRIVER: <strong>{challan.driverName}</strong> {challan.driverPhone ? `(${challan.driverPhone})` : ""}
              </p>
              <p className="text-[10px] text-gray-700 font-sans">
                TANKER DIP: <strong>{challan.dipMeasurementInches}" INCHES</strong>
              </p>
            </div>
          </div>

          <div className="mb-4 overflow-hidden border border-black">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200 text-black border-b border-black font-bold uppercase text-[11px]">
                  <th className="py-2 px-3 w-12 text-center border-r border-black">S/L</th>
                  <th className="py-2 px-3 border-r border-black">PARTICULAR / PRODUCT GRADE</th>
                  <th className="py-2 px-3 text-center border-r border-black w-28">HS CODE</th>
                  <th className="py-2 px-3 text-center border-r border-black w-24">LTR / QTY</th>
                  <th className="py-2 px-3 text-right border-r border-black w-28">RATE (RS/L)</th>
                  <th className="py-2 px-3 text-right w-32">TOTAL AMOUNT (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-sans">
                <tr className="border-b border-black">
                  <td className="py-2.5 px-3 text-center font-bold border-r border-black font-mono">1</td>
                  <td className="py-2.5 px-3 font-bold text-black uppercase border-r border-black">
                    {challan.productName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono border-r border-black text-gray-800">
                    2710.19.31
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono border-r border-black">
                    {quantityLiters.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-black">
                    {Number(challan.overrideRate || challan.ratePerLiter || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-black">
                    {Number(grandTotal).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-gray-100 font-bold border-t-2 border-black">
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider border-r border-black">
                    TOTAL
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono border-r border-black text-black">
                    {quantityLiters.toLocaleString()} LTR
                  </td>
                  <td className="py-2.5 px-3 border-r border-black"></td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-black">
                    Rs {Number(grandTotal).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border border-black p-2.5 rounded-xs bg-gray-50 mb-6 font-mono text-[11px] font-semibold text-black">
            <span>IN Word Total PKR : </span>
            <span className="font-bold underline decoration-1">{numberToWords(grandTotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2 items-end">
            <div className="border border-black p-3 rounded-xs space-y-1 bg-white text-[10px] font-mono leading-relaxed">
              <p className="font-bold text-[11px] text-black">GATE PASS VERIFICATION</p>
              <p>Vehicle Dispatched from Main Depot</p>
              <p>Tanker Seal Number Verified</p>
              <p>Security Checkpoint: Cleared & Logged</p>
            </div>

            <div className="space-y-12 text-right">
              <div className="flex justify-between items-end gap-4">
                <div className="text-center">
                  <div className="size-16 rounded-full border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-gray-800 uppercase tracking-tighter transform -rotate-12 mx-auto mb-1">
                    <span>AL KHALEEJ</span>
                    <span className="text-[6px]">CO. NO. 323096-W</span>
                    <span>DISPATCH LOG</span>
                  </div>
                  <div className="border-t border-black pt-1 w-36 text-center font-bold text-[9px] uppercase">
                    <p>AL KHALEEJ LUBRICANTS</p>
                    <p className="text-[8px] text-gray-600">DISPATCH DEPARTMENT</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="h-14"></div>
                  <div className="border-t border-black pt-1 w-44 text-center font-bold text-[9px] uppercase">
                    MILL RECEIVER SIGN & STAMP
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
          <span>Print A4 Challan</span>
        </Button>
      </div>
    </div>
  </div>
);

return createPortal(modalContent, document.body);
}
