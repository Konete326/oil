import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ConfirmModal } from "@/components/confirm-modal";
import { XIcon, PlusIcon, Trash2Icon, TagIcon } from "lucide-react";

export function SubcategoryModal({ isOpen, onClose, category, onAddSubcategory, onDeleteSubcategory }) {
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subNameValid, setSubNameValid] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!isOpen || !category) return null;

  const autoGenerateSubCode = (nameStr) => {
    if (!nameStr || nameStr.trim().length === 0) return `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanStr = nameStr.trim().replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    return `SUB-${cleanStr}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!subNameValid) return;
    setLoading(true);
    setError("");
    try {
      const generatedCode = autoGenerateSubCode(subName);
      await onAddSubcategory(category._id, {
        name: subName,
        code: generatedCode,
        description: subDesc,
      });
      setSubName("");
      setSubDesc("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add subcategory");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubId) return;
    try {
      setDeleteLoading(true);
      await onDeleteSubcategory(category._id, deletingSubId);
      setDeletingSubId(null);
    } catch (err) {
      setError(err.message || "Failed to delete subcategory");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <TagIcon className="size-4 text-primary" />
                Subcategories for {category.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">Category Code: {category.code}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="size-7">
              <XIcon className="size-4" />
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">Add New Subcategory</p>
            <ValidatedInput
              label="Subcategory Name"
              rule="name"
              required
              placeholder="e.g. Spindle Oil 10"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              onValidationChange={setSubNameValid}
            />
            <ValidatedInput
              label="Description (Optional)"
              rule="text"
              required={false}
              placeholder="e.g. Grade specification or usage details"
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
            />
            <Button type="submit" size="sm" className="w-full gap-1 text-xs h-8" disabled={loading || !subNameValid}>
              <PlusIcon className="size-3.5" />
              {loading ? "Adding..." : "Add Subcategory"}
            </Button>
          </form>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Existing Subcategories ({category.subcategories?.length || 0})
            </p>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pe-1">
              {category.subcategories?.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  No subcategories added yet.
                </p>
              ) : (
                category.subcategories?.map((sub) => (
                  <div
                    key={sub._id}
                    className="flex items-center justify-between rounded-lg border bg-card p-2 text-xs shadow-xs"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{sub.name}</span>
                        {sub.code && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono text-primary shrink-0">
                            {sub.code}
                          </span>
                        )}
                      </div>
                      {sub.description && (
                        <p className="text-[10px] text-muted-foreground truncate">{sub.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive cursor-pointer shrink-0 ms-2"
                      onClick={() => setDeletingSubId(sub._id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingSubId}
        onClose={() => setDeletingSubId(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory?"
        confirmText="Delete Subcategory"
      />
    </>
  );
}


