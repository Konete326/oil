import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createEmployeeApi, updateEmployeeApi, createUserApi } from "@/lib/api";

const DEPARTMENTS = ["Plant Operations", "Warehouse & Store", "Sales & Marketing", "Finance & Accounts", "General"];

export function EmployeeModal({ isOpen, onClose, editingEmployee = null, onSuccess }) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("Plant Operations");
  const [phone, setPhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [status, setStatus] = useState("Active");

  const [enableLogin, setEnableLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("cashier");

  const [loading, setLoading] = useState(false);

  const [nameValid, setNameValid] = useState(false);
  const [designationValid, setDesignationValid] = useState(false);
  const [salaryValid, setSalaryValid] = useState(false);

  const isFormValid = nameValid && designationValid && salaryValid;

  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name || "");
      setDesignation(editingEmployee.designation || "");
      setDepartment(editingEmployee.department || "Plant Operations");
      setPhone(editingEmployee.phone || "");
      setBaseSalary(String(editingEmployee.baseSalary || ""));
      setStatus(editingEmployee.status || "Active");
      setEnableLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginRole("cashier");
    } else {
      setName("");
      setDesignation("");
      setDepartment("Plant Operations");
      setPhone("");
      setBaseSalary("");
      setStatus("Active");
      setEnableLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginRole("cashier");
    }
  }, [editingEmployee, isOpen]);

  const handleNameChange = (val) => {
    setName(val);
    if (!editingEmployee && !loginEmail) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean) setLoginEmail(`${clean}@alkhaleej.com`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      if (editingEmployee) {
        await updateEmployeeApi(editingEmployee._id, {
          name: name.trim(),
          designation: designation.trim(),
          department,
          phone,
          baseSalary: Number(baseSalary),
          status,
        });
        toast.success("Employee profile updated!");
      } else {
        await createEmployeeApi({
          name: name.trim(),
          designation: designation.trim(),
          department,
          phone,
          baseSalary: Number(baseSalary),
          status,
        });

        if (enableLogin && loginEmail && loginPassword) {
          try {
            await createUserApi({
              name: name.trim(),
              email: loginEmail.trim().toLowerCase(),
              password: loginPassword,
              role: loginRole,
              status: "active",
            });
            toast.success(`Software login account created for ${name}! (Role: ${loginRole.toUpperCase()})`);
          } catch (loginErr) {
            toast.warning(`Employee saved, but login creation had issue: ${loginErr.message}`);
          }
        }
        toast.success("New employee profile created!");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save employee profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {editingEmployee ? "Edit Employee Profile" : "Add New Employee & Staff Login"}
            </h2>
            <p className="text-[11px] text-muted-foreground">Staff member details, salary, and optional software access credentials.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <ValidatedInput
            label="Full Name"
            rule="name"
            required
            placeholder="e.g. Kashif Mahmood"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onValidationChange={setNameValid}
          />

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Designation"
              rule="text"
              required
              placeholder="e.g. Cashier / Munshi"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              onValidationChange={setDesignationValid}
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Phone Number"
              rule="phone"
              required={false}
              placeholder="0300-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <ValidatedInput
              label="Base Salary (PKR)"
              rule="amount"
              required
              type="number"
              placeholder="35000"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              onValidationChange={setSalaryValid}
              className="font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground">Employment Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              <option value="Active">Active Employee</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Terminated / Inactive</option>
            </select>
          </div>

          {!editingEmployee && (
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3 pt-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableLogin}
                  onChange={(e) => setEnableLogin(e.target.checked)}
                  className="size-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3.5 text-primary" />
                  <span>Grant Software Login Access (Cashier / Staff Account)</span>
                </span>
              </label>

              {enableLogin && (
                <div className="space-y-2.5 pt-1 animate-in fade-in-50">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Login Email / ID</label>
                      <input
                        type="email"
                        required={enableLogin}
                        placeholder="cashier@alkhaleej.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Login PIN / Password</label>
                      <input
                        type="password"
                        required={enableLogin}
                        placeholder="e.g. 123456"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">System Role & Access Level</label>
                    <select
                      value={loginRole}
                      onChange={(e) => setLoginRole(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground cursor-pointer"
                    >
                      <option value="cashier">Cashier (POS Counter & Daily Sales Only)</option>
                      <option value="manager">Manager (Inventory, Khatas, POS & Reports)</option>
                      <option value="admin">Administrator (Full Unrestricted Access)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isFormValid || loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer text-xs font-semibold"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="size-3.5" />
                  <span>{editingEmployee ? "Update Employee" : "Create Profile & Login"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
