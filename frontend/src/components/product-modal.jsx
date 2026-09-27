import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { uploadMediaApi } from "@/lib/api";
import {
  XIcon,
  UploadCloudIcon,
  ImageIcon,
  Loader2Icon,
  LayersIcon,
  DropletIcon,
} from "lucide-react";
import { toast } from "sonner";

function generateUniqueSku(existingList = []) {
  const existingSet = new Set(
    existingList
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item.trim().toUpperCase();
        if (typeof item === "object" && item.sku) return item.sku.trim().toUpperCase();
        return "";
      })
      .filter(Boolean)
  );

  let highestNum = 1000;
  existingSet.forEach((code) => {
    const match = code.match(/(\d+)/g);
    if (match) {
      const lastDigits = parseInt(match[match.length - 1], 10);
      if (!isNaN(lastDigits) && lastDigits >= highestNum && lastDigits < 999999) {
        highestNum = lastDigits;
      }
    }
  });

  let nextNum = highestNum + 1;
  let candidate = `LUB-${nextNum}`;
  while (existingSet.has(candidate)) {
    nextNum++;
    candidate = `LUB-${nextNum}`;
  }
  return candidate;
}

export function ProductModal({ isOpen, onClose, onSave, initialData, existingProducts = [] }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [nameValid, setNameValid] = useState(false);
  const [costValid, setCostValid] = useState(false);
  const [stockValid, setStockValid] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSku(initialData.sku || generateUniqueSku(existingProducts));
      setCostPrice(initialData.costPrice !== undefined ? String(initialData.costPrice) : "");
      setStockQuantity(initialData.stockQuantity !== undefined ? String(initialData.stockQuantity) : "0");
      setImageUrl(initialData.imageUrl || "");
      setImagePreview(initialData.imageUrl || "");
    } else {
      setName("");
      setSku(generateUniqueSku(existingProducts));
      setCostPrice("");
      setStockQuantity("0");
      setImageUrl("");
      setImagePreview("");
    }
  }, [initialData, isOpen, existingProducts]);

  if (!isOpen) return null;

  const costNum = Number(costPrice) || 0;
  const isFormValid = name.trim().length > 0 && sku.trim().length > 0 && costNum > 0;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);
    try {
      const url = await uploadMediaApi(file);
      const finalUrl = url || localPreview;
      setImageUrl(finalUrl);
      setImagePreview(finalUrl);
      toast.success("Image uploaded successfully.");
    } catch (err) {
      toast.error(err.message || "Image upload failed.");
      setImageUrl(localPreview);
      setImagePreview(localPreview);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please enter a valid Product Name and Kharid Rate (Cost).");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        packagingType: "Liter",
        unit: "Liters",
        costPrice: costNum,
        sellingPrice: initialData?.sellingPrice || 0,
        stockQuantity: Number(stockQuantity) || 0,
        imageUrl,
      });
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LayersIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {initialData ? "Edit Oil Product" : "Add Lubricant / Oil Product"}
              </h3>
              <p className="text-[10px] text-muted-foreground">Standardized Oil Inventory (All calculations in Liters)</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">

          <div className="space-y-1">
            <ValidatedInput
              label="Full Product / Oil Name *"
              rule="name"
              required
              placeholder="e.g. Shell Rimula R4 15W-40 CI-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onValidationChange={setNameValid}
            />
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/70 bg-muted/20 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <DropletIcon className="size-3.5 text-blue-500" />
              <span>Unit:</span>
            </div>
            <span className="font-mono font-bold text-foreground text-[11px] bg-background px-2 py-0.5 rounded border border-border/60">
              Liters (L)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ValidatedInput
              label="Kharid Rate (Cost) Rs/L *"
              rule="positiveNumber"
              required
              type="number"
              placeholder="e.g. 850"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              onValidationChange={setCostValid}
              className="font-mono font-bold text-foreground"
            />

            <ValidatedInput
              label="Current Stock (Liters)"
              rule="positiveNumber"
              type="number"
              placeholder="e.g. 500"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              onValidationChange={setStockValid}
              className="font-mono"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card">
            <div className="text-[11px] text-muted-foreground">
              Farokht rate (Selling Price) direct POS counter par sale ke waqt tay hogi.
            </div>

            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {imagePreview ? (
                <div className="flex items-center gap-2">
                  <img src={imagePreview} alt="Preview" className="size-8 rounded-md object-contain border border-border bg-muted/20" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-7 text-[11px] gap-1 cursor-pointer"
                  >
                    {uploading ? <Loader2Icon className="size-3 animate-spin" /> : <UploadCloudIcon className="size-3" />}
                    <span>Change</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImageUrl("");
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={uploading}
                    className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-7 text-[11px] gap-1 cursor-pointer border-dashed"
                >
                  {uploading ? <Loader2Icon className="size-3 animate-spin" /> : <ImageIcon className="size-3 text-muted-foreground" />}
                  <span>Add Product Image (Optional)</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || uploading || !isFormValid}
              className="cursor-pointer gap-2 font-medium bg-primary text-primary-foreground text-xs px-6"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : initialData ? (
                "Update Product"
              ) : (
                "Save Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
