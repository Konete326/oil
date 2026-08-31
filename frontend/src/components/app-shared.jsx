import {
  LayoutGridIcon,
  PackageIcon,
  ShoppingCartIcon,
  HistoryIcon,
  FactoryIcon,
  BookOpenIcon,
  UsersIcon,
  TruckIcon,
  BanknoteIcon,
  CalculatorIcon,
  UserCheckIcon,
  SettingsIcon,
  BellIcon,
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
        title: "Inventory",
        path: "/products",
        icon: <PackageIcon />,
      },
      {
        title: "POS Sales",
        path: "/pos",
        icon: <ShoppingCartIcon />,
        subItems: [
          {
            title: "Counter",
            path: "/pos",
            icon: <ShoppingCartIcon />,
          },
          {
            title: "Sales History",
            path: "/pos/history",
            icon: <HistoryIcon />,
          },
        ],
      },
      {
        title: "Textile Mills",
        path: "/textile",
        icon: <FactoryIcon />,
      },
      {
        title: "Accounts",
        path: "/customers",
        icon: <BookOpenIcon />,
        subItems: [
          {
            title: "Customers",
            path: "/customers",
            icon: <UsersIcon />,
          },
          {
            title: "Suppliers",
            path: "/supplier-ledger",
            icon: <TruckIcon />,
          },
          {
            title: "Cash Book",
            path: "/cash",
            icon: <BanknoteIcon />,
          },
          {
            title: "Reports",
            path: "/financial-reports",
            icon: <CalculatorIcon />,
          },
        ],
      },
      {
        title: "Staff & Payroll",
        path: "/payroll",
        icon: <UserCheckIcon />,
      },
    ],
  },
];

export const footerNavLinks = [];

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
