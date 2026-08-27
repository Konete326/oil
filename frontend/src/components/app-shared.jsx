import {
  LayoutGridIcon,
  FolderTreeIcon,
  PackageIcon,
  RefreshCwIcon,
  FactoryIcon,
  ShoppingCartIcon,
  HistoryIcon,
  BookOpenIcon,
  BanknoteIcon,
  TrendingUpIcon,
  CalculatorIcon,
  TruckIcon,
  ScaleIcon,
  ReceiptIcon,
  UserCogIcon,
  ShieldAlertIcon,
  FileTextIcon,
  BriefcaseIcon,
  BoxesIcon,
  UserCheckIcon,
  UsersIcon,
  BellIcon,
  SettingsIcon,
} from "lucide-react";

export const navGroups = [
  {
    label: "Main",
    items: [
      {
        title: "Dashboard",
        path: "/",
        icon: <LayoutGridIcon />,
      },
      {
        title: "Inventory & Stock",
        path: "/products",
        icon: <BoxesIcon />,
        subItems: [
          {
            title: "Products & Stock",
            path: "/products",
            icon: <PackageIcon />,
          },
          {
            title: "Categories",
            path: "/categories",
            icon: <FolderTreeIcon />,
          },
        ],
      },
      {
        title: "POS Counter Sales",
        path: "/pos",
        icon: <ShoppingCartIcon />,
        subItems: [
          {
            title: "POS Counter",
            path: "/pos",
            icon: <ShoppingCartIcon />,
          },
          {
            title: "POS Sales History",
            path: "/pos/history",
            icon: <HistoryIcon />,
          },
        ],
      },
      {
        title: "Textile Mills & DC",
        path: "/textile",
        icon: <FactoryIcon />,
      },
      {
        title: "Khatas & Ledgers",
        path: "/ledger",
        icon: <BookOpenIcon />,
        subItems: [
          {
            title: "Customers & Accounts",
            path: "/customers",
            icon: <UsersIcon />,
          },
          {
            title: "Customer Ledger & Khata",
            path: "/ledger",
            icon: <BookOpenIcon />,
          },
          {
            title: "Supplier Ledger",
            path: "/supplier-ledger",
            icon: <TruckIcon />,
          },
          {
            title: "Cash Transactions",
            path: "/cash",
            icon: <BanknoteIcon />,
          },
          {
            title: "Sales & Purchases",
            path: "/sales-purchases",
            icon: <TrendingUpIcon />,
          },
          {
            title: "Profit & Loss Margin",
            path: "/profit-loss",
            icon: <CalculatorIcon />,
          },
          {
            title: "Financial Reports",
            path: "/financial-reports",
            icon: <ScaleIcon />,
          },
          {
            title: "Expenses Management",
            path: "/expenses",
            icon: <ReceiptIcon />,
          },
        ],
      },
      {
        title: "HR & Administration",
        path: "/payroll",
        icon: <UserCheckIcon />,
        subItems: [
          {
            title: "Employee Payroll",
            path: "/payroll",
            icon: <BriefcaseIcon />,
          },
          {
            title: "User Management",
            path: "/users",
            icon: <UserCogIcon />,
          },
          {
            title: "Audit Trail Logs",
            path: "/audit-trail",
            icon: <ShieldAlertIcon />,
          },
        ],
      },
    ],
  },
];

export const footerNavLinks = [
  {
    title: "Documentation",
    path: "/documentation",
    icon: <FileTextIcon />,
  },
];

export const navLinks = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
  {
    title: "Settings",
    path: "/settings",
    icon: <SettingsIcon />,
  },
  {
    title: "Notifications",
    path: "/notifications",
    icon: <BellIcon />,
  },
  ...footerNavLinks,
];
