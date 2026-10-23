import { LoaderCircle } from "lucide-react";

export const Loader = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
  </div>
);
