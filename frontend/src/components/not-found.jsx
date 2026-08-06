import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeftIcon } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="space-y-1 select-none">
          <p className="text-[120px] font-black leading-none tracking-tighter bg-gradient-to-br from-primary via-primary/60 to-primary/20 bg-clip-text text-transparent">
            404
          </p>
          <div className="h-1 w-16 mx-auto rounded-full bg-primary/30" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page you are looking for does not exist or has been moved. Check the URL and try again.
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
            Go Back
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <HomeIcon className="size-3.5" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
