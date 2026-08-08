import { Button } from "@/components/ui/button";
import { PrinterIcon, XIcon, Building2Icon, FileTextIcon } from "lucide-react";

export function CustomerPrintStatement({ isOpen, onClose, customer, summary, posSales, ledgerEntries }) {
  if (!isOpen || !customer) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 print:hidden">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <PrinterIcon className="size-4 text-primary" />
            A4 Print Statement Preview
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} size="sm" className="gap-1.5 cursor-pointer text-xs font-semibold">
              <PrinterIcon className="size-3.5" />
              Print A4 Document
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="size-7 cursor-pointer">
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-8 text-foreground bg-white dark:bg-zinc-950 print:p-0 print:bg-white print:text-black">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #printable-a4-area, #printable-a4-area * { visibility: visible; }
              #printable-a4-area { position: absolute; left: 0; top: 0; width: 100%; font-size: 11px; padding: 20px; }
              @page { size: A4; margin: 15mm; }
            }
          `}</style>

          <div id="printable-a4-area" className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-5">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-primary flex items-center gap-2">
                  <Building2Icon className="size-6 text-primary" />
                  AL KHALEEJ LUBRICANTS LLC
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  High Performance Industrial & Automotive Lubricants
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Plot #45, Industrial Zone, Karachi, Pakistan | Phone: +92 21 34567890
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded border border-primary/20">
                  CUSTOMER STATEMENT
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Date: <strong className="text-foreground">{currentDate}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-muted/20">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Customer Details</p>
                <h2 className="text-sm font-bold text-foreground">{customer.name}</h2>
                <p className="text-xs text-muted-foreground">Phone: {customer.phone || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Address: {customer.address || "N/A"}, {customer.city}</p>
                <p className="text-xs text-muted-foreground">Category: <span className="font-semibold text-foreground">{customer.customerType}</span></p>
              </div>
              <div className="space-y-1 text-right border-l border-border pl-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Account Summary</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span className="font-mono font-semibold">Rs {(customer.creditLimit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Purchases:</span>
                    <span className="font-mono font-semibold">Rs {(summary?.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-bold text-sm text-primary">
                    <span>Current Khata Balance:</span>
                    <span className="font-mono">Rs {(customer.currentBalance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileTextIcon className="size-3.5 text-primary" /> Recent POS Sales & Invoices
              </h3>
              <table className="w-full border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground">
                    <th className="border border-border p-2 text-left">Date</th>
                    <th className="border border-border p-2 text-left">Invoice #</th>
                    <th className="border border-border p-2 text-left">Items</th>
                    <th className="border border-border p-2 text-center">Payment</th>
                    <th className="border border-border p-2 text-right">Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {posSales && posSales.length > 0 ? (
                    posSales.slice(0, 10).map((sale) => (
                      <tr key={sale._id} className="border-b border-border hover:bg-muted/10">
                        <td className="border border-border p-2">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border border-border p-2 font-mono font-semibold">
                          {sale.saleNumber}
                        </td>
                        <td className="border border-border p-2">
                          {sale.items?.map((i) => i.productName).join(", ") || "General Sale"}
                        </td>
                        <td className="border border-border p-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                            {sale.paymentMode}
                          </span>
                        </td>
                        <td className="border border-border p-2 text-right font-mono font-semibold">
                          {(sale.grandTotal || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border border-border p-3 text-center text-muted-foreground">
                        No sales transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-border pt-2 text-muted-foreground">
                Customer Signature & Stamp
              </div>
              <div className="border-t border-border pt-2 text-muted-foreground">
                Authorized Signatory (Al Khaleej)
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-1.5 cursor-pointer text-xs font-semibold">
            <PrinterIcon className="size-3.5" />
            Print A4 Document
          </Button>
        </div>
      </div>
    </div>
  );
}
