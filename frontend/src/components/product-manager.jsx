import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchProducts,
  fetchCategories,
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
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Plus as PlusIcon,
  Edit3 as Edit3Icon,
  Trash2 as Trash2Icon,
  Package as PackageIcon,
  Search as SearchIcon,
  AlertTriangle as AlertTriangleIcon,
  ShieldAlert as ShieldAlertIcon,
  ScanBarcode as ScanBarcodeIcon,
  LayoutGrid as LayoutGridIcon,
  List as ListIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function ProductManager() {
  const location = useLocation();
  const [viewMode, setViewMode] = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteProd, setConfirmDeleteProd] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  useEffect(() => {
    if (location.state?.openModal) {
      setEditingProduct(null);
      setIsModalOpen(true);
    }
  }, [location.state]);

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([fetchProducts(), fetchCategories()]);
      if (pRes && pRes.success && Array.isArray(pRes.data)) setProducts(pRes.data);
      if (cRes && cRes.success && Array.isArray(cRes.data)) setCategories(cRes.data);
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
      const selectedCatObj = categories.find(
        (c) => c._id === (typeof formData.category === "object" ? formData.category?._id : formData.category)
      );
      const cleanData = {
        ...formData,
        category: typeof formData.category === "object" && formData.category?._id ? formData.category._id : formData.category,
      };

      setIsModalOpen(false);
      const isEditing = !!editingProduct;
      const targetId = editingProduct?._id;
      setEditingProduct(null);

      if (isEditing) {
        const optimisticProd = {
          ...editingProduct,
          ...cleanData,
          category: selectedCatObj || editingProduct.category,
          updatedAt: new Date().toISOString(),
        };
        setProducts((prev) => prev.map((p) => (p._id === targetId ? optimisticProd : p)));

        const res = await updateProduct(targetId, cleanData);
        if (res && res.data) {
          setProducts((prev) => prev.map((p) => (p._id === targetId ? res.data : p)));
        }
        toast.success("Product updated successfully");
      } else {
        const tempId = `prod_${Date.now()}`;
        const optimisticProd = {
          _id: tempId,
          ...cleanData,
          category: selectedCatObj || { _id: cleanData.category, name: "General" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProducts((prev) => [optimisticProd, ...prev]);

        const res = await createProduct(cleanData);
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

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        (p.grade && p.grade.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = !selectedCategory || (p.category?._id || p.category) === selectedCategory;

      let matchesStock = true;
      if (stockStatus === "inStock") matchesStock = p.stockQuantity > p.minStockAlert;
      else if (stockStatus === "lowStock") matchesStock = p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0;
      else if (stockStatus === "outOfStock") matchesStock = p.stockQuantity === 0;

      return matchesSearch && matchesCat && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "priceLow") return (a.sellingPrice || 0) - (b.sellingPrice || 0);
      if (sortBy === "priceHigh") return (b.sellingPrice || 0) - (a.sellingPrice || 0);
      if (sortBy === "stockLow") return (a.stockQuantity || 0) - (b.stockQuantity || 0);
      if (sortBy === "stockHigh") return (b.stockQuantity || 0) - (a.stockQuantity || 0);
      return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageIcon className="size-6 text-primary" />
            Oil Products & Inventory
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage oil stock, master drums, grades, pricing, and barcode stickers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors",
                viewMode === "table" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <ListIcon className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors",
                viewMode === "cards" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Card View (Mobile Friendly)"
            >
              <LayoutGridIcon className="size-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="gap-2 shadow-xs cursor-pointer text-xs h-9"
          >
            <PlusIcon className="size-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <PackageIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Products</p>
            <p className="text-xl font-bold text-foreground">{products.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"}`}>
            <AlertTriangleIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Low Stock Alerts</p>
            <p className="text-xl font-bold text-foreground">{lowStockCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <PackageIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total In-Stock Items</p>
            <p className="text-xl font-bold text-foreground">
              {products.filter((p) => p.stockQuantity > 0).length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
        <div className="grid grid-cols-12 gap-3">
          <div className="relative col-span-12 md:col-span-4">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, brand, grade..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-9 w-full bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="col-span-12 sm:col-span-4 md:col-span-3">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Stock Status</option>
              <option value="inStock">In Stock Only</option>
              <option value="lowStock">Low Stock Alert</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>

          <div className="col-span-12 sm:col-span-4 md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="name">Sort by: Name (A-Z)</option>
              <option value="priceLow">Sort by: Price (Low to High)</option>
              <option value="priceHigh">Sort by: Price (High to Low)</option>
              <option value="stockLow">Sort by: Stock (Low to High)</option>
              <option value="stockHigh">Sort by: Stock (High to Low)</option>
            </select>
          </div>

          <div className="col-span-12 md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <PackageIcon className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No Products Found</p>
            <p className="text-xs text-muted-foreground">Click "Add Product" to add your first oil item to inventory.</p>
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[110px]">SKU</TableHead>
                    <TableHead>Product Name & Brand</TableHead>
                    <TableHead>Category / Subcategory</TableHead>
                    <TableHead>Packaging & Grade</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-center">Stock Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((prod) => {
                    const isLowStock = prod.stockQuantity <= prod.minStockAlert;
                    return (
                      <TableRow key={prod._id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {prod.sku}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="size-9 rounded-lg object-contain border border-border bg-muted/40 shrink-0"
                              />
                            ) : (
                              <div className="size-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                {prod.brand ? prod.brand.slice(0, 2).toUpperCase() : "OL"}
                              </div>
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{prod.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">Brand: {prod.brand}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {prod.category?.name || "Uncategorized"}
                            </span>
                            {prod.subcategoryName && (
                              <p className="text-[11px] text-muted-foreground">{prod.subcategoryName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <p className="font-medium text-foreground">{prod.packagingType}</p>
                            {prod.grade && (
                              <p className="text-[11px] text-muted-foreground font-mono">
                                Grade: {prod.grade}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          Rs {prod.costPrice?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs font-bold text-foreground">
                          Rs {prod.sellingPrice?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: isLowStock ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)",
                              borderColor: isLowStock ? "rgba(244, 63, 94, 0.3)" : "rgba(16, 185, 129, 0.3)",
                              color: isLowStock ? "#f43f5e" : "#10b981",
                            }}
                          >
                            {isLowStock && <ShieldAlertIcon className="size-3.5" />}
                            <span>{prod.stockQuantity} {prod.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary cursor-pointer"
                              title="Generate & Print Barcode Sticker"
                              onClick={() => setBarcodeProduct(prod)}
                            >
                              <ScanBarcodeIcon className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit Product"
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit3Icon className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Delete Product"
                              onClick={() => setConfirmDeleteProd(prod)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
                {paginatedProducts.map((prod) => {
                  const isLowStock = prod.stockQuantity <= prod.minStockAlert;
                  const isOutOfStock = prod.stockQuantity === 0;
                  const profitPerUnit = (prod.sellingPrice || 0) - (prod.costPrice || 0);

                  return (
                    <div
                      key={prod._id}
                      className="rounded-xl border border-border bg-card p-3.5 shadow-xs space-y-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="size-11 rounded-lg object-contain border border-border bg-muted/40 shrink-0"
                            />
                          ) : (
                            <div className="size-11 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                              {prod.brand ? prod.brand.slice(0, 2).toUpperCase() : "OL"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{prod.name}</h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              Brand: <strong className="text-foreground">{prod.brand}</strong> • SKU: <span className="font-mono text-primary font-semibold">{prod.sku}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                            isOutOfStock
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : isLowStock
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          )}
                        >
                          {isOutOfStock ? "Out of Stock" : isLowStock ? `${prod.stockQuantity} Left` : `${prod.stockQuantity} In Stock`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 text-xs border border-border/50">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Selling Rate</span>
                          <span className="font-mono font-bold text-foreground text-sm">Rs {prod.sellingPrice?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Cost Rate</span>
                          <span className="font-mono text-muted-foreground text-xs">Rs {prod.costPrice?.toLocaleString() || 0}</span>
                          {profitPerUnit > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                              +Rs {profitPerUnit.toLocaleString()} profit
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">
                          {prod.category?.name || "General"} • {prod.packagingType} {prod.grade ? `(${prod.grade})` : ""}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBarcodeProduct(prod)}
                          className="h-7 text-xs gap-1 px-2 cursor-pointer"
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
                          className="h-7 text-xs gap-1 px-2 cursor-pointer"
                        >
                          <Edit3Icon className="size-3 text-blue-500" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteProd(prod)}
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
        categories={categories}
        initialData={editingProduct}
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
    </div>
  );
}
