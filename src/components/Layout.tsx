import { useLocation, Link } from "wouter";
import { Home, ShoppingBag, UtensilsCrossed, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function Layout({ children, hideNav }: LayoutProps) {
  const [location] = useLocation();
  const { items } = useCartStore();
  useAuth(); // Just to check if user is authenticated
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/menu", icon: UtensilsCrossed, label: "Menu" },
    { path: "/cart", icon: ShoppingBag, label: "Cart", badge: cartCount },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-primary neon-text tracking-wide">MYRA</span>
            <span className="text-muted-foreground text-sm font-medium">DRINKS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors relative ${
                  location === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="md:hidden relative">
            <Link href="/cart">
              <ShoppingBag className={`w-5 h-5 ${location === "/cart" ? "text-primary" : "text-muted-foreground"}`} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 pb-24 md:pb-8 min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border md:hidden">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path} className="flex flex-col items-center gap-0.5 relative px-3 py-1">
                  <div className="relative">
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs transition-colors ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-0 right-0 h-0.5 bg-primary rounded-b"
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