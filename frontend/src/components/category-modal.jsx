import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon, FolderTreeIcon, LayersIcon } from "lucide-react";

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  onSaveSubcategory,
  categories = [],
  initialData,
}) {
  const [categoryType, setCategoryType] = useState("main");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameValid, setNameValid] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCategoryType("main");
    } else {
      setName("");
      setCategoryType("main");
      setParentCategoryId(categories[0]?._id || "");
    }
    setError("");
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const autoGenerateCode = (rawName, isSub = false) => {
    if (initialData?.code) return initialData.code;
    const prefix = isSub ? "SUB" : "CAT";
    if (!rawName || rawName.trim().length === 0) return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const words = rawName.trim().split(/\s+/).filter(Boolean);
    let codeStr = "";
    if (words.length >= 2) {
      codeStr = words.map((w) => w[0]).join("").toUpperCase().substring(0, 4);
    } else {
      codeStr = rawName.substring(0, 4).toUpperCase();
    }
    return `${prefix}-${codeStr}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameValid) return;
    setLoading(true);
    setError("");

    try {
      if (categoryType === "sub") {
        if (!parentCategoryId) {
          setError("Please select a parent main category.");
          setLoading(false);
          return;
        }
        const subCode = autoGenerateCode(name, true);
        if (onSaveSubcategory) {
          await onSaveSubcategory(parentCategoryId, { name: name.trim(), code: subCode });
        }
      } else {
        const generatedCode = autoGenerateCode(name, false);
        await onSave({ name: name.trim(), code: generatedCode });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              {categoryType === "main" ? <FolderTreeIcon className="size-4" /> : <LayersIcon className="size-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {initialData ? "Edit Category" : "Add Category / Subcategory"}
              </h3>
              <p className="text-[11px] text-muted-foreground">Manage hierarchy without extra description fields</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        {!initialData && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border/80">
            <button
              type="button"
              onClick={() => setCategoryType("main")}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryType === "main"
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Main Category
            </button>
            <button
              type="button"
              onClick={() => setCategoryType("sub")}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryType === "sub"
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Subcategory
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {categoryType === "sub" && (
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Parent Main Category *</label>
              <select
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="" disabled>Select Parent Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <ValidatedInput
            label={categoryType === "main" ? "Main Category Name *" : "Subcategory Name *"}
            rule="name"
            required
            placeholder={categoryType === "main" ? "e.g. Engine Oils, Industrial Lubricants" : "e.g. Synthetic 4T, Spindle Lube"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onValidationChange={setNameValid}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !nameValid || (categoryType === "sub" && !parentCategoryId)}
              className="cursor-pointer text-xs bg-primary text-primary-foreground font-medium"
            >
              {loading ? "Saving..." : initialData ? "Update Category" : categoryType === "sub" ? "Create Subcategory" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
