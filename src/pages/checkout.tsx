import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Bike, Store, UtensilsCrossed, CheckCircle, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type OrderType = "pickup" | "delivery" | "revolve_fitness" | "dine_in";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(100);

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'delivery_fee').single()
      .then(({ data }) => { if (data) setDeliveryFee(parseInt(data.value) || 100) })
  }, [])

  const fee = orderType === "delivery" ? deliveryFee : 0;
  const total = getTotal() + fee;

  const handlePlaceOrder = async () => {
    if (!user) { setLocation("/auth"); return; }
    if (items.length === 0) return;
    if (orderType === "delivery" && !address.trim()) {
      toast({ title: "Please enter delivery address", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }

    setPlacing(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_amount: total,
          order_type: orderType,
          delivery_address: orderType === "delivery" ? address : null,
          phone_number: phone,
          notes: notes || null,
        })
        .select()
        .single();

      if (error || !order) throw new Error(error?.message || 'Order failed');

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          menu_item_id: item.drinkId,
          drink_name: item.drinkName,
          quantity: item.quantity,
          unit_price: item.price,
        }))
      );

      if (itemsError) throw new Error(itemsError.message);

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      toast({ title: "Failed to place order", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <Layout hideNav>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6 py-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
            <h1 className="text-3xl font-serif font-bold">Order Placed! 🎉</h1>
            <p className="text-muted-foreground">We've received your order and will start preparing it shortly.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => setLocation("/orders")} className="bg-primary text-primary-foreground w-full">Track My Order</Button>
            <Button variant="ghost" onClick={() => setLocation("/menu")} className="w-full">Order More</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="py-4 pb-32 max-w-lg mx-auto space-y-6">
        <button onClick={() => setLocation("/cart")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Cart</span>
        </button>

        <h1 className="text-2xl font-serif font-bold">Checkout</h1>

        {/* Order Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Order Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: "pickup" as OrderType, icon: Store, label: "Pickup", sub: "Free" },
              { type: "delivery" as OrderType, icon: Bike, label: "Delivery", sub: `+Rs ${deliveryFee}` },
              { type: "revolve_fitness" as OrderType, icon: Dumbbell, label: "Revolve Fitness", sub: "Free" },
              { type: "dine_in" as OrderType, icon: UtensilsCrossed, label: "Dine In", sub: "Free" },
            ].map(({ type, icon: Icon, label, sub }) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  orderType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs opacity-70">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX" className="pl-9 bg-card border-border" />
          </div>
        </div>

        {/* Delivery Address */}
        <AnimatePresence>
          {orderType === "delivery" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <Label className="text-sm font-semibold">Delivery Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  rows={3}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">💡 Include landmarks for faster delivery</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Special Instructions <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Extra ice, no sugar, etc." className="bg-card border-border" />
        </div>

        {/* Order Summary */}
        <div className="glass-card rounded-2xl p-5 border border-border space-y-3">
          <h3 className="font-semibold text-sm">Order Summary</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.drinkName} × {item.quantity}</span>
                <span>Rs {Math.round(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs {Math.round(getTotal())}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span>Rs {fee}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground text-base">
              <span>Total</span>
              <span className="text-primary">Rs {Math.round(total)}</span>
            </div>
          </div>
        </div>

        {/* Place Order */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-lg mx-auto">
            <Button onClick={handlePlaceOrder} disabled={placing || items.length === 0}
              className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base">
              {placing ? "Placing Order..." : `Place Order · Rs ${Math.round(total)}`}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
