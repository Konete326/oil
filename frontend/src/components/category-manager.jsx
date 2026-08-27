import { useState, useEffect, useMemo } from "react";
import {
  fetchCategories,
  fetchProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
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
import { SubcategoryModal } from "@/components/subcategory-modal";
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
  Boxes,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

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
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const [subStatus, setSubStatus] = useState("all");

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
      const optimisticCat = { _id: tempId, subcategories: [], ...formData };
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

  const handleAddSub = async (catId, subData) => {
    const res = await addSubcategory(catId, subData);
    if (res && res.success) {
      setSelectedSubCategory(res.data);
      setCategories((prev) => prev.map((c) => (c._id === catId ? res.data : c)));
      toast.success("Subcategory added successfully");
    }
  };

  const handleDeleteSub = async (catId, subId) => {
    const res = await deleteSubcategory(catId, subId);
    if (res && res.success) {
      setSelectedSubCategory(res.data);
      setCategories((prev) => prev.map((c) => (c._id === catId ? res.data : c)));
      toast.success("Subcategory deleted successfully");
    }
  };

  const getCategoryStockInfo = (catId) => {
    const catProds = products.filter((p) => (p.category?._id || p.category) === catId);
    const totalQty = catProds.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const unitMap = {};
    catProds.forEach((p) => {
      const u = p.unit || "Cans";
      unitMap[u] = (unitMap[u] || 0) + (p.stockQuantity || 0);
    });
    const summary = Object.entries(unitMap)
      .map(([u, q]) => `${q} ${u}`)
      .join(" · ");
    return { count: catProds.length, totalQty, summary: summary || "0 Units" };
  };

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    return categories.filter((c) => {
      const matchesCategoryNameOrCode =
        (c.name || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q);

      const matchesSubcategory =
        c.subcategories &&
        c.subcategories.some(
          (sub) =>
            (sub.name || "").toLowerCase().includes(q) ||
            (sub.code && sub.code.toLowerCase().includes(q))
        );

      const matchesSearch = !q || matchesCategoryNameOrCode || matchesSubcategory;

      let matchesFilter = true;
      if (subStatus === "withSubs") {
        matchesFilter = (c.subcategories?.length || 0) > 0;
      } else if (subStatus === "noSubs") {
        matchesFilter = (c.subcategories?.length || 0) === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [categories, search, subStatus]);

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  return (
    <div className="space-y-3 p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderTreeIcon className="size-5 text-primary" />
            <span>Product Categories & Subcategories</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Structure lubricant lines, sub-brands, packaging sizes, and track category inventory stock.
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
            onClick={() => {
              setEditingCategory(null);
              setIsCatModalOpen(true);
            }}
            className="gap-1.5 shadow-xs cursor-pointer text-xs h-7.5 px-3"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-2.5 shadow-xs">
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="relative col-span-12 md:col-span-9">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search category or subcategory name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-7.5 w-full bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="col-span-12 md:col-span-3">
            <select
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-7.5 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Category Types</option>
              <option value="withSubs">With Subcategories</option>
              <option value="noSubs">No Subcategories</option>
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
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FolderTreeIcon className="size-7 mx-auto text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">No Categories Found</p>
            <p className="text-[11px] text-muted-foreground">Click "Add Category" to add your first entry.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-250px)] min-h-[320px] overflow-y-auto overflow-x-auto">
              {viewMode === "table" ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-xs">
                    <TableRow className="border-b border-border/80">
                      <TableHead className="w-[120px] text-xs h-9">Code</TableHead>
                      <TableHead className="text-xs h-9">Main Category Name</TableHead>
                      <TableHead className="text-xs h-9">Subcategories</TableHead>
                      <TableHead className="text-xs h-9">Live Inventory Stock</TableHead>
                      <TableHead className="text-right text-xs h-9 pe-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map((cat) => {
                      const q = search.toLowerCase().trim();
                      const stockInfo = getCategoryStockInfo(cat._id);
                      return (
                        <TableRow key={cat._id} className="hover:bg-muted/20 border-b border-border/40">
                          <TableCell className="font-mono text-[11px] font-semibold text-primary py-2.5">
                            {cat.code}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground text-xs py-2.5">
                            {cat.name}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 gap-1 px-2 text-[10.5px] border-dashed cursor-pointer shrink-0"
                                onClick={() => {
                                  setSelectedSubCategory(cat);
                                  setIsSubModalOpen(true);
                                }}
                              >
                                <TagIcon className="size-2.5 text-primary" />
                                <span>{cat.subcategories?.length || 0} Subcategories</span>
                              </Button>
                              {cat.subcategories?.slice(0, 4).map((sub) => {
                                const isMatch =
                                  q.length > 0 &&
                                  ((sub.name || "").toLowerCase().includes(q) ||
                                    (sub.code && sub.code.toLowerCase().includes(q)));
                                return (
                                  <Badge
                                    key={sub._id || sub.name}
                                    variant="outline"
                                    className={`text-[9.5px] cursor-pointer transition-colors px-1.5 py-0 ${
                                      isMatch
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold"
                                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                    }`}
                                    onClick={() => {
                                      setSelectedSubCategory(cat);
                                      setIsSubModalOpen(true);
                                    }}
                                  >
                                    {sub.name}
                                  </Badge>
                                );
                              })}
                              {cat.subcategories?.length > 4 && (
                                <span className="text-[9.5px] text-muted-foreground font-mono">
                                  +{cat.subcategories.length - 4} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border font-mono ${
                                    stockInfo.totalQty > 0
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                      : "bg-muted text-muted-foreground border-border"
                                  }`}
                                >
                                  {stockInfo.totalQty} Units
                                </span>
                                <span className="text-[10.5px] text-muted-foreground">({stockInfo.count} Products)</span>
                              </div>
                              <span className="text-[9.5px] text-muted-foreground truncate max-w-xs">
                                {stockInfo.summary}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2.5 pe-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setIsCatModalOpen(true);
                                }}
                              >
                                <Edit3Icon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                onClick={() => setConfirmDeleteCat(cat)}
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
                  {paginatedCategories.map((cat) => {
                    const q = search.toLowerCase().trim();
                    const stockInfo = getCategoryStockInfo(cat._id);

                    return (
                      <div
                        key={cat._id}
                        className="rounded-lg border border-border/80 bg-card p-3 shadow-xs space-y-2 hover:border-primary/40 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <Boxes className="size-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-foreground">{cat.name}</h4>
                                <p className="text-[10px] font-mono text-primary font-semibold">Code: {cat.code}</p>
                              </div>
                            </div>

                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border font-mono shrink-0 ${
                                stockInfo.totalQty > 0
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {stockInfo.totalQty} Units
                            </span>
                          </div>

                          <div className="p-1.5 rounded-md bg-muted/30 border border-border/50 text-[10.5px] space-y-1">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Linked Products:</span>
                              <strong className="text-foreground">{stockInfo.count} items</strong>
                            </div>
                            <div className="text-[9.5px] text-muted-foreground truncate">{stockInfo.summary}</div>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-5.5 gap-1 px-1.5 text-[9.5px] border-dashed cursor-pointer"
                              onClick={() => {
                                setSelectedSubCategory(cat);
                                setIsSubModalOpen(true);
                              }}
                            >
                              <TagIcon className="size-2.5 text-primary" />
                              <span>{cat.subcategories?.length || 0} Subs</span>
                            </Button>
                            {cat.subcategories?.slice(0, 3).map((sub) => {
                              const isMatch =
                                q.length > 0 &&
                                ((sub.name || "").toLowerCase().includes(q) ||
                                  (sub.code && sub.code.toLowerCase().includes(q)));
                              return (
                                <Badge
                                  key={sub._id || sub.name}
                                  variant="outline"
                                  className={`text-[9px] cursor-pointer px-1.5 py-0 ${
                                    isMatch
                                      ? "bg-amber-500/15 text-amber-600 border-amber-500/40 font-bold"
                                      : "bg-muted/50 text-muted-foreground"
                                  }`}
                                  onClick={() => {
                                    setSelectedSubCategory(cat);
                                    setIsSubModalOpen(true);
                                  }}
                                >
                                  {sub.name}
                                </Badge>
                              );
                            })}
                            {cat.subcategories?.length > 3 && (
                              <span className="text-[9px] text-muted-foreground font-mono">
                                +{cat.subcategories.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-border flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubCategory(cat);
                              setIsSubModalOpen(true);
                            }}
                            className="h-6.5 text-[10.5px] gap-1 px-2 cursor-pointer"
                          >
                            <TagIcon className="size-2.5 text-primary" />
                            <span>Manage Subs</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsCatModalOpen(true);
                            }}
                            className="h-6.5 text-[10.5px] gap-1 px-2 cursor-pointer"
                          >
                            <Edit3Icon className="size-2.5 text-blue-500" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteCat(cat)}
                            className="h-6.5 text-[10.5px] px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
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
        onClose={() => {
          setIsCatModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleCreateOrUpdate}
        onSaveSubcategory={handleAddSub}
        categories={categories}
        initialData={editingCategory}
      />

      <SubcategoryModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setSelectedSubCategory(null);
        }}
        category={selectedSubCategory}
        onAddSubcategory={handleAddSub}
        onDeleteSubcategory={handleDeleteSub}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteCat}
        onClose={() => setConfirmDeleteCat(null)}
        onConfirm={() => handleDelete(confirmDeleteCat._id)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${confirmDeleteCat?.name}"? This action will also delete all attached subcategories.`}
      />
    </div>
  );
}
