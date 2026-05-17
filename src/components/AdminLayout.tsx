import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  DollarSign,
  ChevronLeft,
  Image,
  Settings,
  ShoppingCart
} from "lucide-react";
import { motion } from "framer-motion";

const ADMIN_NAV = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { path: "/admin/menu", icon: UtensilsCrossed, label: "Menu" },
  { path: "/admin/inventory", icon: Package, label: "Inventory" },
  { path: "/admin/expenses", icon: DollarSign, label: "Expenses" },
  { path: "/admin/banners", icon: Image, label: "Banners" },
  { path: "/admin/pos", icon: ShoppingCart, label: "POS" },
  { path: "/admin/settings", icon: Settings, label: "Settings" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const hideNav = false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">

      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b border-purple-500/20 md:hidden"
        style={{
          background:
            "linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #3b0764 100%)"
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold neon-text tracking-widest">
              MYRA ADMIN
            </span>
          </Link>

          <Link href="/" className="text-purple-200 hover:text-white text-sm">
            Store
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border glass sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-border flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs mb-3"
          >
            <ChevronLeft className="w-3 h-3" /> Back to Store
          </Link>

          <span className="font-serif font-bold text-primary neon-text text-sm">
            ADMIN PANEL
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
        {children}
      </main>

      {/* Mobile bottom nav */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-purple-500/30 md:hidden"
          style={{
            background:
              "linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #3b0764 100%)"
          }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {ADMIN_NAV.map((item) => {
              const isActive = location === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex flex-col items-center gap-0.5 relative px-3 py-1"
                >
                  <div className="relative">
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? "text-white fill-white"
                          : "text-purple-300"
                      }`}
                    />
                  </div>

                  <span
                    className={`text-xs transition-colors ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-purple-300"
                    }`}
                  >
                    {item.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-0 right-0 h-0.5 bg-white rounded-b"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}