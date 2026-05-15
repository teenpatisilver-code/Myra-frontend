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

  useEffect(() => {
    if (!id) return;

    supabase
      .from("menu_items")
      .select("*, categories(name)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          supabase
            .from("drinks")
            .select("*, categories(name)")
            .eq("id", id)
            .single()
            .then(({ data: d2, error: e2 }) => {
              if (e2 || !d2) {
                setLocation("/menu");
                return;
              }

              setDrink(d2);
              setLoading(false);
              fetchAIBenefits(d2);
            });

          return;
        }

        setDrink(data);
        setLoading(false);
        fetchAIBenefits(data);
      });
  }, [id]);

  // ✅ Replaced Anthropic call with Groq helper
  const fetchAIBenefits = async (drink: any) => {
    setAiLoading(true);

    try {
      const text = await getAIBenefits(
        drink.name,
        drink.ingredients || ""
      );

      setAiBenefits(text);
    } catch {
      setAiBenefits("Could not load AI benefits.");
    }

    setAiLoading(false);
  };

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

  if (loading)
    return (
      <Layout>
        <div className="py-8 space-y-4">
          <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
        </div>
      </Layout>
    );

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

        {/* Image */}
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

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          {drink.categories?.name && (
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">
              {drink.categories.name}
            </span>
          )}

          <h1 className="text-2xl font-bold font-serif text-foreground">
            {drink.name}
          </h1>

          {drink.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {drink.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">
              Rs {Math.round(price)}
            </span>

            {hasDiscount && (
              <span className="text-muted-foreground line-through text-sm">
                Rs {Math.round(Number(drink.price))}
              </span>
            )}
          </div>

          {(drink.calories != null || drink.protein != null) && (
            <div className="flex gap-4 pt-1">
              {drink.calories != null && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {drink.calories} kcal
                </span>
              )}

              {drink.protein != null && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  {drink.protein}g protein
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-4 border border-border space-y-2"
          >
            <h3 className="font-semibold text-foreground text-sm">
              Ingredients
            </h3>

            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing: string) => (
                <span
                  key={ing}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                >
                  {ing}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4 border border-border space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              AI Health Benefits
            </h3>
          </div>

          {aiLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-muted animate-pulse"
                  style={{ width: `${70 + i * 10}%` }}
                />
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {expanded
                  ? aiBenefits
                  : aiBenefits.slice(0, 200) +
                    (aiBenefits.length > 200 ? "..." : "")}
              </p>

              {aiBenefits.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-primary text-xs font-medium"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Read less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Read more
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Fixed bottom cart bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-full bg-background flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>

            <span className="w-6 text-center font-semibold text-sm">
              {quantity}
            </span>

            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-full bg-background flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!drink.is_available}
            className="flex-1 bg-primary text-primary-foreground h-12 font-semibold"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart • Rs {Math.round(price * quantity)}
          </Button>
        </div>
      </div>
    </Layout>
  );
}