import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import {
  requestLogout,
  selectOperatorName,
  selectOperatorRoles,
} from "@/app/model/operator";
import { useTheme } from "@/app/model/theme";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Separator } from "@/shared/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { Switch } from "@/shared/ui/switch";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { NAV_GROUPS, pageTitleFor } from "./navigation";
import type { OperatorOutletContext } from "./outlet-context";

const getInitials = (name: string | null) =>
  name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export const Layout = () => {
  const dispatch = useAppDispatch();
  const name = useAppSelector(selectOperatorName);
  const roles = useAppSelector(selectOperatorRoles);
  const { isDark, toggle } = useTheme();
  const { pathname } = useLocation();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" tooltip="Admin UI">
                  <Link to="/overview">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">Admin UI</span>
                      <span className="truncate text-xs text-muted-foreground">
                        php-auth dashboard
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.title}
                        >
                          <Link to={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" tooltip={name ?? "Signed in"}>
                      <Avatar className="size-8">
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {name ?? "Signed in"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {roles.join(", ") || "no roles"}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="end"
                    sideOffset={8}
                    className="min-w-56"
                  >
                    <DropdownMenuLabel className="truncate">
                      {name ?? "Signed in"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => dispatch(requestLogout())}
                    >
                      <LogOut />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <h1 className="text-sm font-medium">{pageTitleFor(pathname)}</h1>
            <span className="ml-auto text-xs text-muted-foreground">
              Dark mode
            </span>
            <Switch
              aria-label="Dark mode"
              checked={isDark}
              onCheckedChange={toggle}
            />
            <Badge variant="outline">admin realm</Badge>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Outlet context={{ name, roles } satisfies OperatorOutletContext} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};
