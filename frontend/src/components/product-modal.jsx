import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadMediaApi } from "@/lib/api";
import { XIcon, UploadCloudIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

const PACKAGING_TYPES = [
  "Master Drum 208L",
  "Small Can 1L",
  "Medium Can 4L",
  "Bucket 20L",
  "Bulk Liter",
];

const UNITS = ["Drums", "Cans", "Liters", "Units"];

export function ProductModal({ isOpen, onClose, onSave, categories, initialData }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [brand, setBrand] = useState("");
  const [grade, setGrade] = useState("");
  const [viscosity, setViscosity] = useState("");
  const [packagingType, setPackagingType] = useState("Master Drum 208L");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unit, setUnit] = useState("Drums");
  const [minStockAlert, setMinStockAlert] = useState("10");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const selectedCategoryObj = categories.find((c) => c._id === category);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSku(initialData.sku || "");
      setCategory(initialData.category?._id || initialData.category || "");
      setSubcategoryName(initialData.subcategoryName || "");
      setBrand(initialData.brand || "");
      setGrade(initialData.grade || "");
      setViscosity(initialData.viscosity || "");
      setPackagingType(initialData.packagingType || "Master Drum 208L");
      setCostPrice(initialData.costPrice !== undefined ? String(initialData.costPrice) : "");
      setSellingPrice(initialData.sellingPrice !== undefined ? String(initialData.sellingPrice) : "");
      setStockQuantity(initialData.stockQuantity !== undefined ? String(initialData.stockQuantity) : "");
      setUnit(initialData.unit || "Drums");
      setMinStockAlert(initialData.minStockAlert !== undefined ? String(initialData.minStockAlert) : "10");
      setDescription(initialData.description || "");
      setImageUrl(initialData.imageUrl || "");
      setImagePreview(initialData.imageUrl || "");
    } else {
      setName("");
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory(categories[0]?._id || "");
      setSubcategoryName("");
      setBrand("");
      setGrade("");
      setViscosity("");
      setPackagingType("Master Drum 208L");
      setCostPrice("");
      setSellingPrice("");
      setStockQuantity("0");
      setUnit("Drums");
      setMinStockAlert("10");
      setDescription("");
      setImageUrl("");
      setImagePreview("");
    }
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP).");
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
      setImageUrl(url);
      toast.success("Image uploaded successfully.");
    } catch (err) {
      toast.error(err.message || "Image upload failed.");
      setImagePreview(imageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const syntheticEvent = { target: { files: [file] } };
      handleFileChange(syntheticEvent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !category || !brand.trim() || costPrice === "" || sellingPrice === "") {
      toast.error("Product Name, SKU, Category, Brand, Cost Price, and Selling Price are required.");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        name,
        sku: sku.toUpperCase(),
        category,
        subcategoryName,
        brand,
        grade,
        viscosity,
        packagingType,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity) || 0,
        unit,
        minStockAlert: Number(minStockAlert) || 10,
        description,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-lg text-foreground">
            {initialData ? "Edit Oil Product" : "Add New Oil Product"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div
            className="relative rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {imagePreview ? (
              <div className="relative h-36 w-full overflow-hidden rounded-xl">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-full object-contain bg-muted/20"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center gap-2 text-xs text-foreground">
                    <Loader2Icon className="size-4 animate-spin text-primary" />
                    <span>Uploading to Cloudinary...</span>
                  </div>
                )}
                {!uploading && (
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs font-medium text-foreground gap-1">
                    <UploadCloudIcon className="size-4" />
                    <span>Change Image</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                {uploading ? (
                  <>
                    <Loader2Icon className="size-6 animate-spin text-primary" />
                    <span className="text-[11px]">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="size-8 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    <p className="text-[11px] font-medium">Click or drag &amp; drop to upload product image</p>
                    <p className="text-[10px]">JPG, PNG, WEBP — max 5MB</p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Product Name *</label>
              <Input
                placeholder="e.g. Super Spindle Lube 10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">SKU Code *</label>
              <Input
                placeholder="e.g. SKU-TEX-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Category *</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubcategoryName(""); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                required
              >
                <option value="" disabled>Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Subcategory</label>
              <select
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="">None / General</option>
                {selectedCategoryObj?.subcategories?.map((sub) => (
                  <option key={sub._id || sub.name} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Brand / Manufacturer *</label>
              <Input
                placeholder="e.g. Shell, Mobil, Total"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Oil Grade</label>
              <Input
                placeholder="e.g. ISO VG 68, 20W-50"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Viscosity</label>
              <Input
                placeholder="e.g. 68 cSt, 10 cSt"
                value={viscosity}
                onChange={(e) => setViscosity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Packaging Type</label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
              >
                {PACKAGING_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Stock Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Cost Price (Rs) *</label>
              <Input type="number" placeholder="450" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Selling Price (Rs) *</label>
              <Input type="number" placeholder="600" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Current Stock</label>
              <Input type="number" placeholder="50" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Min Stock Alert</label>
              <Input type="number" placeholder="10" value={minStockAlert} onChange={(e) => setMinStockAlert(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-muted-foreground">Description / Notes</label>
            <Input
              placeholder="e.g. High pressure hydraulic oil suitable for textile looms"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading} className="cursor-pointer gap-2">
              {loading ? (
                <><Loader2Icon className="size-3.5 animate-spin" /><span>Saving...</span></>
              ) : (
                initialData ? "Update Product" : "Save Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
