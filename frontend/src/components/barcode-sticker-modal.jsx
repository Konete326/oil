import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  XIcon,
  PrinterIcon,
  ScanBarcodeIcon,
  CopyIcon,
  CheckIcon,
  LayersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { COMPANY_CONFIG } from "@/lib/company-config";

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function generateCode128B(text) {
  const clean = text.replace(/[^\x20-\x7E]/g, "");
  let checkSum = 104;
  const patternList = [CODE128_PATTERNS[104]];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    checkSum += code * (i + 1);
    patternList.push(CODE128_PATTERNS[code]);
  }

  const checkChar = checkSum % 103;
  patternList.push(CODE128_PATTERNS[checkChar]);
  patternList.push(CODE128_PATTERNS[106]);

  let binary = "";
  for (const p of patternList) {
    if (!p) continue;
    for (let j = 0; j < p.length; j++) {
      const width = parseInt(p[j], 10);
      const bit = j % 2 === 0 ? "1" : "0";
      binary += bit.repeat(width);
    }
  }
  return binary;
}

export function BarcodeStickerModal({ isOpen, onClose, product }) {
  const [copies, setCopies] = useState(1);
  const [paperLayout, setPaperLayout] = useState("single");
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  if (!isOpen || !product) return null;

  const skuCode = product.sku || "LUB-0000";
  const binaryBars = generateCode128B(skuCode);

  const handleCopySku = () => {
    navigator.clipboard.writeText(skuCode);
    setCopied(true);
    toast.success("SKU copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const orig = document.title;
    document.title = `Al_Khaleej_Barcode_Stickers_${product?.sku || skuCode || "SKU"}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const previewCount = paperLayout === "a4sheet" ? 2 : 1;
  const printItems = Array.from({ length: Math.min(500, Math.max(1, copies)) });

  const renderCard = (key) => (
    <div
      key={key}
      className="barcode-sticker-card w-[230px] bg-white text-black p-2.5 rounded-lg border border-neutral-300 shadow-xs flex flex-col items-center justify-between text-center select-none shrink-0"
    >
      <div className="w-full border-b border-neutral-200 pb-1">
        <p className="text-[9px] font-black tracking-wider uppercase text-neutral-800">
          {COMPANY_CONFIG.name}
        </p>
        <h4 className="text-[11px] font-bold leading-tight truncate text-black">
          {product.name}
        </h4>
        <p className="text-[9px] font-medium text-neutral-600 truncate">
          {product.brand} {product.grade ? `· ${product.grade}` : ""} · {product.packagingType}
        </p>
      </div>

      <div className="py-1.5 w-full flex flex-col items-center">
        <svg
          viewBox={`0 0 ${binaryBars.length} 45`}
          className="w-full h-9"
          preserveAspectRatio="none"
        >
          {binaryBars.split("").map((bit, bIdx) =>
            bit === "1" ? (
              <rect
                key={bIdx}
                x={bIdx}
                y="0"
                width="1"
                height="45"
                fill="#000000"
              />
            ) : null
          )}
        </svg>
        <span className="font-mono font-bold text-[10px] tracking-widest text-black mt-0.5">
          *{skuCode}*
        </span>
      </div>

      <div className="w-full border-t border-neutral-200 pt-1 flex items-center justify-between text-[10px]">
        <span className="font-semibold text-neutral-600">RETAIL PRICE:</span>
        <span className="font-mono font-black text-xs text-black">
          Rs {product.sellingPrice?.toLocaleString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ScanBarcodeIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Product SKU Barcode Sticker
              </h3>
              <p className="text-[10px] text-muted-foreground">Printable physical label for cans, bottles & drums</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-hidden flex flex-col flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-muted/20 shrink-0 print:hidden">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Number of Stickers</label>
              <input
                type="number"
                min="1"
                max="500"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono font-bold shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Print Format</label>
              <select
                value={paperLayout}
                onChange={(e) => setPaperLayout(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="single">Single Label (50mm × 30mm Thermal)</option>
                <option value="a4sheet">A4 Sticker Sheet (Multi-Grid)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-0 print:hidden">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <LayersIcon className="size-3.5 text-primary" />
                  Live Sticker Preview
                </span>
                <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border font-mono">
                  {copies} label{copies > 1 ? "s" : ""} to print
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySku}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                {copied ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                <span>{skuCode}</span>
              </button>
            </div>

            <div className="flex-1 min-h-[160px] max-h-[240px] sm:max-h-[260px] overflow-y-auto p-3 bg-muted/10 rounded-xl border border-dashed border-border flex items-center justify-center">
              {paperLayout === "a4sheet" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full justify-items-center">
                  {Array.from({ length: previewCount }).map((_, idx) => renderCard(`prev-${idx}`))}
                </div>
              ) : (
                renderCard("prev-single")
              )}
            </div>
          </div>

          <div ref={printRef} className="hidden print:block printable-barcode-zone">
            {printItems.map((_, idx) => renderCard(`print-${idx}`))}
          </div>

          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-barcode-zone,
              .printable-barcode-zone * {
                visibility: visible !important;
              }
              .printable-barcode-zone {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                background: white !important;
                padding: 0 !important;
              }
              .barcode-sticker-card {
                page-break-inside: avoid !important;
                border: 1px solid #ddd !important;
                margin: 4px !important;
                box-shadow: none !important;
              }
            }
          `}</style>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0 print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="cursor-pointer gap-2 font-medium bg-primary text-primary-foreground text-xs px-5 shadow-xs"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print {copies} Sticker{copies > 1 ? "s" : ""}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
