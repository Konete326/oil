import { LayoutGridIcon, FolderTreeIcon, PackageIcon, RefreshCwIcon, FactoryIcon, ShoppingCartIcon, HistoryIcon, BookOpenIcon, BanknoteIcon, TrendingUpIcon, CalculatorIcon, TruckIcon, ScaleIcon, ReceiptIcon, UserCogIcon, ShieldAlertIcon, FileTextIcon, BarChart3Icon, BriefcaseIcon, UsersIcon, PlugIcon, KeyRoundIcon, SettingsIcon, CreditCardIcon, HelpCircleIcon } from "lucide-react";

export const navGroups = [
	{
		label: "Product",
		items: [
			{
				title: "Dashboard",
				path: "/",
				icon: (
					<LayoutGridIcon />
				),
				isActive: true,
			},
			{
				title: "Categories",
				path: "/categories",
				icon: (
					<FolderTreeIcon />
				),
			},
			{
				title: "Products & Stock",
				path: "/products",
				icon: (
					<PackageIcon />
				),
			},
			{
				title: "POS Counter",
				path: "/pos",
				icon: (
					<ShoppingCartIcon />
				),
			},
			{
				title: "POS Sales History",
				path: "/pos/history",
				icon: (
					<HistoryIcon />
				),
			},
			{
				title: "Drum Decanting",
				path: "/decanting",
				icon: (
					<RefreshCwIcon />
				),
			},
			{
				title: "Textile Mills & DC",
				path: "/textile",
				icon: (
					<FactoryIcon />
				),
			},
			{
				title: "Ledger & Khata",
				path: "/ledger",
				icon: (
					<BookOpenIcon />
				),
			},
			{
				title: "Cash Transactions",
				path: "/cash",
				icon: (
					<BanknoteIcon />
				),
			},
			{
				title: "Sales & Purchases",
				path: "/sales-purchases",
				icon: (
					<TrendingUpIcon />
				),
			},
			{
				title: "Profit & Loss Margin",
				path: "/profit-loss",
				icon: (
					<CalculatorIcon />
				),
			},
			{
				title: "Supplier Ledger",
				path: "/supplier-ledger",
				icon: (
					<TruckIcon />
				),
			},
			{
				title: "Financial Reports",
				path: "/financial-reports",
				icon: (
					<ScaleIcon />
				),
			},
			{
				title: "Expenses Management",
				path: "/expenses",
				icon: (
					<ReceiptIcon />
				),
			},
			{
				title: "User Management",
				path: "/users",
				icon: (
					<UserCogIcon />
				),
			},
			{
				title: "Audit Trail Logs",
				path: "/audit-trail",
				icon: (
					<ShieldAlertIcon />
				),
			},
			{
				title: "Analytics",
				path: "/analytics",
				icon: (
					<BarChart3Icon />
				),
			},
		],
	},
	{
		label: "Workspace",
		items: [
			{
				title: "Team",
				path: "/team",
				icon: (
					<UsersIcon />
				),
			},
			{
				title: "Integrations",
				path: "/integrations",
				icon: (
					<PlugIcon />
				),
			},
			{
				title: "API Keys",
				path: "/api-keys",
				icon: (
					<KeyRoundIcon />
				),
			},
		],
	},
	{
		label: "Administration",
		items: [
			{
				title: "Settings",
				path: "/settings",
				icon: (
					<SettingsIcon />
				),
			},
			{
				title: "Billing",
				path: "/billing",
				icon: (
					<CreditCardIcon />
				),
			},
		],
	},
];

export const footerNavLinks = [
	{
		title: "Help Center",
		path: "/help",
		icon: (
			<HelpCircleIcon />
		),
	},
	{
		title: "Documentation",
		path: "/documentation",
		icon: (
			<FileTextIcon />
		),
	},
];

export const navLinks = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item])),
	...footerNavLinks,
];
