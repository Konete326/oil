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
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Plus as PlusIcon, Edit3 as Edit3Icon, Trash2 as Trash2Icon, Package as PackageIcon, Search as SearchIcon, AlertTriangle as AlertTriangleIcon, Filter as FilterIcon, ShieldAlert as ShieldAlertIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

export function ProductManager() {
  const location = useLocation();
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

  useEffect(() => {
    if (location.state?.openModal) {
      setEditingProduct(null);
      setIsModalOpen(true);
    }
  }, [location.state]);

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

  const handleSave = async (formData) => {
    if (editingProduct) {
      await updateProduct(editingProduct._id, formData);
    } else {
      await createProduct(formData);
    }
    await loadData();
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    setConfirmDeleteProd(null);
    await loadData();
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
            Manage oil stock, master drums, grades, pricing, and reorder levels.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="gap-2 shadow-xs cursor-pointer"
        >
          <PlusIcon className="size-4" />
          Add Product
        </Button>
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
          <div className="size-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500">
            <FilterIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Categories</p>
            <p className="text-xl font-bold text-foreground">{categories.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
          <div className="relative col-span-12 md:col-span-10">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search product, SKU, brand, grade..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-9 w-full"
            />
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
            <Table>
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
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground">{prod.name}</p>
                          <p className="text-[11px] text-muted-foreground">Brand: {prod.brand}</p>
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
                          <p className="text-[11px] text-muted-foreground">
                            {prod.grade ? `Grade: ${prod.grade}` : ""} {prod.viscosity ? `(${prod.viscosity})` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        Rs {prod.costPrice?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-xs text-foreground">
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
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
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
