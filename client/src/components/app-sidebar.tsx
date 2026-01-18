import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  Trophy,
  Settings,
  QrCode,
  Clock,
  AlertCircle,
  BarChart3,
  UserCog,
  Crown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, User } from "@shared/schema";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: Calendar,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Financials",
    url: "/financials",
    icon: Wallet,
  },
  {
    title: "Tournaments",
    url: "/tournaments",
    icon: Trophy,
  },
  {
    title: "Memberships",
    url: "/memberships",
    icon: Crown,
  },
];

const quickActions = [
  {
    title: "Walk-in Booking",
    url: "/walkin",
    icon: Clock,
  },
  {
    title: "Scanner Mode",
    url: "/scanner",
    icon: QrCode,
  },
  {
    title: "Waitlist",
    url: "/waitlist",
    icon: AlertCircle,
  },
];

const settingsItems = [
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Staff",
    url: "/staff",
    icon: UserCog,
    ownerOnly: true,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  user?: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
    refetchInterval: 30000,
  });

  const userRole = user?.role || "receptionist";
  const isOwner = userRole === "owner";
  const isManager = userRole === "manager" || isOwner;

  const getInitials = () => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Athezy</span>
              <span className="text-xs text-muted-foreground">Venue Management</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === "Bookings" && stats?.pendingCheckIns ? (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {stats.pendingCheckIns}
                        </Badge>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems
                .filter((item) => !item.ownerOnly || isOwner)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">
              {user?.firstName || "User"} {user?.lastName || ""}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
