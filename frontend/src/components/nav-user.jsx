"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUserApi } from "@/lib/api";
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
import { UserIcon, SettingsIcon, CreditCardIcon, LogOutIcon, SunIcon, MoonIcon } from "lucide-react";

export function NavUser({ user: currentUser, onLogout }) {
  const navigate = useNavigate();
  const savedUser = currentUser || JSON.parse(localStorage.getItem("user") || '{"name":"Admin User","email":"admin@gmail.com"}');

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

  const handleLogout = () => {
    logoutUserApi();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
				<Avatar className="size-8 cursor-pointer">
					<AvatarImage src="https://github.com/shabanhr.png" />
					<AvatarFallback>{savedUser.name?.charAt(0) || "A"}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
				<DropdownMenuItem className="flex items-center justify-start gap-2">
					<DropdownMenuLabel className="flex items-center gap-3">
						<Avatar className="size-10">
							<AvatarImage src="https://github.com/shabanhr.png" />
							<AvatarFallback>{savedUser.name?.charAt(0) || "A"}</AvatarFallback>
						</Avatar>
						<div>
							<span className="font-medium text-foreground">{savedUser.name}</span>{" "}
							<br />
							<div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
								{savedUser.email}
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="cursor-pointer">
						<UserIcon />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem className="cursor-pointer">
						<SettingsIcon />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="cursor-pointer">
						<CreditCardIcon />
						Plan & Billing
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
					<DropdownMenuItem className="w-full cursor-pointer flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
						<LogOutIcon className="size-4" />
						<span>Log out</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
        </DropdownMenu>
    );
}
