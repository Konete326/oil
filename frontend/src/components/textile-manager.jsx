import { useState, useEffect } from "react";
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
import { FactoryIcon, TruckIcon, PlusIcon, Edit3Icon, Trash2Icon, SearchIcon, PrinterIcon, ShieldCheckIcon, WalletIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

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
    if (mRes && mRes.success) setMills(mRes.data);
    if (cRes && cRes.success) setChallans(cRes.data);
    if (pRes && pRes.success) setProducts(pRes.data);
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

  const filteredChallans = challans.filter(
    (c) =>
      c.challanNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.millName.toLowerCase().includes(search.toLowerCase()) ||
      c.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.productName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMills = mills.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      m.zone.toLowerCase().includes(search.toLowerCase())
  );

  const totalDispatchedLiters = challans.reduce((sum, c) => sum + (c.quantityLiters || 0), 0);
  const totalMillOutstanding = mills.reduce((sum, m) => sum + (m.currentBalance || 0), 0);

  const totalChallanPages = Math.ceil(filteredChallans.length / PAGE_SIZE);
  const paginatedChallans = filteredChallans.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalMillPages = Math.ceil(filteredMills.length / PAGE_SIZE);
  const paginatedMills = filteredMills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FactoryIcon className="size-6 text-primary" />
            Karachi Textile Mills B2B Sales & Gate Pass
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage Textile Mill contracts, Tanker Dip dispatch, Gate Passes, and Delivery Challans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsChallanModalOpen(true)}
            className="gap-2 shadow-xs cursor-pointer text-xs"
          >
            <TruckIcon className="size-4" />
            Issue Delivery Challan
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingMill(null);
              setIsMillModalOpen(true);
            }}
            className="gap-2 shadow-xs cursor-pointer text-xs"
          >
            <PlusIcon className="size-4" />
            Add Textile Mill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FactoryIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Registered Textile Mills</p>
            <p className="text-xl font-bold text-foreground">{mills.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <TruckIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Tanker Dispatched Volume</p>
            <p className="text-xl font-bold text-foreground">{totalDispatchedLiters.toLocaleString()} Liters</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <WalletIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Mills Outstanding Balance</p>
            <p className="text-xl font-bold text-foreground">Rs {totalMillOutstanding.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab("challans");
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "challans" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Delivery Challans & Gate Passes ({challans.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("mills");
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "mills" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Textile Mill Profiles ({mills.length})
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab === "challans" ? "challan, mill, vehicle..." : "mill name, code, zone..."}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="ps-8 text-xs"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : activeTab === "challans" ? (
          filteredChallans.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <TruckIcon className="size-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No Delivery Challans Found</p>
              <p className="text-xs text-muted-foreground">Click "Issue Delivery Challan" to dispatch your first tanker load.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[110px]">Challan No.</TableHead>
                    <TableHead>Textile Mill Consignee</TableHead>
                    <TableHead>Product / Grade</TableHead>
                    <TableHead>Tanker & Driver</TableHead>
                    <TableHead className="text-center">Dip & Volume</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedChallans.map((c) => (
                    <TableRow key={c._id} className="hover:bg-muted/20 text-xs">
                      <TableCell className="font-mono font-bold text-primary">
                        {c.challanNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {c.millName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.productName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-mono font-medium text-foreground">{c.vehicleNumber}</p>
                          <p className="text-[11px] text-muted-foreground">{c.driverName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-0.5 font-mono">
                          <span className="font-bold text-foreground">{c.quantityLiters?.toLocaleString()} L</span>
                          <p className="text-[10px] text-muted-foreground">Dip: {c.dipMeasurementInches}"</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        Rs {c.totalAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs cursor-pointer"
                          onClick={() => setPrintingChallan(c)}
                        >
                          <PrinterIcon className="size-3.5 text-primary" />
                          <span>Gate Pass</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
            <FactoryIcon className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No Textile Mills Registered</p>
            <p className="text-xs text-muted-foreground">Click "Register Mill" to add a new B2B client profile.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Mill Name & Zone</TableHead>
                  <TableHead>Contact Representative</TableHead>
                  <TableHead className="text-right">Contract Rate</TableHead>
                  <TableHead className="text-right">Outstanding Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMills.map((m) => (
                  <TableRow key={m._id} className="hover:bg-muted/20 text-xs">
                    <TableCell className="font-mono font-bold text-primary">
                      {m.code}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-foreground">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.zone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{m.contactPerson}</p>
                        <p className="text-[11px] text-muted-foreground">{m.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-500">
                      Rs {m.contractRatePerLiter} / L
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-amber-500">
                      Rs {m.currentBalance?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => {
                            setEditingMill(m);
                            setIsMillModalOpen(true);
                          }}
                        >
                          <Edit3Icon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => setConfirmDeleteMill(m)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
