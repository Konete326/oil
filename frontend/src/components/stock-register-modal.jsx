import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
import {
  XIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  MinusIcon,
  SearchIcon,
  DropletIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BookOpenIcon,
  LayersIcon,
  CalendarIcon,
  Loader2Icon,
} from "lucide-react";
import {
  fetchPurchasesApi,
  createPurchaseApi,
  fetchPosSales,
  fetchChallans,
  updateProduct,
  fetchProducts,
} from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

export function StockRegisterModal({
  isOpen,
  onClose,
  initialProduct,
  products: initialProducts = [],
  onStockUpdated,
  isPage = false,
}) {
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const products = initialProducts.length > 0 ? initialProducts : fetchedProducts;
  const [selectedProductId, setSelectedProductId] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [submittingMovement, setSubmittingMovement] = useState(false);

  const [inwardSupplier, setInwardSupplier] = useState("");
  const [inwardQty, setInwardQty] = useState("");
  const [inwardRate, setInwardRate] = useState("");
  const [inwardInvoiceNo, setInwardInvoiceNo] = useState("");
  const [inwardNotes, setInwardNotes] = useState("");

  const [outwardReason, setOutwardReason] = useState("Manual Stock Adjustment / Return");
  const [outwardQty, setOutwardQty] = useState("");
  const [outwardFolio, setOutwardFolio] = useState("");
  const [outwardNotes, setOutwardNotes] = useState("");

  useEffect(() => {
    if (initialProducts.length === 0) {
      fetchProducts().then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setFetchedProducts(res.data);
        }
      });
    }
  }, [initialProducts.length]);

  useEffect(() => {
    if (initialProduct?._id) {
      setSelectedProductId(initialProduct._id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0]._id);
    }
  }, [initialProduct, products, selectedProductId]);

  const activeProduct = useMemo(() => {
    return products.find((p) => p._id === selectedProductId) || initialProduct || null;
  }, [products, selectedProductId, initialProduct]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchRes, salesRes, challanRes] = await Promise.all([
        fetchPurchasesApi(),
        fetchPosSales(),
        fetchChallans(),
      ]);

      if (purchRes && purchRes.success && Array.isArray(purchRes.data)) {
        setPurchases(purchRes.data);
      }
      if (salesRes && salesRes.success && Array.isArray(salesRes.data)) {
        setSales(salesRes.data);
      }
      if (challanRes && challanRes.success && Array.isArray(challanRes.data)) {
        setChallans(challanRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock movement register records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen || isPage) {
      loadData();
    }
  }, [isOpen, isPage]);

  const registerEntries = useMemo(() => {
    if (!activeProduct) return [];

    const prodId = activeProduct._id;
    const prodName = (activeProduct.name || "").toLowerCase().trim();

    const rawInward = [];
    purchases.forEach((p) => {
      const matches =
        (p.product && (p.product._id === prodId || p.product === prodId)) ||
        p.productId === prodId ||
        (p.productName && p.productName.toLowerCase().trim() === prodName);

      if (matches) {
        rawInward.push({
          id: p._id,
          date: p.purchaseDate || p.createdAt || new Date().toISOString(),
          particulars: p.supplierName || "Supplier Purchase",
          folio: p.invoiceNumber || p.purchaseNumber || "-",
          receipts: Number(p.quantity) || 0,
          issued: 0,
          remarks: p.notes || "Supplier Inward",
          type: "inward",
        });
      }
    });

    const rawOutward = [];
    sales.forEach((s) => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach((it) => {
        const matches =
          (it.product && (it.product._id === prodId || it.product === prodId)) ||
          (it.productName && it.productName.toLowerCase().trim() === prodName);

        if (matches) {
          rawOutward.push({
            id: `${s._id}_${it._id || it.productName}`,
            date: s.createdAt || new Date().toISOString(),
            particulars: s.customerName || "Walk-in Counter Customer",
            folio: s.saleNumber || "-",
            receipts: 0,
            issued: Number(it.quantity) || 0,
            remarks: s.isCredit ? "Udhar (Credit) Sale" : "Counter Cash Sale",
            type: "outward",
          });
        }
      });
    });

    challans.forEach((ch) => {
      const matches =
        (ch.product && (ch.product._id === prodId || ch.product === prodId)) ||
        (ch.productName && ch.productName.toLowerCase().trim() === prodName);

      if (matches) {
        rawOutward.push({
          id: ch._id,
          date: ch.createdAt || new Date().toISOString(),
          particulars: ch.millName || "Textile Mill Delivery",
          folio: ch.challanNumber || "-",
          receipts: 0,
          issued: Number(ch.quantityLiters) || 0,
          remarks: "Delivery Challan",
          type: "outward",
        });
      }
    });

    const totalInFromPurchases = rawInward.reduce((sum, item) => sum + item.receipts, 0);
    const totalOutFromSales = rawOutward.reduce((sum, item) => sum + item.issued, 0);
    const currentStock = Number(activeProduct.stockQuantity) || 0;

    const initialStock = Math.max(0, currentStock + totalOutFromSales - totalInFromPurchases);

    const initialEntry = {
      id: `bf_${prodId}`,
      date: activeProduct.createdAt || new Date(Date.now() - 30 * 86400000).toISOString(),
      particulars: "B.F (Balance Forward)",
      folio: "-",
      receipts: initialStock,
      issued: 0,
      remarks: "Opening Balance Forward",
      type: "bf",
    };

    const combined = [initialEntry, ...rawInward, ...rawOutward].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let runningBal = 0;
    const computed = combined.map((entry) => {
      runningBal = runningBal + entry.receipts - entry.issued;
      return {
        ...entry,
        balance: Math.max(0, runningBal),
      };
    });

    return computed;
  }, [activeProduct, purchases, sales, challans]);

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return registerEntries
      .filter((entry) => {
        const matchesSearch =
          !q ||
          entry.particulars.toLowerCase().includes(q) ||
          entry.folio.toLowerCase().includes(q) ||
          entry.remarks.toLowerCase().includes(q);

        let matchesType = true;
        if (typeFilter === "inward") matchesType = entry.receipts > 0;
        else if (typeFilter === "outward") matchesType = entry.issued > 0;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortOrder === "desc") return new Date(b.date) - new Date(a.date);
        return new Date(a.date) - new Date(b.date);
      });
  }, [registerEntries, search, typeFilter, sortOrder]);

  const totalReceipts = useMemo(
    () => registerEntries.reduce((sum, e) => sum + e.receipts, 0),
    [registerEntries]
  );
  const totalIssued = useMemo(
    () => registerEntries.reduce((sum, e) => sum + e.issued, 0),
    [registerEntries]
  );
  const currentBalance = activeProduct?.stockQuantity ?? 0;

  const handlePrint = () => {
    const orig = document.title;
    const artName = (activeProduct?.name || "Product").replace(/[^a-zA-Z0-9-_]/g, "_");
    document.title = `Stock_Register_${artName}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    const data = filteredEntries.map((e, idx) => ({
      "S.No": idx + 1,
      Date: new Date(e.date).toLocaleDateString("en-GB"),
      PARTICULARS: e.particulars,
      Folio: e.folio,
      "Receipts (Inward L)": e.receipts > 0 ? e.receipts : "-",
      "Issued (Outward L)": e.issued > 0 ? e.issued : "-",
      "Balance (L)": e.balance,
      Remarks: e.remarks,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Register");
    XLSX.writeFile(
      workbook,
      `Stock_Register_${activeProduct?.name || "Oil"}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("Stock Register exported to Excel!");
  };

  const handleRecordInward = async (e) => {
    e.preventDefault();
    if (!inwardQty || Number(inwardQty) <= 0) {
      toast.error("Please enter a valid inward quantity in Liters.");
      return;
    }
    setSubmittingMovement(true);
    try {
      await createPurchaseApi({
        supplierName: inwardSupplier.trim() || "Local Supplier Arrival",
        productId: activeProduct._id,
        productName: activeProduct.name,
        quantity: Number(inwardQty),
        unitType: "Liters",
        unitPrice: Number(inwardRate) || activeProduct.costPrice || 0,
        invoiceNumber: inwardInvoiceNo.trim() || `REC-${Date.now().toString().slice(-5)}`,
        notes: inwardNotes.trim() || "Stock Inward Register Entry",
      });

      toast.success(`${inwardQty} Liters successfully added to stock register!`);
      setIsInwardModalOpen(false);
      setInwardQty("");
      setInwardSupplier("");
      setInwardInvoiceNo("");
      setInwardNotes("");
      await loadData();
      onStockUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to record inward stock");
    } finally {
      setSubmittingMovement(false);
    }
  };

  const handleRecordOutward = async (e) => {
    e.preventDefault();
    const qty = Number(outwardQty);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid outward quantity in Liters.");
      return;
    }
    if (qty > currentBalance) {
      toast.error(`Cannot issue ${qty} Liters. Current balance is only ${currentBalance} Liters.`);
      return;
    }

    setSubmittingMovement(true);
    try {
      const newStock = Math.max(0, currentBalance - qty);
      await updateProduct(activeProduct._id, { stockQuantity: newStock });
      toast.success(`${qty} Liters deducted from stock balance!`);
      setIsOutwardModalOpen(false);
      setOutwardQty("");
      setOutwardFolio("");
      setOutwardNotes("");
      await loadData();
      onStockUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to record outward stock");
    } finally {
      setSubmittingMovement(false);
    }
  };

  if ((!isOpen && !isPage) || typeof window === "undefined") return null;

  const modalContent = (
    <div className={cn(
      isPage
        ? "w-full space-y-4 print:p-0"
        : "print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto"
    )}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-portal {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .a4-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>

      <div className={cn(
        "w-full rounded-2xl border border-border bg-background shadow-xs flex flex-col print:border-none print:shadow-none print:w-full print:block print:bg-white",
        !isPage && "max-w-5xl max-h-[94vh] shadow-2xl my-auto"
      )}>
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between border-b border-border p-3.5 print:hidden bg-card rounded-t-2xl shrink-0 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <BookOpenIcon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Stock (Inward & Outward) Register
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                  Pakistani Standard
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mal ka aana (Receipts), nikalna (Issued), aur live Baqaya balance ka mukammal register.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => setIsInwardModalOpen(true)}
              className="h-7.5 gap-1 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusIcon className="size-3.5" />
              <span>+ Maal Aaya (Inward)</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsOutwardModalOpen(true)}
              className="h-7.5 gap-1 text-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            >
              <MinusIcon className="size-3.5" />
              <span>- Maal Nikla (Outward)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-7.5 gap-1 text-xs px-2.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
              <span>Excel</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="h-7.5 gap-1 text-xs cursor-pointer bg-primary text-primary-foreground font-medium"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print A4</span>
            </Button>

            {!isPage && (
              <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
                <XIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Select Article:
            </span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full sm:w-72 h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground font-semibold shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.stockQuantity} L)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search party, folio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-8 text-xs h-8 bg-background"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-2xs cursor-pointer"
            >
              <option value="all">All Movements</option>
              <option value="inward">Inward (Receipts) Only</option>
              <option value="outward">Outward (Issued) Only</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="h-8 text-xs px-2.5 cursor-pointer"
              title="Change Chronological Order"
            >
              {sortOrder === "asc" ? "Oldest First" : "Newest First"}
            </Button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto p-3 sm:p-5 print:overflow-visible print:p-0 print:m-0">
          <div
            className="w-full bg-card text-foreground p-4 sm:p-6 rounded-xl shadow-xs border border-border/80 font-sans text-xs print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:text-black a4-sheet relative notranslate"
            dir="ltr"
            lang="en"
          >
            <div className="text-center pb-3 border-b border-border/80 print:border-b-2 print:border-black">
              <h1 className="font-extrabold text-base sm:text-xl tracking-wider text-foreground print:text-black uppercase font-mono">
                STOCK (INWARD & OUTWARD) REGISTER
              </h1>
              <p className="text-[11px] text-muted-foreground print:text-gray-700 font-semibold tracking-wide">
                AL KHALEEJ LUBRICANTS · INVENTORY MOVEMENT REGISTER
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-border/80 print:border-b-2 print:border-black text-xs font-mono">
              <div className="border border-border/70 print:border-black p-2.5 rounded-lg bg-card/60 print:bg-transparent">
                <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-gray-600 block">
                  ARTICLE:
                </span>
                <span className="font-bold text-xs sm:text-sm text-foreground print:text-black uppercase">
                  {activeProduct?.name || "OIL PRODUCT"}
                </span>
                <span className="text-[9.5px] text-muted-foreground print:text-gray-500 block">
                  SKU: {activeProduct?.sku || "-"}
                </span>
              </div>

              <div className="border border-border/70 print:border-black p-2.5 rounded-lg bg-card/60 print:bg-transparent">
                <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-gray-600 block">
                  RATES (KHARID):
                </span>
                <span className="font-bold text-xs sm:text-sm text-foreground print:text-black">
                  Rs {activeProduct?.costPrice?.toLocaleString() || 0} / L
                </span>
                <span className="text-[9.5px] text-muted-foreground print:text-gray-500 block">Standard Unit: Liters</span>
              </div>

              <div className="border border-emerald-500/30 print:border-black p-2.5 rounded-lg bg-emerald-500/10 print:bg-emerald-50">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-800 block">
                  TOTAL INWARD (RECEIPTS):
                </span>
                <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 print:text-emerald-900">
                  {totalReceipts.toLocaleString()} Liters
                </span>
                <span className="text-[9.5px] text-emerald-600/80 dark:text-emerald-400/80 print:text-emerald-700 block">Total Mal Aaya</span>
              </div>

              <div className="border border-amber-500/30 print:border-black p-2.5 rounded-lg bg-amber-500/10 print:bg-amber-50">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 print:text-amber-900 block">
                  CURRENT BALANCE:
                </span>
                <span className="font-extrabold text-sm sm:text-base text-foreground print:text-black">
                  {currentBalance.toLocaleString()} Liters
                </span>
                <span className="text-[9.5px] text-muted-foreground print:text-gray-700 block">
                  Issued: {totalIssued.toLocaleString()} L
                </span>
              </div>
            </div>

            <div className="mt-4 border border-border/80 print:border-black rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100 text-foreground print:text-black border-b border-border/80 print:border-black font-mono font-bold text-[11px]">
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black w-24">Date</th>
                    <th className="py-2 px-3 border-r border-border/70 print:border-black">PARTICULARS</th>
                    <th className="py-2 px-2 border-r border-border/70 print:border-black text-center w-24">Folio</th>
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black text-center bg-emerald-500/10 print:bg-emerald-50 text-emerald-700 dark:text-emerald-400 print:text-emerald-900 w-24">
                      Receipts
                    </th>
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black text-center bg-rose-500/10 print:bg-rose-50 text-rose-700 dark:text-rose-400 print:text-rose-900 w-24">
                      Issued
                    </th>
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black text-center bg-muted/80 print:bg-gray-200 text-foreground print:text-black w-24">
                      Balance
                    </th>
                    <th className="py-2 px-2 text-left w-28">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 print:divide-black font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground font-mono">
                        Loading Register Ledger Data...
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground font-mono">
                        No Stock Movement Entries Recorded For This Product.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 print:border-gray-300 font-mono text-[11px]">
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black whitespace-nowrap text-muted-foreground print:text-gray-800">
                          {new Date(row.date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-2 px-3 border-r border-border/60 print:border-black font-sans font-semibold text-foreground print:text-gray-900">
                          {row.particulars}
                        </td>
                        <td className="py-2 px-2 border-r border-border/60 print:border-black text-center font-bold text-muted-foreground print:text-gray-700">
                          {row.folio}
                        </td>
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black text-center font-extrabold text-emerald-600 dark:text-emerald-400 print:text-emerald-800 bg-emerald-500/5 print:bg-emerald-50/50">
                          {row.receipts > 0 ? row.receipts.toLocaleString() : "-"}
                        </td>
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black text-center font-extrabold text-rose-600 dark:text-rose-400 print:text-rose-800 bg-rose-500/5 print:bg-rose-50/50">
                          {row.issued > 0 ? row.issued.toLocaleString() : "-"}
                        </td>
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black text-center font-black text-foreground print:text-black bg-muted/40 print:bg-gray-100">
                          {row.balance.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 font-sans text-[10px] text-muted-foreground print:text-gray-600">
                          {row.remarks}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="hidden print:grid pt-12 grid-cols-2 gap-8 text-xs text-black font-mono">
              <div>
                <div className="w-48 border-t border-black pt-1 text-center font-bold text-[10px] uppercase">
                  Store Incharge / Munshi
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-48 border-t border-black pt-1 text-center font-bold text-[10px] uppercase">
                  Proprietor / Auditor Signature
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-end gap-2 p-3.5 border-t border-border bg-card rounded-b-2xl print:hidden shrink-0">
          {!isPage && (
            <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Close Register
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePrint}
            className="cursor-pointer text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
          >
            <PrinterIcon className="size-3.5" />
            <span>Print Register Sheet</span>
          </Button>
        </div>
      </div>

      {isInwardModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ArrowDownIcon className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Record Inward (Maal Aaya)</h3>
                  <p className="text-[10px] text-muted-foreground">{activeProduct?.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsInwardModalOpen(false)}
                className="cursor-pointer"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleRecordInward} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px] block">
                  Supplier / Source Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Al-Noor Lubricants / Shell Distributor"
                  value={inwardSupplier}
                  onChange={(e) => setInwardSupplier(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground text-[11px] block">
                    Quantity Inward (Liters) *
                  </label>
                  <Input
                    required
                    type="number"
                    step="any"
                    min="0.1"
                    placeholder="e.g. 200"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value)}
                    className="h-8.5 text-xs font-mono font-bold text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground text-[11px] block">
                    Cost Rate (Rs / Liter)
                  </label>
                  <Input
                    type="number"
                    placeholder={`Default Rs ${activeProduct?.costPrice || 0}`}
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground text-[11px] block">
                    Folio / Invoice / DC #
                  </label>
                  <Input
                    placeholder="e.g. INV-8842"
                    value={inwardInvoiceNo}
                    onChange={(e) => setInwardInvoiceNo(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground text-[11px] block">
                    Remarks / Notes
                  </label>
                  <Input
                    placeholder="e.g. Fresh stock arrival"
                    value={inwardNotes}
                    onChange={(e) => setInwardNotes(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInwardModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingMovement}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {submittingMovement && <Loader2Icon className="size-3.5 animate-spin" />}
                  <span>Save Inward Entry</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOutwardModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ArrowUpIcon className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Record Outward (Maal Nikla / Adjustment)
                  </h3>
                  <p className="text-[10px] text-muted-foreground">{activeProduct?.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOutwardModalOpen(false)}
                className="cursor-pointer"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleRecordOutward} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px] block">
                  Particulars / Reason *
                </label>
                <select
                  value={outwardReason}
                  onChange={(e) => setOutwardReason(e.target.value)}
                  className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground cursor-pointer"
                >
                  <option value="Damaged / Leakage Oil">Damaged / Leakage Oil</option>
                  <option value="Return to Supplier">Return to Supplier</option>
                  <option value="Internal Shop Consumption">Internal Shop Consumption</option>
                  <option value="Stock Correction / Shortage">Stock Correction / Shortage</option>
                  <option value="Sample / Testing">Sample / Testing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground text-[11px] block">
                    Quantity Outward (Liters) *
                  </label>
                  <Input
                    required
                    type="number"
                    step="any"
                    min="0.1"
                    max={currentBalance}
                    placeholder="e.g. 10"
                    value={outwardQty}
                    onChange={(e) => setOutwardQty(e.target.value)}
                    className="h-8.5 text-xs font-mono font-bold text-foreground"
                  />
                  <span className="text-[9.5px] text-muted-foreground">
                    Available: {currentBalance} L
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground text-[11px] block">
                    Folio / Reference #
                  </label>
                  <Input
                    placeholder="e.g. ADJ-01"
                    value={outwardFolio}
                    onChange={(e) => setOutwardFolio(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px] block">
                  Remarks / Notes
                </label>
                <Input
                  placeholder="e.g. Drum seal broken"
                  value={outwardNotes}
                  onChange={(e) => setOutwardNotes(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOutwardModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingMovement}
                  className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  {submittingMovement && <Loader2Icon className="size-3.5 animate-spin" />}
                  <span>Save Outward Entry</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isPage) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
