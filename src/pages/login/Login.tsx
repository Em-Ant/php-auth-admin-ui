import { KeyRound } from "lucide-react";
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
  <div className="flex min-h-[70vh] items-center justify-center">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
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
);
