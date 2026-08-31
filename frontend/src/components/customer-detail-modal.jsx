import { useState, useEffect } from "react";
import { fetchCustomerDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CloudLoader } from "@/components/ui/cloud-loader";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { XIcon, UserIcon, CreditCardIcon, ShoppingBagIcon, PrinterIcon, TrendingUpIcon, CheckCircle2Icon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function CustomerDetailModal({ isOpen, onClose, customerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");

  useEffect(() => {
    if (isOpen && customerId) {
      setLoading(true);
      setError("");
      fetchCustomerDetail(customerId)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load customer detail.");
          setLoading(false);
        });
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const customer = data?.customer;
  const summary = data?.summary;
  const monthlyData = data?.monthlyData || [];
  const posSales = data?.posSales || [];
  const ledgerEntries = data?.ledgerEntries || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-primary/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-7.5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                <UserIcon className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{customer ? customer.name : "Customer Khata Details"}</span>
                  {customer?.customerType && (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-mono font-medium">
                      {customer.customerType}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {customer?.phone ? `Phone: ${customer.phone}` : "No phone"} | City: {customer?.city || "Karachi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => setIsPrintOpen(true)}
                size="sm"
                className="h-7 px-2.5 gap-1 cursor-pointer text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PrinterIcon className="size-3" />
                <span>Print Statement</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="size-7 cursor-pointer">
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <CloudLoader label="Loading customer khata records..." />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive text-xs">{error}</div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-border/80 bg-muted/20 p-2 sm:p-2.5 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ShoppingBagIcon className="size-3 text-primary" /> Total Purchases
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-foreground">
                    Rs {(summary?.totalSpent || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/20 p-2 sm:p-2.5 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <TrendingUpIcon className="size-3 text-blue-500" /> Total Orders
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-foreground">
                    {summary?.totalOrders || 0} Sales
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 sm:p-2.5 space-y-0.5">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CreditCardIcon className="size-3 text-emerald-500" /> Khata Balance
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    Rs {(customer?.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/20 p-2 sm:p-2.5 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2Icon className="size-3 text-purple-500" /> Credit Limit
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-foreground">
                    Rs {(customer?.creditLimit || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                    <TrendingUpIcon className="size-3.5 text-primary" /> Sales Purchase Trend
                  </h4>
                </div>
                {monthlyData.length > 0 ? (
                  <div className="h-32 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip
                          formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, "Purchases"]}
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", fontSize: "10.5px", borderRadius: "6px" }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center text-muted-foreground text-[11px]">
                    No historical chart data available.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex border-b border-border gap-3">
                  <button
                    onClick={() => setActiveTab("sales")}
                    className={`pb-1.5 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "sales" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    POS Sales History ({posSales.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className={`pb-1.5 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "ledger" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ledger Transactions ({ledgerEntries.length})
                  </button>
                </div>

                {activeTab === "sales" ? (
                  <div className="rounded-xl border border-border overflow-hidden max-h-44 overflow-y-auto overflow-x-auto shadow-2xs">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground border-b border-border shadow-2xs">
                        <tr>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Date</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Sale #</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Items</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Mode</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold text-right">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-sans">
                        {posSales.length > 0 ? (
                          posSales.map((sale) => (
                            <tr key={sale._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-1.5 px-2.5 text-muted-foreground text-[10.5px]">
                                {new Date(sale.createdAt).toLocaleDateString("en-GB")}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono font-semibold text-foreground text-xs">
                                {sale.saleNumber}
                              </td>
                              <td className="py-1.5 px-2.5 text-foreground text-[11px]">
                                {sale.items?.map((i) => `${i.productName} (${i.quantity})`).join(", ")}
                              </td>
                              <td className="py-1.5 px-2.5">
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-primary/10 text-primary border border-primary/20">
                                  {sale.paymentMode}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono font-bold text-foreground text-xs">
                                Rs {(sale.grandTotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground text-[11px]">
                              No POS sales recorded for this customer.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden max-h-44 overflow-y-auto overflow-x-auto shadow-2xs">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground border-b border-border shadow-2xs">
                        <tr>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Date</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Type</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Amount</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold">Mode</th>
                          <th className="py-1.5 px-2.5 text-[10.5px] font-semibold text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-sans">
                        {ledgerEntries.length > 0 ? (
                          ledgerEntries.map((entry) => (
                            <tr key={entry._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-1.5 px-2.5 text-muted-foreground text-[10.5px]">
                                {new Date(entry.createdAt).toLocaleDateString("en-GB")}
                              </td>
                              <td className="py-1.5 px-2.5 font-medium text-foreground text-[11px]">
                                {entry.transactionType}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono font-semibold text-foreground text-xs">
                                Rs {(entry.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-1.5 px-2.5 text-muted-foreground text-[10.5px]">
                                {entry.paymentMode || "Cash"}
                              </td>
                              <td className="py-1.5 px-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-xs">
                                Rs {(entry.runningBalance || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground text-[11px]">
                              No ledger entries recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isPrintOpen && (
        <CustomerPrintStatement
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          customer={customer}
          summary={summary}
          posSales={posSales}
          ledgerEntries={ledgerEntries}
        />
      )}
    </>
  );
}
