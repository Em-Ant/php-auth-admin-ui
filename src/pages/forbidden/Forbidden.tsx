import { ShieldAlert } from "lucide-react";
import { ADMIN_ROLE } from "@/shared/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export const Forbidden = () => (
  <div className="flex min-h-[70vh] items-center justify-center">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="size-5" />
        </div>
        <CardTitle>Forbidden</CardTitle>
        <CardDescription>
          Your access token does not carry the &quot;{ADMIN_ROLE}&quot; role.
          Ask an administrator for it and sign in again.
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
);
