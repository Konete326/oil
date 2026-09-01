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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto h-[550px] max-h-[82vh] flex flex-col animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-border bg-primary/5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                <UserIcon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5 truncate">
                  <span className="truncate">{customer ? customer.name : "Customer Khata Details"}</span>
                  {customer?.customerType && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-mono font-medium shrink-0">
                      {customer.customerType}
                    </span>
                  )}
                </h3>
                <p className="text-[9.5px] text-muted-foreground truncate">
                  {customer?.phone ? `Phone: ${customer.phone}` : "No phone"} | City: {customer?.city || "Karachi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                onClick={() => setIsPrintOpen(true)}
                size="sm"
                className="h-6.5 px-2 gap-1 cursor-pointer text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PrinterIcon className="size-3" />
                <span>Statement</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="size-6.5 cursor-pointer">
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center flex-1 items-center">
              <CloudLoader label="Loading customer khata records..." />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive text-xs flex-1 flex items-center justify-center">{error}</div>
          ) : (
            <div className="p-2.5 sm:p-3 space-y-2 text-xs flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                <div className="rounded-lg border border-border/80 bg-muted/20 p-1.5 space-y-0.5">
                  <span className="text-[9.5px] text-muted-foreground flex items-center gap-1">
                    <ShoppingBagIcon className="size-2.5 text-primary" /> Total Purchases
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    Rs {(summary?.totalSpent || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/20 p-1.5 space-y-0.5">
                  <span className="text-[9.5px] text-muted-foreground flex items-center gap-1">
                    <TrendingUpIcon className="size-2.5 text-blue-500" /> Total Orders
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    {summary?.totalOrders || 0} Sales
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-1.5 space-y-0.5">
                  <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CreditCardIcon className="size-2.5 text-emerald-500" /> Khata Balance
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    Rs {(customer?.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/20 p-1.5 space-y-0.5">
                  <span className="text-[9.5px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2Icon className="size-2.5 text-purple-500" /> Credit Limit
                  </span>
                  <div className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    Rs {(customer?.creditLimit || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-2 space-y-1 shadow-2xs shrink-0">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[10.5px] text-foreground flex items-center gap-1">
                    <TrendingUpIcon className="size-3 text-primary" /> 6-Month Purchases &amp; Payments Trend
                  </h4>
                  <div className="flex items-center gap-2 text-[9.5px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-xs bg-primary inline-block" /> Purchases
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-xs bg-emerald-500 inline-block" /> Wasool
                    </span>
                  </div>
                </div>
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 2, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 8.5 }} />
                      <YAxis tick={{ fontSize: 8.5 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          `Rs ${Number(value).toLocaleString()}`,
                          name === "payments" ? "Wasool Raqam" : "POS Purchase"
                        ]}
                        contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", fontSize: "10px", borderRadius: "6px" }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Purchases" />
                      <Bar dataKey="payments" fill="#10b981" radius={[2, 2, 0, 0]} name="Wasool Raqam" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col space-y-1 overflow-hidden">
                <div className="flex border-b border-border gap-3 shrink-0">
                  <button
                    onClick={() => setActiveTab("sales")}
                    className={`pb-1 text-[11px] font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "sales" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    POS Sales History ({posSales.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className={`pb-1 text-[11px] font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "ledger" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ledger Transactions ({ledgerEntries.length})
                  </button>
                </div>

                {activeTab === "sales" ? (
                  <div className="flex-1 min-h-0 rounded-xl border border-border/80 overflow-y-auto overflow-x-auto shadow-2xs">
                    <table className="w-full text-left text-xs min-w-[480px]">
                      <thead className="sticky top-0 bg-muted/95 backdrop-blur-xs text-muted-foreground border-b border-border shadow-2xs z-10">
                        <tr>
                          <th className="py-1 px-2 text-[10px] font-semibold">Date</th>
                          <th className="py-1 px-2 text-[10px] font-semibold">Sale #</th>
                          <th className="py-1 px-2 text-[10px] font-semibold">Items</th>
                          <th className="py-1 px-2 text-[10px] font-semibold">Mode</th>
                          <th className="py-1 px-2 text-[10px] font-semibold text-right">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-sans">
                        {posSales.length > 0 ? (
                          posSales.map((sale) => (
                            <tr key={sale._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-1 px-2 text-muted-foreground text-[10px]">
                                {new Date(sale.createdAt).toLocaleDateString("en-GB")}
                              </td>
                              <td className="py-1 px-2 font-mono font-semibold text-foreground text-[11px]">
                                {sale.saleNumber}
                              </td>
                              <td className="py-1 px-2 text-foreground text-[10.5px]">
                                {sale.items?.map((i) => `${i.productName} (${i.quantity})`).join(", ")}
                              </td>
                              <td className="py-1 px-2">
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-primary/10 text-primary border border-primary/20">
                                  {sale.bankAccountName ? `Bank (${sale.bankAccountName.split("-")[0].trim()})` : sale.paymentMode || "Cash"}
                                </span>
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-foreground text-[11px]">
                                Rs {(sale.grandTotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground text-[10.5px]">
                              No POS sales recorded for this customer.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 rounded-xl border border-border/80 overflow-y-auto overflow-x-auto shadow-2xs">
                    <table className="w-full text-left text-xs min-w-[480px]">
                      <thead className="sticky top-0 bg-muted/95 backdrop-blur-xs text-muted-foreground border-b border-border shadow-2xs z-10">
                        <tr>
                          <th className="py-1 px-2 text-[10px] font-semibold">Date</th>
                          <th className="py-1 px-2 text-[10px] font-semibold">Type</th>
                          <th className="py-1 px-2 text-[10px] font-semibold">Amount</th>
                          <th className="py-1 px-2 text-[10px] font-semibold">Mode / Bank</th>
                          <th className="py-1 px-2 text-[10px] font-semibold text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-sans">
                        {ledgerEntries.length > 0 ? (
                          ledgerEntries.map((entry) => (
                            <tr key={entry._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-1 px-2 text-muted-foreground text-[10px]">
                                {new Date(entry.createdAt).toLocaleDateString("en-GB")}
                              </td>
                              <td className="py-1 px-2 font-medium text-foreground text-[10.5px]">
                                {entry.transactionType}
                              </td>
                              <td className="py-1 px-2 font-mono font-semibold text-foreground text-[11px]">
                                Rs {(entry.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-1 px-2 text-[10.5px]">
                                {entry.bankAccountName || entry.bankAccount?.bankName ? (
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    Bank ({entry.bankAccountName ? entry.bankAccountName.split("-")[0].trim() : entry.bankAccount?.bankName})
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">{entry.paymentMode || "Cash"}</span>
                                )}
                              </td>
                              <td className="py-1 px-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-[11px]">
                                Rs {(entry.runningBalance || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground text-[10.5px]">
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
