import { useState, useEffect, useMemo } from "react";
import {
  fetchMills,
  createMill,
  updateMill,
  deleteMill,
  fetchChallans,
  createChallan,
  fetchProducts,
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
import { FactoryIcon, TruckIcon, PlusIcon, Edit3Icon, Trash2Icon, SearchIcon, PrinterIcon, WalletIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 4;

export function TextileManager() {
  const [activeTab, setActiveTab] = useState("challans");
  const [mills, setMills] = useState([]);
  const [challans, setChallans] = useState([]);
  const [products, setProducts] = useState([]);
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
    const [mRes, cRes, pRes] = await Promise.all([fetchMills(), fetchChallans(), fetchProducts()]);
    if (mRes && mRes.success) setMills(mRes.data || []);
    if (cRes && cRes.success) setChallans(cRes.data || []);
    if (pRes && pRes.success) setProducts(pRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveMill = async (formData) => {
    if (editingMill) {
      await updateMill(editingMill._id, formData);
    } else {
      await createMill(formData);
    }
    await loadData();
  };

  const handleDeleteMill = async (id) => {
    await deleteMill(id);
    setConfirmDeleteMill(null);
    await loadData();
  };

  const handleSaveChallan = async (formData) => {
    await createChallan(formData);
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

  const totalDispatchedLiters = useMemo(() => challans.reduce((sum, c) => sum + (c.quantityLiters || 0), 0), [challans]);
  const totalMillOutstanding = useMemo(() => mills.reduce((sum, m) => sum + (m.currentBalance || 0), 0), [mills]);

  const totalChallanPages = Math.ceil(filteredChallans.length / PAGE_SIZE) || 1;
  const paginatedChallans = useMemo(() => {
    return filteredChallans.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredChallans, currentPage]);

  const totalMillPages = Math.ceil(filteredMills.length / PAGE_SIZE) || 1;
  const paginatedMills = useMemo(() => {
    return filteredMills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredMills, currentPage]);

  return (
    <div className="w-full space-y-3 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FactoryIcon className="size-5 text-primary" />
            <span>Textile Mills B2B Sales & Gate Pass</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Manage Textile Mill contracts, Tanker Dip dispatch, Gate Passes, and Delivery Challans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            onClick={() => setIsChallanModalOpen(true)}
            className="gap-1 shadow-xs cursor-pointer text-xs h-7.5 px-3"
          >
            <TruckIcon className="size-3.5" />
            <span>Issue Challan</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingMill(null);
              setIsMillModalOpen(true);
            }}
            className="gap-1 shadow-xs cursor-pointer text-xs h-7.5 px-3"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Mill</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FactoryIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Registered Textile Mills</p>
            <p className="text-base sm:text-lg font-bold text-foreground">{mills.length}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
            <TruckIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Dispatched Volume</p>
            <p className="text-base sm:text-lg font-bold text-foreground font-mono">{totalDispatchedLiters.toLocaleString()} L</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xs">
          <div className="size-8 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
            <WalletIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] text-muted-foreground font-medium truncate">Mills Outstanding Balance</p>
            <p className="text-base sm:text-lg font-bold text-foreground font-mono">Rs {totalMillOutstanding.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
          <button
            onClick={() => {
              setActiveTab("challans");
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "challans" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Delivery Challans ({challans.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("mills");
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "mills" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Textile Mills ({mills.length})
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab === "challans" ? "challan, mill, vehicle..." : "mill name, code, zone..."}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="ps-8 text-xs h-7.5 bg-muted/30 focus:bg-background"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : activeTab === "challans" ? (
          filteredChallans.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <TruckIcon className="size-7 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No Delivery Challans Found</p>
              <p className="text-[11px] text-muted-foreground">Click "Issue Challan" to dispatch your first tanker load.</p>
            </div>
          ) : (
            <>
              <div className="max-h-[calc(100vh-270px)] min-h-[240px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-[110px] text-xs h-9">Challan No.</TableHead>
                      <TableHead className="text-xs h-9">Textile Mill Consignee</TableHead>
                      <TableHead className="text-xs h-9">Product / Grade</TableHead>
                      <TableHead className="text-xs h-9">Tanker & Driver</TableHead>
                      <TableHead className="text-center text-xs h-9">Dip & Volume</TableHead>
                      <TableHead className="text-right text-xs h-9">Total Amount</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedChallans.map((c) => (
                      <TableRow key={c._id} className="hover:bg-muted/20 text-xs border-b border-border/40">
                        <TableCell className="font-mono font-bold text-primary py-2">
                          {c.challanNumber}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2">
                          {c.millName}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-2">
                          {c.productName}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="space-y-0.5">
                            <p className="font-mono font-medium text-foreground text-[11px]">{c.vehicleNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{c.driverName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="space-y-0.5 font-mono">
                            <span className="font-bold text-foreground text-xs">{c.quantityLiters?.toLocaleString()} L</span>
                            <p className="text-[9.5px] text-muted-foreground">Dip: {c.dipMeasurementInches}"</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground py-2 text-xs">
                          Rs {c.totalAmount?.toLocaleString()}
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
                totalPages={totalChallanPages}
                totalItems={filteredChallans.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )
        ) : filteredMills.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FactoryIcon className="size-7 mx-auto text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">No Textile Mills Registered</p>
            <p className="text-[11px] text-muted-foreground">Click "Add Mill" to add a new B2B client profile.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-270px)] min-h-[240px] overflow-y-auto overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                  <TableRow className="border-b border-border/80">
                    <TableHead className="w-[100px] text-xs h-9">Code</TableHead>
                    <TableHead className="text-xs h-9">Mill Name & Zone</TableHead>
                    <TableHead className="text-xs h-9">Contact Representative</TableHead>
                    <TableHead className="text-right text-xs h-9">Contract Rate</TableHead>
                    <TableHead className="text-right text-xs h-9">Outstanding Balance</TableHead>
                    <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMills.map((m) => (
                    <TableRow key={m._id} className="hover:bg-muted/20 text-xs border-b border-border/40">
                      <TableCell className="font-mono font-bold text-primary py-2">
                        {m.code}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs text-foreground">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.zone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground text-[11px]">{m.contactPerson}</p>
                          <p className="text-[10px] text-muted-foreground">{m.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 py-2 text-xs">
                        Rs {m.contractRatePerLiter} / L
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400 py-2 text-xs">
                        Rs {m.currentBalance?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-2 pe-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => {
                              setEditingMill(m);
                              setIsMillModalOpen(true);
                            }}
                          >
                            <Edit3Icon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => setConfirmDeleteMill(m)}
                          >
                            <Trash2Icon className="size-3.5" />
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
              totalPages={totalMillPages}
              totalItems={filteredMills.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      <MillModal
        isOpen={isMillModalOpen}
        onClose={() => {
          setIsMillModalOpen(false);
          setEditingMill(null);
        }}
        onSave={handleSaveMill}
        initialData={editingMill}
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
        onConfirm={() => handleDeleteMill(confirmDeleteMill._id)}
        title="Delete Textile Mill Profile"
        message={`Are you sure you want to delete profile for "${confirmDeleteMill?.name}"?`}
      />
    </div>
  );
}
