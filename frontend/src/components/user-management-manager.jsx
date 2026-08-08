import { useState, useEffect } from "react";
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  Edit2Icon,
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  LockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserModal } from "@/components/user-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { fetchUsersApi, deleteUserApi } from "@/lib/api";

const PAGE_SIZE = 10;

export function UserManagementManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currentUser = (() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchUsersApi();
      if (res?.success) setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (u) => {
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    const targetUser = users.find((u) => u._id === deletingId);
    if (targetUser && targetUser.role === "admin") {
      toast.error("Security Restriction: Admin user accounts are protected system accounts and cannot be deleted by anyone.");
      setDeletingId(null);
      return;
    }

    if (currentUser && currentUser._id === deletingId) {
      toast.error("Self-deletion is prohibited. You cannot delete your own active account.");
      setDeletingId(null);
      return;
    }

    try {
      setDeleteLoading(true);
      const res = await deleteUserApi(deletingId);
      if (res?.success) {
        toast.success("User account deleted successfully");
        setUsers((prev) => prev.filter((u) => u._id !== deletingId));
      } else {
        toast.error(res?.message || "Failed to delete user account");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete user account");
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const isCurrentUserAdmin = currentUser?.role === "admin";
  const filteredUsers = users
    .filter((u) => isCurrentUserAdmin || u.role !== "admin")
    .filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management & Permissions</h1>
          <p className="text-xs text-muted-foreground">Manage user roles, grant feature permissions, and control system access.</p>
        </div>

        <Button size="sm" onClick={handleOpenAddModal} className="gap-1.5 cursor-pointer text-xs">
          <PlusIcon className="size-3.5" />
          <span>Create New User</span>
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500 flex items-center gap-3">
        <LockIcon className="size-5 shrink-0" />
        <div>
          <strong className="font-semibold text-foreground">Admin Account Protection Active:</strong> Admin user accounts are visible only to logged-in Admins and cannot be deleted by anyone (including Admins).
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search user name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-xs"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          Total Users: <strong className="text-foreground font-mono">{filteredUsers.length}</strong>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 ps-4">User Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Permissions Summary</th>
                <th className="p-3 pe-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading users list...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((user) => {
                  const isSelf = currentUser && currentUser._id === user._id;
                  const isAdminUser = user.role === "admin";
                  const isDeleteDisabled = isSelf || isAdminUser;

                  return (
                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 ps-4 font-semibold text-foreground flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{user.name}</span>
                          {isSelf && (
                            <span className="ms-1.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-primary/20 text-primary">
                              (You)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isAdminUser
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            user.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {user.status === "Active" ? <CheckCircle2Icon className="size-3" /> : <XCircleIcon className="size-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-muted-foreground text-[11px]">
                          {user.permissions?.includes("all")
                            ? "Full Access (All Features)"
                            : `${user.permissions?.length || 0} Modules Granted`}
                        </span>
                      </td>
                      <td className="p-3 pe-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit2Icon className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDeleteDisabled}
                            onClick={() => {
                              if (!isDeleteDisabled) setDeletingId(user._id);
                            }}
                            title={
                              isAdminUser
                                ? "Admin accounts are protected and cannot be deleted"
                                : isSelf
                                ? "Self-deletion prohibited"
                                : "Delete User"
                            }
                            className={`size-7 cursor-pointer ${
                              isDeleteDisabled
                                ? "text-muted-foreground/30 cursor-not-allowed opacity-50"
                                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            }`}
                          >
                            {isAdminUser ? <LockIcon className="size-3.5 text-amber-500" /> : <Trash2Icon className="size-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsers.length / PAGE_SIZE) || 1}
          totalItems={filteredUsers.length}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        onSuccess={loadUsers}
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete User Account"
        message="Are you sure you want to delete this user account? This user will no longer be able to log in."
      />
    </div>
  );
}
