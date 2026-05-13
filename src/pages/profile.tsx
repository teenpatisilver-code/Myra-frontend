import { useState } from "react";
import { useLocation } from "wouter";
import { User, Phone, Mail, MapPin, LogOut, Star, ShoppingBag, Settings, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLocation("/auth");
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="py-16 text-center space-y-4">
          <User className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold text-foreground">Not logged in</h2>
          <p className="text-muted-foreground">Please login to view your profile</p>
          <Button onClick={() => setLocation("/auth")} className="bg-primary text-primary-foreground">
            Login / Sign Up
          </Button>
        </div>
      </Layout>
    );
  }

  const email = user?.email ?? "";
  const name = user?.user_metadata?.name ?? email.split("@")[0];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Layout>
      <div className="py-4 space-y-6">

        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-border">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Mail className="w-3 h-3" /> {email}
            </p>
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
                <p className="text-2xl font-bold text-primary">0 pts</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary">
              Redeem
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="glass-card rounded-2xl border border-border overflow-hidden">

          {/* Admin Dashboard - only visible to admin */}
          {isAdmin && (
            <button
              onClick={() => setLocation("/admin")}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors border-b border-border bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">Admin Dashboard</span>
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          )}

          <button
            onClick={() => setLocation("/orders")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">My Orders</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setLocation("/rewards")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Rewards & Points</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Phone Number</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Delivery Address</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="outline"
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>

      </div>
    </Layout>
  );
}
