import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Plus, Minus, ShoppingBag,
  Zap, Flame, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { getAIBenefits } from "@/lib/groq";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";

export default function DrinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const [drink, setDrink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const [aiBenefits, setAiBenefits] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [imgError, setImgError] = useState(false);

  // -------------------------
  // FETCH DRINK
  // -------------------------
  useEffect(() => {
    if (!id) return;

    const fetchDrink = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (error || !data) {
        const { data: d2 } = await supabase
          .from("drinks")
          .select("*, categories(name)")
          .eq("id", id)
          .single();

        if (!d2) {
          setLocation("/menu");
          return;
        }

        setDrink(d2);
        setLoading(false);
        fetchAIBenefits(d2);
        return;
      }

      setDrink(data);
      setLoading(false);
      fetchAIBenefits(data);
    };

    fetchDrink();
  }, [id]);

  // -------------------------
  // GROQ AI CALL (SAFE)
  // -------------------------
  const fetchAIBenefits = async (drink: any) => {
    setAiLoading(true);

    try {
      const text = await getAIBenefits(
        drink?.name || "",
        drink?.ingredients || ""
      );

      setAiBenefits(text || "No AI response available.");
    } catch (err) {
      console.error(err);
      setAiBenefits("Could not load AI benefits right now.");
    } finally {
      setAiLoading(false);
    }
  };

  // -------------------------
  // ADD TO CART
  // -------------------------
  const handleAddToCart = () => {
    if (!drink) return;

    const drinkId = String(drink.id);

    const price = drink.discount_fixed
      ? Math.max(0, Number(drink.price) - Number(drink.discount_fixed))
      : drink.discount_percent
      ? Number(drink.price) * (1 - Number(drink.discount_percent) / 100)
      : Number(drink.price);

    addItem({
      drinkId,
      drinkName: drink.name,
      drinkImageUrl: drink.image_url ?? null,
      price,
      quantity,
      sugarLevel: null,
      iceLevel: null,
      toppings: null,
      notes: null,
    });

    toast({
      title: "Added to cart 🎉",
      description: `${quantity}× ${drink.name}`,
    });

    setLocation("/cart");
  };

  // -------------------------
  // LOADING STATE
  // -------------------------
  if (loading) {
    return (
      <Layout>
        <div className="py-8 space-y-4">
          <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!drink) return null;

  const price = drink.discount_fixed
    ? Math.max(0, Number(drink.price) - Number(drink.discount_fixed))
    : drink.discount_percent
    ? Number(drink.price) * (1 - Number(drink.discount_percent) / 100)
    : Number(drink.price);

  const hasDiscount = price < Number(drink.price);

  const ingredients = drink.ingredients
    ? drink.ingredients
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  // -------------------------
  // UI
  // -------------------------
  return (
    <Layout>
      <div className="py-4 space-y-5 pb-32">

        <button
          onClick={() => setLocation("/menu")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        {/* IMAGE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full aspect-square max-h-72 rounded-2xl overflow-hidden bg-muted"
        >
          {drink.image_url && !imgError ? (
            <img
              src={drink.image_url}
              alt={drink.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="w-20 h-20 text-primary/20" />
            </div>
          )}
        </motion.div>

        {/* INFO */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold">{drink.name}</h1>

          {drink.description && (
            <p className="text-muted-foreground text-sm">
              {drink.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">
              Rs {Math.round(price)}
            </span>

            {hasDiscount && (
              <span className="line-through text-sm text-muted-foreground">
                Rs {Math.round(Number(drink.price))}
              </span>
            )}
          </div>
        </motion.div>

        {/* INGREDIENTS */}
        {ingredients.length > 0 && (
          <div className="p-4 border rounded-xl space-y-2">
            <h3 className="font-semibold text-sm">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing: string) => (
                <span
                  key={ing}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI */}
        <div className="p-4 border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">AI Health Benefits</h3>
          </div>

          {aiLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading AI insights...
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {expanded
                ? aiBenefits
                : aiBenefits.slice(0, 200) +
                  (aiBenefits.length > 200 ? "..." : "")}
            </p>
          )}

          {aiBenefits.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary"
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>

        {/* CART BUTTON */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-lg mx-auto flex gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus />
              </button>

              <span>{quantity}</span>

              <button onClick={() => setQuantity((q) => q + 1)}>
                <Plus />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              className="flex-1"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add • Rs {Math.round(price * quantity)}
            </Button>
          </div>
        </div>

      </div>
    </Layout>
  );
}