import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard-card";
import { CreditCardIcon, UserPlusIcon, FileTextIcon, RocketIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getIcon(iconType) {
	switch (iconType) {
		case "card":
			return <CreditCardIcon />;
		case "user":
			return <UserPlusIcon />;
		case "file":
			return <FileTextIcon />;
		case "rocket":
			return <RocketIcon />;
		default:
			return <RocketIcon />;
	}
}

export function DashboardActivity({ activities, loading }) {
	const items = activities || [
		{ title: "Invoice #1045 marked paid", time: "About 2 hours ago", iconType: "card" },
		{ title: "Jordan joined the team", time: "This morning", iconType: "user" },
		{ title: "Weekly summary exported", time: "Yesterday", iconType: "file" },
		{ title: "Dashboard v2 shipped to prod", time: "2 days ago", iconType: "rocket" },
	];

	return (
        <DashboardCard className="gap-0">
            <CardHeader className="border-b">
				<CardTitle>Activity</CardTitle>
				<CardDescription>Latest workspace events from MongoDB Atlas.</CardDescription>
			</CardHeader>
            <CardContent className="px-0">
				{loading ? (
					<div className="p-6 space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : (
					<ul className="flex flex-col divide-y divide-border">
						{items.map((item, index) => (
							<li className="flex h-16 items-center gap-3 px-6" key={item._id || item.title || index}>
								<span
									aria-hidden="true"
									className="flex size-10 shrink-0 items-center justify-center [&_svg]:size-4">
									{getIcon(item.iconType)}
								</span>
								<div className="min-w-0 flex-1 space-y-1">
									<p className="line-clamp-1 text-pretty text-foreground text-sm leading-snug">
										{item.title}
									</p>
									<p className="text-muted-foreground text-xs">{item.time}</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
        </DashboardCard>
    );
}
