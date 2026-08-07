import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeftIcon, AlertCircleIcon } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="py-16 w-full flex flex-col items-center justify-center bg-card rounded-2xl border border-border p-6 shadow-sm my-auto text-center animate-in fade-in duration-200">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2 select-none flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
            <AlertCircleIcon className="size-8" />
          </div>
          <p className="text-6xl font-black leading-none tracking-tight text-foreground font-mono">
            404
          </p>
          <div className="h-1 w-12 rounded-full bg-primary/40" />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The URL path you entered does not match any valid route in the portal. Please check the address or return to the main dashboard.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Go Back</span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <HomeIcon className="size-3.5" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
