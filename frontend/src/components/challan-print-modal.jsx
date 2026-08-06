import { Button } from "@/components/ui/button";
import { XIcon, PrinterIcon, ShieldCheckIcon } from "lucide-react";
import logoImg from "@/assets/logo.png";

export function ChallanPrintModal({ isOpen, onClose, challan }) {
  if (!isOpen || !challan) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-background p-8 shadow-2xl space-y-6 my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:p-0">
        <div className="flex items-center justify-between border-b pb-4 print:hidden">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <ShieldCheckIcon className="size-5 text-primary" />
            <span>Delivery Challan & Official Gate Pass Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 cursor-pointer">
              <PrinterIcon className="size-4" />
              Print Gate Pass (A4)
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="border border-border p-6 rounded-lg space-y-6 bg-card text-foreground print:bg-white print:text-black print:border-black">
          <div className="flex items-start justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Al Khaleej Lubricants" className="size-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">AL KHALEEJ LUBRICANTS</h1>
                <p className="text-xs text-muted-foreground print:text-gray-600">Industrial & Textile Lubricant Suppliers, Karachi</p>
                <p className="text-[11px] text-muted-foreground print:text-gray-600">NTN: 8941203-7 | Phone: 021-35091244</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-primary/10 text-primary font-bold px-3 py-1 text-sm font-mono border border-primary/20 print:border-black print:text-black">
                {challan.challanNumber}
              </span>
              <p className="text-xs font-mono mt-1 text-muted-foreground print:text-gray-600">
                Date: {new Date(challan.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4">
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground print:text-gray-700">CONSIGNEE / TEXTILE MILL:</p>
              <p className="font-bold text-sm text-foreground print:text-black">{challan.millName}</p>
              <p className="text-muted-foreground print:text-gray-600">{challan.mill?.zone || "Karachi Industrial Area"}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="font-semibold text-muted-foreground print:text-gray-700">TANKER DISPATCH DETAILS:</p>
              <p className="font-mono font-bold text-sm text-foreground print:text-black">Vehicle No: {challan.vehicleNumber}</p>
              <p className="text-muted-foreground print:text-gray-600">Driver: {challan.driverName} ({challan.driverPhone || "N/A"})</p>
            </div>
          </div>

          <div className="space-y-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 print:bg-gray-100 font-semibold">
                  <th className="p-2">Description / Grade</th>
                  <th className="p-2 text-center">Dip (Inches)</th>
                  <th className="p-2 text-center">Dispatched Vol (Liters)</th>
                  <th className="p-2 text-right">Rate (Rs/L)</th>
                  <th className="p-2 text-right">Total Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">{challan.productName}</td>
                  <td className="p-2 text-center font-mono">{challan.dipMeasurementInches}"</td>
                  <td className="p-2 text-center font-mono font-bold">{challan.quantityLiters?.toLocaleString()} L</td>
                  <td className="p-2 text-right font-mono">Rs {challan.ratePerLiter}</td>
                  <td className="p-2 text-right font-mono font-bold">Rs {challan.totalAmount?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-end border-t pt-4">
            <div className="text-xs space-y-1">
              <p className="font-medium text-muted-foreground print:text-gray-600">Status: <span className="font-bold text-foreground print:text-black">{challan.gatePassStatus}</span></p>
              {challan.notes && <p className="text-[11px] text-muted-foreground print:text-gray-600">Notes: {challan.notes}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground print:text-gray-700">Net Payable Amount</p>
              <p className="text-xl font-bold font-mono text-primary print:text-black">Rs {challan.totalAmount?.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs font-medium text-muted-foreground print:text-black border-t">
            <div>
              <div className="border-b border-dashed border-gray-400 mb-1" />
              <span>Driver Signature</span>
            </div>
            <div>
              <div className="border-b border-dashed border-gray-400 mb-1" />
              <span>Gate Security Verified</span>
            </div>
            <div>
              <div className="border-b border-dashed border-gray-400 mb-1" />
              <span>Authorized Manager Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
