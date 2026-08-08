import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  TruckIcon,
  PlusIcon,
  SearchIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierPaymentModal } from "@/components/supplier-payment-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  fetchSuppliersApi,
  createSupplierApi,
  fetchSupplierLedgerApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

const PAGE_SIZE = 10;

export function SupplierLedgerManager() {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false);

  useEffect(() => {
    if (location.state?.openModal) {
      setIsPaymentModalOpen(true);
    }
  }, [location.state]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      const [supRes, legRes] = await Promise.all([
        fetchSuppliersApi({ search }),
        fetchSupplierLedgerApi(selectedSupplierId),
      ]);

      if (supRes?.success) setSuppliers(supRes.data);
      if (legRes?.success) setLedgerEntries(legRes.data);
    } catch (err) {
      toast.error("Failed to load supplier ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [search, selectedSupplierId]);

  const filteredLedgerEntries = ledgerEntries.filter((item) => {
    if (transactionTypeFilter === "Purchase") return item.transactionType.includes("Purchase");
    if (transactionTypeFilter === "Payment") return item.transactionType.includes("Payment");
    return true;
  });

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      await createSupplierApi({
        name: newSupplierName.trim(),
        phone: newSupplierPhone,
        address: newSupplierAddress,
      });

      toast.success("New supplier profile created!");
      setNewSupplierName("");
      setNewSupplierPhone("");
      setNewSupplierAddress("");
      setShowAddSupplierForm(false);
      loadSupplierData();
    } catch (err) {
      toast.error(err.message || "Failed to add supplier");
    }
  };

  const totalOwedBalance = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);

  const handleExportExcel = () => {
    const data = ledgerEntries.map((l) => ({
      Date: new Date(l.createdAt).toLocaleDateString(),
      "Supplier Name": l.supplierName,
      Type: l.transactionType,
      "Amount (PKR)": l.amount,
      "Payment Mode": l.paymentMode,
      "Running Balance (PKR)": l.runningBalance,
      "Ref No": l.referenceNumber || "-",
      Notes: l.notes || "-",
    }));
    exportTransactionsToExcel(data, "Supplier_Khata_Ledger.xlsx");
    toast.success("Supplier ledger exported to Excel!");
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Supplier & Refinery Ledger (Khareedari Khata)</h1>
          <p className="text-xs text-muted-foreground">Manage vendor profiles, pending supplier balances, and payment receipt vouchers.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer text-xs"
          >
            <PlusIcon className="size-3.5" />
            <span>Record Supplier Payment</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddSupplierForm(!showAddSupplierForm)}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <TruckIcon className="size-3.5" />
            <span>{showAddSupplierForm ? "Close Form" : "Add New Supplier"}</span>
          </Button>
        </div>
      </div>

      {showAddSupplierForm && (
        <form onSubmit={handleAddSupplier} className="p-4 bg-card rounded-xl border border-border space-y-3 animate-in fade-in duration-150 text-xs">
          <h3 className="font-semibold text-sm text-foreground">Add New Supplier Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="text"
              placeholder="Supplier Name *"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              className="text-xs"
              required
            />
            <Input
              type="text"
              placeholder="Phone Number"
              value={newSupplierPhone}
              onChange={(e) => setNewSupplierPhone(e.target.value)}
              className="text-xs"
            />
            <Input
              type="text"
              placeholder="Office / Refinery Address"
              value={newSupplierAddress}
              onChange={(e) => setNewSupplierAddress(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" size="sm" className="text-xs cursor-pointer">
              Save Supplier
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Owed to Suppliers</span>
          <div className="text-xl font-bold font-mono text-rose-500">
            Rs. {totalOwedBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Total Pending Payable Balance</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Registered Suppliers</span>
          <div className="text-xl font-bold font-mono text-foreground">
            {suppliers.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Active Vendors / Refineries</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Ledger Entries Count</span>
          <div className="text-xl font-bold font-mono text-foreground">
            {ledgerEntries.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Total Khata Transactions</p>
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
          <div className="relative col-span-12 md:col-span-10">
            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search supplier name, ref no, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 text-xs h-9 w-full"
            />
          </div>

          <div className="col-span-12 md:col-span-2">
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/30 font-semibold text-xs text-foreground">
          Supplier Ledger Transaction History ({filteredLedgerEntries.length} Entries)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">Date</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Transaction Type</th>
                <th className="p-3 text-right">Amount (PKR)</th>
                <th className="p-3 text-right">Running Owed Balance</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 pe-4">Ref No / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading supplier ledger transactions...
                  </td>
                </tr>
              ) : filteredLedgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No supplier ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLedgerEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-semibold text-foreground">{item.supplierName}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.transactionType.includes("Purchase")
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        {item.transactionType}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-500">
                      Rs. {item.runningBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{item.paymentMode || "Cash"}</td>
                    <td className="p-3 pe-4 text-muted-foreground text-[11px]">
                      {item.referenceNumber || item.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLedgerEntries.length / PAGE_SIZE) || 1}
          totalItems={filteredLedgerEntries.length}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        suppliers={suppliers}
        onSuccess={loadSupplierData}
      />
    </div>
  );
}
