import { cn } from "@/lib/utils";
import softwareLogoImg from "@/assets/logo.png";

export const SoftwareLogo = ({ className = "size-6", ...props }) => (
  <img
    src={softwareLogoImg}
    alt="Software Logo"
    className={cn("shrink-0 object-contain", className)}
    {...props}
  />
);

export const OilDropLogo = ({ className = "size-6", ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    {...props}
  >
    <defs>
      <linearGradient id="oilDropGradGlobal" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="oilDropHighlightGlobal" x1="10" y1="8" x2="16" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M16 2.5C16 2.5 6 14.5 6 21.5C6 26.7467 10.4772 30.5 16 30.5C21.5228 30.5 26 26.7467 26 21.5C26 14.5 16 2.5 16 2.5Z"
      fill="url(#oilDropGradGlobal)"
      stroke="#92400e"
      strokeWidth="1.5"
    />
    <path
      d="M16 5.5C16 5.5 8.5 15.5 8.5 21C8.5 24.8 11.8 28 16 28C14 26.5 13.5 23.5 13.5 20.5C13.5 15.5 16 5.5 16 5.5Z"
      fill="url(#oilDropHighlightGlobal)"
    />
    <circle cx="20" cy="23" r="1.5" fill="#fef3c7" />
  </svg>
);

export const PrintOilDropLogo = ({ className = "size-8", monochrome = false, ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    {...props}
  >
    <path
      d="M16 2.5C16 2.5 6 14.5 6 21.5C6 26.7467 10.4772 30.5 16 30.5C21.5228 30.5 26 26.7467 26 21.5C26 14.5 16 2.5 16 2.5Z"
      fill={monochrome ? "#0f172a" : "#d97706"}
      stroke={monochrome ? "#020617" : "#78350f"}
      strokeWidth="1.5"
    />
    <path
      d="M16 5.5C16 5.5 9 15.5 9 21C9 24.5 12 27.5 16 27.5C14 26 13.5 23 13.5 20C13.5 15 16 5.5 16 5.5Z"
      fill="#ffffff"
      fillOpacity="0.45"
    />
    <circle cx="20" cy="22" r="1.8" fill="#ffffff" fillOpacity="0.9" />
  </svg>
);

export const LogoIcon = ({ className = "size-6", ...props }) => (
  <SoftwareLogo className={className} {...props} />
);

export const Logo = ({ className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    <SoftwareLogo className="size-6" />
    <span className="font-bold text-lg text-foreground tracking-tight">Al Khaleej Lubricants</span>
  </div>
);
