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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCard } from "@/components/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";

const PAGE_SIZE = 7;

export function DashboardInvoices({ invoices = [], loading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const items = invoices || [];

  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <DashboardCard className="relative gap-0 md:col-span-2">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Recent Sales Invoices &amp; Gate Passes</CardTitle>
        <CardDescription>Latest POS receipts and tanker delivery challans.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No sales invoices or challans recorded yet.
          </div>
        ) : (
          <>
            <Table>
              <TableCaption className="sr-only">
                Recent invoices with customer, amount, and status.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">Customer / Mill</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead className="pe-6 text-right tabular-nums">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((inv, index) => (
                  <TableRow className="h-12 hover:bg-muted/20" key={inv._id || inv.invoiceId || index}>
                    <TableCell className="max-w-40 truncate ps-6 font-medium">
                      {inv.customer}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {inv.invoiceId}
                    </TableCell>
                    <TableCell className="pe-6 text-right tabular-nums font-semibold text-foreground">
                      {inv.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={items.length}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </CardContent>
    </DashboardCard>
  );
}
