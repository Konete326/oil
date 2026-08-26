import { Link, useLocation } from "react-router-dom";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function NavGroup({ label, items }) {
	const location = useLocation();
	const { t } = useLanguage();

	return (
        <SidebarGroup>
            {label && <SidebarGroupLabel>{t(label)}</SidebarGroupLabel>}
            <SidebarMenu>
				{items.map((item) => {
					const isActive = location.pathname === item.path;
					return (
						<Collapsible
							asChild
							className="group/collapsible"
							defaultOpen={
								isActive || item.subItems?.some((i) => location.pathname === i.path)
							}
							key={item.title}>
							<SidebarMenuItem>
								{item.subItems?.length ? (
									<>
										<CollapsibleTrigger asChild>
											<SidebarMenuButton isActive={isActive} className="cursor-pointer" tooltip={t(item.title)}>
												<span data-slot="icon" className="notranslate flex items-center shrink-0" translate="no">{item.icon}</span>
												<span data-slot="label">{t(item.title)}</span>
												<ChevronRightIcon
													className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden notranslate" />
											</SidebarMenuButton>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.subItems?.map((subItem) => (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton asChild isActive={location.pathname === subItem.path}>
															<Link to={subItem.path} className="cursor-pointer">
																<span data-slot="icon" className="notranslate flex items-center shrink-0" translate="no">{subItem.icon}</span>
																<span data-slot="label">{t(subItem.title)}</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</>
								) : (
									<SidebarMenuButton asChild isActive={isActive} className="cursor-pointer" tooltip={t(item.title)}>
										<Link to={item.path} className="cursor-pointer">
											<span data-slot="icon" className="notranslate flex items-center shrink-0" translate="no">{item.icon}</span>
											<span data-slot="label">{t(item.title)}</span>
										</Link>
									</SidebarMenuButton>
								)}
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
        </SidebarGroup>
    );
}
