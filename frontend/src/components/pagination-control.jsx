import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControl({ page = 1, pages = 1, total = 0, onPageChange }) {
  if (pages <= 1 && total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-card border-t border-border text-xs">
      <div className="text-muted-foreground font-medium text-[11px]">
        Showing Page <strong className="text-foreground font-mono">{page}</strong> of{" "}
        <strong className="text-foreground font-mono">{pages || 1}</strong> ({total} Total Records)
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="size-3.5" />
          <span>Previous</span>
        </Button>

        <span className="px-2 font-mono text-[11px] text-muted-foreground font-semibold">
          {page} / {pages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
