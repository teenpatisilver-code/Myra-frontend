import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Leaf, Dumbbell, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import DrinkCard from "@/components/DrinkCard";
import { useCategories, useMenuItems, useFeaturedMenuItems } from "@/hooks/useMenuData";
import type { MenuItem } from "@/hooks/useMenuData";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "protein-drinks": <Dumbbell className="w-5 h-5" />,
  "healthy-juice": <Leaf className="w-5 h-5" />,
  "mocktails": <Zap className="w-5 h-5" />,
  "smoothies": <Zap className="w-5 h-5" />,
  "coffee": <Zap className="w-5 h-5" />,
  "energy-drinks": <Zap className="w-5 h-5" />,
  "snacks": <Tag className="w-5 h-5" />,
};

function BannerSlider() {
  return (
    <div className="w-full h-48 md:h-64 rounded-2xl bg-gradient-to-br from-primary/20 via-muted to-secondary/20 flex items-center justify-center border border-primary/20">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary neon-text">MYRA DRINKS</h2>
        <p className="text-muted-foreground mt-2">Premium Beverages in Kathmandu</p>
        <Link href="/menu">
          <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            Order Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CategorySlider() {
  const { data: categories, isLoading } = useCategories();
  if (isLoading) return (
    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-20 flex-shrink-0 rounded-xl" />)}
    </div>
  );
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
      {categories?.map((cat, i) => (
        <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Link href={`/menu?categoryId=${cat.id}`}>
            <div className="glass-card border border-border hover:border-primary/40 rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 hover:bg-primary/5 min-w-[80px]">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {CATEGORY_ICONS[cat.slug] ?? <Zap className="w-5 h-5" />}
              </div>
              <span className="text-xs font-medium text-center leading-tight text-foreground">{cat.name}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-foreground font-serif tracking-wide">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
        See all <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function DrinkGrid({ drinks, isLoading }: { drinks?: MenuItem[]; isLoading?: boolean }) {
  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
    </div>
  );
  if (!drinks || drinks.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {drinks.slice(0, 4).map((drink, i) => (
        <motion.div key={drink.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <DrinkCard drink={drink} />
        </motion.div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: allDrinks, isLoading: allLoading } = useMenuItems();
  const { data: featuredDrinks, isLoading: featuredLoading } = useFeaturedMenuItems();

  const newDrinks = allDrinks
    ? [...allDrinks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : undefined;

  return (
    <Layout>
      <div className="py-4 space-y-8">
        <BannerSlider />
        <section>
          <h2 className="text-lg font-bold text-foreground font-serif tracking-wide mb-3">Categories</h2>
          <CategorySlider />
        </section>
        <section>
          <SectionHeader title="Featured Drinks" href="/menu?featured=true" />
          <DrinkGrid drinks={featuredDrinks ?? undefined} isLoading={featuredLoading} />
        </section>
        <section>
          <SectionHeader title="New Arrivals" href="/menu" />
          <DrinkGrid drinks={newDrinks} isLoading={allLoading} />
        </section>
      </div>
    </Layout>
  );
}
