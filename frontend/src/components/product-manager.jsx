import { useState, useEffect } from "react";
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
import { PlusIcon, Edit3Icon, Trash2Icon, PackageIcon, SearchIcon, AlertTriangleIcon, FilterIcon, ShieldAlertIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteProd, setConfirmDeleteProd] = useState(null);

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

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.grade && p.grade.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = !selectedCategory || (p.category?._id || p.category) === selectedCategory;

    return matchesSearch && matchesCat;
  });

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
          <div className={`size-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"}`}>
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
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
            className="rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
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
              {filteredProducts.map((prod) => {
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
                          backgroundColor: isLowStock ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                          borderColor: isLowStock ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)",
                          color: isLowStock ? "#f59e0b" : "#10b981",
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
