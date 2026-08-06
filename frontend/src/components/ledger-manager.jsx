import { useState, useEffect } from "react";
import { fetchMills, fetchLedgerEntries, createPaymentEntry, fetchAgingReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentModal } from "@/components/payment-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { BookOpenIcon, WalletIcon, SearchIcon, PlusIcon, AlertTriangleIcon, CheckCircle2Icon, ClockIcon, FilterIcon, PrinterIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 7;

const AGING_COLORS = {
  "0-30 Days": "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  "31-60 Days": "bg-amber-500/10 text-amber-500 border-amber-500/30",
  "61-90 Days": "bg-orange-500/10 text-orange-500 border-orange-500/30",
  "90+ Days (Overdue)": "bg-destructive/10 text-destructive border-destructive/30",
};

export function LedgerManager() {
  const [activeTab, setActiveTab] = useState("ledger");
  const [mills, setMills] = useState([]);
  const [entries, setEntries] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMill, setSelectedMill] = useState("");
  const [search, setSearch] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    const [mRes, lRes, aRes] = await Promise.all([
      fetchMills(),
      fetchLedgerEntries(selectedMill),
      fetchAgingReport(),
    ]);
    if (mRes && mRes.success) setMills(mRes.data);
    if (lRes && lRes.success) setEntries(lRes.data);
    if (aRes && aRes.success) setAgingData(aRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedMill]);

  const handleSavePayment = async (formData) => {
    await createPaymentEntry(formData);
    await loadData();
  };

  const totalOutstanding = mills.reduce((sum, m) => sum + (m.currentBalance || 0), 0);
  const totalOverdue = agingData.filter((a) => a.category === "90+ Days (Overdue)").reduce((sum, a) => sum + a.balance, 0);

  const filteredEntries = entries.filter((e) =>
    e.clientName.toLowerCase().includes(search.toLowerCase()) ||
    (e.referenceNumber && e.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
    e.transactionType.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpenIcon className="size-6 text-primary" />
            Client Ledger & Khata (Accounts Receivable)
          </h2>
          <p className="text-xs text-muted-foreground">
            Debit/Credit ledger statements, payment receipts, and aging reports per Textile Mill client.
          </p>
        </div>

        <Button
          onClick={() => setIsPaymentModalOpen(true)}
          className="gap-2 shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <PlusIcon className="size-4" />
          Record Payment Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <WalletIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Outstanding Receivable</p>
            <p className="text-xl font-bold text-foreground">Rs {totalOutstanding.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">90+ Days Overdue Balance</p>
            <p className="text-xl font-bold text-destructive">Rs {totalOverdue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ClockIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Payment Entries</p>
            <p className="text-xl font-bold text-foreground">{entries.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab("ledger"); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${activeTab === "ledger" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Ledger Entries ({entries.length})
          </button>
          <button
            onClick={() => { setActiveTab("aging"); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${activeTab === "aging" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Aging Report ({agingData.length} Clients)
          </button>
        </div>

        {activeTab === "ledger" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedMill}
              onChange={(e) => { setSelectedMill(e.target.value); setCurrentPage(1); }}
              className="rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs cursor-pointer"
            >
              <option value="">All Clients</option>
              {mills.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search client, ref, type..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="ps-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : activeTab === "ledger" ? (
          filteredEntries.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <BookOpenIcon className="size-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No Ledger Entries Found</p>
              <p className="text-xs text-muted-foreground">Click "Record Payment Receipt" to add the first transaction.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount (Rs)</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => {
                    const isCredit = entry.transactionType.includes("Credit");
                    return (
                      <TableRow key={entry._id} className="hover:bg-muted/20 text-xs">
                        <TableCell className="font-mono text-muted-foreground text-[11px]">
                          {new Date(entry.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {entry.clientName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {isCredit ? (
                              <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                            ) : (
                              <AlertTriangleIcon className="size-3.5 text-amber-500" />
                            )}
                            <span className={isCredit ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                              {entry.transactionType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.paymentMode}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {entry.referenceNumber || "—"}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isCredit ? "text-emerald-500" : "text-amber-500"}`}>
                          {isCredit ? "+" : "-"}Rs {entry.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground">
                          Rs {entry.runningBalance?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEntries.length}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )
        ) : agingData.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <ClockIcon className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">No Clients in Aging Report</p>
            <p className="text-xs text-muted-foreground">Register Textile Mill clients to view aging analysis.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Mill Code</TableHead>
                <TableHead>Textile Mill Name</TableHead>
                <TableHead>Industrial Zone</TableHead>
                <TableHead className="text-center">Days Since Activity</TableHead>
                <TableHead className="text-center">Aging Category</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.map((a) => (
                <TableRow key={a._id} className="hover:bg-muted/20 text-xs">
                  <TableCell className="font-mono font-bold text-primary">
                    {a.code}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {a.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px]">
                    {a.zone}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {a.daysOverdue} Days
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${AGING_COLORS[a.category] || "bg-muted text-muted-foreground"}`}>
                      {a.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    Rs {a.creditLimit?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-amber-500">
                    Rs {a.balance?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        mills={mills}
      />
    </div>
  );
}
