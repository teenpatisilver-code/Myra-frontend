import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, Flame, Zap, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/hooks/useMenuData";

async function fetchAIBenefits(drinkName: string, description: string | null | undefined): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a health and nutrition expert. For the drink "${drinkName}"${description ? ` described as: "${description}"` : ""}, provide exactly this format and nothing else:

SUMMARY: [one sentence health benefit, max 20 words]
BENEFIT1: [key benefit, max 8 words]
BENEFIT2: [key benefit, max 8 words]
BENEFIT3: [key benefit, max 8 words]
BEST_TIME: [best time to drink, one short sentence]`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

function parseAIResponse(text: string) {
  const get = (key: string) => {
    const match = text.match(new RegExp(`${key}:\\s*(.+)`));
    return match?.[1]?.trim() ?? null;
  };
  return {
    summary: get("SUMMARY"),
    benefits: [get("BENEFIT1"), get("BENEFIT2"), get("BENEFIT3")].filter(Boolean) as string[],
    bestTime: get("BEST_TIME"),
  };
}

export default function DrinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const [drink, setDrink] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("drinks")
      .select("*, categories(name)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        setDrink({
          id: String(data.id),
          name: data.name,
          description: data.description,
          imageUrl: data.image_url,
          price: Number(data.price),
          discountPercent: data.discount_percent ? Number(data.discount_percent) : null,
          discountFixed: data.discount_fixed ? Number(data.discount_fixed) : null,
          calories: data.calories,
          protein: data.protein ? Number(data.protein) : null,
          categoryName: data.categories?.name ?? null,
          isAvailable: data.is_available,
          is_featured: data.is_featured,
          created_at: data.created_at,
        });
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!drink) return;
    setAiLoading(true);
    fetchAIBenefits(drink.name, drink.description)
      .then(setAiText)
      .catch(() => setAiText(null))
      .finally(() => setAiLoading(false));
  }, [drink]);

  const discountedPrice = (() => {
    if (!drink) return 0;
    if (drink.discountFixed != null && drink.discountFixed > 0)
      return Math.max(0, drink.price - drink.discountFixed);
    if (drink.discountPercent != null && drink.discountPercent > 0)
      return drink.price * (1 - drink.discountPercent / 100);
    return drink.price;
  })();

  const hasDiscount = drink ? discountedPrice < drink.price : false;
  const parsed = aiText ? parseAIResponse(aiText) : null;

  const handleAddToCart = () => {
    if (!drink || !drink.isAvailable) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        drinkId: drink.id,
        drinkName: drink.name,
        drinkImageUrl: drink.imageUrl ?? null,
        price: discountedPrice,
        quantity: 1,
        sugarLevel: null,
        iceLevel: null,
        toppings: null,
        notes: null,
      });
    }
    toast({ title: `${quantity}x ${drink.name} added to cart!` });
    setLocation("/cart");
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 py-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Layout>
    );
  }

  if (!drink) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Zap className="w-12 h-12 text-primary/30 mb-4" />
          <h2 className="text-lg font-semibold">Drink not found</h2>
          <Button variant="ghost" onClick={() => setLocation("/menu")} className="mt-2">
            Back to Menu
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-24">
        {/* Back button */}
        <button onClick={() => setLocation("/menu")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Menu</span>
        </button>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden aspect-video bg-muted mb-5"
        >
          {drink.imageUrl && !imgError ? (
            <img
              src={drink.imageUrl}
              alt={drink.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Zap className="w-16 h-16 text-primary/30" />
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold">
              {drink.discountFixed != null && drink.discountFixed > 0
                ? `-Rs ${Math.round(drink.discountFixed)}`
                : `-${Math.round(drink.discountPercent ?? 0)}%`}
            </Badge>
          )}
          {!drink.isAvailable && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-muted-foreground font-medium">Currently Unavailable</span>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {drink.categoryName && (
            <span className="text-xs text-secondary font-medium uppercase tracking-wider">
              {drink.categoryName}
            </span>
          )}
          <h1 className="text-2xl font-serif font-bold text-foreground">{drink.name}</h1>

          {drink.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{drink.description}</p>
          )}

          {/* Nutrition */}
          {(drink.calories != null || drink.protein != null) && (
            <div className="flex gap-4">
              {drink.calories != null && (
                <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">{drink.calories} kcal</span>
                </div>
              )}
              {drink.protein != null && (
                <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{drink.protein}g protein</span>
                </div>
              )}
            </div>
          )}

          {/* AI Benefits */}
          <div className="glass-card border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI Health Insights</span>
            </div>

            {aiLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : parsed ? (
              <div className="space-y-3">
                {parsed.summary && (
                  <p className="text-sm text-foreground leading-relaxed">{parsed.summary}</p>
                )}
                {parsed.benefits.length > 0 && (
                  <ul className="space-y-1.5">
                    {parsed.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">✦</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {parsed.bestTime && (
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {showMore ? "Less" : "Best time to drink"}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
                  </button>
                )}
                {showMore && parsed.bestTime && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    🕐 {parsed.bestTime}
                  </motion.p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Health insights unavailable.</p>
            )}
          </div>

          {/* Price + Quantity + Add to Cart */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={!drink.isAvailable}
                className="flex-1 bg-primary text-primary-foreground font-semibold h-11"
              >
                Add to Cart · Rs {Math.round(discountedPrice * quantity)}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
