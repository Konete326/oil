import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, PlusIcon, Trash2Icon, TagIcon } from "lucide-react";

export function SubcategoryModal({ isOpen, onClose, category, onAddSubcategory, onDeleteSubcategory }) {
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !category) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!subName.trim()) {
      setError("Subcategory name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAddSubcategory(category._id, {
        name: subName,
        code: subCode.toUpperCase() || subName.substring(0, 4).toUpperCase(),
        description: subDesc,
      });
      setSubName("");
      setSubCode("");
      setSubDesc("");
    } catch (err) {
      setError(err.message || "Failed to add subcategory");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subId) => {
    try {
      await onDeleteSubcategory(category._id, subId);
    } catch (err) {
      setError(err.message || "Failed to delete subcategory");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <TagIcon className="size-5 text-primary" />
              Subcategories for {category.name}
            </h3>
            <p className="text-xs text-muted-foreground">Category Code: {category.code}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-foreground">Add New Subcategory</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Subcategory Name (e.g. Spindle Oil 10)"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="text-xs"
              required
            />
            <Input
              placeholder="Code (e.g. SPD-10)"
              value={subCode}
              onChange={(e) => setSubCode(e.target.value)}
              className="text-xs"
            />
          </div>
          <Input
            placeholder="Description / Grade Specification"
            value={subDesc}
            onChange={(e) => setSubDesc(e.target.value)}
            className="text-xs"
          />
          <Button type="submit" size="sm" className="w-full gap-1 text-xs" disabled={loading}>
            <PlusIcon className="size-3.5" />
            {loading ? "Adding..." : "Add Subcategory"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Existing Subcategories ({category.subcategories?.length || 0})
          </p>
          <div className="max-h-56 overflow-y-auto space-y-2 pe-1">
            {category.subcategories?.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No subcategories added yet.
              </p>
            ) : (
              category.subcategories?.map((sub) => (
                <div
                  key={sub._id}
                  className="flex items-center justify-between rounded-lg border bg-card p-2.5 text-xs shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{sub.name}</span>
                      {sub.code && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary">
                          {sub.code}
                        </span>
                      )}
                    </div>
                    {sub.description && (
                      <p className="text-[11px] text-muted-foreground">{sub.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(sub._id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
