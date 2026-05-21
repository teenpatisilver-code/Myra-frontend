import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Zap, Flame, Heart } from "lucide-react";
import { motion } from "framer-motion";
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
    supabase.from("drink_likes").select("id", { count: "exact" }).eq("drink_id", drink.id)
      .then(({ count }) => setLikeCount(count ?? 0));
    if (user) {
      supabase.from("drink_likes").select("id").eq("drink_id", drink.id).eq("user_id", user.id).single()
        .then(({ data }) => setLiked(!!data));
    }
  }, [drink.id, user]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast({ title: "Sign in to like drinks", variant: "destructive" }); return; }
    if (liked) {
      await supabase.from("drink_likes").delete().eq("drink_id", drink.id).eq("user_id", user.id);
      setLiked(false); setLikeCount(c => c - 1);
    } else {
      await supabase.from("drink_likes").insert({ drink_id: drink.id, user_id: user.id });
      setLiked(true); setLikeCount(c => c + 1);
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
    e.preventDefault(); e.stopPropagation();
    if (!drink.isAvailable) return;
    addItem({
      drinkId: drink.id, drinkName: drink.name,
      drinkImageUrl: drink.imageUrl ?? null,
      price: discountedPrice, quantity: 1,
      sugarLevel: null, iceLevel: null, toppings: null, notes: null,
    });
    toast({ title: "Added to cart ✨", description: drink.name });
  };

  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link href={`/menu/${drink.id}`}>
        <div className="overflow-hidden cursor-pointer h-full flex flex-col"
          style={{
            background: "linear-gradient(180deg, #3A0014 0%, #22000C 100%)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: "24px",
            boxShadow: "0 8px 32px rgba(91,0,30,0.3), inset 0 1px 0 rgba(212,175,55,0.1)",
          }}>

          {/* Image */}
          <div className="relative aspect-square overflow-hidden" style={{ borderRadius: "24px 24px 0 0" }}>
            {drink.imageUrl && !imgError ? (
              <img src={drink.imageUrl} alt={drink.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3A0014, #5B001E)" }}>
                <Zap className="w-12 h-12" style={{ color: "rgba(212,175,55,0.3)" }} />
              </div>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#D4AF37", color: "#3A0014" }}>
                {drink.discountFixed != null && drink.discountFixed > 0
                  ? `-Rs ${Math.round(drink.discountFixed)}`
                  : `-${Math.round(drink.discountPercent ?? 0)}%`}
              </div>
            )}

            {/* Like button */}
            <button onClick={toggleLike}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
              <Heart className="w-4 h-4 transition-colors"
                style={{ color: liked ? "#ef4444" : "rgba(255,255,255,0.7)", fill: liked ? "#ef4444" : "none" }} />
            </button>

            {/* Unavailable overlay */}
            {!drink.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Unavailable</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 flex flex-col flex-1 gap-1.5">
            {drink.categoryName && (
              <span className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "#D4AF37", opacity: 0.8 }}>
                {drink.categoryName}
              </span>
            )}
            <h3 className="font-semibold text-sm leading-tight line-clamp-2" style={{ color: "#FFFFFF" }}>
              {drink.name}
            </h3>

            {(drink.calories != null || drink.protein != null) && (
              <div className="flex items-center gap-2">
                {drink.calories != null && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <Flame className="w-3 h-3 text-orange-400" />{drink.calories} kcal
                  </span>
                )}
                {drink.protein != null && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <Zap className="w-3 h-3" style={{ color: "#D4AF37" }} />{drink.protein}g
                  </span>
                )}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between pt-1">
              <div>
                <span className="font-bold text-base" style={{ color: "#FFFFFF" }}>
                  Rs {Math.round(discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs line-through ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Rs {Math.round(drink.price)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {likeCount > 0 && (
                  <span className="text-xs flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Heart className="w-3 h-3 fill-red-400 text-red-400" />{likeCount}
                  </span>
                )}
                <button onClick={handleAddToCart} disabled={!drink.isAvailable}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(180deg, #E0B84F 0%, #B8860B 100%)",
                    boxShadow: "0 4px 12px rgba(212,175,55,0.4)",
                  }}>
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
