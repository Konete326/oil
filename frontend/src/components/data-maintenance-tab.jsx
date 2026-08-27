import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Trash2,
  ShieldAlert,
  Boxes,
  ShoppingCart,
  BookOpen,
  Banknote,
  Receipt,
  UserCheck,
  Factory,
} from "lucide-react";

export function DataMaintenanceTab({ isAdmin, triggerEraseAllModal, triggerEraseModuleModal }) {
  const MODULES = [
    {
      key: "products",
      name: "Inventory & Stock",
      desc: "All products & categories",
      icon: <Boxes className="size-4 text-amber-500" />,
      btnLabel: "Erase Stock",
    },
    {
      key: "sales",
      name: "POS Sales & Delivery",
      desc: "POS counter & delivery challans",
      icon: <ShoppingCart className="size-4 text-emerald-500" />,
      btnLabel: "Erase Sales",
    },
    {
      key: "ledgers",
      name: "Khatas & Ledgers",
      desc: "Customer & supplier khatas",
      icon: <BookOpen className="size-4 text-blue-500" />,
      btnLabel: "Erase Ledgers",
    },
    {
      key: "cash",
      name: "Cash Register",
      desc: "Cash in/out transactions",
      icon: <Banknote className="size-4 text-cyan-500" />,
      btnLabel: "Erase Cash",
    },
    {
      key: "expenses",
      name: "Expense Vouchers",
      desc: "Operating expense logs",
      icon: <Receipt className="size-4 text-purple-500" />,
      btnLabel: "Erase Expenses",
    },
    {
      key: "payroll",
      name: "Employee Payroll",
      desc: "Staff salary & advance history",
      icon: <UserCheck className="size-4 text-indigo-500" />,
      btnLabel: "Erase Payroll",
    },
    {
      key: "textile",
      name: "Textile Mills",
      desc: "Textile mill profiles & rates",
      icon: <Factory className="size-4 text-teal-500" />,
      btnLabel: "Erase Mills",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
            <ShieldAlert className="size-4.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-rose-500 flex items-center gap-1.5">
              <span>Full System Data Erasure</span>
              <Badge variant="outline" className="text-[9px] text-rose-400 border-rose-500/30 py-0 font-normal">
                Dangerous
              </Badge>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Permanently wipes all product inventory, sales, ledgers, and transactions. Admin user login is preserved.
            </p>
          </div>
        </div>

        {isAdmin ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={triggerEraseAllModal}
            className="cursor-pointer gap-1.5 font-semibold text-xs h-7.5 px-3 shrink-0"
          >
            <Trash2 className="size-3.5" />
            <span>Erase All Data</span>
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">Admin Only</Badge>
        )}
      </div>

      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="p-3 sm:p-3.5 border-b border-border/40 space-y-0.5">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
            <Database className="size-4 text-primary" />
            <span>Selective Module Data Erasure</span>
          </CardTitle>
          <CardDescription className="text-[10px]">
            Selectively purge specific module records from database with Super Admin password authentication.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {MODULES.map((mod) => (
              <div
                key={mod.key}
                className="p-2.5 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-background border border-border/50 shrink-0 mt-0.5">
                    {mod.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">{mod.name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{mod.desc}</p>
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerEraseModuleModal(mod.key, mod.name)}
                    className="w-full h-6.5 text-[11px] cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>{mod.btnLabel}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
