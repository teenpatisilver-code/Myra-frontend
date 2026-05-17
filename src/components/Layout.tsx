import { useLocation, Link } from "wouter";
import { Home, UtensilsCrossed, Heart, User, ShoppingCart } from "lucide-react";
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
  useAuth();

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/menu", icon: UtensilsCrossed, label: "Menu" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b border-purple-500/20"
        style={{
          background:
            "linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #3b0764 100%)",
        }}
      >
        {/* Cart notification banner */}
        {cartCount > 0 && (
          <div className="bg-primary/90 text-primary-foreground text-xs text-center py-1.5 px-4 font-medium">
            🛒 {cartCount} item{cartCount > 1 ? "s" : ""} in your cart —{" "}
            <Link href="/cart" className="underline font-bold">
              View Cart
            </Link>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold neon-text tracking-widest text-white">
              MYRA
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location === item.path
                      ? "text-white font-bold"
                      : "text-purple-200 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Cart icon */}
            <Link href="/cart" className="relative">
              <ShoppingCart
                className={`w-5 h-5 transition-colors ${
                  location === "/cart"
                    ? "text-white"
                    : "text-purple-200 hover:text-white"
                }`}
              />

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-purple-800 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
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
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex flex-col items-center gap-0.5 relative px-3 py-1"
                >
                  <div className="relative">
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? "text-primary fill-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <span
                    className={`text-xs transition-colors ${
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
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