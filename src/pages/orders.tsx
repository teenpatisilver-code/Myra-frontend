import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, ChefHat, Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useListOrders, getListOrdersQueryKey } from "@/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  accepted: { label: "Accepted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  preparing: { label: "Preparing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <ChefHat className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-primary/20 text-primary border-primary/30", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive border-destructive/30", icon: <XCircle className="w-3 h-3" /> },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useListOrders(
    user ? { userId: user.id } : undefined,
    { query: { queryKey: getListOrdersQueryKey(user ? { userId: user.id } : undefined) } }
  );

  return (
    <Layout>
      <div className="py-4 space-y-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your order history</p>
        </div>

        {!user && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sign in to view your orders</p>
            <Link href="/auth" className="text-primary text-sm mt-2 inline-block hover:underline">Sign in</Link>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        )}

        {!isLoading && user && orders?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <Link href="/menu" className="text-primary text-sm mt-2 inline-block hover:underline">Order something</Link>
          </div>
        )}

        <div className="space-y-3">
          {orders?.map((order, i) => {
            const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/orders/${order.id}`} data-testid={`card-order-${order.id}`}>
                  <div className="glass-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground">Order #{order.id}</span>
                      <Badge className={`${status.color} flex items-center gap-1 text-xs`}>
                        {status.icon} {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground space-y-0.5">
                        <p className="capitalize">{order.orderType.replace("_", " ")}</p>
                        <p className="text-xs">{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className="font-bold text-primary text-base">Rs {Math.round(order.total)}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
