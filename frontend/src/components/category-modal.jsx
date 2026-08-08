import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { XIcon } from "lucide-react";

export function CategoryModal({ isOpen, onClose, onSave, initialData }) {
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

  const autoGenerateCode = (categoryName) => {
    if (initialData?.code) return initialData.code;
    if (!categoryName || categoryName.trim().length === 0) return `CAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const words = categoryName.trim().split(/\s+/).filter(Boolean);
    let codeStr = "";
    if (words.length >= 2) {
      codeStr = words.map((w) => w[0]).join("").toUpperCase().substring(0, 4);
    } else {
      codeStr = categoryName.substring(0, 4).toUpperCase();
    }
    return `CAT-${codeStr}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameValid) return;
    setLoading(true);
    setError("");
    try {
      const generatedCode = autoGenerateCode(name);
      await onSave({ name, code: generatedCode, description });
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
          <ValidatedInput
            label="Category Name"
            rule="name"
            required
            placeholder="e.g. Textile Processing Oils"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onValidationChange={setNameValid}
          />

          <ValidatedInput
            label="Description (Optional)"
            rule="text"
            required={false}
            placeholder="e.g. Specialized oils for spinning & weaving mills"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !nameValid}>
              {loading ? "Saving..." : initialData ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

