import { useState, useEffect, useRef, useMemo } from "react";
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
  fetchCustomers,
  fetchSuppliersApi,
  fetchCurrentShiftStatusApi,
} from "@/lib/api";
import { ShopClosingModal } from "@/components/shop-closing-modal";
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
  ChevronDownIcon,
  StoreIcon,
  FileSpreadsheetIcon,
  XIcon,
  CornerDownLeftIcon,
  LayoutGridIcon,
  SparklesIcon,
  ArrowRightIcon,
  UsersIcon,
} from "lucide-react";

export function AppHeader({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useToastNotification();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [shiftStatus, setShiftStatus] = useState(null);

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const quickActionRef = useRef(null);
  const resultsContainerRef = useRef(null);

  const refreshShiftStatus = async () => {
    const res = await fetchCurrentShiftStatusApi();
    if (res?.success && res.data) setShiftStatus(res.data);
  };

  useEffect(() => {
    refreshShiftStatus();
    const interval = setInterval(refreshShiftStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
      if (quickActionRef.current && !quickActionRef.current.contains(e.target)) {
        setIsQuickActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const getMatchingNavLinks = (q) => {
    if (!q) return [];
    const query = q.toLowerCase().trim();
    const matched = [];
    navLinks.forEach((link) => {
      if (link.title?.toLowerCase().includes(query) || link.path?.toLowerCase().includes(query)) {
        if (!matched.some((m) => m.path === link.path)) {
          matched.push({
            id: `nav-${link.path}`,
            title: link.title,
            subtitle: `Navigate to ${link.title}`,
            category: "Navigation & Pages",
            path: link.path,
            state: link.state,
            icon: link.icon || <LayoutGridIcon className="size-4 text-primary" />,
          });
        }
      }
    });
    return matched.slice(0, 4);
  };

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setSelectedCategory("All");
      return;
    }

    const navMatches = getMatchingNavLinks(q);
    setSearchResults(navMatches);
    setIsSearchOpen(true);
    setSelectedIndex(0);

    const timer = setTimeout(async () => {
      setSearchLoading(true);
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
          fetchTasks.push(fetchCashTransactionsApi({ search: q }));
          moduleKeys.push("cash");
        }
        if (hasPermission("ledger")) {
          fetchTasks.push(fetchCustomers({ search: q }));
          moduleKeys.push("ledger");
        }
        if (hasPermission("supplier-ledger")) {
          fetchTasks.push(fetchSuppliersApi({ search: q }));
          moduleKeys.push("supplier-ledger");
        }
        if (hasPermission("expenses")) {
          fetchTasks.push(fetchExpensesApi({ search: q }));
          moduleKeys.push("expenses");
        }

        const responses = await Promise.all(fetchTasks);
        const apiResults = [];

        responses.forEach((res, idx) => {
          const modKey = moduleKeys[idx];
          if (!res || !res.success || !res.data) return;

          if (modKey === "products") {
            res.data
              .filter(
                (p) =>
                  p.name?.toLowerCase().includes(q) ||
                  p.sku?.toLowerCase().includes(q) ||
                  p.category?.toLowerCase().includes(q)
              )
              .slice(0, 4)
              .forEach((p) => {
                apiResults.push({
                  id: `prod-${p._id}`,
                  title: p.name,
                  subtitle: `Stock: ${p.stockQuantity ?? 0} Liters | Price: Rs ${Number(p.sellingPrice || 0).toLocaleString()}`,
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
                  s.customerName?.toLowerCase().includes(q) ||
                  s.vehicleNumber?.toLowerCase().includes(q)
              )
              .slice(0, 4)
              .forEach((s) => {
                apiResults.push({
                  id: `pos-${s._id}`,
                  title: `Sale #${s.saleNumber || "POS"} - ${s.customerName || "Walk-in"}`,
                  subtitle: `Total: Rs ${Number(s.grandTotal || 0).toLocaleString()} | Mode: ${s.paymentMode || "Cash"}`,
                  category: "POS Counter Sales",
                  path: "/pos/history",
                  icon: <ShoppingCartIcon className="size-4 text-blue-500" />,
                });
              });
          } else if (modKey === "cash") {
            res.data
              .filter(
                (c) =>
                  c.partyName?.toLowerCase().includes(q) ||
                  c.referenceNo?.toLowerCase().includes(q) ||
                  c.category?.toLowerCase().includes(q)
              )
              .slice(0, 4)
              .forEach((c) => {
                apiResults.push({
                  id: `cash-${c._id}`,
                  title: `${c.type || "Cash"} - ${c.partyName || "General"}`,
                  subtitle: `Rs ${Number(c.amount || 0).toLocaleString()} | ${c.paymentMode || "Cash"} | Ref: ${c.referenceNo || "-"}`,
                  category: "Cash & Bank",
                  path: "/cash",
                  icon: <WalletIcon className="size-4 text-emerald-500" />,
                });
              });
          } else if (modKey === "ledger" || modKey === "customers") {
            res.data
              .filter(
                (c) =>
                  c.name?.toLowerCase().includes(q) ||
                  c.phone?.toLowerCase().includes(q) ||
                  c.address?.toLowerCase().includes(q)
              )
              .slice(0, 4)
              .forEach((c) => {
                apiResults.push({
                  id: `cust-${c._id}`,
                  title: c.name,
                  subtitle: `Balance: Rs ${Number(c.currentBalance || 0).toLocaleString()} | Phone: ${c.phone || "-"}`,
                  category: "Customers & Accounts",
                  path: "/customers",
                  icon: <UsersIcon className="size-4 text-primary" />,
                });
              });
          } else if (modKey === "supplier-ledger") {
            res.data
              .filter(
                (s) =>
                  s.name?.toLowerCase().includes(q) ||
                  s.phone?.toLowerCase().includes(q)
              )
              .slice(0, 4)
              .forEach((s) => {
                apiResults.push({
                  id: `sup-${s._id}`,
                  title: s.name,
                  subtitle: `Payable: Rs ${Number(s.currentBalance || 0).toLocaleString()} | ${s.phone || ""}`,
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
                  e.voucherNumber?.toLowerCase().includes(q) ||
                  e.category?.toLowerCase().includes(q)
              )
              .slice(0, 4)
              .forEach((e) => {
                apiResults.push({
                  id: `exp-${e._id}`,
                  title: e.title || "Expense Voucher",
                  subtitle: `Voucher: ${e.voucherNumber || "-"} | Amount: Rs ${Number(e.amount || 0).toLocaleString()}`,
                  category: "Expenses",
                  path: "/pos/history",
                  state: { tab: "expenses" },
                  icon: <ReceiptIcon className="size-4 text-destructive" />,
                });
              });
          }
        });

        setSearchResults([...navMatches, ...apiResults]);
      } catch (err) {
        console.warn("Global search query failed", err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories = useMemo(() => {
    const list = ["All"];
    searchResults.forEach((r) => {
      if (r.category && !list.includes(r.category)) list.push(r.category);
    });
    return list;
  }, [searchResults]);

  const filteredResults = useMemo(() => {
    if (selectedCategory === "All") return searchResults;
    return searchResults.filter((r) => r.category === selectedCategory);
  }, [searchResults, selectedCategory]);

  const handleSelectResult = (res) => {
    if (!res) return;
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(res.path, res.state ? { state: res.state } : undefined);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isSearchOpen && searchResults.length > 0) {
        setIsSearchOpen(true);
        setSelectedIndex(0);
        return;
      }
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  const quickActions = [
    {
      label: "New POS Sale",
      path: "/pos",
      state: null,
      perm: "pos",
      icon: <ShoppingCartIcon className="size-3.5 text-blue-500" />,
    },
    {
      label: "Record Received / Paid Cash",
      path: "/cash",
      state: { openModal: true, initialType: "Received" },
      perm: "cash",
      icon: <WalletIcon className="size-3.5 text-emerald-500" />,
    },
    {
      label: "Record Expense Voucher",
      path: "/pos/history",
      state: { openExpenseModal: true },
      perm: "pos",
      icon: <ReceiptIcon className="size-3.5 text-destructive" />,
    },
    {
      label: "Add Oil Product",
      path: "/products",
      state: { openModal: true },
      perm: "products",
      icon: <PackageIcon className="size-3.5 text-primary" />,
    },
    {
      label: "Supplier Payment",
      path: "/supplier-ledger",
      state: { openModal: true },
      perm: "supplier-ledger",
      icon: <TruckIcon className="size-3.5 text-purple-500" />,
    },
    {
      label: "Customers & Accounts",
      path: "/customers",
      state: null,
      perm: "customers",
      icon: <UsersIcon className="size-3.5 text-primary" />,
    },
    {
      label: "Master Platform Report",
      path: "/financial-reports",
      state: null,
      perm: "financial-reports",
      icon: <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />,
    },
  ].filter((a) => hasPermission(a.perm));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <CustomSidebarTrigger />
        <Separator
          className="mr-1 h-4 data-[orientation=vertical]:self-center hidden sm:block"
          orientation="vertical"
        />
        <div className="hidden lg:block">
          <AppBreadcrumbs page={activeItem} />
        </div>
      </div>

      <div className="flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-2 sm:mx-6 min-w-0">
        <div ref={searchRef} className="relative w-full">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search products, customers, sales, ledgers... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length > 0 || searchResults.length > 0) setIsSearchOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="ps-10 pe-16 text-xs h-10 w-full bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/80 rounded-xl transition-all shadow-2xs focus-visible:ring-1 focus-visible:ring-primary"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsSearchOpen(false);
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-background/80 border border-border rounded shadow-2xs pointer-events-none">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>
          </div>

          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-11.5 z-50 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 w-full">
              <div className="p-2.5 border-b border-border bg-muted/40 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <SparklesIcon className="size-3 text-primary" />
                    Global Search ({filteredResults.length})
                  </span>
                  <span className="font-mono text-[9.5px]">Role: {user?.role || "Staff"}</span>
                </div>

                {categories.length > 2 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap transition-colors cursor-pointer border",
                          selectedCategory === cat
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                            : "bg-background/80 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={resultsContainerRef} className="max-h-80 overflow-y-auto divide-y divide-border/40 p-1">
                {searchLoading ? (
                  <div className="p-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Searching database...</span>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">No Records Found</p>
                    <p className="text-[11px]">No matching records found for "{searchQuery}".</p>
                  </div>
                ) : (
                  filteredResults.map((res, idx) => (
                    <button
                      key={res.id}
                      data-index={idx}
                      onClick={() => handleSelectResult(res)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group",
                        selectedIndex === idx
                          ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0 transition-colors",
                          selectedIndex === idx ? "bg-primary text-primary-foreground shadow-2xs" : "bg-muted"
                        )}>
                          {res.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {res.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{res.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
                          {res.category}
                        </span>
                        <ArrowRightIcon className={cn(
                          "size-3.5 transition-transform text-muted-foreground",
                          selectedIndex === idx ? "text-primary translate-x-0.5" : "opacity-0 group-hover:opacity-100"
                        )} />
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-background border border-border">↑</kbd>
                    <kbd className="px-1 py-0.5 rounded bg-background border border-border">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-background border border-border flex items-center">
                      <CornerDownLeftIcon className="size-2.5 mr-0.5" />
                      Enter
                    </kbd>
                    Open
                  </span>
                </div>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-background border border-border">ESC</kbd> Close
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsShopModalOpen(true)}
          className={cn(
            "gap-2 h-9 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer shadow-2xs shrink-0",
            shiftStatus?.isClosed
              ? "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted"
              : "border-border/80 bg-background/60 hover:bg-muted/70 text-foreground"
          )}
          title={shiftStatus?.isClosed ? "Shop is closed" : "Manual Shop Closing (Z-Report)"}
        >
          <span className="relative flex h-2 w-2">
            {!shiftStatus?.isClosed && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/70" />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                shiftStatus?.isClosed ? "bg-muted-foreground/60" : "bg-emerald-500"
              )}
            />
          </span>
          <StoreIcon className="size-3.5 text-muted-foreground" />
          <span className="hidden xl:inline font-medium">
            {shiftStatus?.isClosed ? "Shop Closed" : "Shop Close"}
          </span>
        </Button>

        <SyncStatusBadge />
        <LanguageSelector />

        <Button
          aria-label="Notifications"
          size="sm"
          variant="outline"
          onClick={() => navigate("/notifications")}
          className="cursor-pointer relative shrink-0 size-9 p-0 rounded-xl border-border/80 bg-background/50 hover:bg-muted/80 flex items-center justify-center"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-primary text-[9.5px] font-bold text-primary-foreground font-mono">
              {unreadCount}
            </span>
          )}
        </Button>

        <Separator
          className="h-4 data-[orientation=vertical]:self-center hidden sm:block mx-0.5"
          orientation="vertical"
        />

        <NavUser user={user} onLogout={onLogout} />
      </div>

      <ShopClosingModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        onSuccess={() => {
          refreshShiftStatus();
          window.dispatchEvent(new CustomEvent("refresh-dashboard"));
        }}
      />
    </header>
  );
}
