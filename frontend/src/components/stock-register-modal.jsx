import { useState, useEffect, useMemo, useRef } from "react";
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
import { OilDropLogo } from "@/components/logo";
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

export function formatStockVolume(val) {
  const num = Number(val) || 0;
  if (num === 0) return "-";
  if (num < 1) {
    const ml = Math.round(num * 1000);
    return `${ml} ML (${num} L)`;
  }
  if (num % 1 !== 0) {
    const ml = Math.round(num * 1000);
    return `${num} L (${ml.toLocaleString()} ML)`;
  }
  return `${num.toLocaleString()} L`;
}

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

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef(null);
  const productDropdownRef = useRef(null);

  const filteredProductOptions = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const supplierSuggestions = useMemo(() => {
    const names = purchases
      .map((p) => p.supplierName)
      .filter(Boolean);
    return [...new Set(names)].sort();
  }, [purchases]);

  const activeProductLabel = useMemo(() => {
    const p = products.find((x) => x._id === selectedProductId);
    return p ? `${p.name} (${formatStockVolume(p.stockQuantity)})` : "";
  }, [products, selectedProductId]);

  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [submittingMovement, setSubmittingMovement] = useState(false);

  const [inwardSupplier, setInwardSupplier] = useState("");
  const [inwardQty, setInwardQty] = useState("");

  const [outwardReason, setOutwardReason] = useState("Manual Stock Adjustment / Return");
  const [outwardQty, setOutwardQty] = useState("");

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
      runningBal = Number((runningBal + entry.receipts - entry.issued).toFixed(3));
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
      "Receipts (Inward L / ML)": formatStockVolume(e.receipts),
      "Issued (Outward L / ML)": formatStockVolume(e.issued),
      "Balance (L / ML)": formatStockVolume(e.balance),
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
        unitPrice: activeProduct.costPrice || 0,
        invoiceNumber: `REC-${Date.now().toString().slice(-5)}`,
        notes: "Stock Inward Register Entry",
      });

      toast.success(`${inwardQty} Liters successfully added to stock register!`);
      setIsInwardModalOpen(false);
      setInwardQty("");
      setInwardSupplier("");
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
      setOutwardReason("");
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
            margin: 10mm 12mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            font-family: 'Times New Roman', Times, serif !important;
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
            border-radius: 0 !important;
          }
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
          .print-summary-box {
            background: white !important;
            border: 1.5px solid black !important;
            color: black !important;
          }
          .print-summary-label {
            color: #333 !important;
          }
          .print-summary-value {
            color: black !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid black !important;
            color: black !important;
            background: white !important;
          }
          thead tr {
            background: #e8e8e8 !important;
          }
          thead th {
            background: #e8e8e8 !important;
            color: black !important;
            border: 1.5px solid black !important;
          }
          tbody tr:nth-child(even) td {
            background: #f8f8f8 !important;
          }
          .print-receipts-cell {
            font-weight: 800 !important;
            color: black !important;
            background: white !important;
          }
          .print-issued-cell {
            font-weight: 800 !important;
            color: black !important;
            background: white !important;
          }
          .print-balance-cell {
            font-weight: 900 !important;
            color: black !important;
            background: #efefef !important;
          }
        }
      `}</style>

      <div className={cn(
        "w-full rounded-2xl border border-border bg-background shadow-xs flex flex-col print:border-none print:shadow-none print:w-full print:block print:bg-white",
        !isPage && "max-w-5xl max-h-[94vh] shadow-2xl my-auto"
      )}>
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between border-b border-border p-3 print:hidden bg-card rounded-t-2xl shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpenIcon className="size-3.5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">
              Stock Register
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              onClick={() => setIsInwardModalOpen(true)}
              className="h-7 gap-1 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
            >
              <PlusIcon className="size-3" />
              <span>Maal Aaya</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsOutwardModalOpen(true)}
              className="h-7 gap-1 text-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white px-2.5"
            >
              <MinusIcon className="size-3" />
              <span>Maal Nikla</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-7 gap-1 text-xs px-2.5 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3 text-emerald-500" />
              <span>Excel</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="h-7 gap-1 text-xs cursor-pointer bg-primary text-primary-foreground px-2.5"
            >
              <PrinterIcon className="size-3" />
              <span>Print</span>
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
            <div className="relative w-full sm:w-72" ref={productDropdownRef}>
              <Input
                ref={productSearchRef}
                placeholder="Search product..."
                value={showProductDropdown ? productSearch : activeProductLabel}
                onFocus={() => {
                  setShowProductDropdown(true);
                  setProductSearch("");
                }}
                onBlur={(e) => {
                  if (!productDropdownRef.current?.contains(e.relatedTarget)) {
                    setShowProductDropdown(false);
                  }
                }}
                onChange={(e) => setProductSearch(e.target.value)}
                className="h-8 text-xs font-semibold bg-background cursor-text"
              />
              {showProductDropdown && (
                <div className="absolute z-50 top-full mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg text-xs">
                  {filteredProductOptions.length === 0 ? (
                    <div className="px-3 py-2 text-muted-foreground">No products found</div>
                  ) : (
                    filteredProductOptions.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        tabIndex={0}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedProductId(p._id);
                          setShowProductDropdown(false);
                          setProductSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-accent cursor-pointer transition-colors ${
                          selectedProductId === p._id ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">{formatStockVolume(p.stockQuantity)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
            <div className="text-center pb-3 border-b border-border/80 print:border-b-2 print:border-black flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <OilDropLogo className="size-7" />
                <span className="font-black text-sm uppercase tracking-tight text-foreground print:text-black font-mono">
                  AL KHALEEJ LUBRICANTS
                </span>
              </div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-wider text-foreground print:text-black uppercase font-mono">
                STOCK (INWARD & OUTWARD) REGISTER
              </h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-border/80 print:border-b-2 print:border-black text-xs font-mono">
              <div className="border border-border/70 print:border-black p-2.5 rounded-lg bg-card/60 print-summary-box">
                <span className="text-[10px] uppercase font-bold text-muted-foreground print-summary-label block">
                  ARTICLE:
                </span>
                <span className="font-bold text-xs sm:text-sm text-foreground print:text-black print-summary-value uppercase">
                  {activeProduct?.name || "OIL PRODUCT"}
                </span>
                <span className="text-[9.5px] text-muted-foreground print:text-black block">
                  SKU: {activeProduct?.sku || "-"}
                </span>
              </div>

              <div className="border border-border/70 print:border-black p-2.5 rounded-lg bg-card/60 print-summary-box">
                <span className="text-[10px] uppercase font-bold text-muted-foreground print-summary-label block">
                  COST RATE:
                </span>
                <span className="font-bold text-xs sm:text-sm text-foreground print:text-black print-summary-value">
                  Rs {activeProduct?.costPrice?.toLocaleString() || 0} / L
                </span>
                <span className="text-[9.5px] text-muted-foreground print:text-black block">Unit: Liters</span>
              </div>

              <div className="border border-emerald-500/30 print:border-black p-2.5 rounded-lg bg-emerald-500/10 print-summary-box">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 print-summary-label block">
                  TOTAL INWARD:
                </span>
                <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 print:text-black print-summary-value">
                  {totalReceipts.toLocaleString()} L
                </span>
                <span className="text-[9.5px] text-emerald-600/80 print:text-black block">Total Mal Aaya</span>
              </div>

              <div className="border border-amber-500/30 print:border-black p-2.5 rounded-lg bg-amber-500/10 print-summary-box">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 print-summary-label block">
                  CURRENT BALANCE:
                </span>
                <span className="font-extrabold text-sm sm:text-base text-foreground print:text-black print-summary-value">
                  {currentBalance.toLocaleString()} L
                </span>
                <span className="text-[9.5px] text-muted-foreground print:text-black block">
                  Issued: {totalIssued.toLocaleString()} L
                </span>
              </div>
            </div>

            <div className="mt-4 border border-border/80 print:border-2 print:border-black rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-200 text-foreground print:text-black border-b border-border/80 print:border-black font-mono font-bold text-[11px]">
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black w-20">DATE</th>
                    <th className="py-2 px-3 border-r border-border/70 print:border-black">PARTICULARS</th>
                    <th className="py-2 px-2 border-r border-border/70 print:border-black text-center w-20">FOLIO</th>
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black text-center text-emerald-700 dark:text-emerald-400 print:text-black w-24">
                      RECEIPTS
                    </th>
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black text-center text-rose-700 dark:text-rose-400 print:text-black w-24">
                      ISSUED
                    </th>
                    <th className="py-2 px-2.5 border-r border-border/70 print:border-black text-center print:text-black w-24">
                      BALANCE
                    </th>
                    <th className="py-2 px-2 text-left w-28">REMARKS</th>
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
                      <tr key={row.id} className="border-b border-border/40 print:border-black font-mono text-[11px]">
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black whitespace-nowrap text-muted-foreground print:text-black">
                          {new Date(row.date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-2 px-3 border-r border-border/60 print:border-black font-sans font-semibold text-foreground print:text-black">
                          {row.particulars}
                        </td>
                        <td className="py-2 px-2 border-r border-border/60 print:border-black text-center font-bold text-muted-foreground print:text-black">
                          {row.folio}
                        </td>
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black text-center font-extrabold text-emerald-600 dark:text-emerald-400 print:text-black print-receipts-cell">
                          {formatStockVolume(row.receipts)}
                        </td>
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black text-center font-extrabold text-rose-600 dark:text-rose-400 print:text-black print-issued-cell">
                          {formatStockVolume(row.issued)}
                        </td>
                        <td className="py-2 px-2.5 border-r border-border/60 print:border-black text-center font-black text-foreground print:text-black bg-muted/40 print-balance-cell">
                          {formatStockVolume(row.balance)}
                        </td>
                        <td className="py-2 px-2 font-sans text-[10px] text-muted-foreground print:text-black">
                          {row.remarks}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="hidden print:flex pt-10 justify-between text-xs text-black font-mono">
              <div className="text-center">
                <div className="w-44 border-t-2 border-black pt-1 font-bold text-[10px] uppercase tracking-wide">
                  Store Incharge / Munshi
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-mono text-black mb-1">
                  Printed: {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="text-center">
                <div className="w-44 border-t-2 border-black pt-1 font-bold text-[10px] uppercase tracking-wide">
                  Proprietor / Auditor
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
                <input
                  required
                  list="supplier-suggestions"
                  placeholder="e.g. Al-Noor Lubricants / Shell Distributor"
                  value={inwardSupplier}
                  onChange={(e) => setInwardSupplier(e.target.value)}
                  className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <datalist id="supplier-suggestions">
                  {supplierSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px] block">
                  Quantity Inward (Liters) *
                </label>
                <Input
                  required
                  type="number"
                  step="any"
                  min="0.001"
                  placeholder="e.g. 200 or 0.7 (700 ML)"
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value)}
                  className="h-8.5 text-xs font-mono font-bold text-foreground"
                />
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
                  Reason / Wajah
                </label>
                <Input
                  placeholder="e.g. Damaged oil, Return to supplier..."
                  value={outwardReason}
                  onChange={(e) => setOutwardReason(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground text-[11px] block">
                  Quantity Outward (Liters) *
                </label>
                <Input
                  required
                  type="number"
                  step="any"
                  min="0.001"
                  max={currentBalance}
                  placeholder="e.g. 10 or 0.7 (700 ML)"
                  value={outwardQty}
                  onChange={(e) => setOutwardQty(e.target.value)}
                  className="h-8.5 text-xs font-mono font-bold text-foreground"
                />
                <span className="text-[9.5px] text-muted-foreground">
                  Available: {currentBalance} L
                </span>
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
