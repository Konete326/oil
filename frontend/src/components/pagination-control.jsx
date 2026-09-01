import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControl({
  page,
  pages,
  total,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
}) {
  const activePage = currentPage || page || 1;
  const pageCount = Math.max(1, totalPages || pages || 1);
  const count = totalRecords !== undefined ? totalRecords : total !== undefined ? total : 0;

  if (count === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-3.5 py-2.5 bg-card border-t border-border text-xs">
      <div className="text-muted-foreground font-medium text-[11px]">
        Showing Page <strong className="text-foreground font-mono">{activePage}</strong> of{" "}
        <strong className="text-foreground font-mono">{pageCount}</strong> ({count} Total Records)
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={activePage <= 1}
          onClick={() => onPageChange && onPageChange(activePage - 1)}
          className="h-7.5 px-2 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="size-3.5" />
          <span>Previous</span>
        </Button>

        <span className="px-2 font-mono text-[11px] text-muted-foreground font-semibold">
          {activePage} / {pageCount}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={activePage >= pageCount}
          onClick={() => onPageChange && onPageChange(activePage + 1)}
          className="h-7.5 px-2 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
