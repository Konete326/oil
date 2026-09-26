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
  UserCheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeModal } from "@/components/employee-modal";
import { AdvanceModal } from "@/components/advance-modal";
import { EmployeeAdvanceLedgerView } from "@/components/employee-advance-ledger-view";
import { PaginationControl } from "@/components/pagination-control";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  fetchEmployeesApi,
  deleteEmployeeApi,
} from "@/lib/api";
import { exportTransactionsToExcel } from "@/lib/cash-export-utils";

export function EmployeePayrollManager() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [empPage, setEmpPage] = useState(1);
  const [empPages, setEmpPages] = useState(1);
  const [empTotal, setEmpTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedEmpForAdvance, setSelectedEmpForAdvance] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchEmployeesApi({ search, page: empPage, limit: 10 });
      if (res?.success) {
        setEmployees(res.data);
        setEmpPage(res.page || 1);
        setEmpPages(res.pages || 1);
        setEmpTotal(res.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, search, empPage]);

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
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
    const data = employees.map((e, idx) => ({
      "S.No": idx + 1,
      Name: e.name,
      Designation: e.designation,
      Phone: e.phone || "-",
      "Base Salary (PKR)": e.baseSalary,
      "Outstanding Advance (PKR)": e.advanceBalance,
      Status: e.status,
    }));
    exportTransactionsToExcel(data, "Employee_Directory.xlsx");
    toast.success("Payroll data exported to Excel!");
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Directory & Advance Khata</h1>
          <p className="text-xs text-muted-foreground">Manage staff profiles, base salary details, and staff advance cash khata.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAdvanceModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 cursor-pointer text-xs flex-1 sm:flex-none"
          >
            <HandCoinsIcon className="size-3.5" />
            <span>Record Advance Cash</span>
          </Button>

          <Button size="sm" onClick={handleOpenAddEmployee} className="gap-1.5 cursor-pointer text-xs flex-1 sm:flex-none">
            <PlusIcon className="size-3.5" />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Monthly Base Payroll</span>
          <div className="text-xl font-bold font-mono text-emerald-500">
            Rs. {totalMonthlyBaseSalary.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Combined Active Base Salaries</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Outstanding Advance Khata</span>
          <div className="text-xl font-bold font-mono text-amber-500">
            Rs. {totalOutstandingAdvance.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Pending Advance Deductions Owed</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Registered Staff</span>
          <div className="text-xl font-bold font-mono text-foreground">
            {empTotal || employees.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Active & Inactive Employee Profiles</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/40 text-xs">
          {[
            { id: "employees", label: "Employee Directory" },
            { id: "advance", label: "Advance Salary Khata" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveTab(btn.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === btn.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search staff name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-8 text-xs"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs cursor-pointer">
            <FileSpreadsheetIcon className="size-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs cursor-pointer">
            <PrinterIcon className="size-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {activeTab === "employees" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 ps-4">Employee Name</th>
                  <th className="p-3">Designation</th>
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
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading employee directory...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
                      <td className="p-3 font-mono text-muted-foreground">{emp.phone || "-"}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-500">
                        Rs. {emp.baseSalary.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-500">
                        Rs. {(emp.advanceBalance || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            emp.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {emp.status === "Active" ? <CheckCircle2Icon className="size-3" /> : <XCircleIcon className="size-3" />}
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-3 pe-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEmployee(emp)}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit2Icon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(emp._id)}
                            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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

          <PaginationControl
            page={empPage}
            pages={empPages}
            total={empTotal}
            onPageChange={(p) => setEmpPage(p)}
          />
        </div>
      )}

      {activeTab === "advance" && (
        <EmployeeAdvanceLedgerView
          employees={employees}
          onOpenAdvanceModal={(empId) => {
            setSelectedEmpForAdvance(empId || "");
            setIsAdvanceModalOpen(true);
          }}
          onRefreshEmployees={loadData}
        />
      )}

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        editingEmployee={editingEmployee}
        onSuccess={loadData}
      />

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => {
          setIsAdvanceModalOpen(false);
          setSelectedEmpForAdvance("");
        }}
        employees={employees}
        defaultEmployeeId={selectedEmpForAdvance}
        onSuccess={loadData}
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
