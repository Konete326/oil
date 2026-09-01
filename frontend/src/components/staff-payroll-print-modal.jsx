import { createPortal } from "react-dom";
import { XIcon, PrinterIcon, FileSpreadsheetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import printLogoImg from "@/assets/print_logo.png";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";
import { COMPANY_CONFIG } from "@/lib/company-config";

export function StaffPayrollPrintModal({
  isOpen,
  onClose,
  activeTab = "employees",
  employees = [],
  salaryVouchers = [],
}) {
  if (!isOpen || typeof window === "undefined") return null;

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalBaseSalary = employees.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0);
  const totalAdvance = employees.reduce((sum, e) => sum + (Number(e.advanceBalance) || 0), 0);

  const totalPayrollBase = salaryVouchers.reduce((sum, v) => sum + (Number(v.baseSalary) || 0), 0);
  const totalPayrollBonus = salaryVouchers.reduce((sum, v) => sum + (Number(v.bonus) || 0), 0);
  const totalPayrollDeducted = salaryVouchers.reduce((sum, v) => sum + (Number(v.advanceDeducted) || 0), 0);
  const totalPayrollNet = salaryVouchers.reduce((sum, v) => sum + (Number(v.netSalaryPaid) || 0), 0);

  const handlePrint = () => {
    const orig = document.title;
    document.title = `Al_Khaleej_Staff_Payroll_Statement_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    const restore = () => {
      document.title = orig;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  const handleExportExcel = () => {
    if (activeTab === "payroll") {
      const data = salaryVouchers.map((v, idx) => ({
        "S.No": idx + 1,
        "Voucher No": v.voucherNumber,
        Date: new Date(v.paymentDate).toLocaleDateString(),
        Employee: v.employeeName,
        "Salary Month": v.monthYear,
        "Base Salary (PKR)": v.baseSalary,
        "Bonus (PKR)": v.bonus,
        "Advance Deducted (PKR)": v.advanceDeducted,
        "Net Paid (PKR)": v.netSalaryPaid,
        "Payment Mode": v.paymentMode,
      }));
      exportTransactionsToExcel(data, "Monthly_Salary_Vouchers.xlsx");
    } else {
      const data = employees.map((e, idx) => ({
        "S.No": idx + 1,
        Name: e.name,
        Designation: e.designation,
        Department: e.department,
        Phone: e.phone || "-",
        "Base Salary (PKR)": e.baseSalary,
        "Outstanding Advance (PKR)": e.advanceBalance,
        Status: e.status,
      }));
      exportTransactionsToExcel(data, "Employee_Directory.xlsx");
    }
  };

  const modalContent = (
    <div className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 6mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-portal {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .a4-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>

      <div className="a4-sheet relative w-full max-w-[820px] max-h-[90vh] bg-white text-black rounded-2xl shadow-2xl overflow-hidden flex flex-col print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:w-full print:m-0 print:border-none">
        <div className="flex items-center justify-between p-3.5 border-b border-gray-200 bg-gray-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <PrinterIcon className="size-4 text-gray-700" />
            <h3 className="font-bold text-xs text-gray-800">
              {activeTab === "payroll" ? "Monthly Payroll Statement" : "Staff Directory & Salary Statement"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
            >
              <FileSpreadsheetIcon className="size-3.5" />
              <span>Export Excel</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs bg-black text-white hover:bg-gray-800 cursor-pointer"
            >
              <PrinterIcon className="size-3.5" />
              <span>Print A4</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="h-8 w-8 text-gray-500 hover:text-black cursor-pointer"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 print:p-0 print:overflow-visible text-[11px] leading-relaxed">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-3">
              <img
                src={printLogoImg}
                alt="Al Khaleej Oil"
                className="h-12 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-base font-black uppercase tracking-wider text-black">
                  {COMPANY_CONFIG.name}
                </h1>
                <p className="text-[10px] text-gray-600 font-medium">
                  {COMPANY_CONFIG.tagline}
                </p>
                <p className="text-[9.5px] text-gray-500">
                  {COMPANY_CONFIG.address} | Ph: {COMPANY_CONFIG.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-black text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider mb-1">
                {activeTab === "payroll" ? "Payroll Register" : "Staff Directory"}
              </span>
              <p className="text-[10px] font-mono text-gray-600">Date: {currentDate}</p>
            </div>
          </div>

          {activeTab === "payroll" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 font-mono text-[10.5px]">
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Total Base Salary:</span>
                  <span className="font-bold text-black">Rs. {totalPayrollBase.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Total Bonus:</span>
                  <span className="font-bold text-emerald-700">+Rs. {totalPayrollBonus.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Total Deductions:</span>
                  <span className="font-bold text-amber-700">-Rs. {totalPayrollDeducted.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Net Paid Out:</span>
                  <span className="font-bold text-black">Rs. {totalPayrollNet.toLocaleString()}</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-y-2 border-black bg-gray-100 font-bold uppercase text-[9.5px]">
                    <th className="p-1.5 ps-2">Date</th>
                    <th className="p-1.5">Voucher #</th>
                    <th className="p-1.5">Employee Name</th>
                    <th className="p-1.5">Month</th>
                    <th className="p-1.5 text-right">Base (PKR)</th>
                    <th className="p-1.5 text-right">Bonus</th>
                    <th className="p-1.5 text-right">Advance Ded.</th>
                    <th className="p-1.5 pe-2 text-right">Net Paid (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salaryVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500 italic">
                        No salary vouchers recorded.
                      </td>
                    </tr>
                  ) : (
                    salaryVouchers.map((v) => (
                      <tr key={v._id} className="hover:bg-gray-50">
                        <td className="p-1.5 ps-2 font-mono text-gray-600">
                          {new Date(v.paymentDate).toLocaleDateString("en-GB")}
                        </td>
                        <td className="p-1.5 font-mono font-semibold">{v.voucherNumber}</td>
                        <td className="p-1.5 font-bold text-black">{v.employeeName}</td>
                        <td className="p-1.5">{v.monthYear}</td>
                        <td className="p-1.5 text-right font-mono">{Number(v.baseSalary || 0).toLocaleString()}</td>
                        <td className="p-1.5 text-right font-mono text-emerald-700">
                          {v.bonus > 0 ? `+${Number(v.bonus).toLocaleString()}` : "-"}
                        </td>
                        <td className="p-1.5 text-right font-mono text-amber-700">
                          {v.advanceDeducted > 0 ? `-${Number(v.advanceDeducted).toLocaleString()}` : "-"}
                        </td>
                        <td className="p-1.5 pe-2 text-right font-mono font-bold text-black">
                          Rs. {Number(v.netSalaryPaid || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-bold bg-gray-100 font-mono text-[10.5px]">
                    <td colSpan={4} className="p-1.5 ps-2 font-sans uppercase">Total Payroll</td>
                    <td className="p-1.5 text-right">Rs. {totalPayrollBase.toLocaleString()}</td>
                    <td className="p-1.5 text-right text-emerald-700">Rs. {totalPayrollBonus.toLocaleString()}</td>
                    <td className="p-1.5 text-right text-amber-700">Rs. {totalPayrollDeducted.toLocaleString()}</td>
                    <td className="p-1.5 pe-2 text-right text-black">Rs. {totalPayrollNet.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 font-mono text-[10.5px]">
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Total Registered Staff:</span>
                  <span className="font-bold text-black">{employees.length} Members</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Total Monthly Payroll:</span>
                  <span className="font-bold text-black">Rs. {totalBaseSalary.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[9.5px] block font-sans">Total Outstanding Advance:</span>
                  <span className="font-bold text-amber-700">Rs. {totalAdvance.toLocaleString()}</span>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-y-2 border-black bg-gray-100 font-bold uppercase text-[9.5px]">
                    <th className="p-1.5 ps-2">Sr #</th>
                    <th className="p-1.5">Staff Name</th>
                    <th className="p-1.5">Designation</th>
                    <th className="p-1.5">Department</th>
                    <th className="p-1.5">Phone #</th>
                    <th className="p-1.5 text-right">Monthly Base (PKR)</th>
                    <th className="p-1.5 text-right">Advance Balance (PKR)</th>
                    <th className="p-1.5 pe-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500 italic">
                        No staff profiles recorded.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, idx) => (
                      <tr key={emp._id || idx} className="hover:bg-gray-50">
                        <td className="p-1.5 ps-2 font-mono text-gray-500">{idx + 1}</td>
                        <td className="p-1.5 font-bold text-black">{emp.name}</td>
                        <td className="p-1.5 text-gray-700">{emp.designation}</td>
                        <td className="p-1.5 text-gray-600">{emp.department}</td>
                        <td className="p-1.5 font-mono text-gray-600">{emp.phone || "-"}</td>
                        <td className="p-1.5 text-right font-mono font-bold text-black">
                          Rs. {Number(emp.baseSalary || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-amber-700">
                          Rs. {Number(emp.advanceBalance || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 pe-2 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border border-gray-300 uppercase">
                            {emp.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-bold bg-gray-100 font-mono text-[10.5px]">
                    <td colSpan={5} className="p-1.5 ps-2 font-sans uppercase">Total Summary</td>
                    <td className="p-1.5 text-right text-black">Rs. {totalBaseSalary.toLocaleString()}</td>
                    <td className="p-1.5 text-right text-amber-700">Rs. {totalAdvance.toLocaleString()}</td>
                    <td className="p-1.5 pe-2 text-center">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-4">
              <p className="font-semibold text-[10.5px]">Prepared by:</p>
              <div className="pt-3 border-t border-black w-3/4">
                <p className="font-bold uppercase text-[10.5px]">AL KHALEEJ ACCOUNTS</p>
                <p className="text-[9.5px] text-gray-600">Payroll Officer</p>
              </div>
            </div>

            <div className="space-y-4 text-right flex flex-col items-end">
              <p className="font-semibold text-[10.5px]">Approved by:</p>
              <div className="pt-3 border-t border-black w-3/4 text-right">
                <p className="font-bold uppercase text-[10.5px]">MANAGEMENT</p>
                <p className="text-[9.5px] text-gray-600">Authorized Signature</p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 text-center text-[8.5px] text-gray-500 font-mono tracking-wider border-t border-gray-200">
            Print by elitedevagency.com
          </div>
        </div>

        <div className="w-full flex items-center justify-end gap-2 p-3 border-t border-gray-200 bg-gray-50 print:hidden shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close Preview
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="cursor-pointer text-xs gap-1.5 bg-black text-white hover:bg-gray-800"
          >
            <PrinterIcon className="size-3.5" />
            <span>Print A4 Statement</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
