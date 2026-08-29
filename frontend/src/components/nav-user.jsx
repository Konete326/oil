"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUserApi } from "@/lib/api";
import { ConfirmModal } from "@/components/confirm-modal";
import { useSync } from "@/context/sync-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  RefreshCwIcon,
  WifiIcon,
  WifiOffIcon,
  GaugeIcon,
} from "lucide-react";

export function NavUser({ user: currentUser, onLogout }) {
  const navigate = useNavigate();
  const savedUser = currentUser || JSON.parse(localStorage.getItem("user") || '{"name":"Admin User","email":"admin@gmail.com"}');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { isOnline, pendingCount, isSyncing, syncProgress, networkSpeed, networkDetails, lastSyncTime, triggerManualSync } = useSync();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = (e) => {
    e.preventDefault();
    setIsDark((prev) => !prev);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logoutUserApi();
    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  const getSpeedLabel = () => {
    if (!isOnline) return "Offline";
    if (networkDetails?.label) return networkDetails.label;
    if (networkSpeed === "slow") return "Slow 2G (Throttled)";
    if (networkSpeed === "medium") return "Medium 3G Speed";
    return "High Speed 4G/WiFi";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative inline-block cursor-pointer">
            <Avatar className="size-8">
              {savedUser.avatar && <AvatarImage src={savedUser.avatar} />}
              <AvatarFallback>{savedUser.name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background flex items-center justify-center ${
                isSyncing
                  ? "bg-amber-500"
                  : isOnline
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              }`}
            >
              {isSyncing && (
                <RefreshCwIcon className="size-2 text-white animate-spin" />
              )}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem className="flex items-center justify-start gap-2">
            <DropdownMenuLabel className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="size-10">
                  {savedUser.avatar && <AvatarImage src={savedUser.avatar} />}
                  <AvatarFallback>{savedUser.name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-background ${
                    isOnline ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
              </div>
              <div>
                <span className="font-medium text-foreground">{savedUser.name}</span>
                <div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
                  {savedUser.email}
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-3 py-2 bg-muted/40 rounded-lg mx-1 my-1 space-y-2 border border-border/40">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                {isOnline ? (
                  <WifiIcon className="size-3.5 text-emerald-500" />
                ) : (
                  <WifiOffIcon className="size-3.5 text-rose-500" />
                )}
                <span>{isOnline ? "Online Mode" : "Offline Mode"}</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  pendingCount > 0
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {pendingCount > 0 ? `${pendingCount} Pending` : "Synced"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 border-t border-border/30">
              <span className="flex items-center gap-1">
                <GaugeIcon className="size-3 text-sky-500" />
                {getSpeedLabel()}
              </span>
            </div>

            {isSyncing && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <RefreshCwIcon className="size-3 animate-spin text-primary" />
                    Throttled batch sync...
                  </span>
                  <span>{syncProgress.percentage}%</span>
                </div>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${syncProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {!isSyncing && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {lastSyncTime ? `Last: ${lastSyncTime}` : "Auto-sync active"}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={!isOnline || isSyncing}
                  onClick={triggerManualSync}
                  className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                >
                  <RefreshCwIcon className="size-2.5" />
                  <span>Sync Now</span>
                </Button>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/users")}>
              <UserIcon className="size-4 mr-2" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/settings")}>
              <SettingsIcon className="size-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem className="w-full cursor-pointer flex items-center justify-between" onClick={toggleTheme}>
              <div className="flex items-center gap-2">
                {isDark ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
                <span>Theme</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {isDark ? "Dark" : "Light"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="w-full cursor-pointer flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOutIcon className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your session?"
        confirmText="Log Out"
        variant="logout"
        icon={LogOutIcon}
      />
    </>
  );
}
