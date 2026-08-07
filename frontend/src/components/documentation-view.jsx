import { useState } from "react";
import {
  FileTextIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  SearchIcon,
  CheckCircle2Icon,
  LockIcon,
  CpuIcon,
  Building2Icon,
  LayersIcon,
  UserCheckIcon,
  CopyIcon,
  CheckIcon,
  InfoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DOCUMENTATION_SECTIONS = [
  {
    id: "overview",
    title: "1. System Overview",
    icon: <Building2Icon className="size-4 text-primary" />,
  },
  {
    id: "user-guide",
    title: "2. Software User Guide",
    icon: <BookOpenIcon className="size-4 text-emerald-500" />,
  },
  {
    id: "roles-permissions",
    title: "3. Role & Permission Matrix",
    icon: <UserCheckIcon className="size-4 text-amber-500" />,
  },
  {
    id: "rules-terms",
    title: "4. Rules, Terms & Privacy",
    icon: <ShieldCheckIcon className="size-4 text-rose-500" />,
  },
];

const MODULE_GUIDES = [
  {
    name: "Dashboard & Analytics",
    desc: "Real-time key performance indicators, gross revenue, inventory stock alerts, and quick navigation shortcuts.",
  },
  {
    name: "Category & Subcategory Management",
    desc: "Classify lubricant products by industrial application (e.g. Textile Oils, Hydraulic Lubricants, Engine Oils) and sub-types.",
  },
  {
    name: "Products & Stock Inventory",
    desc: "Manage master drum stock (208L), small cans (1L/4L), cost prices, selling prices, minimum stock alert limits, and Cloudinary media uploads.",
  },
  {
    name: "POS Counter & Sales History",
    desc: "Fast retail & wholesale checkout terminal supporting cash, card POS, bank transfers, credit khata, custom discounts, GST tax, and printable invoices.",
  },
  {
    name: "Drum Decanting & Packaging",
    desc: "Convert 208L Master Drums into smaller retail packaging (1L/4L Cans/Buckets) with automated evaporation wastage percentage calculation and instant stock adjustment.",
  },
  {
    name: "Textile Mills & DC Gate Pass",
    desc: "Register industrial textile mills, configure contract rates per liter, and issue Tanker Delivery Challans (Gate Passes) with dip measurements (inches) and driver details.",
  },
  {
    name: "Customer Ledger & Khata",
    desc: "Track client debit/credit balances, record credit payments, view complete ledger transaction history, and generate printable PDF statements.",
  },
  {
    name: "Supplier & Refinery Ledger",
    desc: "Maintain refinery purchasing khata accounts, record raw oil shipments, log supplier payment vouchers, and track outstanding vendor liabilities.",
  },
  {
    name: "Cash Transactions",
    desc: "Record daily cash outflows (Paid Cash) and cash inflows (Received Cash) with category breakdown and petty cash management.",
  },
  {
    name: "Sales & Purchase Reports",
    desc: "Filter historical sales and stock purchases by date ranges, products, suppliers, and client mills.",
  },
  {
    name: "Profit & Loss Margin",
    desc: "Calculate automated gross revenue, cost of goods sold (COGS), operational expenses, and net profit margins.",
  },
  {
    name: "Trial Balance & Financial Reports",
    desc: "Comprehensive balance sheet, trial balance verification, debit/credit audit summaries for accounting transparency.",
  },
  {
    name: "Expenses & Employee Payroll",
    desc: "Record business operational expenses (utilities, freight, rent) and process monthly staff salaries with advance cash deduction vouchers.",
  },
  {
    name: "User Management & Role Security",
    desc: "Create staff user accounts and assign granular module permissions (Admin, Manager, Cashier, Accountant).",
  },
  {
    name: "Audit Trail Logs",
    desc: "Security audit logging tracking every database write, update, delete operation with user identity, timestamp, and IP address.",
  },
];

export function DocumentationView() {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const filteredGuides = MODULE_GUIDES.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCredit = () => {
    navigator.clipboard.writeText("Software for Al Khaleej Lubricants LLC | Developed by Elite Dev Agency (2026)");
    setCopiedKey(true);
    toast.success("License & credit details copied to clipboard.");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileTextIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Software Documentation &amp; User Manual
              </h1>
              <p className="text-xs text-muted-foreground">
                Official User Guide, Role Permissions, Operating Rules &amp; Enterprise License (2026 Edition).
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCredit}
          className="gap-2 text-xs cursor-pointer self-start sm:self-auto"
        >
          {copiedKey ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
          <span>Copy System Specs</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Navigation Index
            </p>
            {DOCUMENTATION_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  activeSection === sec.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {sec.icon}
                <span>{sec.title}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <InfoIcon className="size-4 text-primary" />
              <span>Portal Info</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Software engineered specifically for <strong className="text-foreground">Al Khaleej Lubricants LLC</strong> for managing industrial oil production, retail sales, textile mill deliveries, and financial ledgers.
            </p>
            <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
              Developed by <span className="font-bold text-primary">Elite Dev Agency</span> (2026).
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === "overview" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <CpuIcon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">1. System Overview</h2>
                    <p className="text-xs text-muted-foreground">Al Khaleej Lubricants ERP &amp; Oil Management Software</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-foreground/90">
                  Welcome to the official operating system for <strong>Al Khaleej Lubricants LLC</strong>. This enterprise platform is engineered to streamline end-to-end lube blending operations, raw oil drum purchasing, decanting into retail cans, retail counter POS sales, textile mill contract shipments via tanker trucks, customer credit khatas, and automated profit &amp; loss analytics.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Client Name</p>
                    <p className="text-xs font-bold text-foreground">Al Khaleej Lubricants LLC</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Engineering Agency</p>
                    <p className="text-xs font-bold text-primary">Elite Dev Agency</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Version / Release</p>
                    <p className="text-xs font-bold text-foreground">2026 Enterprise Edition v2.4</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <LayersIcon className="size-4 text-primary" />
                  Key Business Capabilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground">Multi-Unit Inventory Control</p>
                    <p className="text-[11px] text-muted-foreground">Manage Master Drums (208L), Cans (1L/4L), Buckets, and Bulk oil stock with real-time low-stock alerts.</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground">Automated Financial Sync</p>
                    <p className="text-[11px] text-muted-foreground">Synchronized Customer Khatas, Supplier Ledgers, POS sales receipts, and operational expenses.</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground">Real-Time Form Validation</p>
                    <p className="text-[11px] text-muted-foreground">Live regex checks, red border error highlighting, and submit protection across all forms.</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground">Audit Trail &amp; Security</p>
                    <p className="text-[11px] text-muted-foreground">Immutable activity logs capturing user operations, timestamps, and network security details.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "user-guide" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">2. Software User Guide</h2>
                    <p className="text-xs text-muted-foreground">Detailed instructions for operating all management modules.</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search module guide..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredGuides.map((guide, idx) => (
                    <div
                      key={guide.name}
                      className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          Module {idx + 1}
                        </span>
                        <h4 className="font-bold text-foreground text-xs">{guide.name}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{guide.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "roles-permissions" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">3. Role-Based Access Control (RBAC) Matrix</h2>
                  <p className="text-xs text-muted-foreground">Permission matrix defining user access privileges across roles.</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">Module / Feature</th>
                        <th className="p-3 text-center">Admin</th>
                        <th className="p-3 text-center">Manager</th>
                        <th className="p-3 text-center">Cashier</th>
                        <th className="p-3 text-center">Accountant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="p-3 font-medium text-foreground">Dashboard &amp; Overview</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">POS Counter &amp; Sales</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">Products &amp; Decanting</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">Textile Mills &amp; Gate Passes</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">Customer &amp; Supplier Ledgers</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">Profit &amp; Loss &amp; Financials</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">User Management &amp; Roles</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-foreground">Audit Trail Logs</td>
                        <td className="p-3 text-center text-emerald-500 font-bold">Full</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                        <td className="p-3 text-center text-destructive font-bold">Denied</td>
                        <td className="p-3 text-center text-amber-500 font-bold">Read-Only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === "rules-terms" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <LockIcon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">4. Operating Rules, Terms of Service &amp; Licensing</h2>
                    <p className="text-xs text-muted-foreground">Legal usage terms, software ownership, and privacy policy.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <CheckCircle2Icon className="size-4 text-primary" />
                      Proprietary Software License Grant
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      This software suite is a proprietary enterprise solution custom built for <strong className="text-foreground">Al Khaleej Lubricants LLC</strong>. All rights, title, and intellectual property concerning code architecture, UI components, and backend database schema were engineered by <strong className="text-primary">Elite Dev Agency</strong> (2026).
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-foreground">Prohibited Actions &amp; Terms of Use</h4>
                    <ul className="space-y-2 text-muted-foreground list-disc ps-5 text-[11px]">
                      <li>
                        <strong className="text-foreground">No Unauthorized Resale:</strong> This software is strictly non-transferable and may not be resold, sub-licensed, or rented to third-party entities under any circumstances.
                      </li>
                      <li>
                        <strong className="text-foreground">Source Code Protection:</strong> Decompiling, reverse engineering, or publicly sharing backend API keys or source code repositories is strictly prohibited.
                      </li>
                      <li>
                        <strong className="text-foreground">Data Privacy &amp; Confidentiality:</strong> All customer khata records, textile mill contracts, pricing margins, and audit logs are strictly confidential to Al Khaleej Lubricants LLC.
                      </li>
                      <li>
                        <strong className="text-foreground">Data Backups &amp; Security:</strong> Database state is backed up automatically. Users are responsible for preserving user credentials and avoiding shared logins.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-muted/30 text-center space-y-1">
                    <p className="font-bold text-foreground text-xs">Al Khaleej Lubricants LLC © 2026</p>
                    <p className="text-[10px] text-muted-foreground">
                      Designed, Engineered &amp; Maintained by <span className="font-semibold text-primary">Elite Dev Agency</span>. All Rights Reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
