import { useState, useEffect, useMemo } from "react";
import { fetchCustomerDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CloudLoader } from "@/components/ui/cloud-loader";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { CustomerUdharDiaryModal } from "@/components/customer-udhar-diary-modal";
import { CustomerTrialSheetModal } from "@/components/customer-trial-sheet-modal";
import { EditLedgerEntryModal } from "@/components/edit-ledger-entry-modal";
import { AddLedgerEntryModal } from "@/components/add-ledger-entry-modal";
import { deleteLedgerEntryApi } from "@/lib/api";
import { XIcon, UserIcon, PhoneIcon, MapPinIcon, CreditCardIcon, ShoppingBagIcon, PrinterIcon, TrendingUpIcon, Loader2Icon, CalendarIcon, CheckCircle2Icon, BookOpenIcon, ScaleIcon, Edit3Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function CustomerDetailModal({ isOpen, onClose, customerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isTrialSheetOpen, setIsTrialSheetOpen] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
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
  
  const [editingEntry, setEditingEntry] = useState(null);

  const unifiedLedger = useMemo(() => {
    if (!customer) return [];
    const entries = [];
    
    posSales.forEach(sale => {
      const isCredit = sale.paymentMode === "Credit / Khata";
      const grandTotal = Number(sale.grandTotal) || 0;
      const cashRec = Number(sale.cashReceived) || 0;
      
      const itemsDesc = (sale.items || [])
        .map(it => `${it.quantity}L ${it.productName || "Product"}`)
        .join(", ") || "Oil Products";

      if (isCredit || grandTotal > cashRec) {
        entries.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          description: itemsDesc,
          debit: grandTotal,
          credit: 0,
          type: "Credit Sale",
          isEditable: false,
        });
        if (cashRec > 0) {
          entries.push({
            id: `sale-part-${sale._id}`,
            date: sale.updatedAt || sale.createdAt,
            description: `Payment for Sale ${sale.saleNumber || ""}`,
            debit: 0,
            credit: cashRec,
            type: "Partial Payment",
            isEditable: false,
          });
        }
      } else {
        entries.push({
          id: `sale-${sale._id}`,
          date: sale.createdAt,
          description: itemsDesc + " (Cash)",
          debit: grandTotal,
          credit: grandTotal,
          type: "Cash Sale",
          isEditable: false,
        });
      }
    });

    ledgerEntries.forEach(entry => {
      const isDebit = entry.transactionType?.includes("Debit") || false;
      const isCredit = entry.transactionType?.includes("Credit") || entry.transactionType?.includes("Payment") || false;
      entries.push({
        id: `ledger-${entry._id}`,
        date: entry.createdAt,
        description: entry.notes || entry.transactionType,
        debit: isDebit ? entry.amount : 0,
        credit: isCredit ? entry.amount : 0,
        type: entry.transactionType,
        isEditable: true,
        original: entry
      });
    });
    
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    let totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    let openingBalance = (customer.currentBalance || 0) - totalDebit + totalCredit;

    if (openingBalance !== 0) {
      entries.unshift({
        id: 'opening',
        date: customer.createdAt,
        description: 'Opening Balance',
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        type: 'Opening Balance',
        isEditable: false
      });
    }

    let running = 0;
    return entries.map(e => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });
  }, [customer, posSales, ledgerEntries]);

  const reloadData = () => {
    fetchCustomerDetail(customerId).then(res => setData(res)).catch(() => {});
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm("Are you sure you want to delete this ledger entry? This action cannot be undone.")) {
      try {
        await deleteLedgerEntryApi(entryId);
        reloadData();
      } catch (err) {
        alert(err.message || "Failed to delete entry");
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-primary/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                <UserIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-base text-foreground flex items-center gap-2 flex-wrap">
                  {customer ? customer.name : "Customer Analytics & Details"}
                  {customer?.customerType && (
                    <span className="text-sm px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono">
                      {customer.customerType}
                    </span>
                  )}
                </h3>
                <p className="text-sm sm:text-sm text-muted-foreground">
                  {customer?.phone ? `Phone: ${customer.phone}` : "No phone registered"} | City: {customer?.city || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <Button
                onClick={() => setIsTrialSheetOpen(true)}
                size="sm"
                variant="outline"
                className="gap-1.5 cursor-pointer text-sm font-bold border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 hidden sm:inline-flex"
                title="Customer Individual Trial Balance Sheet"
              >
                <ScaleIcon className="size-3.5 text-amber-600" />
                <span>Trial Sheet (PDF)</span>
              </Button>

              <Button
                onClick={() => setIsAddingEntry(true)}
                size="sm"
                className="gap-1.5 cursor-pointer text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                title="Add Purana Khata / New Entry"
              >
                <PlusIcon className="size-3.5" />
                <span>Add Entry</span>
              </Button>

              <Button
                onClick={() => setIsDiaryOpen(true)}
                size="sm"
                variant="outline"
                className="gap-1.5 cursor-pointer text-sm font-bold border-border hover:bg-muted"
                title="Customer Ledger Diary"
              >
                <BookOpenIcon className="size-3.5 text-primary" />
                <span>Ledger Diary</span>
              </Button>

              <Button
                onClick={() => setIsPrintOpen(true)}
                size="sm"
                className="gap-1.5 cursor-pointer text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PrinterIcon className="size-3.5" />
                <span>Print A4 Statement</span>
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
            <div className="p-8 text-center text-destructive text-sm">{error}</div>
          ) : (
            <div className="p-4 sm:p-6 space-y-5 text-sm overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <ShoppingBagIcon className="size-3.5 text-primary" /> Total Purchases
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    Rs {(summary?.totalSpent || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUpIcon className="size-3.5 text-blue-500" /> Total Orders
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    {summary?.totalOrders || 0} Sales
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCardIcon className="size-3.5 text-emerald-500" /> Current Khata Balance
                  </span>
                  <div className="text-base font-bold font-mono text-emerald-500">
                    Rs {(customer?.currentBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2Icon className="size-3.5 text-purple-500" /> Credit Limit
                  </span>
                  <div className="text-base font-bold font-mono text-foreground">
                    Rs {(customer?.creditLimit || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
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
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    No graph data available yet for this customer.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex border-b border-border gap-4">
                  <button
                    onClick={() => setActiveTab("sales")}
                    className={`pb-2 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "sales" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    POS Sales History ({posSales.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className={`pb-2 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${
                      activeTab === "ledger" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    Ledger Transactions ({ledgerEntries.length})
                  </button>
                </div>

                {activeTab === "sales" ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-left text-sm">
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
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
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
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Description/Particulars</th>
                          <th className="p-3 text-right">Debit (Dr.)</th>
                          <th className="p-3 text-right">Credit (Cr.)</th>
                          <th className="p-3 text-right">Balance</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {unifiedLedger.length > 0 ? (
                          unifiedLedger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-3 text-muted-foreground whitespace-nowrap">
                                {new Date(entry.date).toLocaleString()}
                              </td>
                              <td className="p-3 font-medium text-foreground">
                                {entry.description}
                                <div className="text-xs text-muted-foreground font-normal mt-0.5">{entry.type}</div>
                              </td>
                              <td className="p-3 text-right font-mono text-rose-500">
                                {entry.debit > 0 ? `Rs ${entry.debit.toLocaleString()}` : "-"}
                              </td>
                              <td className="p-3 text-right font-mono text-emerald-500">
                                {entry.credit > 0 ? `Rs ${entry.credit.toLocaleString()}` : "-"}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-foreground">
                                Rs {entry.balance.toLocaleString()}
                              </td>
                              <td className="p-3 text-center">
                                {entry.isEditable && entry.original && (
                                  <div className="flex items-center justify-center gap-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-7 p-0"
                                      title="Edit Entry"
                                      onClick={() => setEditingEntry(entry.original)}
                                    >
                                      <Edit3Icon className="size-3" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
                                      title="Delete Entry"
                                      onClick={() => handleDeleteEntry(entry.original._id)}
                                    >
                                      <Trash2Icon className="size-3" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                              No ledger records found.
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

      {isDiaryOpen && (
        <CustomerUdharDiaryModal
          isOpen={isDiaryOpen}
          onClose={() => setIsDiaryOpen(false)}
          customerName={customer?.name}
          salesHistory={posSales}
          onSuccess={() => {
            if (customerId) {
              fetchCustomerDetail(customerId).then(setData).catch(() => {});
            }
          }}
        />
      )}

      {customer && (
        <CustomerTrialSheetModal
          isOpen={isTrialSheetOpen}
          onClose={() => setIsTrialSheetOpen(false)}
          customer={customer}
          initialSales={posSales}
          initialLedger={ledgerEntries}
        />
      )}

      {editingEntry && (
        <EditLedgerEntryModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onSuccess={reloadData}
        />
      )}

      {isAddingEntry && (
        <AddLedgerEntryModal
          open={isAddingEntry}
          onOpenChange={setIsAddingEntry}
          customerId={customerId}
          clientName={customer?.name}
          onSuccess={reloadData}
        />
      )}
    </>
  );
}
