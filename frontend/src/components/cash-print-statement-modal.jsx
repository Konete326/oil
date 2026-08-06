import { XIcon, PrinterIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

export function CashPrintStatementModal({ isOpen, onClose, transactions = [], partyName = "All Parties", startDate = "", endDate = "" }) {
  if (!isOpen) return null;

  const totalPaid = transactions
    .filter((t) => t.type === "Paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalReceived = transactions
    .filter((t) => t.type === "Received")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netBalance = totalReceived - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-in fade-in duration-150 print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
        <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-foreground">Cash Ledger Statement Preview</h2>
            <p className="text-xs text-muted-foreground">Print or Save as PDF with official Al Khaleej Lubricants letterhead.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 cursor-pointer">
              <PrinterIcon className="size-3.5" />
              <span>Print / Save PDF</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="border border-border p-6 rounded-xl space-y-6 bg-card print:border-black print:p-4 print:bg-white">
          <div className="flex items-start justify-between border-b border-border pb-4 print:border-black">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Al Khaleej Lubricants" className="size-12 object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground print:text-black">AL KHALEEJ LUBRICANTS</h1>
                <p className="text-xs text-muted-foreground print:text-gray-700">Industrial & Textile Lubricant Suppliers, Karachi</p>
                <p className="text-[11px] text-muted-foreground print:text-gray-700">NTN: 8941203-7 | Phone: 021-35091244 | Karachi, Pakistan</p>
              </div>
            </div>
            <div className="text-right space-y-1 text-xs">
              <span className="inline-block px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold uppercase text-[10px] print:border print:border-black print:bg-transparent print:text-black">
                Official Statement
              </span>
              <p className="text-muted-foreground print:text-gray-700 text-[11px]">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs print:bg-gray-50 print:border-gray-300">
            <div>
              <p className="text-muted-foreground print:text-gray-600">Party / Account Title:</p>
              <p className="font-bold text-foreground print:text-black text-sm">{partyName}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground print:text-gray-600">Statement Period:</p>
              <p className="font-semibold text-foreground print:text-black">
                {startDate ? new Date(startDate).toLocaleDateString() : "Beginning"} — {endDate ? new Date(endDate).toLocaleDateString() : "Present"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 print:border-gray-400 print:bg-gray-50">
              <p className="text-muted-foreground print:text-gray-600 text-[11px]">Total Paid Cash (Outflow)</p>
              <p className="text-base font-bold text-amber-500 print:text-black font-mono">Rs. {totalPaid.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 print:border-gray-400 print:bg-gray-50">
              <p className="text-muted-foreground print:text-gray-600 text-[11px]">Total Received Cash (Inflow)</p>
              <p className="text-base font-bold text-emerald-500 print:text-black font-mono">Rs. {totalReceived.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 print:border-gray-400 print:bg-gray-50">
              <p className="text-muted-foreground print:text-gray-600 text-[11px]">Net Balance</p>
              <p className={`text-base font-bold font-mono ${netBalance >= 0 ? "text-emerald-500 print:text-black" : "text-destructive print:text-black"}`}>
                {netBalance >= 0 ? "+" : ""}Rs. {netBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/60 border-y border-border font-semibold text-foreground text-[10px] uppercase print:bg-gray-100 print:border-black print:text-black">
                <tr>
                  <th className="p-2.5 ps-3">S.No</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Party Name</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Amount (PKR)</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 pe-3">Ref No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-gray-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground print:text-gray-600">
                      No transaction records in this statement.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t, idx) => (
                    <tr key={t._id || idx} className="print:text-black">
                      <td className="p-2.5 ps-3 text-muted-foreground print:text-black">{idx + 1}</td>
                      <td className="p-2.5">{new Date(t.transactionDate || t.createdAt).toLocaleDateString()}</td>
                      <td className="p-2.5 font-semibold">
                        <span className={t.type === "Paid" ? "text-amber-500 print:text-black" : "text-emerald-500 print:text-black"}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium">{t.partyName}</td>
                      <td className="p-2.5 text-muted-foreground print:text-black">{t.category || "General"}</td>
                      <td className={`p-2.5 text-right font-mono font-bold ${t.type === "Paid" ? "text-amber-500 print:text-black" : "text-emerald-500 print:text-black"}`}>
                        {t.type === "Paid" ? "-" : "+"}Rs. {t.amount.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-muted-foreground print:text-black">{t.paymentMode || "Cash"}</td>
                      <td className="p-2.5 pe-3 font-mono text-muted-foreground print:text-black">{t.referenceNo || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-muted-foreground print:text-black border-t border-border/60 print:border-black print:pt-10">
            <div>
              <div className="border-t border-dashed border-border print:border-black w-3/4 mx-auto mb-1" />
              <p className="font-medium text-foreground print:text-black">Prepared By</p>
            </div>
            <div>
              <div className="border-t border-dashed border-border print:border-black w-3/4 mx-auto mb-1" />
              <p className="font-medium text-foreground print:text-black">Cashier Signature</p>
            </div>
            <div>
              <div className="border-t border-dashed border-border print:border-black w-3/4 mx-auto mb-1" />
              <p className="font-medium text-foreground print:text-black">Authorized Accountant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
