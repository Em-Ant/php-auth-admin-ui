import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const describeError = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed with status ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
};

export const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            The screen could not load. This usually means the backend is
            unreachable or the session could not be initialised.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground">
            {describeError(error)}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button asChild variant="outline">
              <a href={import.meta.env.BASE_URL}>Back to dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
