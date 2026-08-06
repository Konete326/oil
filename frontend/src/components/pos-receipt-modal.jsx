import { Button } from "@/components/ui/button";
import { XIcon, PrinterIcon, CheckCircle2Icon } from "lucide-react";
import logoImg from "@/assets/logo.png";

export function PosReceiptModal({ isOpen, onClose, sale }) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4 my-8 print:border-none print:shadow-none print:w-full print:max-w-none print:p-0">
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            <span>POS Sale Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1 text-xs cursor-pointer">
              <PrinterIcon className="size-3.5" />
              Print Thermal Receipt
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="border border-border p-5 rounded-lg space-y-4 bg-card text-foreground font-mono text-xs print:bg-white print:text-black print:border-black print:p-2">
          <div className="text-center space-y-1 border-b pb-3">
            <img src={logoImg} alt="EliteDev" className="size-8 mx-auto object-contain" />
            <h2 className="font-bold text-sm tracking-tight text-foreground print:text-black">ELITEDEV OIL TRADERS</h2>
            <p className="text-[10px] text-muted-foreground print:text-gray-600">POS Counter Retail & Wholesale</p>
            <p className="text-[10px] text-muted-foreground print:text-gray-600">Phone: 021-35091244 | Karachi</p>
          </div>

          <div className="space-y-1 text-[11px] border-b pb-2">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-bold">{sale.saleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(sale.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Sale Type / Mode:</span>
              <span>{sale.saleType} ({sale.paymentMode})</span>
            </div>
          </div>

          <div className="space-y-2 border-b pb-3">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b text-muted-foreground print:text-gray-700">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1.5 pe-1 font-medium">
                      {item.productName}
                      <span className="block text-[9px] text-muted-foreground">({item.unitType})</span>
                    </td>
                    <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                    <td className="py-1.5 text-right">Rs {item.unitPrice}</td>
                    <td className="py-1.5 text-right font-bold">Rs {item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-muted-foreground print:text-gray-600">
              <span>Subtotal:</span>
              <span>Rs {sale.subtotal?.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-amber-500">
                <span>Discount:</span>
                <span>-Rs {sale.discount}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST Tax:</span>
                <span>+Rs {sale.taxAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-foreground print:text-black border-t pt-1.5">
              <span>GRAND TOTAL:</span>
              <span>Rs {sale.grandTotal?.toLocaleString()}</span>
            </div>

            {sale.cashReceived > 0 && (
              <div className="pt-1 text-[10px] space-y-0.5 text-muted-foreground border-t border-dashed">
                <div className="flex justify-between">
                  <span>Cash Received:</span>
                  <span>Rs {sale.cashReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change Due:</span>
                  <span>Rs {sale.changeDue}</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center pt-3 border-t text-[10px] text-muted-foreground print:text-gray-600 space-y-0.5">
            <p>Thank you for doing business with us!</p>
            <p>Products once sold are non-refundable.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
