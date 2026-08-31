import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { uploadMediaApi } from "@/lib/api";
import {
  XIcon,
  UploadCloudIcon,
  ImageIcon,
  Loader2Icon,
  TrendingUpIcon,
  RefreshCwIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";

const POPULAR_BRANDS = [
  "Total",
  "Shell",
  "ZIC",
  "Caltex",
  "Mobil",
  "PSO",
  "Castrol",
  "Havoline",
  "Liqui Moly",
  "Valvoline",
  "Kixx",
  "Petronas",
];

const POPULAR_GRADES = [
  "20W-50",
  "10W-40",
  "5W-30",
  "0W-20",
  "15W-40",
  "Hydraulic 68",
  "Hydraulic 46",
  "ATF",
  "Gear 85W-140",
  "Spindle 10",
  "Turbine 32",
  "Cutting Oil",
];

const DEFAULT_PACKAGING_OPTIONS = [
  "Small Can 1L",
  "1 Liter Bottle",
  "1 Liter Can",
  "0.7 Liter Can",
  "3 Liter Can",
  "Medium Can 4L",
  "4 Liter Can",
  "5 Liter Can",
  "10 Liter Can",
  "Bucket 20L",
  "20 Liter Bucket",
  "50 Liter Drum",
  "Master Drum 208L",
  "208 Liter Master Drum",
  "Bulk Liter",
];

const DEFAULT_UNITS = [
  "Cans",
  "Drums",
  "Buckets",
  "Liters",
  "Bottles",
  "Packs",
  "Units",
  "Cartons",
  "Pieces",
];

function generateSkuCode() {
  return `LUB-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ProductModal({ isOpen, onClose, onSave, categories = [], initialData }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [grade, setGrade] = useState("");
  const [packagingType, setPackagingType] = useState("Medium Can 4L");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unit, setUnit] = useState("Cans");
  const [minStockAlert, setMinStockAlert] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [customPackagingOptions, setCustomPackagingOptions] = useState(() => {
    try {
      const saved = localStorage.getItem("oil_custom_packaging");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customUnits, setCustomUnits] = useState(() => {
    try {
      const saved = localStorage.getItem("oil_custom_units");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allPackagingOptions = Array.from(
    new Set([...DEFAULT_PACKAGING_OPTIONS, ...customPackagingOptions, packagingType].filter(Boolean))
  );

  const allUnits = Array.from(
    new Set([...DEFAULT_UNITS, ...customUnits, unit].filter(Boolean))
  );

  const [nameValid, setNameValid] = useState(false);
  const [costValid, setCostValid] = useState(false);
  const [sellingValid, setSellingValid] = useState(false);
  const [stockValid, setStockValid] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSku(initialData.sku || generateSkuCode());
      const catId =
        (typeof initialData.category === "object" && initialData.category?._id)
          ? initialData.category._id
          : (initialData.category || categories[0]?._id || "");
      setCategory(catId);
      setBrand(initialData.brand || (initialData.name ? initialData.name.split(" ")[0] : ""));
      setGrade(initialData.grade || "");
      setPackagingType(initialData.packagingType || "Medium Can 4L");
      setCostPrice(initialData.costPrice !== undefined ? String(initialData.costPrice) : "");
      setSellingPrice(initialData.sellingPrice !== undefined ? String(initialData.sellingPrice) : "");
      setStockQuantity(initialData.stockQuantity !== undefined ? String(initialData.stockQuantity) : "0");
      setUnit(initialData.unit || "Cans");
      setMinStockAlert(initialData.minStockAlert !== undefined ? String(initialData.minStockAlert) : "5");
      setImageUrl(initialData.imageUrl || "");
      setImagePreview(initialData.imageUrl || "");
    } else {
      const defaultCatId = categories[0]?._id || "";
      setName("");
      setSku(generateSkuCode());
      setCategory(defaultCatId);
      setBrand("");
      setGrade("");
      setPackagingType("Medium Can 4L");
      setCostPrice("");
      setSellingPrice("");
      setStockQuantity("0");
      setUnit("Cans");
      setMinStockAlert("5");
      setImageUrl("");
      setImagePreview("");
    }
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const costNum = Number(costPrice) || 0;
  const sellingNum = Number(sellingPrice) || 0;
  const profitPerUnit = Math.max(0, sellingNum - costNum);
  const marginPct = costNum > 0 ? ((profitPerUnit / costNum) * 100).toFixed(1) : "0.0";

  const isFormValid =
    name.trim().length > 0 &&
    sku.trim().length > 0 &&
    (brand.trim().length > 0 || name.trim().length > 0) &&
    sellingNum > 0;

  const handlePackagingChange = (val) => {
    setPackagingType(val);
    const lower = val.toLowerCase();
    if (lower.includes("drum")) {
      setUnit("Drums");
    } else if (lower.includes("bucket")) {
      setUnit("Buckets");
    } else if (lower.includes("loose") || lower.includes("bulk") || (lower.includes("liter") && !lower.includes("can") && !lower.includes("bottle"))) {
      setUnit("Liters");
    } else if (lower.includes("bottle")) {
      setUnit("Bottles");
    } else if (lower.includes("can")) {
      setUnit("Cans");
    }
  };

  const handleBrandChange = (newBrand) => {
    setBrand(newBrand);
    if (!name || name.trim().length < 3) {
      setName(`${newBrand} ${grade}`.trim());
    }
  };

  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    if (brand) {
      setName(`${brand} ${newGrade}`.trim());
    } else if (!name) {
      setName(newGrade);
    }
  };

  const handleCategoryChange = (newCatId) => {
    setCategory(newCatId);
    const catObj = categories.find((c) => c._id === newCatId);
    if (catObj?.subcategories?.length) {
      setSubcategoryName(catObj.subcategories[0].name);
    } else {
      setSubcategoryName("");
    }
  };

  const handleRegenerateSku = () => {
    setSku(generateSkuCode());
  };

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
      toast.error("Please enter a valid Product Name, SKU, and Farokht Rate.");
      return;
    }
    setLoading(true);
    try {
      const trimmedPkg = packagingType.trim() || "Medium Can 4L";
      const trimmedUnit = unit.trim() || "Cans";

      if (!DEFAULT_PACKAGING_OPTIONS.includes(trimmedPkg)) {
        const updatedPkg = Array.from(new Set([...customPackagingOptions, trimmedPkg]));
        setCustomPackagingOptions(updatedPkg);
        try {
          localStorage.setItem("oil_custom_packaging", JSON.stringify(updatedPkg));
        } catch {}
      }

      if (!DEFAULT_UNITS.includes(trimmedUnit)) {
        const updatedUnits = Array.from(new Set([...customUnits, trimmedUnit]));
        setCustomUnits(updatedUnits);
        try {
          localStorage.setItem("oil_custom_units", JSON.stringify(updatedUnits));
        } catch {}
      }

      const resolvedBrand = brand.trim() || name.trim().split(" ")[0] || "General";
      const resolvedCategory = typeof category === "object" && category?._id ? category._id : category || categories[0]?._id;

      await onSave({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: resolvedCategory,
        brand: resolvedBrand,
        grade: grade.trim(),
        packagingType: trimmedPkg,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity) || 0,
        unit: trimmedUnit,
        minStockAlert: Number(minStockAlert) || 5,
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
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LayersIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {initialData ? "Edit Oil Product" : "Add Lubricant / Oil Product"}
              </h3>
              <p className="text-[10px] text-muted-foreground">Streamlined fast entry with brand & grade selectors</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Brand / Company *</label>
              <input
                type="text"
                list="modal-brand-list"
                required
                placeholder="e.g. Total, Shell, ZIC"
                value={brand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <datalist id="modal-brand-list">
                {POPULAR_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Oil Grade / Viscosity</label>
              <input
                type="text"
                list="modal-grade-list"
                placeholder="e.g. 20W-50, 5W-30"
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              />
              <datalist id="modal-grade-list">
                {POPULAR_GRADES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <ValidatedInput
                label="Full Product Name *"
                rule="name"
                required
                placeholder="e.g. Total Quartz 9000 5W-30"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onValidationChange={setNameValid}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground">SKU (Auto / Editable) *</label>
                <button
                  type="button"
                  onClick={handleRegenerateSku}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-mono"
                >
                  <RefreshCwIcon className="size-2.5" />
                  Auto-Gen
                </button>
              </div>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. LUB-8921"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring uppercase text-primary"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-foreground">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-foreground">Packaging & Unit</label>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <input
                    type="text"
                    list="modal-packaging-list"
                    placeholder="e.g. 1L Can, 4L Can"
                    value={packagingType}
                    onChange={(e) => handlePackagingChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <datalist id="modal-packaging-list">
                    {allPackagingOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    list="modal-unit-list"
                    placeholder="e.g. Cans, Liters"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <datalist id="modal-unit-list">
                    {allUnits.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <ValidatedInput
                label="Kharid Rate (Purchase) Rs *"
                rule="positiveNumber"
                required
                type="number"
                placeholder="e.g. 3200"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                onValidationChange={setCostValid}
              />

              <ValidatedInput
                label="Farokht Rate (Selling) Rs *"
                rule="positiveNumber"
                required
                type="number"
                placeholder="e.g. 3800"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                onValidationChange={setSellingValid}
              />

              <ValidatedInput
                label="Current Opening Stock"
                rule="positiveNumber"
                type="number"
                placeholder="e.g. 24"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                onValidationChange={setStockValid}
              />

              <ValidatedInput
                label="Min Stock Alert Level"
                rule="positiveNumber"
                type="number"
                placeholder="5"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card">
            <div className="flex items-center gap-2 text-xs">
              {costNum > 0 && sellingNum > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUpIcon className="size-4" />
                  <span>Profit Margin:</span>
                  <span className="font-mono font-bold">+Rs {profitPerUnit.toLocaleString()} / unit ({marginPct}%)</span>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">Enter Kharid and Farokht rate to see estimated profit.</span>
              )}
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
