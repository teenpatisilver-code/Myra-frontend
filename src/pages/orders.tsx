import { useEffect, useState } from "react";
import { ShoppingBag, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  delivered: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  if (!isAuthenticated) return (
    <Layout>
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Please login to view orders</h2>
        <Button onClick={() => setLocation('/auth')} className="bg-primary text-primary-foreground">Login</Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="py-4 space-y-4">
        <h1 className="text-2xl font-bold font-serif text-foreground">My Orders</h1>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
            <h2 className="text-xl font-bold text-foreground">No orders yet</h2>
            <p className="text-muted-foreground">Your order history will appear here</p>
            <Button onClick={() => setLocation('/menu')} className="bg-primary text-primary-foreground">Order Now</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass-card rounded-2xl p-5 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="font-bold text-primary text-lg">Rs {order.total_amount?.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                </div>
                {order.order_items?.length > 0 && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.drink_name} × {item.quantity}</span>
                        <span>Rs {Math.round(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground border-t border-border pt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(order.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
