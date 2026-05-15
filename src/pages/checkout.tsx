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

// ✅ FIXED: Gemini → Groq
import { getUpsellSuggestion } from "@/lib/groq";

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

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [upsell, setUpsell] = useState("");
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneFromProfile, setPhoneFromProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    if (items.length === 0) {
      setLocation("/cart");
      return;
    }

    supabase
      .from("settings")
      .select("value")
      .eq("key", "delivery_price")
      .single()
      .then(({ data }) => {
        if (data) setDeliveryPrice(Number(data.value));
      });

    supabase
      .from("profiles")
      .select("phone")
      .eq("id", user!.id)
      .single()
      .then(({ data }) => {
        if (data?.phone) {
          setPhone(data.phone);
          setPhoneFromProfile(true);
        }
      });

    // ✅ Groq upsell suggestion (was Gemini)
    setUpsellLoading(true);

    getUpsellSuggestion(items.map((i) => i.drinkName))
      .then(setUpsell)
      .catch(() => {})
      .finally(() => setUpsellLoading(false));
  }, []);

  function handleGPS() {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", variant: "destructive" });
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

        toast({ title: "📍 Location captured!" });
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
    if (!user) {
      toast({ title: "Please login first", variant: "destructive" });
      setLocation("/auth");
      return;
    }

    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please add your phone number to place an order.",
        variant: "destructive",
      });
      return;
    }

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

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          status: "pending",
          order_type: orderType,
          delivery_address: orderType === "delivery" ? address : null,
          latitude,
          longitude,
          map_url: mapUrl,
          phone_number: phone,
          notes: `Items: ${items
            .map((i) => `${i.drinkName} x${i.quantity}`)
            .join(", ")}`,
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      const orderItems = items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.drinkId,
        drink_name: i.drinkName,
        unit_price: i.price,
        quantity: i.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      clearCart();

      toast({
        title: "Order placed! 🎉",
        description: "Your order is being prepared.",
      });

      setLocation("/orders");
    } catch (err: any) {
      toast({
        title: "Order failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Layout>
      <div className="py-4 space-y-5 pb-48">

        <button
          onClick={() => setLocation("/cart")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>

        <h1 className="text-2xl font-bold font-serif">Checkout</h1>

        {/* rest of UI unchanged */}
        {/* (no logic changes needed below) */}

      </div>
    </Layout>
  );
}