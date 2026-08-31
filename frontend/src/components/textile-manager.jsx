import { useState, useEffect, useMemo } from "react";
import {
  fetchMills,
  createMill,
  updateMill,
  deleteMill,
  fetchChallans,
  createChallan,
  fetchProducts,
  fetchCustomers,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MillModal } from "@/components/mill-modal";
import { ChallanModal } from "@/components/challan-modal";
import { ChallanPrintModal } from "@/components/challan-print-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  FactoryIcon,
  TruckIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  SearchIcon,
  PrinterIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PAGE_SIZE = 5;

export function TextileManager() {
  const [activeTab, setActiveTab] = useState("challans");
  const [mills, setMills] = useState([]);
  const [challans, setChallans] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isMillModalOpen, setIsMillModalOpen] = useState(false);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [editingMill, setEditingMill] = useState(null);
  const [printingChallan, setPrintingChallan] = useState(null);
  const [confirmDeleteMill, setConfirmDeleteMill] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes, pRes, custRes] = await Promise.all([
        fetchMills(),
        fetchChallans(),
        fetchProducts(),
        fetchCustomers({ limit: 1000 }),
      ]);
      if (mRes && mRes.success) setMills(mRes.data || []);
      if (cRes && cRes.success) setChallans(cRes.data || []);
      if (pRes && pRes.success) setProducts(pRes.data || []);
      if (custRes && (custRes.data || Array.isArray(custRes))) {
        setCustomers(Array.isArray(custRes.data) ? custRes.data : Array.isArray(custRes) ? custRes : []);
      }
    } catch (e) {
      toast.error("Failed to load textile management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveMill = async (formData) => {
    if (editingMill) {
      await updateMill(editingMill._id, formData);
      toast.success("Mill profile updated successfully");
    } else {
      await createMill(formData);
      toast.success("New Textile Mill added successfully");
    }
    await loadData();
  };

  const handleDeleteMill = async (id) => {
    await deleteMill(id);
    setConfirmDeleteMill(null);
    toast.success("Mill profile removed");
    await loadData();
  };

  const handleSaveChallan = async (formData) => {
    await createChallan(formData);
    toast.success("Delivery Challan issued & stock deducted!");
    await loadData();
  };

  const filteredChallans = useMemo(() => {
    const q = search.toLowerCase().trim();
    return challans.filter(
      (c) =>
        !q ||
        (c.challanNumber && c.challanNumber.toLowerCase().includes(q)) ||
        (c.millName && c.millName.toLowerCase().includes(q)) ||
        (c.vehicleNumber && c.vehicleNumber.toLowerCase().includes(q)) ||
        (c.productName && c.productName.toLowerCase().includes(q))
    );
  }, [challans, search]);

  const filteredMills = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mills.filter(
      (m) =>
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.code && m.code.toLowerCase().includes(q)) ||
        (m.contactPerson && m.contactPerson.toLowerCase().includes(q)) ||
        (m.zone && m.zone.toLowerCase().includes(q))
    );
  }, [mills, search]);

  const totalDispatchedLiters = useMemo(() => challans.reduce((sum, c) => sum + (Number(c.quantityLiters) || 0), 0), [challans]);
  const totalMillOutstanding = useMemo(() => mills.reduce((sum, m) => sum + (Number(m.currentBalance) || 0), 0), [mills]);

  const currentDisplayList = activeTab === "challans" ? filteredChallans : filteredMills;
  const totalPages = Math.ceil(currentDisplayList.length / PAGE_SIZE) || 1;
  const paginatedList = useMemo(() => {
    return currentDisplayList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [currentDisplayList, currentPage]);

  return (
    <div className="w-full space-y-4 p-3 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FactoryIcon className="size-5.5 text-primary" />
            <span>Textile Mills &amp; Delivery Challans</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bulk lubricant contracts, tanker dispatches, delivery gate passes, and mill rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsChallanModalOpen(true)}
            size="sm"
            className="gap-1.5 shadow-xs cursor-pointer text-xs h-8"
          >
            <TruckIcon className="size-3.5" />
            <span>Issue Delivery Challan</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingMill(null);
              setIsMillModalOpen(true);
            }}
            className="gap-1.5 shadow-xs cursor-pointer text-xs h-8"
          >
            <PlusIcon className="size-3.5" />
            <span>Add New Mill</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Registered Textile Mills
          </p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
            {mills.length} <span className="text-xs font-semibold text-muted-foreground">Mills</span>
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-1">
            Active bulk client contracts
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 shadow-xs space-y-1">
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Dispatched Volume
          </p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {totalDispatchedLiters.toLocaleString()} <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">Liters</span>
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-emerald-500/20 pt-1">
            Total dispatched bulk volume
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Challans Issued
          </p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
            {challans.length} <span className="text-xs font-semibold text-muted-foreground">Gate Passes</span>
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-1">
            Tanker delivery records
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 shadow-xs space-y-1">
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Total Mills Outstanding
          </p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            Rs {Number(totalMillOutstanding || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground border-t border-amber-500/20 pt-1">
            Pending uncollected khata
          </p>
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border/80 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/40 shrink-0">
            <button
              onClick={() => {
                setActiveTab("challans");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "challans"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Delivery Challans ({challans.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("mills");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "mills"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Textile Mills Directory ({mills.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === "challans" ? "challan no, mill, vehicle..." : "mill name, code, zone..."}`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-8 bg-muted/30 focus:bg-background"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        ) : activeTab === "challans" ? (
          filteredChallans.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-1.5">
              <TruckIcon className="size-7 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No Delivery Challans Found</p>
              <p className="text-[11px] text-muted-foreground">Click "Issue Delivery Challan" to dispatch a tanker load.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/60 border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead className="w-[110px] text-[11px] h-8 font-semibold">Challan No.</TableHead>
                      <TableHead className="text-[11px] h-8 font-semibold">Textile Mill Consignee</TableHead>
                      <TableHead className="text-[11px] h-8 font-semibold">Product / Grade</TableHead>
                      <TableHead className="text-[11px] h-8 font-semibold">Tanker &amp; Driver</TableHead>
                      <TableHead className="text-center text-[11px] h-8 font-semibold">Volume (Liters)</TableHead>
                      <TableHead className="text-right text-[11px] h-8 font-semibold">Total Amount</TableHead>
                      <TableHead className="text-right text-[11px] h-8 pe-4 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map((c) => (
                      <TableRow key={c._id} className="hover:bg-muted/30 text-xs border-b border-border/40">
                        <TableCell className="font-mono font-bold text-primary py-2">
                          {c.challanNumber}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2">
                          {c.millName}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-2 text-[11px]">
                          {c.productName}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="space-y-0.5 leading-tight">
                            <p className="font-mono font-medium text-foreground text-[11px]">{c.vehicleNumber || "N/A"}</p>
                            <p className="text-[10px] text-muted-foreground">{c.driverName || "Driver"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2 font-mono font-bold text-foreground text-[11.5px]">
                          {Number(c.quantityLiters || 0).toLocaleString()} L
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground py-2 text-xs">
                          Rs {Number(c.totalAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-2 pe-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6.5 gap-1 text-[11px] px-2 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                            onClick={() => setPrintingChallan(c)}
                          >
                            <PrinterIcon className="size-3 text-primary" />
                            <span>Gate Pass</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredChallans.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )
        ) : (
          filteredMills.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-1.5">
              <FactoryIcon className="size-7 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No Textile Mills Registered</p>
              <p className="text-[11px] text-muted-foreground">Click "Add New Mill" to register a factory.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/60 border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead className="text-[11px] h-8 font-semibold">Mill Code &amp; Name</TableHead>
                      <TableHead className="text-[11px] h-8 font-semibold">Contact Person &amp; Phone</TableHead>
                      <TableHead className="text-[11px] h-8 font-semibold">Zone / Location</TableHead>
                      <TableHead className="text-right text-[11px] h-8 font-semibold">Contract Rate / L</TableHead>
                      <TableHead className="text-right text-[11px] h-8 font-semibold">Credit Limit</TableHead>
                      <TableHead className="text-right text-[11px] h-8 font-semibold">Khata Balance</TableHead>
                      <TableHead className="text-right text-[11px] h-8 pe-4 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map((m) => (
                      <TableRow key={m._id} className="hover:bg-muted/30 text-xs border-b border-border/40">
                        <TableCell className="py-2">
                          <span className="font-mono text-primary font-semibold">[{m.code}]</span>{" "}
                          <span className="font-bold text-foreground">{m.name}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-foreground font-medium text-[11.5px]">{m.contactPerson || "-"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{m.phone || "-"}</p>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="inline-block rounded bg-muted/70 px-2 py-0.5 text-[10.5px] font-medium text-foreground">
                            {m.zone || "Karachi"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium py-2 text-xs">
                          Rs {Number(m.contractRatePerLiter || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono py-2 text-muted-foreground text-xs">
                          Rs {Number(m.creditLimit || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground py-2 text-xs">
                          <span className={m.currentBalance > (m.creditLimit || 0) && m.creditLimit > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
                            Rs {Number(m.currentBalance || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2 pe-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6.5 cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingMill(m);
                                setIsMillModalOpen(true);
                              }}
                              title="Edit Mill"
                            >
                              <Edit3Icon className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => setConfirmDeleteMill(m)}
                              title="Delete Mill"
                            >
                              <Trash2Icon className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredMills.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )
        )}
      </div>

      <MillModal
        isOpen={isMillModalOpen}
        onClose={() => setIsMillModalOpen(false)}
        onSave={handleSaveMill}
        editingMill={editingMill}
        mills={mills}
        customers={customers}
      />

      <ChallanModal
        isOpen={isChallanModalOpen}
        onClose={() => setIsChallanModalOpen(false)}
        onSave={handleSaveChallan}
        mills={mills}
        products={products}
      />

      <ChallanPrintModal
        isOpen={!!printingChallan}
        onClose={() => setPrintingChallan(null)}
        challan={printingChallan}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteMill}
        onClose={() => setConfirmDeleteMill(null)}
        onConfirm={() => handleDeleteMill(confirmDeleteMill?._id)}
        title="Delete Mill Profile"
        description={`Are you sure you want to delete "${confirmDeleteMill?.name}"?`}
      />
    </div>
  );
}
