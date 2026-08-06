import logoImg from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export const LogoIcon = ({ className, ...props }) => (
	<img
		src={logoImg}
		alt="EliteDev Logo"
		className={cn("size-6 object-contain shrink-0", className)}
		{...props}
	/>
);

export const Logo = ({ className, ...props }) => (
	<div className={cn("flex items-center gap-2", className)} {...props}>
		<img src={logoImg} alt="EliteDev Logo" className="size-6 object-contain shrink-0" />
		<span className="font-bold text-lg text-foreground tracking-tight">EliteDev</span>
	</div>
);
