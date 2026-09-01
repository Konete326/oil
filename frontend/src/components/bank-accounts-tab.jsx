import { useState, useEffect, useCallback } from "react";
import {
  Building2Icon,
  PlusIcon,
  StarIcon,
  PencilIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  WalletIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  LandmarkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BankAccountModal } from "@/components/bank-account-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { CloudLoader } from "@/components/ui/cloud-loader";
import { PaginationControl } from "@/components/pagination-control";
import { fetchBankAccounts, deleteBankAccountApi, setDefaultBankAccountApi } from "@/lib/api";

const PAGE_SIZE = 3;

export function BankAccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ totalBankBalance: 0, activeCount: 0, defaultAccount: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBankAccounts();
      if (res && res.data) {
        setAccounts(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      toast.error("Failed to load company bank accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyIban = (ibanStr, id) => {
    if (!ibanStr) return;
    navigator.clipboard.writeText(ibanStr);
    setCopiedId(id);
    toast.success("IBAN copied to clipboard!");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleSetDefault = async (account) => {
    try {
      await setDefaultBankAccountApi(account._id);
      toast.success(`${account.bankName} is now set as the primary default account for prints!`);
      loadData();
    } catch (err) {
      toast.error("Failed to set default bank account.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBankAccountApi(deleteTarget._id);
      toast.success("Bank account removed successfully.");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error("Failed to delete bank account.");
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.bankName || "").toLowerCase().includes(q) ||
      (a.accountTitle || "").toLowerCase().includes(q) ||
      (a.accountNumber || "").toLowerCase().includes(q) ||
      (a.iban || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedAccounts = filteredAccounts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search bank name, title, or account #..."
            className="w-full h-8.5 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="h-8 text-xs gap-1.5 cursor-pointer">
            <RefreshCwIcon className="size-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAccountToEdit(null);
              setIsModalOpen(true);
            }}
            className="h-8 text-xs gap-1.5 cursor-pointer font-semibold"
          >
            <PlusIcon className="size-3.5" />
            <span>Add Bank Account</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <CloudLoader label="Loading company bank accounts..." />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-3 bg-muted/10">
          <LandmarkIcon className="size-10 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-foreground">No Bank Accounts Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your company bank accounts (Meezan Bank, HBL, etc.) to receive POS payments, track transfers, and print account details on invoices.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAccountToEdit(null);
              setIsModalOpen(true);
            }}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            <span>Add First Bank Account</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedAccounts.map((acc) => (
              <div
                key={acc._id}
                className={`rounded-2xl border transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                  acc.isDefault
                    ? "border-primary/50 bg-gradient-to-b from-primary/5 via-card to-card"
                    : "border-border/80 bg-card hover:border-border"
                }`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground truncate">{acc.bankName}</h4>
                        {acc.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            <StarIcon className="size-2.5 fill-amber-500" /> Default Print
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{acc.accountTitle}</p>
                    </div>

                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
                      <Building2Icon className="size-4" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans">Account No:</span>
                      <strong className="text-foreground text-xs">{acc.accountNumber || "-"}</strong>
                    </div>

                    {acc.iban && (
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40">
                        <span className="text-[9.5px] text-muted-foreground uppercase font-sans">IBAN:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-foreground truncate max-w-[140px] tracking-wide">{acc.iban}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyIban(acc.iban, acc._id)}
                            className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer rounded-xs hover:bg-muted"
                            title="Copy IBAN"
                          >
                            {copiedId === acc._id ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">Current Balance</span>
                    <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      Rs {(acc.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>

                  {acc.branchName && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      Branch: {acc.branchName} {acc.branchCode ? `(${acc.branchCode})` : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 px-3.5 py-2 border-t border-border/60 bg-muted/20 text-xs">
                  {!acc.isDefault ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(acc)}
                      className="h-6.5 text-[10.5px] px-2 text-muted-foreground hover:text-amber-500 cursor-pointer gap-1"
                    >
                      <StarIcon className="size-3" />
                      <span>Set Default</span>
                    </Button>
                  ) : (
                    <span className="text-[10.5px] text-amber-500 font-medium flex items-center gap-1 px-1">
                      <ShieldCheckIcon className="size-3" /> Primary Account
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAccountToEdit(acc);
                        setIsModalOpen(true);
                      }}
                      className="h-6.5 text-[10.5px] px-2 text-muted-foreground hover:bg-muted cursor-pointer gap-1"
                    >
                      <PencilIcon className="size-3" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(acc)}
                      className="h-6.5 text-[10.5px] px-2 text-destructive hover:bg-destructive/10 cursor-pointer gap-1"
                    >
                      <Trash2Icon className="size-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAccounts.length > PAGE_SIZE && (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={filteredAccounts.length}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <BankAccountModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setAccountToEdit(null);
          }}
          accountToEdit={accountToEdit}
          onSuccess={loadData}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Bank Account"
          message={`Are you sure you want to delete '${deleteTarget.bankName} (${deleteTarget.accountNumber})'? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
