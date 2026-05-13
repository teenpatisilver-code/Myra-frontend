import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home"));
const MenuPage = lazy(() => import("@/pages/menu"));
const AuthPage = lazy(() => import("@/pages/auth"));
const DrinkDetailPage = lazy(() => import("@/pages/drink-detail"));
const CartPage = lazy(() => import("@/pages/cart"));
const OrdersPage = lazy(() => import("@/pages/orders"));
const OrderDetailPage = lazy(() => import("@/pages/order-detail"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const RewardsPage = lazy(() => import("@/pages/rewards"));

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
        <Route path="/auth" component={AuthPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/orders/:id" component={OrderDetailPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/rewards" component={RewardsPage} />
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
