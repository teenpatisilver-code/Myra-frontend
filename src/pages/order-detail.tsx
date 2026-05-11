import { useParams, useLocation } from "wouter";
import { ChevronLeft, Clock, CheckCircle, XCircle, ChefHat, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/Layout";
import { useGetOrder, getGetOrderQueryKey } from "@/api";

const STATUS_STEPS = ["pending", "accepted", "preparing", "completed"];
const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-4 h-4" />, color: "text-yellow-400" },
  accepted: { label: "Accepted", icon: <CheckCircle className="w-4 h-4" />, color: "text-blue-400" },
  preparing: { label: "Preparing", icon: <ChefHat className="w-4 h-4" />, color: "text-orange-400" },
  completed: { label: "Completed", icon: <CheckCircle className="w-4 h-4" />, color: "text-primary" },
  cancelled: { label: "Cancelled", icon: <XCircle className="w-4 h-4" />, color: "text-destructive" },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const orderId = Number(id);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="py-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="py-16 text-center text-muted-foreground">Order not found.</div>
      </Layout>
    );
  }

  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const isCancelled = order.status === "cancelled";
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <Layout>
      <div className="py-4 space-y-5">
        <button onClick={() => setLocation("/orders")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> My Orders
        </button>

        {/* Order Header */}
        <div className="glass-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-serif font-bold text-foreground">Order #{order.id}</h1>
            <Badge className={`flex items-center gap-1 ${isCancelled ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
              <span className={status.color}>{status.icon}</span>
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="mt-2 text-sm text-muted-foreground capitalize">
            {order.orderType.replace("_", " ")}
            {order.deliveryAddress && ` · ${order.deliveryAddress}`}
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="glass-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentStep;
                const isActive = i === currentStep;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex flex-col items-center gap-1 ${i < STATUS_STEPS.length - 1 ? "flex-1" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? "bg-primary border-primary" : "bg-muted border-border"}`}>
                        {isDone ? <CheckCircle className="w-4 h-4 text-primary-foreground" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                      </div>
                      <span className={`text-xs text-center capitalize ${isActive ? "text-primary font-semibold" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                        {step}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mb-5 mx-1 transition-all ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="glass-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Items</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3" data-testid={`item-order-${item.id}`}>
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.drinkImageUrl ? (
                    <img src={item.drinkImageUrl} alt={item.drinkName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Zap className="w-5 h-5 text-primary/30" /></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{item.drinkName}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.sugarLevel && `Sugar: ${item.sugarLevel}`, item.iceLevel && `Ice: ${item.iceLevel}`, item.toppings].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-foreground">×{item.quantity}</p>
                  <p className="text-xs text-primary">Rs {Math.round(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="glass-card border border-border rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>Rs {Math.round(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{order.deliveryFee > 0 ? `Rs ${Math.round(order.deliveryFee)}` : "Free"}</span></div>
          {order.pointsUsed > 0 && <div className="flex justify-between text-primary"><span>Points redeemed</span><span>-Rs {Math.floor(order.pointsUsed / 100) * 10}</span></div>}
          <Separator />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">Rs {Math.round(order.total)}</span></div>
          {order.pointsEarned > 0 && <p className="text-xs text-muted-foreground text-right">+{order.pointsEarned} points earned</p>}
        </div>
      </div>
    </Layout>
  );
}
