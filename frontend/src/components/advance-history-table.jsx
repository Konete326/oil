import { useState, useEffect } from "react";
import { SearchIcon, PrinterIcon, HandCoinsIcon, FileSpreadsheetIcon, RefreshCwIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchEmployeeAdvancesApi } from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function AdvanceHistoryTable({ onPrintVoucher, refreshTrigger }) {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadAdvances = async () => {
    try {
      setLoading(true);
      const res = await fetchEmployeeAdvancesApi();
      if (res && Array.isArray(res.data)) {
        setAdvances(res.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvances();
  }, [refreshTrigger]);

  const filteredAdvances = advances.filter((adv) => {
    if (!search) return true;
    const s = search.toLowerCase().trim();
    const name = (adv.partyName || adv.party || "").toLowerCase();
    const ref = (adv.referenceNo || "").toLowerCase();
    const notes = (adv.notes || "").toLowerCase();
    return name.includes(s) || ref.includes(s) || notes.includes(s);
  });

  const totalAdvancePaid = filteredAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const handleExport = () => {
    const data = filteredAdvances.map((adv, idx) => ({
      "S.No": idx + 1,
      "Voucher No": adv.referenceNo || "-",
      Date: new Date(adv.transactionDate || adv.createdAt).toLocaleDateString("en-GB"),
      "Staff Member": (adv.partyName || adv.party || "").replace("Advance Salary: ", ""),
      "Amount (PKR)": adv.amount,
      "Payment Mode": adv.paymentMode || "Cash",
      Reason: adv.notes || adv.remarks || "Staff Advance",
    }));
    exportTransactionsToExcel(data, "Staff_Advance_Cash_Log.xlsx");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <HandCoinsIcon className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">Advance Cash Payment History</h3>
            <p className="text-[10px] text-muted-foreground">
              Total Logged: <span className="font-mono font-bold text-amber-500">Rs. {totalAdvancePaid.toLocaleString()}</span> ({filteredAdvances.length} Vouchers)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search voucher or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-8 text-xs h-8"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs cursor-pointer">
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Excel</span>
          </Button>

          <Button variant="ghost" size="icon-sm" onClick={loadAdvances} className="h-8 w-8 cursor-pointer">
            <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5 ps-4">Date</th>
                <th className="p-2.5">Voucher #</th>
                <th className="p-2.5">Staff Member</th>
                <th className="p-2.5 text-right">Advance Amount (PKR)</th>
                <th className="p-2.5">Payment Mode</th>
                <th className="p-2.5">Purpose / Remarks</th>
                <th className="p-2.5 pe-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Loading advance cash payment logs...
                  </td>
                </tr>
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No advance cash payment vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => {
                  const staffName = (adv.partyName || adv.party || "Employee").replace("Advance Salary: ", "");
                  const txDate = new Date(adv.transactionDate || adv.createdAt);
                  return (
                    <tr key={adv._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 ps-4 font-mono text-muted-foreground text-[11px]">
                        {txDate.toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-2.5 font-mono font-semibold text-foreground text-[11px]">
                        {adv.referenceNo || `ADV-${adv._id.slice(-5)}`}
                      </td>
                      <td className="p-2.5 font-semibold text-foreground">
                        {staffName}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-500">
                        Rs. {(Number(adv.amount) || 0).toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-muted/40 border-border text-foreground">
                          {adv.paymentMode || "Cash"}
                        </span>
                      </td>
                      <td className="p-2.5 text-muted-foreground text-[11px] max-w-xs truncate">
                        {adv.notes || adv.remarks || "Staff Advance Cash"}
                      </td>
                      <td className="p-2.5 pe-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onPrintVoucher?.({
                              voucherNumber: adv.referenceNo || `ADV-${adv._id.slice(-5)}`,
                              employeeName: staffName,
                              amount: Number(adv.amount) || 0,
                              paymentMode: adv.paymentMode || "Cash",
                              date: adv.transactionDate || adv.createdAt,
                              reason: adv.notes || adv.remarks,
                              notes: adv.notes || adv.remarks,
                            })
                          }
                          className="h-7 px-2 gap-1 text-[11px] text-primary hover:text-primary-foreground hover:bg-primary cursor-pointer"
                        >
                          <PrinterIcon className="size-3" />
                          <span>Print Slip</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
