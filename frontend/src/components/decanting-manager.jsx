import { useState, useEffect } from "react";
import { fetchProducts, fetchDecantingLogs, createDecantingLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { RefreshCwIcon, BeakerIcon, ArrowDownRightIcon, CheckCircle2Icon, AlertCircleIcon, HistoryIcon, DropletsIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TARGET_UNITS = [
  { label: "Medium Can 4L", size: 4 },
  { label: "Small Can 1L", size: 1 },
  { label: "Bucket 20L", size: 20 },
  { label: "Bulk Liter", size: 1 },
];

const PAGE_SIZE = 10;

export function DecantingManager() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [sourceProductId, setSourceProductId] = useState("");
  const [sourceDrumsCount, setSourceDrumsCount] = useState("1");
  const [targetUnitLabel, setTargetUnitLabel] = useState("Medium Can 4L");
  const [targetProductId, setTargetProductId] = useState("");
  const [wastagePercentage, setWastagePercentage] = useState("0.5");
  const [notes, setNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [drumsValid, setDrumsValid] = useState(true);
  const [wastageValid, setWastageValid] = useState(true);

  const isFormValid = !!sourceProductId && drumsValid && wastageValid;

  const loadData = async () => {
    setLoading(true);
    const [pRes, dRes] = await Promise.all([fetchProducts(), fetchDecantingLogs()]);
    if (pRes && pRes.success) setProducts(pRes.data);
    if (dRes && dRes.success) setLogs(dRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const masterDrumProducts = products.filter(
    (p) => p.packagingType === "Master Drum 208L" || p.unit === "Drums"
  );
  const canProducts = products.filter((p) => p.packagingType !== "Master Drum 208L");

  const selectedSourceProduct = products.find((p) => p._id === sourceProductId);
  const selectedTargetUnitObj = TARGET_UNITS.find((u) => u.label === targetUnitLabel) || TARGET_UNITS[0];

  const drumsCountNum = Number(sourceDrumsCount) || 0;
  const wastePctNum = Number(wastagePercentage) || 0;
  const unitSizeNum = selectedTargetUnitObj.size;

  const grossLiters = drumsCountNum * 208;
  const wastageLiters = Number((grossLiters * (wastePctNum / 100)).toFixed(2));
  const netLiters = Number((grossLiters - wastageLiters).toFixed(2));
  const producedUnits = Math.floor(netLiters / unitSizeNum);
  const remnantLiters = Number((netLiters % unitSizeNum).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceProductId || drumsCountNum <= 0) {
      setError("Please select a Master Drum product and enter at least 1 drum.");
      return;
    }

    if (selectedSourceProduct && selectedSourceProduct.stockQuantity < drumsCountNum) {
      setError(`Insufficient stock. Only ${selectedSourceProduct.stockQuantity} drums available.`);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      await createDecantingLog({
        sourceProductId,
        sourceDrumsCount: drumsCountNum,
        targetUnitType: targetUnitLabel,
        targetUnitSize: unitSizeNum,
        targetProductId: targetProductId || undefined,
        wastagePercentage: wastePctNum,
        notes,
      });

      setSuccessMsg(`Successfully decanted ${drumsCountNum} drum(s) into ${producedUnits} units of ${targetUnitLabel}!`);
      setSourceDrumsCount("1");
      setNotes("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to process decanting entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalDrumsDecanted = logs.reduce((sum, l) => sum + (l.sourceDrumsCount || 0), 0);
  const totalWastageLiters = logs.reduce((sum, l) => sum + (l.wastageLiters || 0), 0).toFixed(1);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RefreshCwIcon className="size-6 text-primary" />
            Master Drum Decanting Engine
          </h2>
          <p className="text-xs text-muted-foreground">
            Convert 208L Master Drums into packaged 1L, 4L, 20L Cans or Bulk Liters with automatic handling loss calculations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <BeakerIcon className="size-5 text-primary" />
              Decanting Process Form
            </h3>
            <span className="text-xs text-muted-foreground font-mono">208 Liters / Master Drum</span>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircleIcon className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-500 flex items-center gap-2">
              <CheckCircle2Icon className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Source Master Drum *</label>
                <select
                  value={sourceProductId}
                  onChange={(e) => setSourceProductId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Master Drum Product</option>
                  {masterDrumProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.brand}) — Stock: {p.stockQuantity} Drums
                    </option>
                  ))}
                </select>
              </div>

              <ValidatedInput
                label="Drums Quantity to Decant"
                rule="amount"
                required
                type="number"
                placeholder="1"
                value={sourceDrumsCount}
                onChange={(e) => setSourceDrumsCount(e.target.value)}
                onValidationChange={setDrumsValid}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Target Packaging Unit *</label>
                <select
                  value={targetUnitLabel}
                  onChange={(e) => setTargetUnitLabel(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
                >
                  {TARGET_UNITS.map((u) => (
                    <option key={u.label} value={u.label}>
                      {u.label} ({u.size} Liter / Unit)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Target Inventory Item (Optional)</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
                >
                  <option value="">Update stock of existing Can item...</option>
                  {canProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.packagingType}) — Current Stock: {p.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ValidatedInput
                label="Handling & Evaporation Loss (%)"
                rule="positiveNumber"
                type="number"
                placeholder="0.5"
                value={wastagePercentage}
                onChange={(e) => setWastagePercentage(e.target.value)}
                onValidationChange={setWastageValid}
              />

              <ValidatedInput
                label="Batch Notes / Operator Ref"
                rule="text"
                required={false}
                placeholder="e.g. Decanted Lot #402 for SITE Mill order"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={submitting || !isFormValid} className="w-full h-10 gap-2 cursor-pointer font-semibold shadow-xs">
              <RefreshCwIcon className="size-4" />
              {submitting ? "Processing Conversion..." : "Execute Decanting & Update Stock"}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <ArrowDownRightIcon className="size-5 text-primary" />
              Real-Time Conversion Calculator
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Live mathematical breakdown of decanting process.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Input Master Drums:</span>
              <span className="font-semibold text-foreground font-mono">{drumsCountNum} Drums ({grossLiters} L)</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Handling Loss ({wastePctNum}%):</span>
              <span className="font-semibold text-amber-500 font-mono">-{wastageLiters} Liters</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Net Usable Volume:</span>
              <span className="font-semibold text-emerald-500 font-mono">{netLiters} Liters</span>
            </div>

            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-1 text-center">
              <p className="text-[11px] text-primary font-medium">Output Packaged Yield</p>
              <p className="text-2xl font-bold text-primary font-mono">{producedUnits} Units</p>
              <p className="text-[10px] text-muted-foreground">{targetUnitLabel} ({unitSizeNum}L per unit)</p>
            </div>

            {remnantLiters > 0 && (
              <div className="flex justify-between items-center py-1 text-[11px] text-muted-foreground">
                <span>Residue / Remnant Fluid:</span>
                <span className="font-mono">{remnantLiters} L</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <RefreshCwIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Drums Decanted</p>
            <p className="text-xl font-bold text-foreground">{totalDrumsDecanted} Drums</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <DropletsIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Process Handling Loss</p>
            <p className="text-xl font-bold text-foreground">{totalWastageLiters} Liters</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
            <HistoryIcon className="size-5 text-primary" />
            Decanting Batch History Log
          </h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            No decanting batch logs recorded yet.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Source Master Drum</TableHead>
                  <TableHead className="text-center">Input Drums</TableHead>
                  <TableHead>Target Pack Type</TableHead>
                  <TableHead className="text-center">Units Produced</TableHead>
                  <TableHead className="text-right">Handling Loss</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log._id} className="hover:bg-muted/20 text-xs">
                    <TableCell className="text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {log.sourceProductName}
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold">
                      {log.sourceDrumsCount} Drums ({log.grossLiters}L)
                    </TableCell>
                    <TableCell>
                      <span className="inline-block rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                        {log.targetUnitType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-emerald-500">
                      {log.producedUnits} Units
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-500">
                      -{log.wastageLiters} L ({log.wastagePercentage}%)
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.operatorName || "Admin"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={logs.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
}
