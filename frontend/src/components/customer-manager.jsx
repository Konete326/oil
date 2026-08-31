import { useState, useEffect } from "react";
import {
  fetchCustomers,
  fetchCustomerDetail,
  deleteCustomerApi,
  createPaymentEntry,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerModal } from "@/components/customer-modal";
import { CustomerDetailModal } from "@/components/customer-detail-modal";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { PaymentModal } from "@/components/payment-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationControl } from "@/components/pagination-control";
import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  LayoutGridIcon,
  ListIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 4;

export function CustomerManager() {
  const [viewMode, setViewMode] = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"));
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetCustomer, setPaymentTargetCustomer] = useState(null);

  const [printDirectCustomer, setPrintDirectCustomer] = useState(null);
  const [printDirectData, setPrintDirectData] = useState(null);
  const [isPrintDirectOpen, setIsPrintDirectOpen] = useState(false);
  const [loadingPrintId, setLoadingPrintId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalCustomers: 0,
    totalReceivable: 0,
    totalCreditLimits: 0,
    pendingDebtorsCount: 0,
  });

  const loadSummary = async () => {
    try {
      const res = await fetchCustomers({ limit: 1000 });
      if (res && res.data && Array.isArray(res.data)) {
        const list = res.data;
        const totalReceivable = list.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
        const totalCreditLimits = list.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
        const pendingDebtorsCount = list.filter((c) => (Number(c.currentBalance) || 0) > 0).length;
        setSummaryMetrics({
          totalCustomers: list.length,
          totalReceivable,
          totalCreditLimits,
          pendingDebtorsCount,
        });
      }
    } catch (e) {}
  };

  const loadCustomers = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await fetchCustomers({ search, customerType, status, page, limit: PAGE_SIZE });
      if (res && res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(true);
    loadSummary();
  }, [search, customerType, status, page]);

  useEffect(() => {
    const handleFocus = () => {
      loadCustomers(false);
      loadSummary();
    };
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => {
      loadCustomers(false);
      loadSummary();
    }, 8000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [search, customerType, status, page]);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (id) => {
    setDetailCustomerId(id);
    setIsDetailOpen(true);
  };

  const handleOpenPayment = (customer) => {
    setPaymentTargetCustomer(customer);
    setIsPaymentModalOpen(true);
  };

  const handleSaveCustomerPayment = async (paymentData) => {
    const pAmt = Number(paymentData.amount) || 0;
    try {
      if (paymentTargetCustomer) {
        setCustomers((prev) =>
          prev.map((c) =>
            c._id === paymentTargetCustomer._id
              ? { ...c, currentBalance: Math.max(0, (Number(c.currentBalance) || 0) - pAmt) }
              : c
          )
        );
        setSummaryMetrics((prev) => ({
          ...prev,
          totalReceivable: Math.max(0, prev.totalReceivable - pAmt),
        }));
      }
      await createPaymentEntry({
        customerId: paymentTargetCustomer?._id,
        clientName: paymentTargetCustomer?.name,
        amount: paymentData.amount,
        paymentMode: paymentData.paymentMode,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes || `Khata payment received from ${paymentTargetCustomer?.name}`,
      });
      toast.success(`Payment of Rs. ${pAmt.toLocaleString()} received & credited to ${paymentTargetCustomer?.name}!`);
      loadCustomers(false);
      loadSummary();
    } catch (err) {
      toast.error(err.message || "Failed to record customer payment.");
      loadCustomers(false);
      loadSummary();
    }
  };

  const handleOpenPrint = async (customer) => {
    setLoadingPrintId(customer._id);
    try {
      const res = await fetchCustomerDetail(customer._id);
      if (res && res.customer) {
        setPrintDirectCustomer(res.customer);
        setPrintDirectData(res);
      } else {
        setPrintDirectCustomer(customer);
        setPrintDirectData({ customer, summary: {}, posSales: [], ledgerEntries: [] });
      }
      setIsPrintDirectOpen(true);
    } catch (err) {
      setPrintDirectCustomer(customer);
      setPrintDirectData({ customer, summary: {}, posSales: [], ledgerEntries: [] });
      setIsPrintDirectOpen(true);
    } finally {
      setLoadingPrintId(null);
    }
  };

  const handleCustomerSaved = (savedCustomer, isEdit) => {
    if (savedCustomer) {
      if (isEdit) {
        setCustomers((prev) => prev.map((c) => (c._id === savedCustomer._id ? { ...c, ...savedCustomer } : c)));
      } else {
        setCustomers((prev) => [savedCustomer, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotalRecords((prev) => prev + 1);
      }
    }
    loadCustomers(false);
    loadSummary();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id;
    const targetName = deleteTarget.name;
    const targetBalance = Number(deleteTarget.currentBalance) || 0;
    const targetLimit = Number(deleteTarget.creditLimit) || 0;
    setCustomers((prev) => prev.filter((c) => c._id !== targetId));
    setTotalRecords((prev) => Math.max(0, prev - 1));
    setSummaryMetrics((prev) => ({
      totalCustomers: Math.max(0, prev.totalCustomers - 1),
      totalReceivable: Math.max(0, prev.totalReceivable - targetBalance),
      totalCreditLimits: Math.max(0, prev.totalCreditLimits - targetLimit),
      pendingDebtorsCount: targetBalance > 0 ? Math.max(0, prev.pendingDebtorsCount - 1) : prev.pendingDebtorsCount,
    }));
    setDeleteTarget(null);
    toast.success(`Customer "${targetName}" deleted successfully.`);
    try {
      await deleteCustomerApi(targetId);
      loadCustomers(false);
      loadSummary();
    } catch (err) {
      toast.error(err.message || "Failed to delete customer.");
      loadCustomers(false);
      loadSummary();
    }
  };

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            <span>Customer Khata &amp; Accounts</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Manage customer accounts, khata balances, credit limits, payments, analytics, and printable statements.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors",
                viewMode === "table" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <ListIcon className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors",
                viewMode === "cards" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Card View"
            >
              <LayoutGridIcon className="size-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <Button onClick={loadCustomers} variant="outline" size="sm" className="gap-1 cursor-pointer text-xs h-7.5 px-2.5">
            <RefreshCwIcon className="size-3" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 cursor-pointer text-xs font-semibold h-7.5 px-3 bg-primary text-primary-foreground">
            <UserPlusIcon className="size-3.5" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs space-y-0.5">
          <p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Customers
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight">
            {summaryMetrics.totalCustomers || totalRecords} <span className="text-xs font-semibold text-muted-foreground">Parties</span>
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-1">
            Registered customer accounts
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 sm:p-3 shadow-xs space-y-0.5">
          <p className="text-[10.5px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Total Khata Receivable
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            Rs {Number(summaryMetrics.totalReceivable || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-amber-500/20 pt-1">
            Pending market balance
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs space-y-0.5">
          <p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Credit Limits
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight">
            Rs {Number(summaryMetrics.totalCreditLimits || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-1">
            Allocated credit limit
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 sm:p-3 shadow-xs space-y-0.5">
          <p className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Active Pending Debtors
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {summaryMetrics.pendingDebtorsCount} <span className="text-xs font-semibold text-muted-foreground">Parties</span>
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-emerald-500/20 pt-1">
            Khata balance &gt; Rs 0
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-card p-2 sm:p-2.5 rounded-xl border border-border/80 shadow-xs">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, city..."
            className="pl-8 text-xs h-7.5 bg-muted/30 focus:bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <FilterIcon className="size-3 text-primary" />
            <span>Filters:</span>
          </div>
          <select
            value={customerType}
            onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
            className="h-7.5 rounded-md border border-input bg-background px-2 text-xs cursor-pointer text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Corporate">Corporate</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-7.5 rounded-md border border-input bg-background px-2 text-xs cursor-pointer text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground text-xs">No Customers Found</p>
            <p className="text-[11px]">Click "Add Customer" to create your first customer profile.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-270px)] min-h-[260px] overflow-y-auto overflow-x-auto">
              {viewMode === "table" ? (
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 text-muted-foreground border-b border-border/80 shadow-xs">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-xs h-8">Customer &amp; Contact Details</th>
                      <th className="py-2 px-3 font-semibold text-right text-xs h-8">Khata Balance</th>
                      <th className="py-2 px-3 font-semibold text-right text-xs h-8">Credit Limit</th>
                      <th className="py-2 px-3 font-semibold text-center text-xs h-8">Status</th>
                      <th className="py-2 px-3 text-right font-semibold text-xs h-8">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {customers.map((c) => {
                      const hasBalance = (c.currentBalance || 0) > 0;
                      return (
                        <tr key={c._id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-bold text-foreground text-xs">{c.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-muted-foreground">
                              {c.phone && c.phone !== "-" && <span>{c.phone}</span>}
                              {c.phone && c.phone !== "-" && <span>•</span>}
                              <span>{c.city || "Karachi"}</span>
                              <span>•</span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/20">
                                {c.customerType || "Retail"}
                              </span>
                            </div>
                          </td>

                          <td className="py-2 px-3 text-right">
                            <span
                              className={cn(
                                "font-mono font-bold text-xs",
                                hasBalance ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                              )}
                            >
                              Rs {(c.currentBalance || 0).toLocaleString()}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-right font-mono text-muted-foreground text-xs">
                            Rs {(c.creditLimit || 0).toLocaleString()}
                          </td>

                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${
                                c.status === "Active"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {c.status || "Active"}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPayment(c)}
                                className="h-6.5 text-[11px] font-semibold px-2.5 cursor-pointer bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                title="Receive Payment for this Customer"
                              >
                                <span>Receive Payment</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPrint(c)}
                                disabled={loadingPrintId === c._id}
                                className="h-6.5 text-[11px] px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                                title="Print A4 Statement"
                              >
                                <span>Statement</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetail(c._id)}
                                className="h-6.5 text-[11px] px-1.5 text-primary hover:bg-primary/10 cursor-pointer"
                                title="View Khata Ledger"
                              >
                                <span>Ledger</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(c)}
                                className="h-6.5 text-[11px] px-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
                                title="Edit Customer"
                              >
                                <span>Edit</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(c)}
                                className="h-6.5 text-[11px] px-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Delete Customer"
                              >
                                <span>Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-2.5 sm:p-3">
                  {customers.map((c) => {
                    const hasBalance = (c.currentBalance || 0) > 0;
                    return (
                      <div
                        key={c._id}
                        className="rounded-lg border border-border/80 bg-card p-3 shadow-xs space-y-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-foreground truncate">{c.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9.5px] font-medium px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {c.customerType || "Retail"}
                              </span>
                              <span className="text-[10.5px] text-muted-foreground truncate">{c.city || "Karachi"}</span>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold shrink-0",
                              c.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {c.status || "Active"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-md bg-muted/30 text-xs border border-border/50">
                          <div>
                            <span className="text-[9px] text-muted-foreground block">Khata Balance</span>
                            <span
                              className={cn(
                                "font-mono font-bold text-xs",
                                hasBalance ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                              )}
                            >
                              Rs {(c.currentBalance || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground block">Credit Limit</span>
                            <span className="font-mono text-muted-foreground text-[11px]">
                              Rs {(c.creditLimit || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {c.phone && (
                          <div className="text-[10.5px] font-mono text-muted-foreground">
                            {c.phone}
                          </div>
                        )}

                        <div className="pt-1.5 border-t border-border flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPayment(c)}
                            className="h-6.5 text-[10.5px] font-semibold px-2 cursor-pointer bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          >
                            <span>Receive Payment</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPrint(c)}
                            disabled={loadingPrintId === c._id}
                            className="h-6.5 text-[10.5px] px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Print A4 Customer Statement"
                          >
                            <span>Statement</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(c._id)}
                            className="h-6.5 text-[10.5px] px-1.5 text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <span>Ledger</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-6.5 text-[10.5px] px-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
                          >
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(c)}
                            className="h-6.5 text-[10.5px] px-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={handleCustomerSaved}
        onSaved={handleCustomerSaved}
        existingCustomers={customers}
      />

      <CustomerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        customerId={detailCustomerId}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSaveCustomerPayment}
        mills={paymentTargetCustomer ? [{ _id: paymentTargetCustomer._id, name: paymentTargetCustomer.name, currentBalance: paymentTargetCustomer.currentBalance }] : []}
      />

      <CustomerPrintStatement
        isOpen={isPrintDirectOpen}
        onClose={() => setIsPrintDirectOpen(false)}
        customer={printDirectCustomer}
        data={printDirectData}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All past invoices will be retained.`}
        confirmText="Delete Customer"
        variant="destructive"
      />
    </div>
  );
}
