"use client";

import { useState } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCard } from "@/components/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";

const PAGE_SIZE = 5;

export function DashboardInvoices({ invoices = [], loading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const items = invoices || [];

  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <DashboardCard className="relative gap-0 md:col-span-2 shadow-2xs rounded-2xl">
      <CardHeader className="p-3.5 pb-1 gap-1 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground">Recent Invoices &amp; Challans</CardTitle>
          <CardDescription className="text-[11px]">Latest POS receipts &amp; gate passes</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No sales invoices or challans recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-7 bg-muted/20 border-b border-border/60">
                  <TableHead className="ps-4 text-[10px] uppercase font-bold py-1">Customer / Mill</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold py-1">Invoice #</TableHead>
                  <TableHead className="pe-4 text-right tabular-nums text-[10px] uppercase font-bold py-1">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((inv, index) => (
                  <TableRow className="h-8 hover:bg-muted/20 text-xs" key={inv._id || inv.invoiceId || index}>
                    <TableCell className="max-w-36 truncate ps-4 font-semibold text-foreground py-1">
                      {inv.customer}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-[11px] py-1">
                      {inv.invoiceId}
                    </TableCell>
                    <TableCell className="pe-4 text-right tabular-nums font-mono font-bold text-foreground py-1 text-xs">
                      {inv.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="p-1.5 border-t border-border/50">
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={items.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </DashboardCard>
  );
}
