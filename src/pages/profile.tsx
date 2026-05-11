import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, Copy, LogOut, Star, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useListOrders, useGetLoyaltyPoints, useUpdateUser, getListOrdersQueryKey, getGetLoyaltyPointsQueryKey } from "@/api";

export default function ProfilePage() {
  const { user, logout, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");

  const { data: orders, isLoading: ordersLoading } = useListOrders(
    user ? { userId: user.id } : undefined,
    { query: { enabled: !!user, queryKey: getListOrdersQueryKey(user ? { userId: user.id } : undefined) } }
  );

  const { data: loyalty } = useGetLoyaltyPoints(
    user?.id ?? 0,
    { query: { enabled: !!user, queryKey: getGetLoyaltyPointsQueryKey(user?.id ?? 0) } }
  );

  const updateUser = useUpdateUser();

  if (!user) {
    return (
      <Layout>
        <div className="py-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">Sign in to view your profile</h2>
            <p className="text-muted-foreground text-sm mt-1">Access orders, rewards, and more</p>
          </div>
          <Button onClick={() => setLocation("/auth")} className="bg-primary text-primary-foreground">Sign In</Button>
        </div>
      </Layout>
    );
  }

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard" });
  };

  const handleSave = () => {
    updateUser.mutate(
      { id: user.id, data: { name: name || null, phone: phone || null, address: address || null } },
      {
        onSuccess: (updated) => {
          login({ ...user, ...updated });
          toast({ title: "Profile updated" });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="py-4 space-y-5">
        {/* Avatar + Name */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-2xl font-bold text-background">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.role === "admin" && <span className="text-xs text-secondary font-semibold uppercase tracking-wider">Admin</span>}
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Orders", value: orders?.length ?? 0 },
            { label: "Points", value: loyalty?.totalPoints ?? user.loyaltyPoints },
            { label: "Lifetime Pts", value: loyalty?.lifetimePoints ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="glass-card border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-primary" data-testid={`text-stat-${stat.label.toLowerCase().replace(" ", "-")}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Code */}
        <div className="glass-card border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Your Referral Code</h3>
            <Star className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono font-bold text-primary tracking-widest text-lg" data-testid="text-referral-code">
              {user.referralCode}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyReferral} className="border-primary/30 text-primary hover:bg-primary/10" data-testid="button-copy-referral">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share this code. You earn 50 points when friends sign up!</p>
        </div>

        {/* Edit Profile */}
        <div className="glass-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Edit Profile</h3>
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-muted border-border" data-testid="input-profile-name" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-muted border-border" data-testid="input-profile-phone" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Delivery Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Default delivery address" className="mt-1 bg-muted border-border" data-testid="input-profile-address" />
          </div>
          <Button onClick={handleSave} disabled={updateUser.isPending} className="w-full bg-primary text-primary-foreground" data-testid="button-save-profile">
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Recent Orders */}
        <div className="glass-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Orders</h3>
            <Link href="/orders" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {ordersLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground"><Package className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No orders yet</p></div>
          ) : (
            <div className="space-y-2">
              {orders?.slice(0, 3).map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} data-testid={`link-order-${order.id}`}>
                  <div className="flex items-center justify-between py-2 hover:bg-muted/30 rounded-lg px-2 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-foreground">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status} · {order.orderType.replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">Rs {Math.round(order.total)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Link href="/rewards">
            <Button variant="outline" className="w-full justify-start gap-2 border-border text-foreground">
              <Star className="w-4 h-4 text-primary" /> Loyalty Rewards
            </Button>
          </Link>
          {user.role === "admin" && (
            <Link href="/admin">
              <Button variant="outline" className="w-full justify-start gap-2 border-secondary/30 text-secondary">
                Admin Dashboard
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={() => { logout(); setLocation("/"); }} className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" data-testid="button-logout">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
}
