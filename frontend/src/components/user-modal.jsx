import { useState, useEffect } from "react";
import { XIcon, PlusIcon, ShieldCheckIcon, Loader2Icon, UserIcon, CheckSquareIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createUserApi, updateUserPermissionsApi } from "@/lib/api";

const ALL_AVAILABLE_PERMISSIONS = [
  { id: "all", label: "Full System Access (All Modules)" },
  { id: "pos", label: "POS Counter & Sales" },
  { id: "products", label: "Products & Stock Inventory" },
  { id: "categories", label: "Categories Management" },
  { id: "textile", label: "Textile Mills & DC Gate Pass" },
  { id: "ledger", label: "Customer Ledger & Khata" },
  { id: "cash", label: "Cash Transactions Register" },
  { id: "sales-purchases", label: "Sales & Purchase Reports" },
  { id: "profit-loss", label: "Profit & Loss Calculator" },
  { id: "supplier-ledger", label: "Supplier / Refinery Ledger" },
  { id: "financial-reports", label: "Trial Balance & Reports" },
  { id: "user-management", label: "User Management & Roles" },
  { id: "audit-trail", label: "Activity Audit Logs" },
];

export function UserModal({ isOpen, onClose, editingUser = null, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [status, setStatus] = useState("Active");
  const [selectedPermissions, setSelectedPermissions] = useState(["pos", "cash", "ledger"]);
  const [loading, setLoading] = useState(false);

  const [nameValid, setNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  const isFormValid = nameValid && (editingUser || emailValid) && (editingUser || passwordValid);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "");
      setEmail(editingUser.email || "");
      setPassword("");
      setRole(editingUser.role || "manager");
      setStatus(editingUser.status || "Active");
      setSelectedPermissions(editingUser.permissions || ["all"]);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("manager");
      setStatus("Active");
      setSelectedPermissions(["pos", "cash", "ledger"]);
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handlePermissionToggle = (pId) => {
    if (pId === "all") {
      if (selectedPermissions.includes("all")) {
        setSelectedPermissions([]);
      } else {
        setSelectedPermissions(["all"]);
      }
      return;
    }

    let updated = selectedPermissions.filter((p) => p !== "all");
    if (updated.includes(pId)) {
      updated = updated.filter((p) => p !== pId);
    } else {
      updated.push(pId);
    }
    setSelectedPermissions(updated);
  };

  const handleSelectAllToggle = () => {
    if (selectedPermissions.includes("all")) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(["all"]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      if (editingUser) {
        await updateUserPermissionsApi(editingUser._id, {
          name: name.trim(),
          role,
          permissions: selectedPermissions,
          status,
        });
        toast.success("User role and permissions updated!");
      } else {
        await createUserApi({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          permissions: selectedPermissions,
          status,
        });
        toast.success("New user account created successfully!");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {editingUser ? "Edit User Account & Permissions" : "Create New User Account"}
              </h2>
              <p className="text-[11px] text-muted-foreground">Configure profile credentials and accessible ERP modules.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="cursor-pointer size-7 rounded-lg">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-6 space-y-3">
              <div className="font-semibold text-foreground flex items-center gap-1.5 pb-1 border-b border-border/60">
                <UserIcon className="size-3.5 text-primary" />
                <span>Account Credentials & Role</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <ValidatedInput
                  label="Full Name"
                  rule="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onValidationChange={setNameValid}
                  placeholder="e.g. Asif Khan"
                />

                <ValidatedInput
                  label="Email Address"
                  rule="email"
                  required
                  value={email}
                  disabled={!!editingUser}
                  onChange={(e) => setEmail(e.target.value)}
                  onValidationChange={setEmailValid}
                  placeholder="user@alkhaleej.com"
                />
              </div>

              {!editingUser && (
                <ValidatedInput
                  label="Password"
                  rule="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onValidationChange={setPasswordValid}
                  placeholder="••••••••"
                />
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">User Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold cursor-pointer"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium cursor-pointer"
                  >
                    <option value="Active">Active (Enabled)</option>
                    <option value="Inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3.5 text-primary" />
                  <span>Module Permissions</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllToggle}
                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer flex items-center gap-1"
                >
                  <CheckSquareIcon className="size-3" />
                  <span>{selectedPermissions.includes("all") ? "Deselect All" : "Select All"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto p-2 border border-border/60 rounded-xl bg-muted/20">
                {ALL_AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes("all") || selectedPermissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-2 text-[11px] p-1.5 rounded-lg cursor-pointer transition-colors border ${
                        isChecked
                          ? "bg-primary/10 border-primary/30 text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="size-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                      <span className="truncate">{perm.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !isFormValid} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>{editingUser ? "Save Permissions" : "Create User"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
