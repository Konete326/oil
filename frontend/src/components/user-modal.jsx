import { useState, useEffect } from "react";
import { XIcon, PlusIcon, ShieldCheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserApi, updateUserPermissionsApi } from "@/lib/api";

const ALL_AVAILABLE_PERMISSIONS = [
  { id: "all", label: "Full System Access (All Features)" },
  { id: "pos", label: "POS Counter & Sales" },
  { id: "categories", label: "Categories Management" },
  { id: "products", label: "Products & Stock Management" },
  { id: "decanting", label: "Drum Decanting" },
  { id: "textile", label: "Textile Mills & DC" },
  { id: "ledger", label: "Customer Ledger & Khata" },
  { id: "cash", label: "Cash Transactions (Paid/Received)" },
  { id: "sales-purchases", label: "Sales & Purchase Reports" },
  { id: "profit-loss", label: "Profit & Loss Calculator" },
  { id: "supplier-ledger", label: "Supplier / Refinery Ledger" },
  { id: "financial-reports", label: "Trial Balance & Financial Reports" },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a user name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (!editingUser && !password) {
      toast.error("Please provide a password for new user");
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {editingUser ? "Edit User & Permissions" : "Create New User Account"}
            </h2>
            <p className="text-xs text-muted-foreground">Assign role and specific feature access permissions.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Full Name *</label>
              <Input
                type="text"
                placeholder="e.g. Asif Khan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Email Address *</label>
              <Input
                type="email"
                placeholder="user@alkhaleej.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
                disabled={!!editingUser}
                required
              />
            </div>
          </div>

          {!editingUser && (
            <div className="space-y-1">
              <label className="font-medium text-foreground">Password *</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground">User Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
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
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheckIcon className="size-4 text-primary" />
                <span>Feature Access Permissions</span>
              </label>
              <span className="text-[10px] text-muted-foreground">Select granted modules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-border/60 rounded-lg bg-muted/20">
              {ALL_AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes("all") || selectedPermissions.includes(perm.id);
                return (
                  <label key={perm.id} className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer p-1 rounded hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePermissionToggle(perm.id)}
                      className="size-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5 cursor-pointer">
              {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlusIcon className="size-3.5" />}
              <span>{editingUser ? "Save Permissions" : "Create User Account"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
