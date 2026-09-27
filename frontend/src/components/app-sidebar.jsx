"use client";

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import softwareLogoImg from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { footerNavLinks, navGroups } from "@/components/app-shared";
import { NavGroup } from "@/components/nav-group";
import { useLanguage } from "@/context/language-context";

export function AppSidebar() {
  const { language, t } = useLanguage();
  const isRtl = language === "ur";

  return (
    <Sidebar
      side={isRtl ? "right" : "left"}
      className={cn(
        "*:data-[slot=sidebar-inner]:bg-background",
        "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-16 justify-center border-b px-2.5">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden group/logo cursor-pointer py-1">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 p-1 border border-primary/20 shadow-2xs group-hover/logo:scale-105 transition-transform">
            <img src={softwareLogoImg} alt="Elite Dev Logo" className="size-full object-contain" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm text-foreground tracking-tight block truncate">
              Al Khaleej Lubricants
            </span>
            <span className="text-[10px] text-muted-foreground font-medium block truncate">
              by Elite Dev
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0">
        <SidebarMenu className="border-t p-2">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="text-muted-foreground cursor-pointer"
                isActive={item.isActive}
                size="sm"
                tooltip={t(item.title)}
              >
                <Link to={item.path} className="cursor-pointer">
                  <span data-slot="icon" className="notranslate flex items-center shrink-0">{item.icon}</span>
                  <span data-slot="label">{t(item.title)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="px-4 py-3 border-t border-border/40 transition-opacity group-data-[collapsible=icon]:hidden space-y-1">
          <p className="text-[10px] font-bold text-foreground tracking-tight">
            Al Khaleej Lubricants
          </p>
          <p className="text-[9px] text-muted-foreground leading-tight">
            © 2026 • Developed by <span className="font-semibold text-primary">Elite Dev</span>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
