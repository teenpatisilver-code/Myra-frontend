import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home"));
const MenuPage = lazy(() => import("@/pages/menu"));
const DrinkDetailPage = lazy(() => import("@/pages/drink-detail"));
const CartPage = lazy(() => import("@/pages/cart"));
const OrdersPage = lazy(() => import("@/pages/orders"));
const OrderDetailPage = lazy(() => import("@/pages/order-detail"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const RewardsPage = lazy(() => import("@/pages/rewards"));
const AuthPage = lazy(() => import("@/pages/auth"));
const AdminLoginPage = lazy(() => import("@/pages/admin/admin-login"));

// Admin pages commented out - will fix after customer flow works
// const AdminDashboardPage = lazy(() => import("@/pages/admin/dashboard"));
// const AdminOrdersPage = lazy(() => import("@/pages/admin/orders"));
// const AdminMenuPage = lazy(() => import("@/pages/admin/menu"));
// const AdminInventoryPage = lazy(() => import("@/pages/admin/inventory"));
// const AdminExpensesPage = lazy(() => import("@/pages/admin/expenses"));
// const AdminBannersPage = lazy(() => import("@/pages/admin/banners"));
// const AdminSettingsPage = lazy(() => import("@/pages/admin/settings"));
// const AdminPosPage = lazy(() => import("@/pages/admin/pos"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/menu/:id" component={DrinkDetailPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/orders/:id" component={OrderDetailPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/rewards" component={RewardsPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/admin-login" component={AdminLoginPage} />
        
        {/* Admin routes commented out - will uncomment after customer pages work */}
        {/* <Route path="/admin" component={AdminDashboardPage} /> */}
        {/* <Route path="/admin/orders" component={AdminOrdersPage} /> */}
        {/* <Route path="/admin/menu" component={AdminMenuPage} /> */}
        {/* <Route path="/admin/inventory" component={AdminInventoryPage} /> */}
        {/* <Route path="/admin/expenses" component={AdminExpensesPage} /> */}
        {/* <Route path="/admin/banners" component={AdminBannersPage} /> */}
        {/* <Route path="/admin/settings" component={AdminSettingsPage} /> */}
        {/* <Route path="/admin/pos" component={AdminPosPage} /> */}
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base="">
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
