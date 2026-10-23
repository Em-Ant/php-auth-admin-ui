import { RefreshCw, Server, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { rawApiClient } from "../api/utils";
import { getConfig } from "../bootstrap/config";
import { join } from "../shared/path";
import { useAppSelector } from "../store";

interface ProbeState {
  apiHome: string;
  health: string;
  ready: string;
}

/**
 * Sanity check from admin-ui/API-CONTRACT.md §6: /health is liveness and
 * /ready touches the database. Both are public, so they go through the raw
 * client instead of the authenticated one.
 */
const useBackendProbe = () => {
  const [state, setState] = useState<ProbeState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { app } = await getConfig();
    const [health, ready] = await Promise.all([
      rawApiClient.get<{ status: string }>(join([app.apiHome, "/health"])),
      rawApiClient.get<{ status: string }>(join([app.apiHome, "/ready"])),
    ]);
    setState({
      apiHome: app.apiHome,
      health: health.fold(
        (value) => value.status,
        (failure) => failure.errors[0]?.message ?? "unreachable",
      ),
      ready: ready.fold(
        (value) => value.status,
        (failure) => failure.errors[0]?.message ?? "unreachable",
      ),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, loading, refresh };
};

const StatusBadge = ({ value }: { value?: string }) => {
  if (value === undefined) {
    return <Skeleton className="h-5 w-16" />;
  }

  return (
    <Badge variant={value === "ok" ? "secondary" : "destructive"}>
      {value}
    </Badge>
  );
};

export const Overview = () => {
  const { name, roles } = useAppSelector((state) => state.user);
  const { state, loading, refresh } = useBackendProbe();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Identity of the signed-in operator and the state of the php-auth
          backend this dashboard talks to.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" />
              Signed in
            </CardTitle>
            <CardDescription>
              Decoded from the admin realm access token.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium">{name ?? "unknown"}</p>
              <p className="text-xs text-muted-foreground">admin realm</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">no roles</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-4" />
              Backend
            </CardTitle>
            <CardDescription className="break-all">
              {state?.apiHome ?? "loading config…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">/health</span>
              <StatusBadge value={state?.health} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">/ready</span>
              <StatusBadge value={state?.ready} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} />
              Recheck
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
