import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import DrinkCard from "@/components/DrinkCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { MenuItem } from "@/hooks/useMenuData";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [drinks, setDrinks] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("drink_likes")
      .select("drink_id, drinks(*, categories(name))")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const mapped = (data ?? []).map((row: any) => ({
          id: String(row.drinks.id),
          name: row.drinks.name,
          description: row.drinks.description,
          imageUrl: row.drinks.image_url,
          price: Number(row.drinks.price),
          discountPercent: row.drinks.discount_percent ? Number(row.drinks.discount_percent) : null,
          discountFixed: row.drinks.discount_fixed ? Number(row.drinks.discount_fixed) : null,
          calories: row.drinks.calories,
          protein: row.drinks.protein ? Number(row.drinks.protein) : null,
          categoryName: row.drinks.categories?.name ?? null,
          isAvailable: row.drinks.is_available,
          is_featured: row.drinks.is_featured,
          created_at: row.drinks.created_at,
        }));
        setDrinks(mapped);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Heart className="w-12 h-12 text-primary/30" />
          <h2 className="text-xl font-bold">Your Favorites</h2>
          <p className="text-muted-foreground text-sm">Sign in to save your favorite drinks</p>
          <Button onClick={() => setLocation("/auth")} className="bg-primary text-primary-foreground">
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4 space-y-5">
        <div>
          <h1 className="text-2xl font-serif font-bold">Favorites</h1>
          <p className="text-muted-foreground text-sm mt-1">Drinks you love</p>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : drinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Heart className="w-12 h-12 text-primary/30" />
            <p className="font-medium">No favorites yet</p>
            <p className="text-sm text-muted-foreground">Tap the ❤️ on any drink to save it here</p>
            <Button variant="ghost" onClick={() => setLocation("/menu")}>Browse Menu</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {drinks.map(drink => <DrinkCard key={drink.id} drink={drink} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
