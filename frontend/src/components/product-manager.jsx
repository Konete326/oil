import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
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
import { ProductModal } from "@/components/product-modal";
import { BarcodeStickerModal } from "@/components/barcode-sticker-modal";
import { StockRegisterModal } from "@/components/stock-register-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Plus as PlusIcon,
  Edit3 as Edit3Icon,
  Trash2 as Trash2Icon,
  Package as PackageIcon,
  Search as SearchIcon,
  ScanBarcode as ScanBarcodeIcon,
  LayoutGrid as LayoutGridIcon,
  List as ListIcon,
  BookOpen as BookOpenIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function ProductManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteProd, setConfirmDeleteProd] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [isStockRegisterOpen, setIsStockRegisterOpen] = useState(false);
  const [selectedRegisterProduct, setSelectedRegisterProduct] = useState(null);

  useEffect(() => {
    if (location.state?.openModal) {
      setEditingProduct(null);
      setIsModalOpen(true);
    }
  }, [location.state]);

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const pRes = await fetchProducts();
      if (pRes && pRes.success && Array.isArray(pRes.data)) setProducts(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleSave = async (formData) => {
    try {
      setIsModalOpen(false);
      const isEditing = !!editingProduct;
      const targetId = editingProduct?._id;
      setEditingProduct(null);

      if (isEditing) {
        const optimisticProd = {
          ...editingProduct,
          ...formData,
          updatedAt: new Date().toISOString(),
        };
        setProducts((prev) => prev.map((p) => (p._id === targetId ? optimisticProd : p)));

        const res = await updateProduct(targetId, formData);
        if (res && res.data) {
          setProducts((prev) => prev.map((p) => (p._id === targetId ? res.data : p)));
        }
        toast.success("Product updated successfully");
      } else {
        const tempId = `prod_${Date.now()}`;
        const optimisticProd = {
          _id: tempId,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProducts((prev) => [optimisticProd, ...prev]);

        const res = await createProduct(formData);
        if (res && res.data) {
          setProducts((prev) => [res.data, ...prev.filter((p) => p._id !== tempId && p._id !== res.data._id)]);
        }
        toast.success("Product added successfully");
      }

      fetchProducts().then((pRes) => {
        if (pRes && pRes.success && Array.isArray(pRes.data)) {
          setProducts(pRes.data);
        }
      });
    } catch (err) {
      toast.error(err.message || "Failed to save product");
      loadData(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setConfirmDeleteProd(null);
      toast.success("Product deleted successfully");

      await deleteProduct(id);
      fetchProducts().then((pRes) => {
        if (pRes && pRes.success && Array.isArray(pRes.data)) {
          setProducts(pRes.data);
        }
      });
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
      loadData(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products
      .filter((p) => {
        const matchesSearch =
          !term ||
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.sku && p.sku.toLowerCase().includes(term));

        let matchesStock = true;
        if (stockStatus === "inStock") matchesStock = p.stockQuantity > 0;
        else if (stockStatus === "outOfStock") matchesStock = p.stockQuantity === 0;

        return matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "priceLow") return (a.costPrice || 0) - (b.costPrice || 0);
        if (sortBy === "priceHigh") return (b.costPrice || 0) - (a.costPrice || 0);
        if (sortBy === "stockLow") return (a.stockQuantity || 0) - (b.stockQuantity || 0);
        if (sortBy === "stockHigh") return (b.stockQuantity || 0) - (a.stockQuantity || 0);
        return 0;
      });
  }, [products, search, stockStatus, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageIcon className="size-5 text-primary" />
            <span>Oil Products & Inventory</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Manage oil products, purchase rates, stock in liters, and barcode stickers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <ListIcon className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors",
                viewMode === "cards"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Cards View"
            >
              <LayoutGridIcon className="size-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/stock-register")}
            className="h-7.5 gap-1.5 text-xs px-3 border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            <BookOpenIcon className="size-3.5 text-muted-foreground" />
            <span>Stock Register</span>
          </Button>

          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5 shadow-xs cursor-pointer text-xs h-7.5 px-3"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-2.5 shadow-xs">
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="relative col-span-12 md:col-span-4">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search oil products by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-7.5 w-full bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="col-span-12 sm:col-span-4 md:col-span-3">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Stock Status</option>
              <option value="inStock">In Stock Only</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="priceLow">Sort: Price (Low to High)</option>
              <option value="priceHigh">Sort: Price (High to Low)</option>
              <option value="stockLow">Sort: Stock (Low to High)</option>
              <option value="stockHigh">Sort: Stock (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <PackageIcon className="size-7 mx-auto text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">No Products Found</p>
            <p className="text-[11px] text-muted-foreground">Click "Add Product" to add your first oil item to inventory.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-250px)] min-h-[320px] overflow-y-auto overflow-x-auto">
              {viewMode === "table" ? (
                <Table className="min-w-[760px]">
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="text-xs h-9">Product Name</TableHead>
                      <TableHead className="text-right text-xs h-9">Kharid Rate (Cost / L)</TableHead>
                      <TableHead className="text-center text-xs h-9">Stock in Liters</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((prod) => {
                      const isOutOfStock = (prod.stockQuantity || 0) === 0;
                      return (
                        <TableRow key={prod._id} className="hover:bg-muted/20 border-b border-border/40">
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="size-8 rounded-md object-contain border border-border bg-muted/40 shrink-0"
                                />
                              ) : (
                                <div className="size-8 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                                  {prod.name ? prod.name.slice(0, 2).toUpperCase() : "OL"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-foreground truncate">{prod.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-xs py-2.5 font-bold text-foreground">
                            Rs {prod.costPrice?.toLocaleString()} / L
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border font-mono",
                                isOutOfStock
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              )}
                            >
                              {prod.stockQuantity} Liters
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2.5 pe-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-emerald-600 cursor-pointer"
                                title="Stock (Inward & Outward) Register Dekhein"
                                onClick={() => {
                                  setSelectedRegisterProduct(prod);
                                  setIsStockRegisterOpen(true);
                                }}
                              >
                                <BookOpenIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-primary cursor-pointer"
                                title="Generate & Print Barcode Sticker"
                                onClick={() => setBarcodeProduct(prod)}
                              >
                                <ScanBarcodeIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Edit Product"
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setIsModalOpen(true);
                                }}
                              >
                                <Edit3Icon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="Delete Product"
                                onClick={() => setConfirmDeleteProd(prod)}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-2.5 sm:p-3">
                  {paginatedProducts.map((prod) => {
                    const isOutOfStock = (prod.stockQuantity || 0) === 0;

                    return (
                      <div
                        key={prod._id}
                        className="rounded-lg border border-border/80 bg-card p-3 shadow-xs space-y-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="size-9 rounded-md object-contain border border-border bg-muted/40 shrink-0"
                              />
                            ) : (
                              <div className="size-9 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                {prod.name ? prod.name.slice(0, 2).toUpperCase() : "OL"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs text-foreground truncate">{prod.name}</h4>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-mono",
                              isOutOfStock
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            )}
                          >
                            {isOutOfStock ? "Out of Stock" : `${prod.stockQuantity} Liters`}
                          </span>
                        </div>

                        <div className="p-2 rounded-md bg-muted/30 text-xs border border-border/50 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-muted-foreground block font-medium">Kharid Rate</span>
                            <span className="font-mono font-bold text-foreground text-xs">
                              Rs {prod.costPrice?.toLocaleString() || 0} / L
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border">
                            Unit: Liters
                          </span>
                        </div>

                        <div className="pt-1.5 border-t border-border flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRegisterProduct(prod);
                              setIsStockRegisterOpen(true);
                            }}
                            className="h-6.5 text-[11px] gap-1 px-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                          >
                            <BookOpenIcon className="size-3 text-emerald-600" />
                            <span>Register</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBarcodeProduct(prod)}
                            className="h-6.5 text-[11px] gap-1 px-2 cursor-pointer"
                          >
                            <ScanBarcodeIcon className="size-3 text-primary" />
                            <span>Sticker</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsModalOpen(true);
                            }}
                            className="h-6.5 text-[11px] gap-1 px-2 cursor-pointer"
                          >
                            <Edit3Icon className="size-3 text-blue-500" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteProd(prod)}
                            className="h-6.5 text-[11px] px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
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

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
        initialData={editingProduct}
        existingProducts={products}
      />

      <BarcodeStickerModal
        isOpen={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        product={barcodeProduct}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteProd}
        onClose={() => setConfirmDeleteProd(null)}
        onConfirm={() => handleDelete(confirmDeleteProd._id)}
        title="Delete Oil Product"
        message={`Are you sure you want to delete "${confirmDeleteProd?.name}" (SKU: ${confirmDeleteProd?.sku})? This action cannot be undone.`}
      />

      <StockRegisterModal
        isOpen={isStockRegisterOpen}
        onClose={() => {
          setIsStockRegisterOpen(false);
          setSelectedRegisterProduct(null);
        }}
        initialProduct={selectedRegisterProduct}
        products={products}
        onStockUpdated={() => loadData(false)}
      />
    </div>
  );
}
