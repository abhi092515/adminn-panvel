import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import Customers from "@/pages/customers";
import WalkinBooking from "@/pages/walkin";
import Financials from "@/pages/financials";
import Scanner from "@/pages/scanner";
import Tournaments from "@/pages/tournaments";
import WaitlistPage from "@/pages/waitlist";
import Settings from "@/pages/settings";
import Analytics from "@/pages/analytics";
import StaffManagement from "@/pages/staff";
import Memberships from "@/pages/memberships";
import VenuesPage from "@/pages/venues";
import CategoriesPage from "@/pages/categories";
import SlotsPage from "@/pages/slots";
import SlotBookPage from "@/pages/slot-book";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/customers" component={Customers} />
      <Route path="/walkin" component={WalkinBooking} />
      <Route path="/financials" component={Financials} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/tournaments" component={Tournaments} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/venues" component={VenuesPage} />
      <Route path="/slots" component={SlotsPage} />
      <Route path="/book-slot" component={SlotBookPage} />
      <Route path="/waitlist" component={WaitlistPage} />
      <Route path="/settings" component={Settings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/staff" component={StaffManagement} />
      <Route path="/memberships" component={Memberships} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ user }: { user: any }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} />
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-50 flex h-12 items-center justify-between gap-2 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="venuehub-theme">
        <TooltipProvider>
          <AppLayout user={null} />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
