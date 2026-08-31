import { useState, useEffect, useMemo } from "react";
import {
  fetchCategories,
  fetchProducts,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryModal } from "@/components/category-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  FolderTreeIcon,
  SearchIcon,
  TagIcon,
  LayoutGrid as LayoutGridIcon,
  List as ListIcon,
  BoxesIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

export function CategoryManager() {
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"
  );
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([fetchCategories(), fetchProducts()]);
      if (cRes && cRes.success && Array.isArray(cRes.data)) setCategories(cRes.data);
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

  const handleCreateOrUpdate = async (formData) => {
    const isEditing = !!editingCategory;
    const targetId = editingCategory?._id;
    setIsCatModalOpen(false);
    setEditingCategory(null);

    if (isEditing) {
      const optimisticCat = { ...editingCategory, ...formData };
      setCategories((prev) => prev.map((c) => (c._id === targetId ? optimisticCat : c)));
      toast.success("Category updated successfully");
      const res = await updateCategory(targetId, formData);
      if (res && res.data) {
        setCategories((prev) => prev.map((c) => (c._id === targetId ? res.data : c)));
      }
    } else {
      const tempId = `cat_${Date.now()}`;
      const optimisticCat = { _id: tempId, ...formData };
      setCategories((prev) => [optimisticCat, ...prev]);
      toast.success("Category added successfully");
      const res = await createCategory(formData);
      if (res && res.data) {
        setCategories((prev) => [res.data, ...prev.filter((c) => c._id !== tempId && c._id !== res.data._id)]);
      }
    }

    fetchCategories().then((cRes) => {
      if (cRes && cRes.success && Array.isArray(cRes.data)) setCategories(cRes.data);
    });
  };

  const handleDelete = async (id) => {
    setCategories((prev) => prev.filter((c) => c._id !== id));
    setConfirmDeleteCat(null);
    toast.success("Category deleted successfully");
    await deleteCategory(id);
    fetchCategories().then((cRes) => {
      if (cRes && cRes.success && Array.isArray(cRes.data)) setCategories(cRes.data);
    });
  };

  const getCategoryStockInfo = (catId) => {
    const catProds = products.filter((p) => (p.category?._id || p.category) === catId);
    const totalQty = catProds.reduce((sum, p) => sum + (Number(p.stockQuantity) || 0), 0);
    const unitMap = {};
    catProds.forEach((p) => {
      const u = p.unit || "Cans";
      unitMap[u] = (unitMap[u] || 0) + (Number(p.stockQuantity) || 0);
    });
    const summary = Object.entries(unitMap)
      .map(([u, q]) => `${q} ${u}`)
      .join(" · ");
    return { count: catProds.length, totalQty, summary: summary || "0 Units" };
  };

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    return categories.filter((c) => {
      return (
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [categories, search]);

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  return (
    <div className="space-y-4 p-3 md:p-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderTreeIcon className="size-5.5 text-primary" />
            <span>Product Categories</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize lubricant product lines (Engine Oil, Hydraulic Oil, Gear Oil, Grease, Industrial Oil) and live stock counts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors",
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
                "px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors",
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
            onClick={() => {
              setEditingCategory(null);
              setIsCatModalOpen(true);
            }}
            size="sm"
            className="gap-1.5 shadow-xs cursor-pointer text-xs h-8 px-3 bg-primary text-primary-foreground"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search category name, code, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="ps-8 text-xs h-8 w-full bg-muted/30 focus:bg-background"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FolderTreeIcon className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">No Categories Found</p>
            <p className="text-[11px] text-muted-foreground">Click "Add Category" to create a new product category.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-280px)] min-h-[280px] overflow-y-auto overflow-x-auto">
              {viewMode === "table" ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-[110px] text-xs h-9">Code</TableHead>
                      <TableHead className="text-xs h-9">Category Name</TableHead>
                      <TableHead className="text-xs h-9">Description</TableHead>
                      <TableHead className="text-center text-xs h-9">Product Count</TableHead>
                      <TableHead className="text-center text-xs h-9">Inventory Stock In-Hand</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map((cat) => {
                      const stockInfo = getCategoryStockInfo(cat._id);
                      return (
                        <TableRow key={cat._id} className="hover:bg-muted/20 text-xs border-b border-border/40">
                          <TableCell className="font-mono font-bold text-primary py-2.5">
                            {cat.code || "CAT-00"}
                          </TableCell>
                          <TableCell className="font-bold text-foreground py-2.5">
                            {cat.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground py-2.5 text-[11px]">
                            {cat.description || "—"}
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {stockInfo.count} Products
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono py-2.5 font-semibold text-foreground text-xs">
                            {stockInfo.summary}
                          </TableCell>
                          <TableCell className="text-right py-2.5 pe-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setIsCatModalOpen(true);
                                }}
                                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Edit Category"
                              >
                                <Edit3Icon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setConfirmDeleteCat(cat)}
                                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Delete Category"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                  {paginatedCategories.map((cat) => {
                    const stockInfo = getCategoryStockInfo(cat._id);
                    return (
                      <div
                        key={cat._id}
                        className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-semibold text-primary block">
                                {cat.code || "CAT-00"}
                              </span>
                              <h4 className="font-bold text-sm text-foreground">{cat.name}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {stockInfo.count} Items
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {cat.description || "Lubricant category line."}
                          </p>

                          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 text-xs">
                            <span className="text-[10px] text-muted-foreground block font-medium">Available Stock Volume:</span>
                            <span className="font-mono font-bold text-foreground text-xs">{stockInfo.summary}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsCatModalOpen(true);
                            }}
                            className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
                          >
                            <Edit3Icon className="size-3 text-blue-500" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteCat(cat)}
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
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSave={handleCreateOrUpdate}
        initialData={editingCategory}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteCat}
        onClose={() => setConfirmDeleteCat(null)}
        onConfirm={() => handleDelete(confirmDeleteCat?._id)}
        title="Delete Category"
        description={`Are you sure you want to delete "${confirmDeleteCat?.name}"? Any products assigned to this category will become unassigned.`}
        confirmText="Delete Category"
        variant="destructive"
      />
    </div>
  );
}
