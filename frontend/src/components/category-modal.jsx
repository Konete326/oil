import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon, FolderTreeIcon, Loader2Icon, PlusIcon } from "lucide-react";

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameValid, setNameValid] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const autoGenerateCode = (rawName) => {
    if (initialData?.code) return initialData.code;
    const prefix = "CAT";
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
      const generatedCode = autoGenerateCode(name);
      await onSave({
        name: name.trim(),
        code: generatedCode,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FolderTreeIcon className="size-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {initialData ? "Edit Product Category" : "Add Product Category"}
              </h3>
              <p className="text-[11px] text-muted-foreground">e.g. Engine Oil, Hydraulic Oil, Gear Oil, Grease</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <ValidatedInput
            label="Category Name *"
            rule="name"
            required
            placeholder="e.g. Hydraulic Oil or Gear Oil"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onValidationChange={setNameValid}
          />

          <div className="space-y-1">
            <label className="font-medium text-foreground">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Industrial ISO 46, 68 hydraulic lubricants"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!nameValid || loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer text-xs font-semibold"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="size-3.5" />
                  <span>{initialData ? "Update Category" : "Create Category"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
