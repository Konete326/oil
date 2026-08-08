import { useState, useEffect } from "react";
import { fetchCustomers, deleteCustomerApi } from "@/lib/api";
import { CustomerModal } from "@/components/customer-modal";
import { CustomerDetailModal } from "@/components/customer-detail-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationControl } from "@/components/pagination-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsersIcon, UserPlusIcon, SearchIcon, EyeIcon, Edit2Icon, Trash2Icon, FilterIcon, RefreshCwIcon, CreditCardIcon, Building2Icon, ShieldAlertIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerManager() {
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

  const [detailCustomerId, setDetailCustomerId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    const res = await fetchCustomers({ search, customerType, status, page, limit: 12 });
    if (res && res.success) {
      setCustomers(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomerApi(deleteTarget._id);
      toast.success(`Customer "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      loadCustomers();
    } catch (err) {
      toast.error(err.message || "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  const totalKhataBalance = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const totalCreditLimits = customers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);

  return (
    <div className="space-y-5 p-1 sm:p-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            Customer & Khata Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer accounts, credit limits, khata balances, analytics, and print statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadCustomers} variant="outline" size="sm" className="gap-1.5 cursor-pointer text-xs">
            <RefreshCwIcon className="size-3.5" />
            <span>Refresh</span>
          </Button>
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 cursor-pointer text-xs font-semibold">
            <UserPlusIcon className="size-3.5" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground text-xs">
            <span>Total Registered</span>
            <UsersIcon className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">{totalRecords}</div>
          <div className="text-[11px] text-muted-foreground">Active Customer Profiles</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground text-xs">
            <span>Page Khata Balance</span>
            <CreditCardIcon className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-500 font-mono">
            Rs {totalKhataBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">Total Receivables</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground text-xs">
            <span>Page Credit Limits</span>
            <Building2Icon className="size-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            Rs {totalCreditLimits.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">Allocated Sanctioned Limits</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground text-xs">
            <span>Active Status</span>
            <CheckCircle2Icon className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            {customers.filter((c) => c.status === "Active").length} / {customers.length}
          </div>
          <div className="text-[11px] text-muted-foreground">Active Accounts on Page</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, city..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FilterIcon className="size-3.5" />
            <span>Filters:</span>
          </div>
          <select
            value={customerType}
            onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs cursor-pointer"
          >
            <option value="">All Customer Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Corporate">Corporate</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">Customer Name</th>
                <th className="p-3.5 font-semibold">Type</th>
                <th className="p-3.5 font-semibold">Contact Info</th>
                <th className="p-3.5 font-semibold">City</th>
                <th className="p-3.5 font-semibold text-right">Khata Balance</th>
                <th className="p-3.5 font-semibold text-right">Credit Limit</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="p-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="p-3.5"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="p-3.5"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="p-3.5"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="p-3.5"><Skeleton className="h-6 w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-bold text-foreground">
                      {c.name}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary">
                        {c.customerType || "Retail"}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {c.phone || c.email || "N/A"}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {c.city || "—"}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-500">
                      Rs {(c.currentBalance || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-foreground">
                      Rs {(c.creditLimit || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.status || "Active"}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetail(c._id)}
                          className="size-7 text-primary hover:bg-primary/10 cursor-pointer"
                          title="View Analytics & A4 Statement"
                        >
                          <EyeIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(c)}
                          className="size-7 text-muted-foreground hover:bg-muted cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2Icon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(c)}
                          className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControl
          page={page}
          pages={totalPages}
          total={totalRecords}
          onPageChange={setPage}
        />
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={loadCustomers}
      />

      <CustomerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        customerId={detailCustomerId}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Profile"
        description={`Are you sure you want to permanently delete customer profile for "${deleteTarget?.name}"?`}
        confirmText="Delete Profile"
        variant="destructive"
      />
    </div>
  );
}
