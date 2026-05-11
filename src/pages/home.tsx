import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Leaf, Dumbbell, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import DrinkCard from "@/components/DrinkCard";
import {
  useListBanners,
  useGetFeaturedDrinks,
  useListCategories,
  useListDrinks,
  useGetTopDrinks,
} from "@/api";

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
  const { data: banners, isLoading } = useListBanners();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!banners?.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners?.length]);

  if (isLoading) return <Skeleton className="w-full h-48 md:h-64 rounded-2xl" />;
  if (!banners?.length) {
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

  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img src={banners[idx].imageUrl} alt={banners[idx].title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            <h2 className="text-2xl font-serif font-bold text-foreground">{banners[idx].title}</h2>
            {banners[idx].subtitle && (
              <p className="text-muted-foreground text-sm mt-1">{banners[idx].subtitle}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 glass rounded-full p-1.5 hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 glass rounded-full p-1.5 hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 right-4 flex gap-1">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-primary w-4" : "bg-muted-foreground"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategorySlider() {
  const { data: categories, isLoading } = useListCategories();

  if (isLoading) return (
    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-20 flex-shrink-0 rounded-xl" />)}
    </div>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
      {categories?.map((cat, i) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link href={`/menu?categoryId=${cat.id}`}>
            <div className="glass-card border border-border hover:border-primary/40 rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 hover:bg-primary/5 min-w-[80px]">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {cat.icon ? <span className="text-xl">{cat.icon}</span> : (CATEGORY_ICONS[cat.slug] ?? <Zap className="w-5 h-5" />)}
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

function DrinkGrid({ drinks, isLoading }: { drinks?: { id: number; name: string; description?: string | null; imageUrl?: string | null; price: number; discountPercent?: number | null; calories?: number | null; protein?: number | null; categoryName?: string | null; isAvailable: boolean }[]; isLoading?: boolean }) {
  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
    </div>
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {drinks?.slice(0, 4).map((drink, i) => (
        <motion.div key={drink.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <DrinkCard drink={drink} />
        </motion.div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: featuredDrinks, isLoading: featuredLoading } = useGetFeaturedDrinks();
  const { data: allDrinks, isLoading: allLoading } = useListDrinks();
  const { data: categories } = useListCategories();

  const gymCategoryId = categories?.find((c) => c.slug === "protein-drinks" || c.name.toLowerCase().includes("protein"))?.id;
  const newDrinks = allDrinks?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const gymDrinks = gymCategoryId ? allDrinks?.filter((d) => d.categoryId === gymCategoryId) : [];
  const offerDrinks = allDrinks?.filter((d) => d.discountPercent && d.discountPercent > 0);

  return (
    <Layout>
      <div className="py-4 space-y-8">
        {/* Hero banner */}
        <BannerSlider />

        {/* Category Slider */}
        <section>
          <h2 className="text-lg font-bold text-foreground font-serif tracking-wide mb-3">Categories</h2>
          <CategorySlider />
        </section>

        {/* Featured Drinks */}
        <section>
          <SectionHeader title="Featured Drinks" href="/menu?featured=true" />
          <DrinkGrid drinks={featuredDrinks} isLoading={featuredLoading} />
        </section>

        {/* New Arrivals */}
        <section>
          <SectionHeader title="New Arrivals" href="/menu" />
          <DrinkGrid drinks={newDrinks} isLoading={allLoading} />
        </section>

        {/* Gym Specials */}
        {gymDrinks && gymDrinks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground font-serif tracking-wide">Gym Specials</h2>
              <Badge className="bg-primary/20 text-primary border-primary/30">High Protein</Badge>
            </div>
            <DrinkGrid drinks={gymDrinks} isLoading={allLoading} />
          </section>
        )}

        {/* Offers */}
        {offerDrinks && offerDrinks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground font-serif tracking-wide">Current Offers</h2>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">Save More</Badge>
            </div>
            <DrinkGrid drinks={offerDrinks} isLoading={allLoading} />
          </section>
        )}
      </div>
    </Layout>
  );
}
