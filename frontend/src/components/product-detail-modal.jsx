import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  X,
  Package,
  Droplet,
  Banknote,
  BookOpen,
  ScanBarcode,
  Edit3,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStockVolume } from "@/components/stock-register-modal";

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  allProducts = [],
  onOpenRegister,
  onOpenBarcode,
  onOpenEdit,
}) {
  if (!isOpen || !product || typeof window === "undefined") return null;

  const stockQty = Number(product.stockQuantity) || 0;
  const costRate = Number(product.costPrice) || 0;
  const productStockValue = Math.round(stockQty * costRate);

  const totalAllStockValue = allProducts.reduce((sum, p) => {
    return sum + ((Number(p.stockQuantity) || 0) * (Number(p.costPrice) || 0));
  }, 0);

  const totalAllLiters = allProducts.reduce((sum, p) => {
    return sum + (Number(p.stockQuantity) || 0);
  }, 0);

  const valueShare = totalAllStockValue > 0
    ? ((productStockValue / totalAllStockValue) * 100).toFixed(1)
    : "0";

  const isOutOfStock = stockQty <= 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Package className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Product & Stock Valuation
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                SKU: {product.sku || "N/A"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/20">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-14 rounded-lg object-contain border border-border bg-card shrink-0"
              />
            ) : (
              <div className="size-14 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0 font-mono">
                {product.name ? product.name.slice(0, 2).toUpperCase() : "OL"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-foreground leading-snug">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded border border-border text-muted-foreground">
                  Unit: Liters
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border",
                    isOutOfStock
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  )}
                >
                  {isOutOfStock ? "Out of Stock" : "In Stock"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block">
                Stock Ki Kul Maliyat (Value)
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 block mt-1">
                Rs {productStockValue.toLocaleString()}
              </span>
              <span className="text-[9.5px] text-muted-foreground block mt-0.5">
                {stockQty} L × Rs {costRate.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide block">
                Mojooda Stock (Volume)
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-blue-700 dark:text-blue-300 block mt-1">
                {stockQty.toLocaleString()} L
              </span>
              <span className="text-[9.5px] text-muted-foreground block mt-0.5">
                {formatStockVolume(stockQty)}
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Kharid Rate (Cost / L)
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground block mt-1">
                Rs {costRate.toLocaleString()}
              </span>
              <span className="text-[9.5px] text-muted-foreground block mt-0.5">
                Per Liter purchase cost
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Godown Valuation Share
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground block mt-1">
                {valueShare}%
              </span>
              <span className="text-[9.5px] text-muted-foreground block mt-0.5">
                Of total warehouse stock
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Banknote className="size-3.5 text-emerald-600" />
              <span>Full Godown Inventory Context</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
              <div>
                <span className="text-[10px] text-muted-foreground block">Kul Godown Maliyat:</span>
                <span className="font-mono font-bold text-foreground">
                  Rs {totalAllStockValue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Kul Tail Volume:</span>
                <span className="font-mono font-bold text-foreground">
                  {totalAllLiters.toLocaleString()} Liters
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenRegister?.(product);
                }}
                className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
              >
                <BookOpen className="size-3.5 text-emerald-600" />
                <span>Stock Register</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenBarcode?.(product);
                }}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                <ScanBarcode className="size-3.5 text-primary" />
                <span>Barcode</span>
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenEdit?.(product);
                }}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                <Edit3 className="size-3.5 text-blue-500" />
                <span>Edit</span>
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
