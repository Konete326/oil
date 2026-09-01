import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  TruckIcon,
  PlusIcon,
  SearchIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  Trash2Icon,
  Building2Icon,
  EyeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierPaymentModal } from "@/components/supplier-payment-modal";
import { SupplierDetailModal } from "@/components/supplier-detail-modal";
import { SupplierModal } from "@/components/supplier-modal";
import { CustomerPrintStatement } from "@/components/customer-print-statement";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  fetchSuppliersApi,
  fetchSupplierLedgerApi,
  deleteSupplierApi,
  deleteSupplierTransactionApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

const PAGE_SIZE = 10;

export function SupplierLedgerManager() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("suppliers");
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
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

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

      if (supRes?.success) setSuppliers(supRes.data || []);
      if (legRes?.success) setLedgerEntries(legRes.data || []);
    } catch (err) {
      toast.error("Failed to load supplier ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [search, selectedSupplierId]);

  const filteredLedgerEntries = useMemo(() => {
    return (ledgerEntries || []).filter((item) => {
      if (!item) return false;
      const transType = String(item.transactionType || "");
      if (transactionTypeFilter === "Purchase") return transType.includes("Purchase");
      if (transactionTypeFilter === "Payment") return transType.includes("Payment");
      return true;
    });
  }, [ledgerEntries, transactionTypeFilter]);



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

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      setIsDeleting(true);
      await deleteSupplierTransactionApi(transactionToDelete._id);
      toast.success("Transaction entry deleted successfully!");
      setTransactionToDelete(null);
      await loadSupplierData();
    } catch (err) {
      toast.error(err.message || "Failed to delete transaction entry");
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

  const totalOwedBalance = useMemo(() => suppliers.reduce((sum, sup) => sum + (sup.currentBalance || 0), 0), [suppliers]);
  const selectedSupplierObj = useMemo(() => suppliers.find((s) => s._id === selectedSupplierId), [suppliers, selectedSupplierId]);

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TruckIcon className="size-5 text-primary" />
            <span>Supplier & Refinery Ledger (Accounts Payable)</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Purchases, payments, and running balance records for oil suppliers and refineries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSupplierToPrint(selectedSupplierObj || { name: "All Suppliers / Refineries Khata Summary", address: "Korangi Industrial Area", city: "Karachi", openingBalance: 0 });
              setIsPrintModalOpen(true);
            }}
            className="gap-1 cursor-pointer text-xs h-7.5 px-2.5"
          >
            <PrinterIcon className="size-3 text-primary" />
            <span>Print A4</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 cursor-pointer text-xs h-7.5 px-3"
          >
            <PlusIcon className="size-3.5" />
            <span>Record Payment</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSupplierModalOpen(true)}
            className="gap-1 cursor-pointer text-xs h-7.5 px-2.5"
          >
            <Building2Icon className="size-3 text-primary" />
            <span>Add Supplier</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-rose-500/15 flex items-center justify-center text-rose-500 shrink-0">
            <TruckIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Total Owed to Suppliers</p>
            <p className="text-base sm:text-lg font-bold font-mono text-rose-500">Rs. {totalOwedBalance.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Building2Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Registered Suppliers</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{suppliers.length} Vendors</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
            <PrinterIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Ledger Entries Count</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{ledgerEntries.length} Records</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-card p-2 sm:p-2.5 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={activeTab === "transactions" ? "Search supplier name, ref no, or notes..." : "Search supplier by name, phone, address..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="ps-8 text-xs h-7.5 w-full bg-muted/30 focus:bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <button
              onClick={() => { setActiveTab("suppliers"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "suppliers"
                  ? "bg-background text-primary border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Suppliers ({suppliers.length})
            </button>
            <button
              onClick={() => { setActiveTab("transactions"); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "transactions"
                  ? "bg-background text-primary border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Transactions ({filteredLedgerEntries.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "transactions" ? (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col">
            <div className="max-h-[calc(100vh-270px)] min-h-[240px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider shadow-xs">
                  <tr>
                    <th className="p-2.5 ps-3.5 h-9 font-semibold">Date</th>
                    <th className="p-2.5 h-9 font-semibold">Supplier Name</th>
                    <th className="p-2.5 h-9 font-semibold">Transaction Type</th>
                    <th className="p-2.5 h-9 font-semibold text-right">Amount (PKR)</th>
                    <th className="p-2.5 h-9 font-semibold text-right">Running Balance</th>
                    <th className="p-2.5 h-9 font-semibold">Payment Mode</th>
                    <th className="p-2.5 h-9 font-semibold">Ref No / Details</th>
                    <th className="p-2.5 pe-3.5 h-9 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">
                        Loading supplier ledger transactions...
                      </td>
                    </tr>
                  ) : filteredLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">
                        No supplier ledger entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => (
                      <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2 ps-3.5 text-muted-foreground text-[11px]">
                          {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="p-2 font-semibold text-foreground">
                          <button
                            onClick={() => {
                              const found = (suppliers || []).find((s) => (s._id || s.id) === item.supplier || s.name === item.supplierName);
                              if (found) setSupplierToView(found);
                            }}
                            className="hover:underline text-left text-primary font-bold cursor-pointer"
                          >
                            {item.supplierName || "Supplier"}
                          </button>
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                              String(item.transactionType || "").includes("Purchase")
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {item.transactionType || "Transaction"}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-foreground text-xs">
                          Rs. {(Number(item.amount) || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          Rs. {(Number(item.runningBalance) || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-[11px]">
                          {item.bankAccountName || (item.paymentMode && item.paymentMode.toLowerCase().includes("bank")) ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Bank ({item.bankAccountName ? item.bankAccountName.split("-")[0].trim() : item.bankName || "Transfer"})
                            </span>
                          ) : item.paymentMode === "Cheque" ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Cheque
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-muted text-muted-foreground border border-border/60">
                              {item.paymentMode || "Cash"}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground text-[11px]">
                          {item.referenceNumber || item.notes || "-"}
                        </td>
                        <td className="p-2 pe-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setTransactionToDelete(item)}
                            className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete Transaction Entry"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
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
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col">
          <div className="max-h-[calc(100vh-270px)] min-h-[240px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider shadow-xs">
                <tr>
                  <th className="p-2.5 ps-3.5 h-9 font-semibold">S.No</th>
                  <th className="p-2.5 h-9 font-semibold">Supplier / Refinery Name</th>
                  <th className="p-2.5 h-9 font-semibold">Phone</th>
                  <th className="p-2.5 h-9 font-semibold">Address / Office</th>
                  <th className="p-2.5 h-9 font-semibold text-right">Owed Balance (PKR)</th>
                  <th className="p-2.5 pe-3.5 h-9 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                      No suppliers registered yet. Click "Add Supplier" to create one.
                    </td>
                  </tr>
                ) : (
                  suppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((sup, idx) => (
                    <tr key={sup._id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2 ps-3.5 font-mono text-muted-foreground text-[11px]">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="p-2 font-semibold text-foreground">
                        <button
                          onClick={() => setSupplierToView(sup)}
                          className="hover:underline text-primary text-left cursor-pointer font-bold"
                        >
                          {sup.name}
                        </button>
                      </td>
                      <td className="p-2 text-muted-foreground font-mono text-[11px]">
                        {sup.phone || "-"}
                      </td>
                      <td className="p-2 text-muted-foreground text-[11px]">
                        {sup.address || "-"}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-rose-500 text-xs">
                        Rs. {(sup.currentBalance || 0).toLocaleString()}
                      </td>
                      <td className="p-2 pe-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedSupplierId(sup._id);
                              setIsPaymentModalOpen(true);
                            }}
                            className="size-7 text-primary hover:bg-primary/10 cursor-pointer"
                            title="Record Payment"
                          >
                            <PlusIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSupplierToView(sup)}
                            className="size-7 text-foreground/80 hover:bg-muted cursor-pointer"
                            title="View Supplier Profile & Details"
                          >
                            <EyeIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSupplierToPrint(sup);
                              setIsPrintModalOpen(true);
                            }}
                            className="size-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                            title="Print A4 Supplier Statement"
                          >
                            <PrinterIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSupplierToDelete(sup)}
                            className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete Supplier Profile"
                          >
                            <Trash2Icon className="size-3.5" />
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
        defaultSupplierId={selectedSupplierId}
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

      <ConfirmModal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete Transaction Entry"
        message={`Are you sure you want to delete this ${transactionToDelete?.transactionType || "transaction"} of Rs. ${Number(transactionToDelete?.amount || 0).toLocaleString()} for "${transactionToDelete?.supplierName || "Supplier"}"? The vendor balance will be automatically adjusted.`}
        confirmText="Yes, Delete Transaction"
        loading={isDeleting}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSaved={loadSupplierData}
        existingSuppliers={suppliers}
      />
    </div>
  );
}
