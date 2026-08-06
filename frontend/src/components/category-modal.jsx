import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";

export function CategoryModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCode(initialData.code || "");
      setDescription(initialData.description || "");
    } else {
      setName("");
      setCode("");
      setDescription("");
    }
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Category Name and Code are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({ name, code: code.toUpperCase(), description });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-lg text-foreground">
            {initialData ? "Edit Category" : "Add New Category"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category Name</label>
            <Input
              placeholder="e.g. Textile Processing Oils"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category Code</label>
            <Input
              placeholder="e.g. TEX-OIL"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input
              placeholder="e.g. Specialized oils for Karachi spinning & weaving mills"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
