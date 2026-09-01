import { useState, useEffect } from "react";
import {
  BriefcaseIcon,
  PlusIcon,
  SearchIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  HandCoinsIcon,
  ReceiptIcon,
  Trash2Icon,
  Edit2Icon,
  UsersIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeModal } from "@/components/employee-modal";
import { AdvanceModal } from "@/components/advance-modal";
import { AdvanceReceiptModal } from "@/components/advance-receipt-modal";
import { AdvanceHistoryTable } from "@/components/advance-history-table";
import { PayslipModal } from "@/components/payslip-modal";
import { UserModal } from "@/components/user-modal";
import { StaffPayrollPrintModal } from "@/components/staff-payroll-print-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ConfirmModal } from "@/components/confirm-modal";
import { UserManagementManager } from "@/components/user-management-manager";
import {
  fetchEmployeesApi,
  deleteEmployeeApi,
  fetchSalaryVouchersApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

const PAGE_SIZE = 4;

export function EmployeePayrollManager() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [empPage, setEmpPage] = useState(1);
  const [empPages, setEmpPages] = useState(1);
  const [empTotal, setEmpTotal] = useState(0);

  const [salaryVouchers, setSalaryVouchers] = useState([]);
  const [salPage, setSalPage] = useState(1);
  const [salPages, setSalPages] = useState(1);
  const [salTotal, setSalTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedAdvanceEmpId, setSelectedAdvanceEmpId] = useState("");
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedPayslipEmpId, setSelectedPayslipEmpId] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [targetStaffForLogin, setTargetStaffForLogin] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [isAdvanceReceiptOpen, setIsAdvanceReceiptOpen] = useState(false);
  const [advanceRefreshKey, setAdvanceRefreshKey] = useState(0);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "employees") {
        const res = await fetchEmployeesApi({ search, page: empPage, limit: PAGE_SIZE });
        if (res?.success) {
          setEmployees(res.data);
          setEmpPage(res.page || 1);
          setEmpPages(res.pages || 1);
          setEmpTotal(res.total || 0);
        }
      } else if (activeTab === "payroll") {
        const res = await fetchSalaryVouchersApi({ page: salPage, limit: PAGE_SIZE });
        if (res?.success) {
          setSalaryVouchers(res.data);
          setSalPage(res.page || 1);
          setSalPages(res.pages || 1);
          setSalTotal(res.total || 0);
        }
      }
    } catch (err) {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, search, empPage, salPage]);

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenAdvance = (empId = "") => {
    setSelectedAdvanceEmpId(empId);
    setIsAdvanceModalOpen(true);
  };

  const handleOpenPayslip = (empId = "") => {
    setSelectedPayslipEmpId(empId);
    setIsPayslipModalOpen(true);
  };

  const handleGrantSoftwareAccess = (emp) => {
    const cleanName = (emp.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "");
    setTargetStaffForLogin({
      name: emp.name,
      email: `${cleanName}@alkhaleej.com`,
      role: "cashier",
      permissions: ["pos", "cash", "ledger"],
      status: "Active",
    });
    setIsUserModalOpen(true);
  };

  const handleAdvanceSuccess = ({ employeeId, amount, updatedEmployee, voucher }) => {
    if (employeeId && amount) {
      setEmployees((prev) =>
        prev.map((emp) => {
          const id = emp._id || emp.id;
          if (id === employeeId) {
            return {
              ...emp,
              advanceBalance: (emp.advanceBalance || 0) + Number(amount),
            };
          }
          return emp;
        })
      );
    }
    setAdvanceRefreshKey((k) => k + 1);

    if (voucher) {
      setCurrentVoucher(voucher);
      setIsAdvanceReceiptOpen(true);
    }

    loadData();
  };

  const handlePrintVoucher = (voucher) => {
    const matchedEmp = employees.find((e) => e.name.toLowerCase() === (voucher.employeeName || "").toLowerCase());
    const fullVoucher = {
      ...voucher,
      designation: matchedEmp?.designation || "Staff Member",
      department: matchedEmp?.department || "General",
      phone: matchedEmp?.phone || "",
      newAdvanceBalance: matchedEmp ? matchedEmp.advanceBalance : voucher.amount,
    };
    setCurrentVoucher(fullVoucher);
    setIsAdvanceReceiptOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!deletingId) return;
    try {
      setDeleteLoading(true);
      await deleteEmployeeApi(deletingId);
      toast.success("Employee profile deleted!");
      setDeletingId(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete employee");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalMonthlyBaseSalary = employees.reduce((sum, e) => sum + (e.baseSalary || 0), 0);
  const totalOutstandingAdvance = employees.reduce((sum, e) => sum + (e.advanceBalance || 0), 0);

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
        "Other Deductions (PKR)": v.otherDeductions,
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
    toast.success("Payroll data exported to Excel!");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8.5 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BriefcaseIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-none">
              Employee Payroll & Staff Management
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 overflow-x-auto min-w-0">
          {[
            { id: "employees", label: "Staff Directory", icon: UsersIcon },
            { id: "advance", label: "Advance Khata", icon: HandCoinsIcon },
            { id: "payroll", label: "Monthly Payslips", icon: ReceiptIcon },
            { id: "users", label: "Staff Logins", icon: ShieldCheckIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Monthly Payroll</span>
          <div className="text-xl font-bold font-mono text-emerald-500">
            Rs. {totalMonthlyBaseSalary.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Active Staff Salaries</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Advance Khata</span>
          <div className="text-xl font-bold font-mono text-amber-500">
            Rs. {totalOutstandingAdvance.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Pending Advance Deductions</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Registered Staff</span>
          <div className="text-xl font-bold font-mono text-foreground">
            {empTotal || employees.length} Members
          </div>
          <p className="text-[11px] text-muted-foreground">Active Profiles</p>
        </div>
      </div>

      {activeTab === "employees" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-3 rounded-xl border border-border">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search staff name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-8 text-xs h-8.5"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenAddEmployee}
                className="h-8.5 text-xs gap-1.5 cursor-pointer"
              >
                <PlusIcon className="size-3.5" />
                <span>Add Employee</span>
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleExportExcel}
                className="size-8.5 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer shrink-0"
                title="Export to Excel"
              >
                <FileSpreadsheetIcon className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setIsPrintModalOpen(true)}
                className="size-8.5 text-primary hover:bg-primary/10 cursor-pointer shrink-0"
                title="Print Statement"
              >
                <PrinterIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 ps-4">Employee Name</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Monthly Base Salary (PKR)</th>
                    <th className="p-3 text-right">Outstanding Advance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pe-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Loading employee directory...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No employee profiles found.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 ps-4 font-semibold text-foreground flex items-center gap-2">
                          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{emp.name}</span>
                        </td>
                        <td className="p-3 font-medium text-foreground">{emp.designation}</td>
                        <td className="p-3 text-muted-foreground">{emp.department}</td>
                        <td className="p-3 font-mono text-muted-foreground">{emp.phone || "-"}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-500">
                          Rs. {emp.baseSalary.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-500">
                          Rs. {(emp.advanceBalance || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              emp.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-2.5 pe-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPayslip(emp._id || emp.id)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title="Generate Monthly Payslip for this Staff"
                            >
                              <ReceiptIcon className="size-3" />
                              <span>Pay</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAdvance(emp._id || emp.id)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title="Give Cash Advance to this Staff"
                            >
                              <HandCoinsIcon className="size-3" />
                              <span>Advance</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGrantSoftwareAccess(emp)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title="Grant Software Access & Permissions for this Staff"
                            >
                              <ShieldCheckIcon className="size-3" />
                              <span>Access</span>
                            </button>

                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleEditEmployee(emp)}
                              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit Employee Profile"
                            >
                              <Edit2Icon className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setDeletingId(emp._id)}
                              className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                              title="Delete Profile"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {empTotal > PAGE_SIZE && (
              <div className="p-2.5 border-t border-border bg-muted/20">
                <PaginationBar
                  currentPage={empPage}
                  totalPages={empPages}
                  onPageChange={setEmpPage}
                  totalItems={empTotal}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "advance" && (
        <AdvanceHistoryTable
          onPrintVoucher={handlePrintVoucher}
          onOpenAdvance={handleOpenAdvance}
          refreshTrigger={advanceRefreshKey}
        />
      )}

      {activeTab === "payroll" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-3 rounded-xl border border-border">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-foreground">Monthly Salary Vouchers Register</h3>
              <p className="text-[11px] text-muted-foreground">Historical records of all disbursed monthly payslips.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsPayslipModalOpen(true)}
                className="h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
              >
                <ReceiptIcon className="size-3.5" />
                <span>Generate Payslip</span>
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleExportExcel}
                className="size-8.5 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer shrink-0"
                title="Export to Excel"
              >
                <FileSpreadsheetIcon className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setIsPrintModalOpen(true)}
                className="size-8.5 text-primary hover:bg-primary/10 cursor-pointer shrink-0"
                title="Print Statement"
              >
                <PrinterIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 ps-4">Date</th>
                    <th className="p-3">Voucher No</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Salary Month</th>
                    <th className="p-3 text-right">Base Salary (PKR)</th>
                    <th className="p-3 text-right">Bonus (PKR)</th>
                    <th className="p-3 text-right">Advance Deducted</th>
                    <th className="p-3 text-right">Net Paid (PKR)</th>
                    <th className="p-3 pe-4">Payment Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Loading salary vouchers...
                      </td>
                    </tr>
                  ) : salaryVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No monthly salary vouchers recorded yet.
                      </td>
                    </tr>
                  ) : (
                    salaryVouchers.map((v) => (
                      <tr key={v._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 ps-4 text-muted-foreground text-[11px]">
                          {new Date(v.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{v.voucherNumber}</td>
                        <td className="p-3 font-semibold text-foreground">{v.employeeName}</td>
                        <td className="p-3 font-medium text-foreground">{v.monthYear}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">
                          Rs. {v.baseSalary.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-500">
                          {v.bonus > 0 ? `+Rs. ${v.bonus.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-amber-500">
                          {v.advanceDeducted > 0 ? `-Rs. ${v.advanceDeducted.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-primary">
                          Rs. {v.netSalaryPaid.toLocaleString()}
                        </td>
                        <td className="p-3 pe-4 text-muted-foreground">{v.paymentMode || "Cash"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {salTotal > PAGE_SIZE && (
              <div className="p-2.5 border-t border-border bg-muted/20">
                <PaginationBar
                  currentPage={salPage}
                  totalPages={salPages}
                  onPageChange={setSalPage}
                  totalItems={salTotal}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <UserManagementManager />
      )}

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        editingEmployee={editingEmployee}
        onSuccess={loadData}
      />

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        employees={employees}
        preselectedEmployeeId={selectedAdvanceEmpId}
        onSuccess={handleAdvanceSuccess}
      />

      <AdvanceReceiptModal
        isOpen={isAdvanceReceiptOpen}
        onClose={() => setIsAdvanceReceiptOpen(false)}
        voucher={currentVoucher}
      />

      <PayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        employees={employees}
        preselectedEmployeeId={selectedPayslipEmpId}
        onSuccess={loadData}
      />

      <StaffPayrollPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={activeTab}
        employees={employees}
        salaryVouchers={salaryVouchers}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        editingUser={targetStaffForLogin}
        onSuccess={() => {
          loadData();
          toast.success("Staff software login & access permissions configured!");
        }}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteEmployee}
        loading={deleteLoading}
        title="Delete Employee Profile"
        message="Are you sure you want to delete this employee profile? This action cannot be undone."
      />
    </div>
  );
}
