import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Flame, Zap, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";
import { useGetDrink, getGetDrinkQueryKey } from "@/api";

const SUGAR_LEVELS = ["none", "low", "medium", "high"];
const ICE_LEVELS = ["no ice", "less", "regular", "extra"];
const TOPPINGS = ["Lemon", "Mint", "Basil", "Chia Seeds"];

export default function DrinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const drinkId = Number(id);
  const { data: drink, isLoading } = useGetDrink(drinkId, {
    query: { enabled: !!drinkId, queryKey: getGetDrinkQueryKey(drinkId) },
  });

  const [quantity, setQuantity] = useState(1);
  const [sugarLevel, setSugarLevel] = useState("medium");
  const [iceLevel, setIceLevel] = useState("regular");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="py-4 space-y-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!drink) {
    return (
      <Layout>
        <div className="py-16 text-center text-muted-foreground">
          <p>Drink not found.</p>
          <Button variant="outline" onClick={() => setLocation("/menu")} className="mt-4">Back to Menu</Button>
        </div>
      </Layout>
    );
  }

  const discountedPrice = (() => {
    if (drink.discountFixed != null && drink.discountFixed > 0) return Math.max(0, drink.price - drink.discountFixed);
    if (drink.discountPercent != null && drink.discountPercent > 0) return drink.price * (1 - drink.discountPercent / 100);
    return drink.price;
  })();
  const hasDiscount = discountedPrice < drink.price;

  const toggleTopping = (t: string) => {
    setSelectedToppings((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleAddToCart = () => {
    addItem({
      drinkId: drink.id,
      drinkName: drink.name,
      drinkImageUrl: drink.imageUrl ?? null,
      price: discountedPrice,
      quantity,
      sugarLevel,
      iceLevel,
      toppings: selectedToppings.join(", ") || null,
      notes: notes || null,
    });
    toast({ title: "Added to cart!", description: `${quantity}x ${drink.name}` });
    setLocation("/cart");
  };

  return (
    <Layout>
      <div className="py-4 space-y-5">
        {/* Back button */}
        <button onClick={() => setLocation("/menu")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-video md:aspect-[3/1.5] rounded-2xl overflow-hidden bg-muted"
        >
          {drink.imageUrl && !imgError ? (
            <img src={drink.imageUrl} alt={drink.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <Zap className="w-20 h-20 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold">
              {drink.discountFixed != null && drink.discountFixed > 0
                ? `-Rs ${Math.round(drink.discountFixed)} OFF`
                : `-${Math.round(drink.discountPercent ?? 0)}% OFF`}
            </Badge>
          )}
        </motion.div>

        {/* Info */}
        <div>
          {drink.categoryName && <p className="text-secondary text-sm font-medium uppercase tracking-wider">{drink.categoryName}</p>}
          <h1 className="text-2xl font-serif font-bold text-foreground mt-1">{drink.name}</h1>
          {drink.description && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{drink.description}</p>}

          <div className="flex items-center gap-4 mt-3">
            {drink.calories != null && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flame className="w-4 h-4 text-orange-500" /> {drink.calories} kcal
              </span>
            )}
            {drink.protein != null && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" /> {drink.protein}g protein
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold text-primary">Rs {Math.round(discountedPrice)}</span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-lg">Rs {Math.round(drink.price)}</span>
            )}
          </div>
        </div>

        {/* Customization */}
        <div className="space-y-5">
          {/* Sugar Level */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Sugar Level</h3>
            <div className="flex gap-2 flex-wrap">
              {SUGAR_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSugarLevel(level)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-all border ${
                    sugarLevel === level
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-sugar-${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Ice Level */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Ice Level</h3>
            <div className="flex gap-2 flex-wrap">
              {ICE_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setIceLevel(level)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-all border ${
                    iceLevel === level
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-ice-${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Toppings</h3>
            <div className="grid grid-cols-2 gap-2">
              {TOPPINGS.map((topping) => (
                <label key={topping} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedToppings.includes(topping)}
                    onCheckedChange={() => toggleTopping(topping)}
                    data-testid={`checkbox-topping-${topping.toLowerCase().replace(" ", "-")}`}
                  />
                  <span className="text-sm text-foreground">{topping}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Special Notes</h3>
            <Textarea
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-card border-border resize-none"
              rows={3}
              data-testid="input-notes"
            />
          </div>
        </div>

        {/* Quantity + Add to Cart */}
        <div className="sticky bottom-20 md:bottom-4 flex items-center gap-3 glass rounded-2xl p-3">
          <div className="flex items-center gap-2 glass-card border border-border rounded-xl px-2 py-1">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} data-testid="button-quantity-minus">
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-foreground w-6 text-center" data-testid="text-quantity">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} data-testid="button-quantity-plus">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!drink.isAvailable}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            data-testid="button-add-to-cart"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart — Rs {Math.round(discountedPrice * quantity)}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
