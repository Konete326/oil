"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ArrowRightIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";

const PAGE_SIZE = 7;

export function DashboardInvoices({ invoices, loading }) {
	const [currentPage, setCurrentPage] = useState(1);
	const items = invoices || [
		{ invoiceId: "1045", customer: "Northwind Labs", amount: "$2,400.00", status: "Paid" },
		{ invoiceId: "1044", customer: "Blue River Co.", amount: "$890.00", status: "Pending" },
		{ invoiceId: "1043", customer: "Oak Street Studio", amount: "$5,120.00", status: "Paid" },
		{ invoiceId: "1042", customer: "Harbor Freight LLC", amount: "$310.50", status: "Overdue" },
	];

	const totalPages = Math.ceil(items.length / PAGE_SIZE);
	const paginatedItems = items.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE
	);

	return (
        <DashboardCard className="relative gap-0 md:col-span-2">
            <CardHeader className="border-b">
				<CardTitle className="text-base">Recent Invoices</CardTitle>
				<CardDescription>Open amounts and payment status from MongoDB Atlas.</CardDescription>
			</CardHeader>
            <CardContent className="px-0">
				{loading ? (
					<div className="p-6 space-y-3">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-6 w-full" />
					</div>
				) : (
					<>
						<Table>
							<TableCaption className="sr-only">
								Recent invoices with customer, amount, and status.
							</TableCaption>
							<TableHeader>
								<TableRow>
									<TableHead className="ps-6">Customer</TableHead>
									<TableHead>Invoice</TableHead>
									<TableHead className="pe-6 text-right tabular-nums">
										Amount
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedItems.map((inv, index) => (
									<TableRow className="h-12 hover:bg-muted/20" key={inv.invoiceId || inv.id || index}>
										<TableCell className="max-w-40 truncate ps-6 font-medium">
											{inv.customer}
										</TableCell>
										<TableCell className="text-muted-foreground tabular-nums">
											#{inv.invoiceId || inv.id}
										</TableCell>
										<TableCell className="pe-6 text-right tabular-nums font-semibold">
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
