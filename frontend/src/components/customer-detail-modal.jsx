import { useState, useEffect } from "react";
import { fetchCustomerDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CloudLoader } from "@/components/ui/cloud-loader";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { XIcon, UserIcon, PhoneIcon, MapPinIcon, CreditCardIcon, ShoppingBagIcon, PrinterIcon, TrendingUpIcon, Loader2Icon, CalendarIcon, CheckCircle2Icon } from "lucide-react";
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                <UserIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  {customer ? customer.name : "Customer Analytics & Details"}
                  {customer?.customerType && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono">
                      {customer.customerType}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {customer?.phone ? `Phone: ${customer.phone}` : "No phone registered"} | City: {customer?.city || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsPrintOpen(true)}
                size="sm"
                className="gap-1.5 cursor-pointer text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PrinterIcon className="size-3.5" />
                Print A4 Statement
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="size-8 cursor-pointer">
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <CloudLoader label="Loading customer analytics & historical records..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-xs">{error}</div>
          ) : (
            <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShoppingBagIcon className="size-3.5 text-primary" /> Total Purchases
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    Rs {(summary?.totalSpent || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <TrendingUpIcon className="size-3.5 text-blue-500" /> Total Orders
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    {summary?.totalOrders || 0} Sales
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CreditCardIcon className="size-3.5 text-emerald-500" /> Current Khata Balance
                  </span>
                  <div className="text-base font-bold font-mono text-emerald-500">
                    Rs {(customer?.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2Icon className="size-3.5 text-purple-500" /> Credit Limit
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    Rs {(customer?.creditLimit || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <TrendingUpIcon className="size-4 text-primary" /> Sales Purchase Trend Chart
                  </h4>
                </div>
                {monthlyData.length > 0 ? (
                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, "Purchases"]}
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", fontSize: "11px", borderRadius: "8px" }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
                    No graph data available yet for this customer.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex border-b border-border gap-4">
                  <button
                    onClick={() => setActiveTab("sales")}
                    className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "sales" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    POS Sales History ({posSales.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "ledger" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    Ledger Transactions ({ledgerEntries.length})
                  </button>
                </div>

                {activeTab === "sales" ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Sale #</th>
                          <th className="p-3">Items Purchased</th>
                          <th className="p-3">Payment Mode</th>
                          <th className="p-3 text-right">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {posSales.length > 0 ? (
                          posSales.map((sale) => (
                            <tr key={sale._id} className="hover:bg-muted/10">
                              <td className="p-3 text-muted-foreground">
                                {new Date(sale.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3 font-mono font-semibold text-foreground">
                                {sale.saleNumber}
                              </td>
                              <td className="p-3 text-foreground">
                                {sale.items?.map((i) => `${i.productName} (${i.quantity})`).join(", ")}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                  {sale.paymentMode}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-foreground">
                                Rs {(sale.grandTotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              No POS sales recorded for this customer.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Payment Mode</th>
                          <th className="p-3">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ledgerEntries.length > 0 ? (
                          ledgerEntries.map((entry) => (
                            <tr key={entry._id} className="hover:bg-muted/10">
                              <td className="p-3 text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3 font-medium text-foreground">
                                {entry.transactionType}
                              </td>
                              <td className="p-3 font-mono font-semibold text-foreground">
                                Rs {(entry.amount || 0).toLocaleString()}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {entry.paymentMode || "Cash"}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-500">
                                Rs {(entry.runningBalance || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
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
