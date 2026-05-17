import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Heart, Star, ArrowLeft, Plus, Minus, ShoppingBag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { askGemini } from "@/lib/gemini";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange?.(s)} type="button"
          className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`w-5 h-5 transition-colors ${s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function DrinkDetailPage() {
  const [, params] = useRoute("/menu/:id");
  const id = params?.id;

  const [drink, setDrink] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [ingredientBenefits, setIngredientBenefits] = useState<Record<string, string>>({});
  const [benefitsLoading, setBenefitsLoading] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const fetchReviews = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("drink_reviews")
      .select("*, profiles(full_name, email)")
      .eq("drink_id", id)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  };

  useEffect(() => {
    if (!id) return;
    supabase.from("drinks").select("*, categories(name)").eq("id", id).single()
      .then(({ data }) => setDrink(data));
    fetchReviews();
    supabase.from("drink_likes").select("id", { count: "exact" }).eq("drink_id", id)
      .then(({ count }) => setLikeCount(count ?? 0));
    if (user) {
      supabase.from("drink_likes").select("id").eq("drink_id", id).eq("user_id", user.id).single()
        .then(({ data }) => setLiked(!!data));
    }
  }, [id, user]);

  // AI benefits — load all at once
  useEffect(() => {
    if (!drink?.ingredients) return;
    const ingredients = drink.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);
    if (ingredients.length === 0) return;

    setBenefitsLoading(true);

    // Load all benefits in parallel
    Promise.all(
      ingredients.map(async (ingredient: string) => {
        try {
          const benefit = await askGemini(
            `What is the main health benefit of ${ingredient}? Reply in exactly one sentence, max 12 words. Plain text only.`
          );
          return { ingredient, benefit: benefit.trim() };
        } catch {
          return { ingredient, benefit: "Supports overall wellbeing and vitality." };
        }
      })
    ).then(results => {
      const map: Record<string, string> = {};
      results.forEach(({ ingredient, benefit }) => { map[ingredient] = benefit; });
      setIngredientBenefits(map);
      setBenefitsLoading(false);
    });
  }, [drink]);

  const toggleLike = async () => {
    if (!isAuthenticated) { setLocation("/auth"); return; }
    if (liked) {
      await supabase.from("drink_likes").delete().eq("drink_id", id).eq("user_id", user!.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from("drink_likes").insert({ drink_id: id, user_id: user!.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) { setLocation("/auth"); return; }
    if (!comment.trim()) { toast({ title: "Please write a comment", variant: "destructive" }); return; }
    setSubmitting(true);

    const { data: existing } = await supabase
      .from("drink_reviews").select("id")
      .eq("drink_id", id).eq("user_id", user!.id).single();

    let error;
    if (existing) {
      const res = await supabase.from("drink_reviews").update({ rating, comment }).eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase.from("drink_reviews").insert({ drink_id: id, user_id: user!.id, rating, comment });
      error = res.error;
    }

    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: existing ? "Review updated! ⭐" : "Review submitted! ⭐" });
      setComment("");
      setRating(5);
      await fetchReviews(); // reload reviews immediately
    }
    setSubmitting(false);
  };

  const handleAddToCart = () => {
    if (!drink) return;
    addItem({
      drinkId: drink.id, drinkName: drink.name,
      drinkImageUrl: drink.image_url, price: Number(drink.price),
      quantity, sugarLevel: null, iceLevel: null, toppings: null, notes: null,
    });
    toast({ title: "Added to cart! 🛒", description: `${quantity}x ${drink.name}` });
  };

  if (!drink) {
    return (
      <Layout>
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <Layout>
      <div className="py-4 space-y-6 pb-24">

        <button onClick={() => setLocation("/menu")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>

        {/* Image */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted">
          {drink.image_url
            ? <img src={drink.image_url} alt={drink.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-6xl">🥤</div>
          }
          <button onClick={toggleLike}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${liked ? "bg-red-500 text-white" : "bg-black/40 text-white"}`}>
            <Heart className="w-5 h-5" fill={liked ? "white" : "none"} />
          </button>
          {likeCount > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Heart className="w-3 h-3 fill-red-400 text-red-400" /> {likeCount}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold font-serif">{drink.name}</h1>
            <span className="text-2xl font-bold text-primary">Rs {Math.round(Number(drink.price))}</span>
          </div>
          {drink.categories?.name && (
            <span className="text-xs text-secondary font-medium uppercase tracking-wider">{drink.categories.name}</span>
          )}
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          )}
          {drink.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{drink.description}</p>
          )}
        </div>

        {/* Health Benefits */}
        {drink.ingredients && (
          <div className="p-4 border border-border rounded-xl space-y-3 bg-muted/30">
            <h3 className="font-semibold text-sm text-foreground">Health Benefits</h3>
            {benefitsLoading && Object.keys(ingredientBenefits).length === 0 ? (
              <div className="space-y-3">
                {drink.ingredients.split(',').map((ing: string) => (
                  <div key={ing} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-base">🌿</span>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded animate-pulse w-20" />
                      <div className="h-2.5 bg-muted rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {drink.ingredients.split(',').map((ing: string) => {
                  const name = ing.trim();
                  return (
                    <div key={name} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-base">🌿</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-primary capitalize">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {ingredientBenefits[name] || (
                            <span className="inline-block w-32 h-2.5 bg-muted rounded animate-pulse mt-1" />
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quantity + Add to Cart */}
        <div className="glass-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button onClick={handleAddToCart} className="w-full bg-primary text-primary-foreground h-12 font-semibold">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart • Rs {Math.round(Number(drink.price) * quantity)}
          </Button>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>

          {/* Write review */}
          <div className="glass-card rounded-xl p-4 border border-border space-y-3">
            <p className="text-sm font-medium">{isAuthenticated ? "Leave a review" : "Sign in to review"}</p>
            <StarRating value={rating} onChange={isAuthenticated ? setRating : undefined} />
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to comment"}
                disabled={!isAuthenticated}
                onKeyDown={e => { if (e.key === 'Enter' && isAuthenticated) submitReview(); }}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <Button
                onClick={isAuthenticated ? submitReview : () => setLocation("/auth")}
                disabled={submitting}
                size="sm"
                className="bg-primary text-primary-foreground px-3 h-10"
              >
                {submitting ? "..." : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* All reviews */}
          {reviews.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
            : reviews.map(r => (
              <div key={r.id} className="glass-card rounded-xl p-4 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {(r.profiles?.full_name || r.profiles?.email || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">
                      {r.profiles?.full_name || r.profiles?.email?.split('@')[0] || "Customer"}
                    </span>
                  </div>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))
          }
        </div>

      </div>
    </Layout>
  );
}
