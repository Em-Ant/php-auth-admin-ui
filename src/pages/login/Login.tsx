import { KeyRound, ShieldCheck } from "lucide-react";
import { Form } from "react-router";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export const Login = () => (
  <div className="flex min-h-screen">
    <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
          <ShieldCheck className="size-5" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Admin UI</span>
          <span className="truncate text-xs opacity-70">
            php-auth dashboard
          </span>
        </div>
      </div>
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">
          Identity administration for php-auth
        </h1>
        <p className="mt-4 text-sm opacity-80">
          Manage realms, clients, users, roles and authentication activity in
          one place. Sign in with your operator account to continue.
        </p>
      </div>
      <p className="text-xs opacity-60">
        Authenticated in the admin realm with the admin role.
      </p>
    </div>
    <div className="flex flex-1 items-center justify-center p-6 md:p-12">
      <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted lg:hidden">
            <ShieldCheck className="size-5" />
          </div>
          <div className="mx-auto mb-2 hidden size-10 items-center justify-center rounded-full bg-muted lg:flex">
            <KeyRound className="size-5" />
          </div>
          <CardTitle>Sign in to Admin UI</CardTitle>
          <CardDescription>
            You will be redirected to the backend login form, then brought back
            here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  </div>
);
