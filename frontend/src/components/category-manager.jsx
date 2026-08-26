import { useState, useEffect } from "react";
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
  LayersIcon,
  PackageCheckIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

export function CategoryManager() {
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

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesCategoryNameOrCode =
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q);

    const matchesSubcategory =
      c.subcategories &&
      c.subcategories.some(
        (sub) =>
          sub.name.toLowerCase().includes(q) ||
          (sub.code && sub.code.toLowerCase().includes(q))
      );

    const matchesSearch = matchesCategoryNameOrCode || matchesSubcategory;

    let matchesFilter = true;
    if (subStatus === "withSubs") {
      matchesFilter = (c.subcategories?.length || 0) > 0;
    } else if (subStatus === "noSubs") {
      matchesFilter = (c.subcategories?.length || 0) === 0;
    }

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  const totalInventoryStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderTreeIcon className="size-6 text-primary" />
            Product Categories & Live Stock Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Structure lubricants into main lines and track real-time stock units per category.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsCatModalOpen(true);
          }}
          className="gap-2 shadow-xs cursor-pointer bg-primary text-primary-foreground font-medium text-xs"
        >
          <PlusIcon className="size-4" />
          Add Category / Subcategory
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FolderTreeIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Main Categories</p>
            <p className="text-xl font-bold text-foreground">{categories.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <LayersIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Subcategories</p>
            <p className="text-xl font-bold text-foreground">{totalSubcategories}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <PackageCheckIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Stock in Categories</p>
            <p className="text-xl font-bold text-foreground">{totalInventoryStock.toLocaleString()} Units</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
        <div className="grid grid-cols-12 gap-3">
          <div className="relative col-span-12 md:col-span-10">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search category or subcategory name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 text-xs h-9 w-full bg-muted/30 focus:bg-background"
            />
          </div>

          <div className="col-span-12 md:col-span-2">
            <select
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="withSubs">With Subcategories</option>
              <option value="noSubs">No Subcategories</option>
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
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <LayersIcon className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No Categories Found</p>
            <p className="text-xs text-muted-foreground">Click "Add Category / Subcategory" to add your first entry.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Main Category Name</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead>Live Inventory Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.map((cat) => {
                  const q = search.toLowerCase().trim();
                  const stockInfo = getCategoryStockInfo(cat._id);
                  return (
                    <TableRow key={cat._id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {cat.code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-sm">
                        {cat.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs border-dashed cursor-pointer shrink-0"
                            onClick={() => {
                              setSelectedSubCategory(cat);
                              setIsSubModalOpen(true);
                            }}
                          >
                            <TagIcon className="size-3 text-primary" />
                            <span>{cat.subcategories?.length || 0} Subcategories</span>
                          </Button>
                          {cat.subcategories?.slice(0, 4).map((sub) => {
                            const isMatch = q.length > 0 && (
                              sub.name.toLowerCase().includes(q) ||
                              (sub.code && sub.code.toLowerCase().includes(q))
                            );
                            return (
                              <Badge
                                key={sub._id || sub.name}
                                variant="outline"
                                className={`text-[10px] cursor-pointer transition-colors ${
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
                            <span className="text-[10px] text-muted-foreground font-mono">
                              +{cat.subcategories.length - 4} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                                stockInfo.totalQty > 0
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {stockInfo.totalQty} Units
                            </span>
                            <span className="text-[11px] text-muted-foreground">({stockInfo.count} Products)</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate max-w-xs">
                            {stockInfo.summary}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsCatModalOpen(true);
                            }}
                          >
                            <Edit3Icon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => setConfirmDeleteCat(cat)}
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
