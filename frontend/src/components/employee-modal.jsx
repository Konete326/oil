import { useState, useEffect } from "react";
import { XIcon, PlusIcon, Loader2Icon, UserIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createEmployeeApi, updateEmployeeApi } from "@/lib/api";

const DEPARTMENTS = [
  "Plant Operations",
  "Warehouse & Store",
  "Sales & Marketing",
  "Finance & Accounts",
  "General",
];

export function EmployeeModal({ isOpen, onClose, editingEmployee = null, onSuccess }) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("Plant Operations");
  const [phone, setPhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);

  const [nameValid, setNameValid] = useState(false);
  const [designationValid, setDesignationValid] = useState(true);
  const [salaryValid, setSalaryValid] = useState(false);

  const isFormValid = nameValid && salaryValid;

  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name || "");
      setDesignation(editingEmployee.designation || "");
      setDepartment(editingEmployee.department || "Plant Operations");
      setPhone(editingEmployee.phone || "");
      setBaseSalary(String(editingEmployee.baseSalary || ""));
      setStatus(editingEmployee.status || "Active");
    } else {
      setName("");
      setDesignation("");
      setDepartment("Plant Operations");
      setPhone("");
      setBaseSalary("");
      setStatus("Active");
    }
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      if (editingEmployee) {
        await updateEmployeeApi(editingEmployee._id, {
          name: name.trim(),
          designation: designation.trim() || "Staff Member",
          department,
          phone,
          baseSalary: Number(baseSalary),
          status,
        });
        toast.success("Employee profile updated successfully!");
      } else {
        await createEmployeeApi({
          name: name.trim(),
          designation: designation.trim() || "Staff Member",
          department,
          phone,
          baseSalary: Number(baseSalary),
          status,
        });
        toast.success("New employee profile created successfully!");
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
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <UserIcon className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {editingEmployee ? "Edit Employee Profile" : "Add New Employee Profile"}
              </h2>
              <p className="text-[11px] text-muted-foreground">Staff member details, department, and monthly base salary.</p>
            </div>
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
            onChange={(e) => setName(e.target.value)}
            onValidationChange={setNameValid}
          />

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="Designation (Optional)"
              rule="text"
              required={false}
              placeholder="e.g. Staff / Munshi"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              onValidationChange={setDesignationValid}
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
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
              label="Phone Number (Optional)"
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
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              <option value="Active">Active Employee</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Terminated / Inactive</option>
            </select>
          </div>

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
                  <CheckCircle2Icon className="size-3.5" />
                  <span>{editingEmployee ? "Update Employee" : "Save Employee"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
