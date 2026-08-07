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
  return (
    <div className="space-y-6">
      <Card className="border-rose-500/30 bg-rose-950/10 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-rose-500">Full System Data Erasure</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Permanently wipes all product inventory, sales, ledgers, transactions, and employee vouchers.
                <span className="font-semibold text-foreground"> Admin login credentials remain preserved.</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Requires valid Administrator Password confirmation.</p>
            <p>• Cannot be undone once executed.</p>
          </div>
          {isAdmin ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={triggerEraseAllModal}
              className="cursor-pointer gap-2 font-semibold text-xs shrink-0"
            >
              <Trash2 className="size-4" /> Erase All Application Data
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">Admin Only</Badge>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="p-4 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="size-4 text-primary" /> Selective Module Data Erasure
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Selectively hard-delete specific operational module data from database with password verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <Boxes className="size-5 text-amber-500" />
              <div>
                <h4 className="text-xs font-semibold">Inventory & Stock</h4>
                <p className="text-[11px] text-muted-foreground">All products & categories</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("products", "Inventory & Stock")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Products Data
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShoppingCart className="size-5 text-emerald-500" />
              <div>
                <h4 className="text-xs font-semibold">POS Sales & Delivery</h4>
                <p className="text-[11px] text-muted-foreground">POS counter transactions & DC</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("sales", "POS Sales & Challans")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Sales Data
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="size-5 text-blue-500" />
              <div>
                <h4 className="text-xs font-semibold">Khatas & Ledgers</h4>
                <p className="text-[11px] text-muted-foreground">Customer & supplier accounts</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("ledgers", "Khatas & Ledgers")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Ledger Data
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <Banknote className="size-5 text-cyan-500" />
              <div>
                <h4 className="text-xs font-semibold">Cash Register</h4>
                <p className="text-[11px] text-muted-foreground">Cashbook in/out logs</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("cash", "Cash Register")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Cash Log
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <Receipt className="size-5 text-purple-500" />
              <div>
                <h4 className="text-xs font-semibold">Expense Vouchers</h4>
                <p className="text-[11px] text-muted-foreground">Operating expense records</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("expenses", "Expenses")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Expenses
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserCheck className="size-5 text-indigo-500" />
              <div>
                <h4 className="text-xs font-semibold">Employee Payroll</h4>
                <p className="text-[11px] text-muted-foreground">Staff profiles & salary advances</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("payroll", "Employee Payroll")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Payroll
              </Button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <Factory className="size-5 text-teal-500" />
              <div>
                <h4 className="text-xs font-semibold">Textile Mills</h4>
                <p className="text-[11px] text-muted-foreground">Textile profiles & contracts</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerEraseModuleModal("textile", "Textile Mills")}
                className="text-xs cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Erase Textile Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
