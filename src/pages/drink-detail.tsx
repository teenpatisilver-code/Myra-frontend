import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Minus, ShoppingBag, Zap, Flame, Sparkles, Star, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

async function fetchAIBenefits(name: string, description: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Health benefits of the drink "${name}"${description ? ` (${description})` : ""}. Give 3 short bullet points, each max 10 words. Then one sentence on best time to drink. Plain text, no markdown.`
      }]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange?.(s)} className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`w-5 h-5 transition-colors ${s <= value ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
        </button>
      ))}
    </div>
  );
}

export default function DrinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const { user } = useAuth();

  const [drink, setDrink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [aiBenefits, setAiBenefits] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("drinks").select("*, categories(name)").eq("id", id).single()
      .then(({ data }) => {
        if (!data) { setLocation("/menu"); return; }
        setDrink(data);
        setLoading(false);
        setAiLoading(true);
        fetchAIBenefits(data.name, data.description || "")
          .then(setAiBenefits).catch(() => setAiBenefits("")).finally(() => setAiLoading(false));
      });
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("drink_reviews")
      .select("*, profiles(full_name)")
      .eq("drink_id", id)
      .order("created_at", { ascending: false });
    const all = data || [];
    setReviews(all);
    if (all.length > 0) {
      setAvgRating(all.reduce((s: number, r: any) => s + r.rating, 0) / all.length);
    }
    if (user) {
      const mine = all.find((r: any) => r.user_id === user.id);
      if (mine) { setMyReview(mine); setRating(mine.rating); setComment(mine.comment || ""); }
    }
  };

  useEffect(() => { fetchReviews(); }, [id, user]);

  const submitReview = async () => {
    if (!user) { toast({ title: "Sign in to leave a review", variant: "destructive" }); return; }
    setSubmitting(true);
    if (myReview) {
      await supabase.from("drink_reviews").update({ rating, comment }).eq("id", myReview.id);
    } else {
      await supabase.from("drink_reviews").insert({ drink_id: id, user_id: user.id, rating, comment });
    }
    toast({ title: "Review submitted!" });
    setSubmitting(false);
    fetchReviews();
  };

  const handleAddToCart = () => {
    if (!drink) return;
    const price = drink.discount_fixed
      ? Math.max(0, Number(drink.price) - Number(drink.discount_fixed))
      : drink.discount_percent
      ? Number(drink.price) * (1 - Number(drink.discount_percent) / 100)
      : Number(drink.price);
    for (let i = 0; i < quantity; i++) {
      addItem({ drinkId: String(drink.id), drinkName: drink.name, drinkImageUrl: drink.image_url ?? null, price, quantity: 1, sugarLevel: null, iceLevel: null, toppings: null, notes: null });
    }
    toast({ title: `${quantity}× ${drink.name} added!` });
    setLocation("/cart");
  };

  if (loading) return (
    <Layout>
      <div className="py-8 space-y-4">
        <div className="h-72 rounded-2xl bg-muted animate-pulse" />
        <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
      </div>
    </Layout>
  );

  if (!drink) return null;

  const price = drink.discount_fixed
    ? Math.max(0, Number(drink.price) - Number(drink.discount_fixed))
    : drink.discount_percent
    ? Number(drink.price) * (1 - Number(drink.discount_percent) / 100)
    : Number(drink.price);

  return (
    <Layout>
      <div className="py-4 space-y-5 pb-32">
        <button onClick={() => setLocation("/menu")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>

        {/* Image */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted">
          {drink.image_url && !imgError
            ? <img src={drink.image_url} alt={drink.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            : <div className="w-full h-full flex items-center justify-center"><Zap className="w-20 h-20 text-primary/20" /></div>
          }
        </motion.div>

        {/* Info */}
        <div className="space-y-2">
          {drink.categories?.name && (
            <span className="text-xs text-secondary font-medium uppercase tracking-wider">{drink.categories.name}</span>
          )}
          <h1 className="text-2xl font-bold font-serif">{drink.name}</h1>
          {drink.description && <p className="text-muted-foreground text-sm">{drink.description}</p>}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">Rs {Math.round(price)}</span>
            {price < Number(drink.price) && (
              <span className="line-through text-sm text-muted-foreground">Rs {Math.round(Number(drink.price))}</span>
            )}
            {avgRating > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews.length})</span>
              </div>
            )}
          </div>

          {(drink.calories != null || drink.protein != null) && (
            <div className="flex gap-3">
              {drink.calories != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="w-3 h-3 text-orange-500" />{drink.calories} kcal
                </span>
              )}
              {drink.protein != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary" />{drink.protein}g protein
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI Benefits */}
        <div className="p-4 border border-primary/20 rounded-xl space-y-3 bg-primary/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-primary">AI Health Benefits</h3>
          </div>
          {aiLoading
            ? <p className="text-sm text-muted-foreground">Analyzing health benefits...</p>
            : aiBenefits
              ? <>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {expanded ? aiBenefits : aiBenefits.slice(0, 150) + (aiBenefits.length > 150 ? "..." : "")}
                  </p>
                  {aiBenefits.length > 150 && (
                    <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary">
                      {expanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </>
              : <p className="text-sm text-muted-foreground">No benefits available.</p>
          }
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Reviews</h3>

          {/* Write review */}
          <div className="glass-card rounded-xl p-4 border border-border space-y-3">
            <p className="text-sm font-medium">{myReview ? "Update your review" : "Leave a review"}</p>
            <StarRating value={rating} onChange={setRating} />
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button onClick={submitReview} disabled={submitting} size="sm" className="bg-primary text-primary-foreground px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Reviews list */}
          {reviews.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
            : reviews.map(r => (
                <div key={r.id} className="glass-card rounded-xl p-4 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {r.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-medium">{r.profiles?.full_name || "Customer"}</span>
                    </div>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))
          }
        </div>

        {/* Add to cart */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-lg mx-auto flex gap-3">
            <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <Button onClick={handleAddToCart} className="flex-1 bg-primary text-primary-foreground font-semibold h-11">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add • Rs {Math.round(price * quantity)}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
