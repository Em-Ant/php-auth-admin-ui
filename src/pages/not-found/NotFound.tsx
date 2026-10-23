import { Link } from "react-router";
import { Button } from "@/shared/ui/button";

export const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
    <p className="text-sm font-medium text-muted-foreground">404</p>
    <h2 className="text-xl font-semibold">Page not found</h2>
    <p className="text-sm text-muted-foreground">
      The requested screen does not exist.
    </p>
    <Button asChild variant="outline" className="mt-2">
      <Link to="/overview">Back to overview</Link>
    </Button>
  </div>
);
