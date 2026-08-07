import { useState, useEffect } from "react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
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
import { CategoryModal } from "@/components/category-modal";
import { SubcategoryModal } from "@/components/subcategory-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { PlusIcon, Edit3Icon, Trash2Icon, FolderTreeIcon, SearchIcon, TagIcon, LayersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 7;

export function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchCategories();
    if (res && res.success) {
      setCategories(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    if (editingCategory) {
      await updateCategory(editingCategory._id, formData);
    } else {
      await createCategory(formData);
    }
    await loadData();
  };

  const handleDelete = async (id) => {
    await deleteCategory(id);
    setConfirmDeleteCat(null);
    await loadData();
  };

  const handleAddSub = async (catId, subData) => {
    const res = await addSubcategory(catId, subData);
    if (res && res.success) {
      setSelectedSubCategory(res.data);
      await loadData();
    }
  };

  const handleDeleteSub = async (catId, subId) => {
    const res = await deleteSubcategory(catId, subId);
    if (res && res.success) {
      setSelectedSubCategory(res.data);
      await loadData();
    }
  };

  const [subStatus, setSubStatus] = useState("all");

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());

    let matchesSub = true;
    if (subStatus === "withSubs") matchesSub = (c.subcategories?.length || 0) > 0;
    else if (subStatus === "noSubs") matchesSub = (c.subcategories?.length || 0) === 0;

    return matchesSearch && matchesSub;
  });

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderTreeIcon className="size-6 text-primary" />
            Oil Categories & Subcategories
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage main oil categories, subcategories, and product classifications.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsCatModalOpen(true);
          }}
          className="gap-2 shadow-xs cursor-pointer"
        >
          <PlusIcon className="size-4" />
          Add Category
        </Button>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
          <div className="relative col-span-12 md:col-span-10">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search category name or code..."
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
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="withSubs">With Subs</option>
              <option value="noSubs">No Subs</option>
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
            <p className="text-xs text-muted-foreground">Click "Add Category" to create your first oil category.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.map((cat) => (
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
                          className="h-7 gap-1 px-2 text-xs border-dashed cursor-pointer"
                          onClick={() => {
                            setSelectedSubCategory(cat);
                            setIsSubModalOpen(true);
                          }}
                        >
                          <TagIcon className="size-3 text-primary" />
                          <span>{cat.subcategories?.length || 0} Subcategories</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {cat.description || "—"}
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
                ))}
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
