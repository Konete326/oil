"use client";

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
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
      <SidebarHeader className="h-14 justify-center border-b px-2">
        <SidebarMenuButton asChild tooltip="Al Khaleej Lubricants">
          <Link to="/" className="cursor-pointer">
            <span data-slot="icon" className="flex items-center shrink-0"><LogoIcon /></span>
            <span data-slot="label" className="font-medium text-foreground!">Al Khaleej Lubricants</span>
          </Link>
        </SidebarMenuButton>
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
