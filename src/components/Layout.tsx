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
    <div className="min-h-screen text-foreground" style={{ background: "#F6F1EB" }}>

      {/* Top bar */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "linear-gradient(180deg, #5B001E 0%, #3A0014 100%)",
          boxShadow: "0 4px 24px rgba(91,0,30,0.4)",
        }}
      >
        {cartCount > 0 && (
          <div className="text-xs text-center py-1.5 px-4 font-medium"
            style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
            🛒 {cartCount} item{cartCount > 1 ? "s" : ""} in your cart —{" "}
            <Link href="/cart" className="underline font-bold">View Cart</Link>
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="font-serif text-2xl font-bold tracking-widest"
              style={{
                color: "#D4AF37",
                textShadow: "0 0 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.2)",
                letterSpacing: "0.2em",
              }}
            >
              MYRA
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}
                  className="text-sm font-medium transition-colors"
                  style={{ color: location === item.path ? "#D4AF37" : "rgba(255,255,255,0.7)" }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-5 h-5" style={{ color: location === "/cart" ? "#D4AF37" : "rgba(255,255,255,0.7)" }} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ background: "#D4AF37", color: "#3A0014" }}>
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
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          style={{
            background: "linear-gradient(180deg, #4A0019 0%, #2A000F 100%)",
            boxShadow: "0 -4px 24px rgba(91,0,30,0.5)",
          }}>
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}
                  className="flex flex-col items-center gap-0.5 relative px-3 py-1">
                  <div className="relative">
                    {isActive && (
                      <div className="absolute inset-0 rounded-full blur-md"
                        style={{ background: "rgba(212,175,55,0.3)", transform: "scale(1.8)" }} />
                    )}
                    <item.icon
                      className="w-5 h-5 relative z-10 transition-colors"
                      style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.65)" }}
                    />
                  </div>
                  <span className="text-xs transition-colors font-medium"
                    style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.65)" }}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-0 right-0 h-0.5 rounded-b"
                      style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }}
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
