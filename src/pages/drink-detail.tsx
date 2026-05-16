import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Heart, Star, ArrowLeft, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function DrinkDetailPage() {
  const [, params] = useRoute("/menu/:id");
  const id = params?.id;

  const [drink, setDrink] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!id) return;

    supabase
      .from("drinks")
      .select("*, categories(name)")
      .eq("id", id)
      .single()
      .then(({ data }) => setDrink(data));

    supabase
      .from("drink_reviews")
      .select("*, profiles(name)")
      .eq("drink_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data || []));

    if (user) {
      supabase
        .from("drink_likes")
        .select("id")
        .eq("drink_id", id)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setLiked(!!data));
    }
  }, [id, user]);

  /* UPDATED UUID SAFE FUNCTION */
  const toggleLike = async () => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    if (liked) {
      await supabase
        .from("drink_likes")
        .delete()
        .eq("drink_id", id)
        .eq("user_id", user!.id);

      setLiked(false);
    } else {
      const { error } = await supabase
        .from("drink_likes")
        .insert({
          drink_id: id,
          user_id: user!.id,
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setLiked(true);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("drink_reviews").insert({
      drink_id: id,
      user_id: user!.id,
      rating,
      comment,
    });

    if (!error) {
      toast({ title: "Review submitted! ⭐" });
      setComment("");
      setRating(5);

      supabase
        .from("drink_reviews")
        .select("*, profiles(name)")
        .eq("drink_id", id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []));
    } else {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setSubmitting(false);
  };

  const handleAddToCart = () => {
    if (!drink) return;

    addItem({
      drinkId: drink.id,
      drinkName: drink.name,
      drinkImageUrl: drink.image_url,
      price: Number(drink.price),
      quantity,
      sugarLevel: null,
      iceLevel: null,
      toppings: null,
      notes: null,
    });

    toast({
      title: "Added to cart! 🛒",
      description: `${quantity}x ${drink.name}`,
    });
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

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <Layout>
      <div className="py-4 space-y-6 pb-24">
        <button
          onClick={() => setLocation("/menu")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>

        {/* Image */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted">
          {drink.image_url ? (
            <img
              src={drink.image_url}
              alt={drink.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🥤
            </div>
          )}

          <button
            onClick={toggleLike}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              liked ? "bg-red-500 text-white" : "bg-black/40 text-white"
            }`}
          >
            <Heart className="w-5 h-5" fill={liked ? "white" : "none"} />
          </button>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold font-serif">{drink.name}</h1>
            <span className="text-2xl font-bold text-primary">
              Rs {Math.round(Number(drink.price))}
            </span>
          </div>

          {drink.categories?.name && (
            <span className="text-xs text-secondary font-medium uppercase tracking-wider">
              {drink.categories.name}
            </span>
          )}

          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium">{avgRating}</span>
              <span className="text-xs text-muted-foreground">
                ({reviews.length} reviews)
              </span>
            </div>
          )}

          {drink.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {drink.description}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="glass-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantity</span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-6 text-center font-bold">{quantity}</span>

              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full bg-primary text-primary-foreground h-12 font-semibold"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart • Rs {Math.round(Number(drink.price) * quantity)}
          </Button>
        </div>
      </div>
    </Layout>
  );
}