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
  Trash2Icon,
  Building2Icon,
  PhoneIcon,
  MapPinIcon,
  EyeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierPaymentModal } from "@/components/supplier-payment-modal";
import { SupplierDetailModal } from "@/components/supplier-detail-modal";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  fetchSuppliersApi,
  createSupplierApi,
  fetchSupplierLedgerApi,
  deleteSupplierApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

const PAGE_SIZE = 10;

export function SupplierLedgerManager() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("transactions");
  const [suppliers, setSuppliers] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [supplierToPrint, setSupplierToPrint] = useState(null);
  const [supplierToView, setSupplierToView] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      setIsDeleting(true);
      await deleteSupplierApi(supplierToDelete._id);
      toast.success(`Supplier "${supplierToDelete.name}" deleted successfully!`);
      if (selectedSupplierId === supplierToDelete._id) {
        setSelectedSupplierId("");
      }
      setSupplierToDelete(null);
      await loadSupplierData();
    } catch (err) {
      toast.error(err.message || "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredLedgerEntries.map((item, idx) => ({
      "S.No": idx + 1,
      Date: new Date(item.createdAt).toLocaleDateString(),
      "Supplier Name": item.supplierName,
      "Transaction Type": item.transactionType,
      "Amount (PKR)": item.amount,
      "Running Balance (PKR)": item.runningBalance,
      "Payment Mode": item.paymentMode || "Cash",
      Reference: item.referenceNumber || item.notes || "-",
    }));

    exportTransactionsToExcel(data, "Supplier_Ledger_Transactions.xlsx");
    toast.success("Supplier ledger exported to Excel!");
  };

  const totalOwedBalance = suppliers.reduce((sum, sup) => sum + (sup.currentBalance || 0), 0);
  const selectedSupplierObj = suppliers.find((s) => s._id === selectedSupplierId);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TruckIcon className="size-6 text-primary" />
            Supplier & Refinery Ledger (Accounts Payable)
          </h2>
          <p className="text-xs text-muted-foreground">
            Purchases, payments, and running balance records for oil suppliers and refineries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSupplierToPrint(selectedSupplierObj || { name: "All Suppliers / Refineries Khata Summary", address: "Korangi Industrial Area", city: "Karachi", openingBalance: 0 });
              setIsPrintModalOpen(true);
            }}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <PrinterIcon className="size-3.5 text-primary" />
            <span>Print A4 Statement</span>
          </Button>

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
            <Building2Icon className="size-3.5" />
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
              placeholder="Phone Number (Optional)"
              value={newSupplierPhone}
              onChange={(e) => setNewSupplierPhone(e.target.value)}
              className="text-xs"
            />
            <Input
              type="text"
              placeholder="Office / Refinery Address (Optional)"
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

      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab("transactions"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "transactions"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ledger Transactions ({filteredLedgerEntries.length})
          </button>
          <button
            onClick={() => { setActiveTab("suppliers"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "suppliers"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Registered Suppliers ({suppliers.length})
          </button>
        </div>

        {activeTab === "transactions" && (
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs cursor-pointer">
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>
        )}
      </div>

      {activeTab === "transactions" ? (
        <div className="space-y-4">
          <div className="bg-card p-3 rounded-xl border border-border">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
              <div className="relative col-span-12 md:col-span-8">
                <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search supplier name, ref no, or notes..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="ps-9 text-xs h-9 w-full"
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => { setSelectedSupplierId(e.target.value); setCurrentPage(1); }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} (Owed: Rs. {s.currentBalance?.toLocaleString() || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedSupplierObj && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-xl text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-foreground">{selectedSupplierObj.name}</span>
                <p className="text-muted-foreground text-[11px]">
                  {selectedSupplierObj.phone ? `Phone: ${selectedSupplierObj.phone}` : "No phone"} | {selectedSupplierObj.address || "Address not provided"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right pe-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Outstanding Balance:</span>
                  <p className="font-mono font-bold text-rose-500 text-sm">Rs. {selectedSupplierObj.currentBalance?.toLocaleString() || 0}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSupplierToView(selectedSupplierObj)}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <EyeIcon className="size-3.5" />
                  <span>View Details</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setSupplierToDelete(selectedSupplierObj)}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Delete Supplier</span>
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border bg-muted/30 font-semibold text-xs text-foreground flex items-center justify-between">
              <span>Supplier Ledger Transaction History</span>
              <span className="text-muted-foreground font-mono text-[11px]">{filteredLedgerEntries.length} Total Entries</span>
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
                    <th className="p-3 pe-4 text-right">Ref No / Details</th>
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
                        <td className="p-3 font-semibold text-foreground">
                          <button
                            onClick={() => {
                              const found = suppliers.find((s) => s._id === item.supplier || s.name === item.supplierName);
                              if (found) setSupplierToView(found);
                            }}
                            className="hover:underline text-left text-primary font-bold cursor-pointer"
                          >
                            {item.supplierName}
                          </button>
                        </td>
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
                        <td className="p-3 pe-4 text-right text-muted-foreground text-[11px]">
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
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-muted/30 font-semibold text-xs text-foreground flex items-center justify-between">
            <span>Registered Suppliers & Refineries List</span>
            <span className="text-muted-foreground font-mono text-[11px]">{suppliers.length} Active Profiles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 ps-4">#</th>
                  <th className="p-3">Supplier / Refinery Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address / Office</th>
                  <th className="p-3 text-right">Owed Balance (PKR)</th>
                  <th className="p-3 pe-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No suppliers registered yet. Click "Add New Supplier" to create one.
                    </td>
                  </tr>
                ) : (
                  suppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((sup, idx) => (
                    <tr key={sup._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 ps-4 font-mono text-muted-foreground">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        <button
                          onClick={() => setSupplierToView(sup)}
                          className="hover:underline text-primary text-left cursor-pointer font-bold"
                        >
                          {sup.name}
                        </button>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {sup.phone || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {sup.address || "-"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-500">
                        Rs. {(sup.currentBalance || 0).toLocaleString()}
                      </td>
                      <td className="p-3 pe-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSupplierToView(sup)}
                            className="text-primary hover:bg-primary/10 cursor-pointer"
                            title="View Supplier Profile & Details"
                          >
                            <EyeIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSupplierToPrint(sup);
                              setIsPrintModalOpen(true);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                            title="Print A4 Supplier Statement"
                          >
                            <PrinterIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSupplierToDelete(sup)}
                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete Supplier Profile"
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.ceil(suppliers.length / PAGE_SIZE) || 1}
            totalItems={suppliers.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        suppliers={suppliers}
        onSuccess={loadSupplierData}
      />

      <SupplierDetailModal
        isOpen={!!supplierToView}
        onClose={() => setSupplierToView(null)}
        supplier={supplierToView}
      />

      {isPrintModalOpen && supplierToPrint && (
        <CustomerPrintStatement
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSupplierToPrint(null);
          }}
          customer={{
            name: supplierToPrint.name,
            phone: supplierToPrint.phone || "-",
            address: supplierToPrint.address || "Supplier Refinery Depot",
            city: "Karachi",
            openingBalance: 0,
          }}
          ledgerEntries={filteredLedgerEntries}
        />
      )}

      <ConfirmModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteSupplier}
        title="Delete Supplier Profile"
        message={`Are you sure you want to delete supplier "${supplierToDelete?.name}"? All associated vendor records will be permanently removed.`}
        confirmText="Yes, Delete Supplier"
        loading={isDeleting}
      />
    </div>
  );
}
