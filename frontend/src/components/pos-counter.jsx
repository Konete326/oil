import { useState, useEffect } from "react";
import { fetchProducts, fetchCategories, createPosSale, fetchPosSales } from "@/lib/api";
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
import { PosReceiptModal } from "@/components/pos-receipt-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ShoppingCartIcon, SearchIcon, PlusIcon, MinusIcon, Trash2Icon, CreditCardIcon, CheckCircle2Icon, AlertCircleIcon, HistoryIcon, PackageIcon, FilterIcon, ReceiptIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 7;

export function PosCounter() {
  const [activeView, setActiveView] = useState("terminal");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleType, setSaleType] = useState("Retail");
  const [discount, setDiscount] = useState("0");
  const [taxPercent, setTaxPercent] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    const [pRes, cRes, sRes] = await Promise.all([fetchProducts(), fetchCategories(), fetchPosSales()]);
    if (pRes && pRes.success) setProducts(pRes.data);
    if (cRes && cRes.success) setCategories(cRes.data);
    if (sRes && sRes.success) setSalesHistory(sRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (product, defaultUnitType = null) => {
    const unitType = defaultUnitType || product.unit || "Liters";
    const existingIndex = cart.findIndex(
      (item) => item.product === product._id && item.unitType === unitType
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity + 1 > product.stockQuantity) {
        setError(`Cannot exceed available stock of ${product.stockQuantity} ${product.unit}.`);
        return;
      }
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      if (product.stockQuantity < 1) {
        setError(`Product ${product.name} is out of stock.`);
        return;
      }
      const price = product.sellingPrice || 0;
      setCart([
        ...cart,
        {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unitType,
          quantity: 1,
          unitPrice: price,
          subtotal: price,
          maxStock: product.stockQuantity,
        },
      ]);
    }
    setError("");
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    if (newQty > updated[index].maxStock) {
      setError(`Cannot exceed max stock limit of ${updated[index].maxStock}.`);
      return;
    }
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unitPrice;
    setCart(updated);
    setError("");
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountNum = Number(discount) || 0;
  const taxPctNum = Number(taxPercent) || 0;
  const taxAmount = Number(((cartSubtotal - discountNum) * (taxPctNum / 100)).toFixed(2));
  const grandTotal = Math.max(0, Number((cartSubtotal - discountNum + (taxAmount > 0 ? taxAmount : 0)).toFixed(2)));

  const cashReceivedNum = Number(cashReceived) || 0;
  const changeDue = Math.max(0, Number((cashReceivedNum - grandTotal).toFixed(2)));

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Please add at least 1 product to the cart.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await createPosSale({
        customerName,
        customerPhone,
        saleType,
        items: cart,
        subtotal: cartSubtotal,
        discount: discountNum,
        taxAmount,
        grandTotal,
        paymentMode,
        cashReceived: cashReceivedNum,
        changeDue,
      });

      setCompletedSale(res.data);
      setCart([]);
      setCustomerName("Walk-in Customer");
      setCustomerPhone("");
      setDiscount("0");
      setCashReceived("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to process POS checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.grade && p.grade.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = !selectedCategory || (p.category?._id || p.category) === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const totalHistoryPages = Math.ceil(salesHistory.length / PAGE_SIZE);
  const paginatedSales = salesHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCartIcon className="size-6 text-primary" />
            Point of Sale (POS) Billing Counter
          </h2>
          <p className="text-xs text-muted-foreground">
            Rapid retail & wholesale counter sales with multi-unit selection and thermal receipts.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
          <button
            onClick={() => setActiveView("terminal")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeView === "terminal" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            POS Terminal Counter
          </button>
          <button
            onClick={() => {
              setActiveView("history");
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeView === "history" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sales History ({salesHistory.length})
          </button>
        </div>
      </div>

      {activeView === "terminal" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, SKU, brand, grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-8 text-xs"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer w-full sm:w-auto"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Skeleton key={n} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center space-y-2">
                <PackageIcon className="size-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">No Matching Products</p>
                <p className="text-xs text-muted-foreground">Try clearing search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto pe-1">
                {filteredProducts.map((prod) => {
                  const isLowStock = prod.stockQuantity <= prod.minStockAlert;
                  return (
                    <div
                      key={prod._id}
                      className="group rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {prod.sku}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isLowStock ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"}`}>
                            {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {prod.name}
                        </h4>

                        <p className="text-[11px] text-muted-foreground">
                          {prod.brand} {prod.grade ? `| ${prod.grade}` : ""}
                        </p>

                        <p className="font-mono font-bold text-sm text-foreground">
                          Rs {prod.sellingPrice?.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">/ {prod.unit}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Packaging:</span>
                          <span className="font-medium text-foreground">{prod.packagingType}</span>
                        </div>

                        <Button
                          size="sm"
                          className="w-full h-8 gap-1.5 text-xs cursor-pointer shadow-xs"
                          onClick={() => addToCart(prod)}
                          disabled={prod.stockQuantity <= 0}
                        >
                          <PlusIcon className="size-3.5" />
                          <span>{prod.stockQuantity <= 0 ? "Out of Stock" : "Add to Cart"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <ShoppingCartIcon className="size-5 text-primary" />
                  Current Checkout Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-xs text-destructive hover:text-destructive cursor-pointer">
                    Clear Cart
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-2.5 text-xs text-destructive flex items-center gap-2">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                  <ShoppingCartIcon className="size-8 mx-auto text-muted-foreground/40" />
                  <p>Cart is empty. Click on product cards to add items.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pe-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
                      <div className="min-w-0 flex-1 space-y-0.5 pe-2">
                        <p className="font-semibold text-foreground truncate">{item.productName}</p>
                        <p className="text-[10px] text-muted-foreground">Rs {item.unitPrice} / {item.unitType}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-md border bg-background">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => updateQuantity(idx, -1)}
                          >
                            <MinusIcon className="size-3" />
                          </Button>
                          <span className="px-2 font-mono font-semibold text-xs">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => updateQuantity(idx, 1)}
                          >
                            <PlusIcon className="size-3" />
                          </Button>
                        </div>

                        <span className="font-mono font-bold text-xs w-16 text-right">Rs {item.subtotal}</span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => removeFromCart(idx)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Customer Name</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Sale Type</label>
                  <select
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs cursor-pointer h-8"
                  >
                    <option value="Retail">Retail Sale</option>
                    <option value="Wholesale">Wholesale Sale</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Discount (Rs)</label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Tax GST (%)</label>
                  <Input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-muted-foreground">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs cursor-pointer h-8"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card POS</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit / Khata">Credit / Khata</option>
                  </select>
                </div>
              </div>

              {paymentMode === "Cash" && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="font-medium text-muted-foreground">Cash Received (Rs)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-muted-foreground">Change Due</label>
                    <div className="h-8 rounded-md border bg-muted/40 px-3 flex items-center font-mono font-bold text-emerald-500">
                      Rs {changeDue}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">Rs {cartSubtotal.toLocaleString()}</span>
                </div>
                {discountNum > 0 && (
                  <div className="flex justify-between text-amber-500">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-Rs {discountNum}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST Tax ({taxPctNum}%):</span>
                    <span className="font-mono font-semibold">+Rs {taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-primary pt-1 border-t border-primary/20">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono">Rs {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={submitting || cart.length === 0}
                className="w-full h-10 gap-2 font-semibold text-xs cursor-pointer shadow-xs"
              >
                <ReceiptIcon className="size-4" />
                {submitting ? "Processing Sale..." : "Complete Sale & Print Receipt"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <HistoryIcon className="size-5 text-primary" />
              POS Retail & Wholesale Transaction History
            </h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No POS sales recorded yet.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[110px]">Receipt No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Sale Type</TableHead>
                    <TableHead className="text-center">Items Count</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale._id} className="hover:bg-muted/20 text-xs">
                      <TableCell className="font-mono font-bold text-primary">
                        {sale.saleNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {sale.customerName}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${sale.saleType === "Wholesale" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}`}>
                          {sale.saleType}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {sale.items?.length || 0} Items
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {sale.paymentMode}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        Rs {sale.grandTotal?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs cursor-pointer"
                          onClick={() => setCompletedSale(sale)}
                        >
                          <ReceiptIcon className="size-3.5 text-primary" />
                          <span>Receipt</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalHistoryPages}
                totalItems={salesHistory.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </div>
      )}

      <PosReceiptModal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        sale={completedSale}
      />
    </div>
  );
}
