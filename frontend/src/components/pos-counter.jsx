import { useState, useEffect, useRef } from "react";
import { fetchProducts, fetchCategories, createPosSale } from "@/lib/api";
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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
    const [pRes, cRes] = await Promise.all([fetchProducts(), fetchCategories()]);
    if (pRes && pRes.success) setProducts(pRes.data);
    if (cRes && cRes.success) setCategories(cRes.data);
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
    const quantity = Math.max(1, Number(qty) || 1);
    const rawDisc = Math.max(0, Number(discVal) || 0);
    const discPerUnit = discType === "percent" ? (price * rawDisc) / 100 : rawDisc;
    const effectiveUnitPrice = Math.max(0, price - discPerUnit);
    return Number((quantity * effectiveUnitPrice).toFixed(2));
  };

  const playLowStockChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  };

  const addToCart = (product) => {
    const isLow = product.stockQuantity <= (product.minStockAlert || 5) && product.stockQuantity > 0;
    if (isLow) {
      playLowStockChime();
      toast.warning(`⚠️ Low Stock Alert: Only ${product.stockQuantity} ${product.unit || "Cans"} left for ${product.name}!`, { duration: 2500 });
    }

    const existingIndex = cart.findIndex((item) => item.product === product._id);
    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      if (existingItem.quantity + 1 > product.stockQuantity) {
        setError(`Insufficient stock for ${product.name}. Max: ${product.stockQuantity}`);
        return;
      }
      const newQty = existingItem.quantity + 1;
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
      if (product.stockQuantity < 1) {
        setError(`Insufficient stock for ${product.name}.`);
        return;
      }
      setCart([
        ...cart,
        {
          product: product._id,
          productName: product.name,
          unitType: product.packagingType || product.unit || "Cans",
          quantity: 1,
          unitPrice: product.sellingPrice,
          itemDiscountType: "fixed",
          itemDiscountValue: 0,
          subtotal: product.sellingPrice,
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
    const newQty = item.quantity + delta;

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

  const updateUnitPrice = (index, newPrice) => {
    const p = Math.max(0, Number(newPrice) || 0);
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const newSubtotal = calculateItemSubtotal(
      p,
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

  const handleCheckout = async (checkoutData) => {
    setSubmitting(true);
    const { customerName, saleType, discount, grandTotal, paymentMode, cashReceived, changeDue } = checkoutData;
    try {
      const res = await createPosSale({
        customerName,
        customerPhone: "",
        saleType,
        items: cart,
        subtotal: grossSubtotal,
        discount,
        grandTotal,
        paymentMode,
        cashReceived,
        changeDue,
      });
      setCompletedSale(res.data);
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
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.grade && p.grade.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = !selectedCategory || (p.category?._id || p.category) === selectedCategory;

    return matchesSearch && matchesCat;
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 p-1.5 rounded-xl border border-border bg-card shadow-xs shrink-0">
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

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs cursor-pointer w-full sm:w-auto h-7.5"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
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
                <p className="text-[10px]">Try searching a different SKU, name or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {filteredProducts.map((prod) => {
                  const minAlert = prod.minStockAlert !== undefined ? prod.minStockAlert : 5;
                  const isLowStock = prod.stockQuantity <= minAlert && prod.stockQuantity > 0;
                  const isOutOfStock = prod.stockQuantity <= 0;
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
                          : isLowStock
                          ? "border-amber-500/50 bg-amber-500/5 hover:border-amber-500"
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
                            "absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 shadow-xs",
                            isOutOfStock
                              ? "bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400"
                              : isLowStock
                              ? "bg-amber-500/25 border-amber-500/50 text-amber-700 dark:text-amber-300 font-extrabold animate-pulse"
                              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {isOutOfStock ? "Out of Stock" : isLowStock ? `⚠️ Only ${prod.stockQuantity} Left` : `${prod.stockQuantity} ${prod.unit || "Cans"}`}
                        </span>
                      </div>

                      <div className="p-1.5 flex flex-col gap-0.5 flex-1">
                        <h4 className="font-bold text-[11px] text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                          {prod.name}
                        </h4>
                        <p className="font-mono font-bold text-xs text-primary pt-0.5">
                          Rs {prod.sellingPrice?.toLocaleString()} <span className="text-[8.5px] font-normal text-muted-foreground">/{prod.unit}</span>
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
                  const hasDiscount = Number(item.itemDiscountValue) > 0 || item.isCustomPrice;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-1.5 rounded-lg border text-xs space-y-1 shadow-2xs transition-all",
                        hasDiscount
                          ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                          : "border-border bg-card hover:bg-muted/30"
                      )}
                    >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-foreground leading-tight truncate">{item.productName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                          <div className="flex items-center gap-0.5">
                            <span className="text-muted-foreground font-mono">Rate:</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateUnitPrice(idx, e.target.value)}
                              className="w-13 h-4.5 px-1 font-mono font-bold text-[10px] rounded border border-input bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                              title="Override Rate"
                            />
                          </div>

                          <div className="flex items-center gap-0.5">
                            <span className="text-muted-foreground font-mono">Disc:</span>
                            <div className="flex items-center rounded border border-input overflow-hidden bg-background">
                              <button
                                type="button"
                                onClick={() => toggleItemDiscountType(idx)}
                                className={cn(
                                  "px-1 py-0.2 font-mono font-bold text-[9px] cursor-pointer transition-colors border-e border-input",
                                  item.itemDiscountType === "percent"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                title="Click to switch between Rs and %"
                              >
                                {item.itemDiscountType === "percent" ? "%" : "Rs"}
                              </button>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={item.itemDiscountValue ?? ""}
                                onChange={(e) => updateItemDiscountValue(idx, e.target.value)}
                                className="w-10 h-4.5 px-1 font-mono font-semibold text-[10px] bg-transparent text-foreground focus:outline-none"
                                title="Per-item discount"
                              />
                            </div>
                          </div>

                          {item.isCustomPrice && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 pt-0.5">
                        <span className="font-mono font-bold text-xs text-primary block">
                          Rs {item.subtotal?.toLocaleString()}
                        </span>
                        {Number(item.itemDiscountValue) > 0 && (
                          <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                            (-Rs{" "}
                            {Number(
                              (
                                (item.itemDiscountType === "percent"
                                  ? (item.unitPrice * Number(item.itemDiscountValue)) / 100
                                  : Number(item.itemDiscountValue)) * item.quantity
                              ).toFixed(2)
                            ).toLocaleString()}
                            )
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 border-t border-border/50">
                      <div className="flex items-center rounded-md border border-border bg-background shadow-2xs">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-5 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => updateQuantity(idx, -1)}
                        >
                          <MinusIcon className="size-2.5" />
                        </Button>
                        <span className="px-2 font-mono font-bold text-[11px] text-foreground">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-5 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => updateQuantity(idx, 1)}
                        >
                          <PlusIcon className="size-2.5" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => removeFromCart(idx)}
                      >
                        <Trash2Icon className="size-2.5" />
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
                <span>Total Amount:</span>
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
            </div>

            <Button
              onClick={() => {
                if (cart.length === 0) {
                  setError("Add at least 1 product to proceed.");
                  return;
                }
                setError("");
                setIsCheckoutOpen(true);
              }}
              disabled={cart.length === 0}
              className="w-full h-8 gap-1.5 font-bold text-xs cursor-pointer shadow-md bg-primary text-primary-foreground"
            >
              <ReceiptIcon className="size-3.5" />
              <span>Proceed ({selectedPaymentMode})</span>
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
