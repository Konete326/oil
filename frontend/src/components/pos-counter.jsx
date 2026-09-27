import { useState, useEffect, useRef } from "react";
import { fetchProducts, createPosSale } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PosCheckoutModal } from "@/components/pos-checkout-modal";
import { PosReceiptModal } from "@/components/pos-receipt-modal";
import {
  ShoppingCartIcon,
  SearchIcon,
  PlusIcon,
  MinusIcon,
  Trash2Icon,
  ReceiptIcon,
  AlertCircleIcon,
  PackageIcon,
  ScanBarcodeIcon,
  CreditCardIcon,
  BanknoteIcon,
  Building2Icon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PosCounter() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("Cash");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [error, setError] = useState("");
  const searchInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    const pRes = await fetchProducts();
    if (pRes && pRes.success) setProducts(pRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && !isCheckoutOpen && !completedSale) {
      searchInputRef.current?.focus();
    }
  }, [loading, isCheckoutOpen, completedSale]);

  const calculateItemSubtotal = (unitPrice, qty, discType, discVal) => {
    const price = Math.max(0, Number(unitPrice) || 0);
    const quantity = Math.max(0, Number(qty) || 0);
    const rawDisc = Math.max(0, Number(discVal) || 0);
    const discPerUnit = discType === "percent" ? (price * rawDisc) / 100 : rawDisc;
    const effectiveUnitPrice = Math.max(0, price - discPerUnit);
    return Number((quantity * effectiveUnitPrice).toFixed(2));
  };

  const addToCart = (product) => {
    const existingIndex = cart.findIndex((item) => item.product === product._id);
    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQty = Number(((Number(existingItem.quantity) || 0) + 1).toFixed(3));
      if (newQty > product.stockQuantity) {
        setError(`Insufficient stock for ${product.name}. Max: ${product.stockQuantity}`);
        return;
      }
      const newSubtotal = calculateItemSubtotal(
        existingItem.unitPrice,
        newQty,
        existingItem.itemDiscountType || "fixed",
        existingItem.itemDiscountValue || 0
      );
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        subtotal: newSubtotal,
      };
      setCart(updatedCart);
      setError("");
    } else {
      if ((Number(product.stockQuantity) || 0) <= 0) {
        setError(`Insufficient stock for ${product.name}.`);
        return;
      }
      const defaultUnitPrice = product.sellingPrice > 0 ? product.sellingPrice : (product.costPrice || 0);
      setCart([
        ...cart,
        {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unitType: "Liters",
          unitMode: "L",
          quantity: 1,
          costPrice: Number(product.costPrice) || 0,
          unitPrice: Number(defaultUnitPrice) || 0,
          itemDiscountType: "fixed",
          itemDiscountValue: 0,
          subtotal: Number(defaultUnitPrice) || 0,
        },
      ]);
      setError("");
    }
  };

  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      if (isCheckoutOpen || completedSale) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" && document.activeElement !== searchInputRef.current) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 130) {
        barcodeBuffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 3) {
          const q = barcodeBuffer.trim().toLowerCase();
          const matched = products.find(
            (p) =>
              (p.sku && p.sku.toLowerCase() === q) ||
              (p.barcode && p.barcode.toLowerCase() === q) ||
              p.name.toLowerCase() === q
          );
          if (matched) {
            e.preventDefault();
            if (matched.stockQuantity > 0) {
              addToCart(matched);
              toast.success(`⚡ Barcode Scanned: ${matched.name}`);
              setSearch("");
              setError("");
            } else {
              setError(`Item ${matched.name} is Out of Stock.`);
            }
            barcodeBuffer = "";
            return;
          }
        }
        barcodeBuffer = "";
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products, isCheckoutOpen, completedSale, cart]);

  const handleSearchChange = (val) => {
    setSearch(val);
    const q = val.trim().toLowerCase();
    if (!q) return;

    const exactMatch = products.find(
      (p) => (p.sku && p.sku.toLowerCase() === q) || (p.barcode && p.barcode.toLowerCase() === q)
    );

    if (exactMatch) {
      if (exactMatch.stockQuantity > 0) {
        addToCart(exactMatch);
        toast.success(`⚡ Auto-Scanned: ${exactMatch.name}`);
        setSearch("");
        setError("");
      } else {
        setError(`Item ${exactMatch.name} is Out of Stock.`);
      }
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = search.trim().toLowerCase();
      if (!q) return;

      const exactSkuMatch = products.find((p) => p.sku?.toLowerCase() === q || p.barcode?.toLowerCase() === q);
      const exactNameMatch = products.find((p) => p.name?.toLowerCase() === q);
      const matched = exactSkuMatch || exactNameMatch || filteredProducts[0];

      if (matched) {
        if (matched.stockQuantity > 0) {
          addToCart(matched);
          toast.success(`Scanned: ${matched.name} added to cart`);
          setSearch("");
          setError("");
        } else {
          setError(`Item ${matched.name} is Out of Stock.`);
        }
      } else {
        setError(`No product found for barcode: ${search}`);
      }
      searchInputRef.current?.focus();
    }
  };

  const updateQuantity = (index, delta) => {
    const item = cart[index];
    const product = products.find((p) => p._id === item.product);
    const newQty = Number((Math.max(0, (Number(item.quantity) || 0) + delta)).toFixed(3));

    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (product && newQty > product.stockQuantity) {
      setError(`Cannot add more than ${product.stockQuantity} for ${product.name}`);
      return;
    }

    const newSubtotal = calculateItemSubtotal(
      item.unitPrice,
      newQty,
      item.itemDiscountType || "fixed",
      item.itemDiscountValue || 0
    );
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQty,
      subtotal: newSubtotal,
    };
    setCart(updatedCart);
    setError("");
  };

  const setDirectQuantity = (index, val, unit = "L") => {
    const item = cart[index];
    const product = products.find((p) => p._id === item.product);
    if (val === "" || val === null) {
      const updatedCart = [...cart];
      updatedCart[index] = { ...item, quantity: "" };
      setCart(updatedCart);
      return;
    }

    const rawNum = Number(val);
    if (isNaN(rawNum) || rawNum < 0) return;
    const newQty = unit === "ML" ? Number((rawNum / 1000).toFixed(3)) : Number(rawNum.toFixed(3));

    if (product && newQty > product.stockQuantity) {
      setError(`Stock limit: Only ${product.stockQuantity} Liters available for ${product.name}`);
      return;
    }

    const newSubtotal = calculateItemSubtotal(
      item.unitPrice,
      newQty,
      item.itemDiscountType || "fixed",
      item.itemDiscountValue || 0
    );
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQty,
      subtotal: newSubtotal,
    };
    setCart(updatedCart);
    setError("");
  };

  const toggleUnitMode = (index) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const newMode = (item.unitMode || "L") === "L" ? "ML" : "L";
    updatedCart[index] = { ...item, unitMode: newMode };
    setCart(updatedCart);
  };

  const updateUnitPrice = (index, newPrice) => {
    const p = newPrice === "" ? "" : Math.max(0, Number(newPrice) || 0);
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const effectivePrice = p === "" ? 0 : p;
    const newSubtotal = calculateItemSubtotal(
      effectivePrice,
      item.quantity,
      item.itemDiscountType || "fixed",
      item.itemDiscountValue || 0
    );
    updatedCart[index] = {
      ...item,
      unitPrice: p,
      subtotal: newSubtotal,
      isCustomPrice: true,
    };
    setCart(updatedCart);
  };

  const updateCostPrice = (index, newCost) => {
    const c = newCost === "" ? "" : Math.max(0, Number(newCost) || 0);
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...updatedCart[index],
      costPrice: c,
    };
    setCart(updatedCart);
  };

  const toggleItemDiscountType = (index) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const nextType = item.itemDiscountType === "percent" ? "fixed" : "percent";
    const newSubtotal = calculateItemSubtotal(
      item.unitPrice,
      item.quantity,
      nextType,
      item.itemDiscountValue || 0
    );
    updatedCart[index] = {
      ...item,
      itemDiscountType: nextType,
      subtotal: newSubtotal,
    };
    setCart(updatedCart);
  };

  const updateItemDiscountValue = (index, val) => {
    const v = val === "" ? "" : Math.max(0, Number(val) || 0);
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const newSubtotal = calculateItemSubtotal(
      item.unitPrice,
      item.quantity,
      item.itemDiscountType || "fixed",
      v
    );
    updatedCart[index] = {
      ...item,
      itemDiscountValue: v,
      subtotal: newSubtotal,
    };
    setCart(updatedCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const grossSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const itemsNetSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const itemDiscountsTotal = Math.max(0, Number((grossSubtotal - itemsNetSubtotal).toFixed(2)));

  const cartDiscountAmount =
    discountType === "percentage"
      ? Number(((itemsNetSubtotal * (Number(discountValue) || 0)) / 100).toFixed(2))
      : Number(discountValue) || 0;

  const totalDiscount = Number((itemDiscountsTotal + cartDiscountAmount).toFixed(2));
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedGrandTotal = Math.max(0, Number((itemsNetSubtotal - cartDiscountAmount).toFixed(2)));
  const totalCartCost = cart.reduce((sum, item) => sum + ((Number(item.costPrice) || 0) * (Number(item.quantity) || 1)), 0);
  const totalCartProfit = Math.max(0, estimatedGrandTotal - totalCartCost);
  const hasLossItem = cart.some((item) => Number(item.unitPrice) < Number(item.costPrice));

  const handleCheckout = async (checkoutData) => {
    setSubmitting(true);
    const { customerName, saleType, discount, grandTotal, paymentMode, cashReceived, changeDue } = checkoutData;
    try {
      const sanitizedItems = cart.map((it) => {
        const qty = Number(it.quantity) || 1;
        const volMl = Math.round(qty * 1000);
        const displayQty = qty < 1 ? `${volMl} ML` : (qty % 1 !== 0 ? `${qty} L (${volMl} ML)` : `${qty} L`);
        return {
          ...it,
          quantity: Number(qty.toFixed(3)),
          volumeMl: volMl,
          displayQuantity: displayQty,
          unitType: qty < 1 ? "ML" : (it.unitType || "Liters"),
          unitPrice: Number(it.unitPrice) || 0,
          costPrice: Number(it.costPrice) || 0,
        };
      });
      const anyLoss = sanitizedItems.some((it) => it.unitPrice < it.costPrice);
      if (anyLoss) {
        toast.error("Loss detected: Selling price cannot be lower than cost price.");
        setError("Loss detected: Selling price cannot be lower than cost price.");
        return;
      }
      if (Number(grandTotal) < totalCartCost) {
        toast.error("Loss detected: Grand Total cannot be lower than total cost price.");
        setError("Loss detected: Grand Total cannot be lower than total cost price.");
        return;
      }
      const res = await createPosSale({
        customerName,
        customerPhone: "",
        saleType,
        items: sanitizedItems,
        subtotal: grossSubtotal,
        discount,
        grandTotal,
        paymentMode,
        cashReceived,
        changeDue,
      });
      setCompletedSale(res.data);
      if (res?.data?.isNextDayShift) {
        toast.info("Shift is closed — this sale has been recorded under Next Day Shift.");
      }
      setCart([]);
      setDiscountValue("");
      setIsCheckoutOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to process POS checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="h-full max-h-full flex flex-col lg:overflow-hidden select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:h-full flex-1 min-h-0">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col lg:h-full space-y-1.5 min-h-0">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-1 shrink-0">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <ShoppingCartIcon className="size-4 text-primary" />
                POS Billing Counter
              </h2>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border shrink-0">
              {filteredProducts.length} Items
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border bg-card shadow-xs shrink-0">
            <div className="relative flex-1 w-full">
              <ScanBarcodeIcon className="absolute left-2.5 top-2.5 size-3.5 text-primary animate-pulse" />
              <Input
                ref={searchInputRef}
                placeholder="Scan Barcode / SKU or type product name (Press Enter)..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="ps-8 text-xs h-7.5 bg-muted/20 border-primary/40 focus-visible:ring-primary focus-visible:border-primary font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[45vh] lg:max-h-none pe-1.5 rounded-xl border border-border/70 bg-muted/10 p-1.5 min-h-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 rounded-xl border border-border bg-card p-2 space-y-1.5">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-1.5 flex flex-col items-center justify-center h-full">
                <PackageIcon className="size-8 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">No Products Found</p>
                <p className="text-[10px]">Try searching a different SKU or name.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = (prod.stockQuantity || 0) <= 0;
                  return (
                    <div
                      key={prod._id}
                      onClick={() => {
                        addToCart(prod);
                        searchInputRef.current?.focus();
                      }}
                      className={cn(
                        "group relative rounded-xl border bg-card p-1.5 shadow-2xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between cursor-pointer active:scale-[0.98]",
                        isOutOfStock
                          ? "opacity-50 border-border"
                          : "border-border/80 hover:border-primary/50"
                      )}
                    >
                      <div className="h-16 w-full rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden relative shrink-0">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <svg className="size-6 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        )}
                        <span
                          className={cn(
                            "absolute top-1 right-1 text-[8px] font-semibold px-1.5 py-0.2 rounded-md border",
                            isOutOfStock
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {Number(prod.stockQuantity) < 1 && Number(prod.stockQuantity) > 0
                            ? `${Math.round(Number(prod.stockQuantity) * 1000)} ML`
                            : Number(prod.stockQuantity) % 1 !== 0
                            ? `${prod.stockQuantity} L (${Math.round(Number(prod.stockQuantity) * 1000)} ML)`
                            : `${prod.stockQuantity} Liters`}
                        </span>
                      </div>

                      <div className="p-1.5 flex flex-col gap-0.5 flex-1">
                        <h4 className="font-bold text-[11px] text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                          {prod.name}
                        </h4>
                        <p className="font-mono font-bold text-xs text-foreground pt-0.5">
                          Kharid: <span className="text-primary font-bold">Rs {prod.costPrice?.toLocaleString() || 0}</span> <span className="text-[8.5px] font-normal text-muted-foreground">/L</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-border bg-card p-2 sm:p-2.5 shadow-md flex flex-col justify-between lg:h-full min-h-0">
          <div className="space-y-1 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center justify-between border-b border-border pb-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-primary/10 text-primary">
                  <ShoppingCartIcon className="size-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-foreground">
                    Current Order Cart
                  </h3>
                  <span className="text-[9px] text-muted-foreground">
                    {totalItemsCount} item{totalItemsCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCart([]);
                    setDiscountValue("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-[10px] text-destructive hover:text-destructive border-destructive/30 hover:border-destructive cursor-pointer h-5 px-1.5"
                >
                  Clear Cart
                </Button>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-2 py-0.5 text-[10px] text-destructive flex items-center justify-between gap-1 shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-1 min-w-0">
                  <AlertCircleIcon className="size-3 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
                <button
                  onClick={() => setError("")}
                  className="hover:opacity-70 text-xs shrink-0 cursor-pointer font-bold leading-none px-1"
                >
                  ×
                </button>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-xs space-y-1 flex-1 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-xl my-1 min-h-0">
                <ShoppingCartIcon className="size-6 text-muted-foreground/30" />
                <p className="font-semibold text-foreground text-xs">Your Cart is Empty</p>
                <p className="text-[9px] text-muted-foreground max-w-xs">Scan any product barcode or click from the catalog to start billing.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 pe-1 min-h-0 border border-border/60 rounded-xl bg-muted/10 p-1.5">
                {cart.map((item, idx) => {
                  const isLoss = Number(item.unitPrice) < Number(item.costPrice);
                  const hasDiscount = Number(item.itemDiscountValue) > 0 || item.isCustomPrice;
                  const itemProfit = Math.max(0, (Number(item.unitPrice) - Number(item.costPrice)) * item.quantity);
                  const itemLoss = isLoss ? (Number(item.costPrice) - Number(item.unitPrice)) * item.quantity : 0;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs space-y-2 shadow-2xs transition-all",
                        isLoss
                          ? "border-destructive bg-destructive/10 ring-1 ring-destructive/40"
                          : hasDiscount
                          ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                          : "border-border bg-card hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-foreground leading-tight truncate">{item.productName}</p>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            SKU: {item.sku || "N/A"} · {item.quantity} Liters
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-xs sm:text-sm text-primary block">
                            Rs. {item.subtotal?.toLocaleString()}
                          </span>
                          {isLoss ? (
                            <span className="font-mono text-[10px] text-destructive block font-bold">
                              Loss: -Rs. {itemLoss.toLocaleString()}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                              +Rs. {itemProfit.toLocaleString()} profit
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-lg bg-muted/30 border border-border/80">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                            <span>Kharid (Cost):</span>
                            <span className="text-[10px] font-mono text-muted-foreground/80">/ L</span>
                          </div>
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-xs font-mono font-semibold text-muted-foreground pointer-events-none select-none">
                              Rs
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={item.costPrice ?? ""}
                              onChange={(e) => updateCostPrice(idx, e.target.value)}
                              className="w-full h-7.5 ps-7 pe-1.5 font-mono font-bold text-xs rounded-md border border-input bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-2xs"
                              placeholder="0"
                              title="Editable Kharid (Purchase / Cost Price) per Liter"
                            />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className={isLoss ? "text-destructive font-bold" : "text-primary"}>
                              Farokht (Sale):
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground/80">/ L</span>
                          </div>
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-xs font-mono font-semibold text-muted-foreground pointer-events-none select-none">
                              Rs
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice ?? ""}
                              onChange={(e) => updateUnitPrice(idx, e.target.value)}
                              className={cn(
                                "w-full h-7.5 ps-7 pe-1.5 font-mono font-bold text-xs rounded-md border bg-background focus:ring-1 focus:outline-none transition-all shadow-2xs",
                                isLoss
                                  ? "border-destructive text-destructive font-black focus:ring-destructive"
                                  : "border-input text-foreground focus:ring-primary focus:border-primary"
                              )}
                              placeholder="0"
                              title="Editable Farokht (Selling Rate) per Liter"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1 text-[11px]">
                        <span className="text-muted-foreground">
                          Profit Margin:{" "}
                          <strong className={Number(item.unitPrice) - Number(item.costPrice) >= 0 ? "text-emerald-600 dark:text-emerald-400 font-mono font-bold" : "text-destructive font-mono font-bold"}>
                            {Number(item.unitPrice) - Number(item.costPrice) >= 0 ? "+" : ""}Rs. {(Number(item.unitPrice) - Number(item.costPrice)).toLocaleString()} / L
                          </strong>
                        </span>
                        {Number(item.costPrice) > 0 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({Number(item.unitPrice) - Number(item.costPrice) >= 0 ? "+" : ""}{Math.round(((Number(item.unitPrice) - Number(item.costPrice)) / Number(item.costPrice)) * 100)}%)
                          </span>
                        )}
                      </div>

                      {isLoss && (
                        <div className="p-1.5 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive text-[10px] font-bold flex items-center gap-1.5">
                          <AlertCircleIcon className="size-3.5 shrink-0" />
                          <span>Loss Warning: Farokht rate (Rs {item.unitPrice}) kharid rate (Rs {item.costPrice}) se kam hai!</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[10px] gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="flex items-center rounded-md border border-border bg-background shadow-2xs">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => updateQuantity(idx, -0.5)}
                              title="- 0.5 L"
                            >
                              <MinusIcon className="size-3" />
                            </Button>

                            <div className="flex items-center px-1">
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                value={
                                  item.quantity === ""
                                    ? ""
                                    : item.unitMode === "ML"
                                    ? Math.round((Number(item.quantity) || 0) * 1000)
                                    : item.quantity ?? ""
                                }
                                onChange={(e) => setDirectQuantity(idx, e.target.value, item.unitMode || "L")}
                                className="w-16 h-6 text-center font-mono font-bold text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded text-foreground"
                                placeholder={item.unitMode === "ML" ? "ML" : "Qty"}
                                title={item.unitMode === "ML" ? "Milliliters (e.g. 700, 500, 250 ML)" : "Decimal Liters (e.g. 0.7, 0.75, 1.5 L)"}
                              />
                              <button
                                type="button"
                                onClick={() => toggleUnitMode(idx)}
                                className="text-[9.5px] font-mono px-1 py-0.5 rounded bg-muted/60 hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer font-bold border border-border/80"
                                title="Click to toggle between Liters (L) and Milliliters (ML)"
                              >
                                {item.unitMode === "ML" ? "ML" : "L"}
                              </button>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => updateQuantity(idx, 0.5)}
                              title="+ 0.5 L (500 ML)"
                            >
                              <PlusIcon className="size-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1 text-[9px] font-mono flex-wrap">
                            {[
                              { val: 0.25, label: "250ml" },
                              { val: 0.5, label: "500ml" },
                              { val: 0.7, label: "700ml" },
                              { val: 0.75, label: "750ml" },
                              { val: 1, label: "1L" },
                              { val: 1.5, label: "1.5L" },
                              { val: 4, label: "4L" },
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => setDirectQuantity(idx, preset.val, "L")}
                                className={cn(
                                  "px-1.5 py-0.5 rounded border cursor-pointer transition-colors",
                                  Number(item.quantity) === preset.val
                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                    : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted"
                                )}
                                title={`Set ${preset.label}`}
                              >
                                {preset.label}
                              </button>
                            ))}

                            {Number(item.quantity) > 0 && (
                              <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                                {Number(item.quantity) < 1
                                  ? `${Math.round(Number(item.quantity) * 1000)} ML`
                                  : Number(item.quantity) % 1 !== 0
                                  ? `${item.quantity} L (${Math.round(Number(item.quantity) * 1000)} ML)`
                                  : `${item.quantity} L`}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                          onClick={() => removeFromCart(idx)}
                          title="Remove item"
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-1.5 border-t border-border space-y-1.5 bg-muted/20 p-2 rounded-xl shrink-0">
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "Cash", label: "Cash", icon: BanknoteIcon, color: "text-emerald-500" },
                { id: "Credit / Khata", label: "Khata", icon: CreditCardIcon, color: "text-amber-500" },
                { id: "Bank Transfer", label: "Bank", icon: Building2Icon, color: "text-blue-500" },
              ].map((pm) => {
                const active = selectedPaymentMode === pm.id;
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPaymentMode(pm.id)}
                    className={cn(
                      "flex items-center justify-center gap-1 py-0.5 px-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("size-2.5", active ? "text-primary-foreground" : pm.color)} />
                    <span className="truncate">{pm.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 p-1 rounded-lg bg-card border border-border text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-semibold">Cart Disc:</span>
                <div className="flex items-center rounded border border-border overflow-hidden bg-muted/40 text-[9px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`px-1.5 py-0.2 font-bold cursor-pointer transition-colors ${
                      discountType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Rs
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`px-1.5 py-0.2 font-bold cursor-pointer transition-colors ${
                      discountType === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <div className="relative w-20">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full text-right font-mono font-bold text-xs h-5 px-1 rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between text-muted-foreground text-[10px]">
                <span>Total Kharid Cost:</span>
                <span className="font-mono font-semibold text-foreground">Rs {totalCartCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[10px]">
                <span>Total Farokht Amount:</span>
                <span className="font-mono font-semibold text-foreground">Rs {grossSubtotal.toLocaleString()}</span>
              </div>
              {itemDiscountsTotal > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
                  <span>Item Discounts:</span>
                  <span className="font-mono">-Rs {itemDiscountsTotal.toLocaleString()}</span>
                </div>
              )}
              {cartDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
                  <span>Cart Disc ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):</span>
                  <span className="font-mono">-Rs {cartDiscountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-0.5 border-t border-border text-foreground">
                <span>Net Payable:</span>
                <span className="font-mono text-primary text-sm">Rs {estimatedGrandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold pt-0.5 text-foreground">
                <span>Estimated Profit:</span>
                <span className={cn("font-mono font-bold", hasLossItem ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                  {hasLossItem ? "Loss Warning" : `+Rs ${totalCartProfit.toLocaleString()}`}
                </span>
              </div>
            </div>

            {hasLossItem && (
              <div className="p-1.5 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive text-[10px] font-bold flex items-center gap-1.5">
                <AlertCircleIcon className="size-3.5 shrink-0" />
                <span>Loss Warning: Selling price is lower than cost price! Checkout blocked.</span>
              </div>
            )}

            <Button
              onClick={() => {
                if (cart.length === 0) {
                  setError("Add at least 1 product to proceed.");
                  return;
                }
                if (hasLossItem) {
                  setError("Loss detected! Selling price cannot be lower than cost price.");
                  return;
                }
                setError("");
                setIsCheckoutOpen(true);
              }}
              disabled={cart.length === 0 || hasLossItem}
              className={cn(
                "w-full h-8 gap-1.5 font-bold text-xs cursor-pointer shadow-md",
                hasLossItem
                  ? "bg-destructive text-destructive-foreground opacity-60 cursor-not-allowed"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <ReceiptIcon className="size-3.5" />
              <span>{hasLossItem ? "🚫 Checkout Blocked (Loss Warning)" : `Proceed (${selectedPaymentMode})`}</span>
            </Button>
          </div>
        </div>
      </div>

      <PosCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          searchInputRef.current?.focus();
        }}
        cartSubtotal={grossSubtotal}
        cartCostTotal={totalCartCost}
        initialDiscount={totalDiscount}
        initialPaymentMode={selectedPaymentMode}
        onConfirm={handleCheckout}
        submitting={submitting}
      />

      <PosReceiptModal
        isOpen={!!completedSale}
        onClose={() => {
          setCompletedSale(null);
          searchInputRef.current?.focus();
        }}
        sale={completedSale}
      />
    </div>
  );
}
