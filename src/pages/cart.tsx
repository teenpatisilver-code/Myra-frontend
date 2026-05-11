import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrder } from "@/api";

const ORDER_TYPES = [
  { value: "pickup", label: "Pickup", description: "Pick up at the counter", fee: 0 },
  { value: "gym_upstairs", label: "Gym Upstairs", description: "Delivered to the gym floor", fee: 0 },
  { value: "delivery", label: "Delivery", description: "Kathmandu delivery", fee: 100 },
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [orderType, setOrderType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? "");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [notes, setNotes] = useState("");

  const createOrder = useCreateOrder();

  const deliveryFee = ORDER_TYPES.find((t) => t.value === orderType)?.fee ?? 0;
  const subtotal = getTotal();
  const maxPoints = user ? Math.min(user.loyaltyPoints, Math.floor(subtotal / 10) * 10) : 0;
  const pointsDiscount = pointsToUse > 0 ? Math.floor(pointsToUse / 100) * 10 : 0;
  const total = Math.max(0, subtotal + deliveryFee - pointsDiscount);
  const pointsEarned = Math.floor(total / 100) * 2;

  const handlePlaceOrder = () => {
    if (!customerName.trim()) {
      toast({ title: "Name required", description: "Please enter your name to proceed.", variant: "destructive" });
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast({ title: "Address required", description: "Please enter a delivery address.", variant: "destructive" });
      return;
    }

    createOrder.mutate(
      {
        data: {
          userId: user?.id ?? null,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          orderType,
          deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : null,
          notes: notes.trim() || null,
          pointsToUse,
          items: items.map((item) => ({
            drinkId: item.drinkId,
            quantity: item.quantity,
            sugarLevel: item.sugarLevel ?? null,
            iceLevel: item.iceLevel ?? null,
            toppings: item.toppings ?? null,
            notes: item.notes ?? null,
          })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          toast({ title: "Order placed!", description: `Order #${order.id} is being prepared.` });
          setLocation(`/orders/${order.id}`);
        },
        onError: () => {
          toast({ title: "Order failed", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="py-16 flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground mt-1 text-sm">Add some drinks from our menu</p>
          </div>
          <Button onClick={() => setLocation("/menu")} className="bg-primary text-primary-foreground">Browse Menu</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4 space-y-6">
        <h1 className="text-2xl font-serif font-bold text-foreground">Your Cart</h1>

        {/* Cart Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card border border-border rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.drinkImageUrl ? (
                    <img src={item.drinkImageUrl} alt={item.drinkName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Zap className="w-6 h-6 text-primary/30" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{item.drinkName}</p>
                  {(item.sugarLevel || item.iceLevel) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[item.sugarLevel && `Sugar: ${item.sugarLevel}`, item.iceLevel && `Ice: ${item.iceLevel}`].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {item.toppings && <p className="text-xs text-muted-foreground">{item.toppings}</p>}
                  <p className="text-primary font-bold text-sm mt-0.5">Rs {Math.round(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center ml-1 hover:bg-destructive/20">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Customer Info */}
        <div className="glass-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Contact Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">Name *</Label>
              <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" className="mt-1 bg-muted border-border" data-testid="input-customer-name" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
              <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" className="mt-1 bg-muted border-border" data-testid="input-customer-phone" />
            </div>
          </div>
        </div>

        {/* Order Type */}
        <div className="glass-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Order Type</h3>
          <div className="space-y-2">
            {ORDER_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setOrderType(type.value)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  orderType === type.value ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
                data-testid={`button-order-type-${type.value}`}
              >
                <div className="text-left">
                  <p className={`font-medium text-sm ${orderType === type.value ? "text-primary" : "text-foreground"}`}>{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                <span className={`text-sm font-semibold ${type.fee > 0 ? "text-foreground" : "text-primary"}`}>
                  {type.fee > 0 ? `+Rs ${type.fee}` : "Free"}
                </span>
              </button>
            ))}
          </div>
          {orderType === "delivery" && (
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address *</Label>
              <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Full address in Kathmandu" className="mt-1 bg-muted border-border" data-testid="input-delivery-address" />
            </div>
          )}
        </div>

        {/* Loyalty Points */}
        {user && user.loyaltyPoints > 0 && (
          <div className="glass-card border border-primary/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Loyalty Points
              </h3>
              <span className="text-sm text-primary font-bold">{user.loyaltyPoints} pts available</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={maxPoints}
                step={100}
                value={pointsToUse}
                onChange={(e) => setPointsToUse(Math.min(maxPoints, Math.max(0, Number(e.target.value))))}
                className="bg-muted border-border"
                placeholder="Points to redeem"
                data-testid="input-loyalty-points"
              />
              <Button variant="outline" size="sm" onClick={() => setPointsToUse(maxPoints)} className="whitespace-nowrap text-xs">
                Use Max
              </Button>
            </div>
            {pointsToUse > 0 && <p className="text-xs text-primary">Saving Rs {pointsDiscount}</p>}
          </div>
        )}

        {/* Order Summary */}
        <div className="glass-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({items.length} items)</span>
              <span>Rs {Math.round(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery fee</span>
              <span>{deliveryFee > 0 ? `Rs ${deliveryFee}` : "Free"}</span>
            </div>
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Points discount</span>
                <span>-Rs {pointsDiscount}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">Rs {Math.round(total)}</span>
            </div>
            {pointsEarned > 0 && (
              <p className="text-xs text-muted-foreground text-right">+{pointsEarned} points earned</p>
            )}
          </div>
        </div>

        {/* Place Order */}
        <Button
          onClick={handlePlaceOrder}
          disabled={createOrder.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 font-bold text-base"
          data-testid="button-place-order"
        >
          {createOrder.isPending ? "Placing Order..." : `Place Order — Rs ${Math.round(total)}`}
        </Button>
      </div>
    </Layout>
  );
}
