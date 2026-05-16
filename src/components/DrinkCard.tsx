import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Zap, Flame, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { MenuItem } from "@/hooks/useMenuData";

interface DrinkCardProps {
  drink: MenuItem;
}

export default function DrinkCard({ drink }: DrinkCardProps) {
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    // Get like count
    supabase
      .from("drink_likes")
      .select("id", { count: "exact" })
      .eq("drink_id", drink.id)
      .then(({ count }) => setLikeCount(count ?? 0));

    // Check if user liked
    if (user) {
      supabase
        .from("drink_likes")
        .select("id")
        .eq("drink_id", drink.id)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setLiked(!!data));
    }
  }, [drink.id, user]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to like drinks", variant: "destructive" });
      return;
    }
    if (liked) {
      await supabase.from("drink_likes").delete().eq("drink_id", drink.id).eq("user_id", user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from("drink_likes").insert({ drink_id: drink.id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const discountedPrice = (() => {
    if (drink.discountFixed != null && drink.discountFixed > 0)
      return Math.max(0, drink.price - drink.discountFixed);
    if (drink.discountPercent != null && drink.discountPercent > 0)
      return drink.price * (1 - drink.discountPercent / 100);
    return drink.price;
  })();
  const hasDiscount = discountedPrice < drink.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!drink.isAvailable) return;
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
    toast({ title: "Added to cart", description: drink.name });
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link href={`/menu/${drink.id}`}>
        <div className="glass-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer h-full flex flex-col">
          <div className="relative aspect-square bg-muted overflow-hidden">
            {drink.imageUrl && !imgError ? (
              <img
                src={drink.imageUrl}
                alt={drink.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Zap className="w-12 h-12 text-primary/30" />
              </div>
            )}
            {hasDiscount && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground font-bold text-xs">
                {drink.discountFixed != null && drink.discountFixed > 0
                  ? `-Rs ${Math.round(drink.discountFixed)}`
                  : `-${Math.round(drink.discountPercent ?? 0)}%`}
              </Badge>
            )}
            {/* Like button */}
            <button
              onClick={toggleLike}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur flex items-center justify-center transition-all hover:scale-110"
            >
              <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
            {!drink.isAvailable && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <span className="text-muted-foreground font-medium text-sm">Unavailable</span>
              </div>
            )}
          </div>
          <div className="p-3 flex flex-col flex-1 gap-2">
            {drink.categoryName && (
              <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                {drink.categoryName}
              </span>
            )}
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
              {drink.name}
            </h3>
            {(drink.calories != null || drink.protein != null) && (
              <div className="flex items-center gap-3">
                {drink.calories != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {drink.calories} kcal
                  </span>
                )}
                {drink.protein != null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-primary" />
                    {drink.protein}g protein
                  </span>
                )}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between pt-1">
              <div>
                <span className="font-bold text-foreground text-base">
                  Rs {Math.round(discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through ml-1">
                    Rs {Math.round(drink.price)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {likeCount > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                    {likeCount}
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={!drink.isAvailable}
                  className="h-7 w-7 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
