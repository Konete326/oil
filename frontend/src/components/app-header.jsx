import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { navLinks } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { NavUser } from "@/components/nav-user";
import { useToastNotification } from "@/components/toast-notification-provider";
import { LanguageSelector } from "@/components/language-selector";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import {
  fetchProducts,
  fetchCashTransactionsApi,
  fetchExpensesApi,
  fetchPosSales,
  fetchMills,
  fetchSuppliersApi,
} from "@/lib/api";
import {
  SearchIcon,
  BellIcon,
  FileQuestionIcon,
  PackageIcon,
  ShoppingCartIcon,
  WalletIcon,
  ReceiptIcon,
  BookOpenIcon,
  TruckIcon,
} from "lucide-react";

export function AppHeader({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useToastNotification();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef(null);

  const activeItem = navLinks.find((item) => item.path === location.pathname) || {
    title: location.pathname === "/notifications" ? "Notifications" : "Page Not Found",
    icon: location.pathname === "/notifications" ? <BellIcon className="size-3.5" /> : <FileQuestionIcon className="size-3.5" />,
  };

  const hasPermission = (permKey) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (Array.isArray(user.permissions) && user.permissions.includes("all")) return true;
    if (Array.isArray(user.permissions)) return user.permissions.includes(permKey);
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGlobalSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setSearchLoading(true);
    setIsSearchOpen(true);

    try {
      const fetchTasks = [];
      const moduleKeys = [];

      if (hasPermission("products")) {
        fetchTasks.push(fetchProducts());
        moduleKeys.push("products");
      }
      if (hasPermission("pos")) {
        fetchTasks.push(fetchPosSales());
        moduleKeys.push("pos");
      }
      if (hasPermission("cash")) {
        fetchTasks.push(fetchCashTransactionsApi({ search: query }));
        moduleKeys.push("cash");
      }
      if (hasPermission("ledger")) {
        fetchTasks.push(fetchMills());
        moduleKeys.push("ledger");
      }
      if (hasPermission("supplier-ledger")) {
        fetchTasks.push(fetchSuppliersApi({ search: query }));
        moduleKeys.push("supplier-ledger");
      }
      if (hasPermission("expenses")) {
        fetchTasks.push(fetchExpensesApi({ search: query }));
        moduleKeys.push("expenses");
      }

      const responses = await Promise.all(fetchTasks);
      const results = [];
      const q = query.toLowerCase();

      responses.forEach((res, idx) => {
        const modKey = moduleKeys[idx];
        if (!res || !res.success || !res.data) return;

        if (modKey === "products") {
          res.data
            .filter(
              (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .forEach((p) => {
              results.push({
                id: `prod-${p._id}`,
                title: p.name,
                subtitle: `SKU: ${p.sku} | Brand: ${p.brand} | Stock: ${p.stockQuantity}`,
                category: "Products & Stock",
                path: "/products",
                icon: <PackageIcon className="size-4 text-primary" />,
              });
            });
        } else if (modKey === "pos") {
          res.data
            .filter(
              (s) =>
                s.saleNumber?.toLowerCase().includes(q) ||
                s.customerName?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .forEach((s) => {
              results.push({
                id: `sale-${s._id}`,
                title: `POS Sale #${s.saleNumber}`,
                subtitle: `Customer: ${s.customerName} | Rs. ${s.grandTotal.toLocaleString()} (${s.paymentMode})`,
                category: "POS Counter",
                path: "/pos/history",
                icon: <ShoppingCartIcon className="size-4 text-emerald-500" />,
              });
            });
        } else if (modKey === "cash") {
          res.data
            .filter(
              (c) =>
                c.voucherNumber?.toLowerCase().includes(q) ||
                c.partyName?.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .forEach((c) => {
              results.push({
                id: `cash-${c._id}`,
                title: `${c.type} Voucher #${c.voucherNumber || "N/A"}`,
                subtitle: `${c.partyName || "General"} | Rs. ${c.amount?.toLocaleString()} (${c.category})`,
                category: "Cash Transactions",
                path: "/cash",
                icon: <WalletIcon className="size-4 text-amber-500" />,
              });
            });
        } else if (modKey === "ledger") {
          res.data
            .filter(
              (m) =>
                m.name?.toLowerCase().includes(q) ||
                m.contactPerson?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .forEach((m) => {
              results.push({
                id: `mill-${m._id}`,
                title: m.name,
                subtitle: `Contact: ${m.contactPerson || "N/A"} | Balance: Rs. ${m.currentBalance?.toLocaleString()}`,
                category: "Textile Mills",
                path: "/textile",
                icon: <BookOpenIcon className="size-4 text-indigo-500" />,
              });
            });
        } else if (modKey === "supplier-ledger") {
          res.data
            .filter(
              (sup) =>
                sup.name?.toLowerCase().includes(q) ||
                sup.companyName?.toLowerCase().includes(q) ||
                sup.phone?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .forEach((sup) => {
              results.push({
                id: `sup-${sup._id}`,
                title: sup.name,
                subtitle: `${sup.companyName || "Supplier"} | Balance Owed: Rs. ${sup.currentBalance?.toLocaleString()}`,
                category: "Supplier Ledger",
                path: "/supplier-ledger",
                icon: <TruckIcon className="size-4 text-purple-500" />,
              });
            });
        } else if (modKey === "expenses") {
          res.data
            .filter(
              (e) =>
                e.title?.toLowerCase().includes(q) ||
                e.category?.toLowerCase().includes(q) ||
                e.voucherNumber?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .forEach((e) => {
              results.push({
                id: `exp-${e._id}`,
                title: `Expense: ${e.title}`,
                subtitle: `Rs. ${e.amount?.toLocaleString()} | ${e.category} (${new Date(e.expenseDate).toLocaleDateString()})`,
                category: "Expenses",
                path: "/cash",
                icon: <ReceiptIcon className="size-4 text-rose-500" />,
              });
            });
        }
      });

      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center hidden sm:block"
          orientation="vertical"
        />
        <div className="hidden sm:block">
          <AppBreadcrumbs page={activeItem} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 max-w-xl justify-end min-w-0">
        <div ref={searchRef} className="relative w-full max-w-[150px] sm:max-w-xs md:max-w-md">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, sales, vouchers..."
              value={searchQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
              }}
              className="ps-8 pe-3 text-xs h-9 w-full bg-muted/30 focus:bg-background"
            />
          </div>

          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-10 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-50 duration-100">
              <div className="p-2 border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex justify-between items-center">
                <span>Search Results ({searchResults.length})</span>
                <span className="font-mono text-[9px]">Role: {user?.role || "Staff"}</span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                {searchLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Searching records...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">No Records Found</p>
                    <p className="text-[11px]">No matching records found for "{searchQuery}".</p>
                  </div>
                ) : (
                  searchResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(res.path);
                      }}
                      className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <div className="mt-0.5 p-1 rounded bg-muted/80">{res.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {res.title}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                            {res.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{res.subtitle}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <SyncStatusBadge />
        <LanguageSelector />

        <Button
          aria-label="Notifications"
          size="sm"
          variant="outline"
          onClick={() => navigate("/notifications")}
          className="cursor-pointer relative shrink-0 size-9 p-0 rounded-lg border-border/80 bg-background/50 hover:bg-muted/80 flex items-center justify-center"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-primary text-[9.5px] font-bold text-primary-foreground font-mono">
              {unreadCount}
            </span>
          )}
        </Button>

        <NavUser user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
