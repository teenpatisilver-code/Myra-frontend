import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  MapPin,
  Store,
  Dumbbell,
  Truck,
  ArrowLeft,
  CheckCircle,
  Navigation,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { getUpsellSuggestion } from "@/lib/gemini";

type OrderType = "pickup" | "revolve_fitness" | "delivery";

const ORDER_TYPES = [
  {
    key: "pickup" as OrderType,
    label: "Pickup",
    description: "Collect from our store",
    icon: Store,
    price: 0,
  },
  {
    key: "revolve_fitness" as OrderType,
    label: "Revolve Fitness",
    description: "Delivered to the gym",
    icon: Dumbbell,
    price: 0,
  },
  {
    key: "delivery" as OrderType,
    label: "Delivery",
    description: "Delivered to your door",
    icon: Truck,
    price: null,
  },
];

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [deliveryPrice, setDeliveryPrice] = useState(150);
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);

  // GPS + Gemini states
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [upsell, setUpsell] = useState("");
  const [upsellLoading, setUpsellLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    if (items.length === 0) {
      setLocation("/cart");
      return;
    }

    // Fetch delivery price
    supabase
      .from("settings")
      .select("value")
      .eq("key", "delivery_price")
      .single()
      .then(({ data }) => {
        if (data) setDeliveryPrice(Number(data.value));
      });

    // Gemini upsell
    setUpsellLoading(true);

    getUpsellSuggestion(items.map((i) => i.drinkName))
      .then(setUpsell)
      .catch(() => {})
      .finally(() => setUpsellLoading(false));
  }, []);

  function handleGPS() {
    if (!navigator.geolocation) {
      toast({
        title: "GPS not supported",
        variant: "destructive",
      });
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        setGpsLoading(false);

        toast({
          title: "📍 Location captured!",
        });
      },
      (err) => {
        setGpsLoading(false);

        toast({
          title: "GPS failed: " + err.message,
          variant: "destructive",
        });
      }
    );
  }

  const deliveryFee = orderType === "delivery" ? deliveryPrice : 0;
  const subtotal = getTotal();
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (orderType === "delivery" && !address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your delivery address.",
        variant: "destructive",
      });
      return;
    }

    setPlacing(true);

    try {
      const mapUrl =
        latitude && longitude
          ? `https://www.google.com/maps?q=${latitude},${longitude}`
          : null;

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          total_amount: total,
          status: "pending",
          order_type: orderType,
          delivery_address:
            orderType === "delivery" ? address : null,
          latitude: latitude,
          longitude: longitude,
          map_url: mapUrl,
          notes: `Items: ${items
            .map((i) => `${i.drinkName} x${i.quantity}`)
            .join(", ")}`,
        })
        .select()
        .single();

      if (error) {
        throw new Error("Order failed: " + error.message);
      }

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          items.map((i) => ({
            order_id: order.id,
            menu_item_id: i.drinkId,
            drink_name: i.drinkName,
            unit_price: i.price,
            quantity: i.quantity,
          }))
        );

      if (itemsError) {
        throw new Error(
          "Order items failed: " + itemsError.message
        );
      }

      clearCart();

      toast({
        title: "Order placed! 🎉",
        description: "Your order is being prepared.",
      });

      setLocation("/orders");
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message || "Failed to place order.",
        variant: "destructive",
      });
    }

    setPlacing(false);
  };

  return (
    <Layout>
      <div className="py-4 space-y-5 pb-32">
        <button
          onClick={() => setLocation("/cart")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>

        <h1 className="text-2xl font-bold font-serif text-foreground">
          Checkout
        </h1>

        {/* Order Type */}
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground text-sm">
            How would you like to receive your order?
          </h2>

          <div className="grid gap-3">
            {ORDER_TYPES.map(
              ({ key, label, description, icon: Icon }) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOrderType(key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    orderType === key
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      orderType === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      {label}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  <div className="text-right">
                    {key === "delivery" ? (
                      <span className="text-sm font-bold text-foreground">
                        Rs {deliveryPrice}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-green-400">
                        Free
                      </span>
                    )}
                  </div>

                  {orderType === key && (
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </motion.button>
              )
            )}
          </div>
        </div>

        {/* Delivery Address */}
        {orderType === "delivery" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Delivery Address
            </h2>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full delivery address..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
            />

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 border border-border rounded-xl p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {gpsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}

              {gpsLoading
                ? "Getting location..."
                : "Use Current Location (GPS)"}
            </button>

            {/* GPS confirmation */}
            {latitude && longitude && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-2">
                <MapPin className="w-3 h-3" />
                GPS captured: {latitude.toFixed(5)},{" "}
                {longitude.toFixed(5)}
              </div>
            )}
          </motion.div>
        )}

        {/* AI Upsell Banner */}
        {(upsell || upsellLoading) && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
            🤖{" "}
            <span className="font-semibold">
              AI Suggestion:
            </span>{" "}
            {upsellLoading ? "Thinking..." : upsell}
          </div>
        )}

        {/* Order Summary */}
        <div className="glass-card rounded-2xl p-4 border border-border space-y-2">
          <h2 className="font-semibold text-foreground text-sm mb-3">
            Order Summary
          </h2>

          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm text-muted-foreground"
            >
              <span>
                {item.drinkName} × {item.quantity}
              </span>

              <span>
                Rs {Math.round(item.price * item.quantity)}
              </span>
            </div>
          ))}

          <div className="border-t border-border pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs {Math.round(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fee</span>

              <span
                className={
                  deliveryFee === 0
                    ? "text-green-400 font-medium"
                    : ""
                }
              >
                {deliveryFee === 0
                  ? "Free"
                  : `Rs ${deliveryFee}`}
              </span>
            </div>

            <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2 mt-1">
              <span>Total</span>

              <span className="text-primary">
                Rs {Math.round(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Place Order */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={placeOrder}
              disabled={placing}
              className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold"
            >
              {placing
                ? "Placing Order..."
                : `Place Order • Rs ${Math.round(total)}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
              +10 loyalty points with this order
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}