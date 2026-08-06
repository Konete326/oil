import { useState, useEffect } from "react";
import {
  BarChart3Icon,
  TrendingUpIcon,
  ShoppingCartIcon,
  TruckIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SalesReportView } from "@/components/sales-report-view";
import { PurchaseReportView } from "@/components/purchase-report-view";
import { PartySalesRecord } from "@/components/party-sales-record";
import { PurchaseModal } from "@/components/purchase-modal";
import {
  fetchSalesReportApi,
  fetchPurchasesApi,
  fetchPartySalesRecordApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function SalesPurchaseManager() {
  const [activeTab, setActiveTab] = useState("sales");
  const [salesPeriod, setSalesPeriod] = useState("monthly");
  const [salesData, setSalesData] = useState({ posSales: [], challans: [] });
  const [salesSummary, setSalesSummary] = useState({});
  const [purchasesData, setPurchasesData] = useState([]);
  const [purchasesTotalCost, setPurchasesTotalCost] = useState(0);
  const [partySalesData, setPartySalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "sales") {
        const res = await fetchSalesReportApi({ period: salesPeriod });
        if (res?.success) {
          setSalesData(res.data);
          setSalesSummary(res.summary);
        }
      } else if (activeTab === "purchases") {
        const res = await fetchPurchasesApi();
        if (res?.success) {
          setPurchasesData(res.data);
          setPurchasesTotalCost(res.totalCost);
        }
      } else if (activeTab === "partySales") {
        const res = await fetchPartySalesRecordApi();
        if (res?.success) {
          setPartySalesData(res.data);
        }
      }
    } catch (err) {
      toast.error("Failed to load sales and purchase data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, salesPeriod]);

  const handleExportExcel = () => {
    if (activeTab === "sales") {
      const exportList = [
        ...(salesData.posSales || []).map((s) => ({
          Date: new Date(s.createdAt).toLocaleDateString(),
          Type: "POS Counter",
          "Ref No": s.saleNumber,
          "Customer / Party": s.customerName,
          "Amount (PKR)": s.grandTotal,
          "Payment Mode": s.paymentMode,
        })),
        ...(salesData.challans || []).map((c) => ({
          Date: new Date(c.createdAt).toLocaleDateString(),
          Type: "Delivery Challan",
          "Ref No": c.challanNumber,
          "Customer / Party": c.millName,
          "Amount (PKR)": c.totalAmount,
          "Payment Mode": c.paymentStatus,
        })),
      ];
      exportTransactionsToExcel(exportList, `Sales_Report_${salesPeriod}.xlsx`);
    } else if (activeTab === "purchases") {
      const exportList = purchasesData.map((p) => ({
        Date: new Date(p.purchaseDate || p.createdAt).toLocaleDateString(),
        "Purchase #": p.purchaseNumber,
        Supplier: p.supplierName,
        Product: p.productName,
        Quantity: p.quantity,
        "Rate (PKR)": p.unitPrice,
        "Total Cost (PKR)": p.totalAmount,
        Status: p.paymentStatus,
      }));
      exportTransactionsToExcel(exportList, "Stock_Purchases_Report.xlsx");
    } else {
      exportTransactionsToExcel(partySalesData, "Party_Sales_History.xlsx");
    }
    toast.success("Excel report exported successfully!");
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales & Purchases (Khareed-o-Farokht)</h1>
          <p className="text-xs text-muted-foreground">Comprehensive Daily/Weekly/Monthly Sales, Stock Purchases, and Party-wise Sales History.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="hidden sm:flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <PrinterIcon className="size-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { id: "sales", label: "Sales Report (Farokht)" },
            { id: "purchases", label: "Stock Purchase Report (Khareedari)" },
            { id: "partySales", label: "Party-Wise Sales Record" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "sales" && (
        <SalesReportView
          period={salesPeriod}
          setPeriod={setSalesPeriod}
          salesData={salesData}
          summary={salesSummary}
          loading={loading}
        />
      )}

      {activeTab === "purchases" && (
        <PurchaseReportView
          purchases={purchasesData}
          totalCost={purchasesTotalCost}
          loading={loading}
          onOpenModal={() => setIsPurchaseModalOpen(true)}
        />
      )}

      {activeTab === "partySales" && (
        <PartySalesRecord partyRecords={partySalesData} loading={loading} />
      )}

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
