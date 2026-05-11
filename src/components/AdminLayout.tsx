import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Package, DollarSign, ChevronLeft, Image, Settings, ShoppingCart } from "lucide-react";

const ADMIN_NAV = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { path: "/admin/menu", icon: UtensilsCrossed, label: "Menu" },
  { path: "/admin/inventory", icon: Package, label: "Inventory" },
  { path: "/admin/expenses", icon: DollarSign, label: "Expenses" },
  { path: "/admin/banners", icon: Image, label: "Banners" },
  { path: "/admin/pos", icon: ShoppingCart, label: "POS" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border glass sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs mb-3">
            <ChevronLeft className="w-3 h-3" /> Back to Store
          </Link>
          <span className="font-serif font-bold text-primary neon-text text-sm">ADMIN PANEL</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
        <div className="flex overflow-x-auto no-scrollbar">
          {ADMIN_NAV.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path} className="flex-shrink-0 flex flex-col items-center py-2 px-3 gap-0.5 min-w-[54px]">
                <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[9px] ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
