import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import DrinkCard from "@/components/DrinkCard";
import { useMenuItems, useFeaturedMenuItems } from "@/hooks/useMenuData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/hooks/useMenuData";

function BannerSlider() {
  const [banners, setBanners] = useState<any[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    supabase.from('ads').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data && data.length > 0) setBanners(data) })
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4000)
    return () => clearInterval(timer)
  }, [banners])

  if (banners.length === 0) {
    return (
      <div className="w-full h-48 md:h-64 rounded-2xl bg-gradient-to-br from-primary/20 via-muted to-secondary/20 flex items-center justify-center border border-primary/20">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary neon-text">MYRA DRINKS</h2>
          <p className="text-muted-foreground mt-2">Premium Beverages in Kathmandu</p>
          <Link href="/menu">
            <button className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:bg-primary/90 flex items-center gap-2 mx-auto">
              Order Now <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const banner = banners[current]
  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden">
      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-end p-5">
        <div>
          <h2 className="text-2xl font-bold text-white">{banner.title}</h2>
          {banner.subtitle && <p className="text-white/80 text-sm mt-1">{banner.subtitle}</p>}
          {banner.link_url && (
            <Link href={banner.link_url}>
              <button className="mt-3 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium">
                {banner.cta_text || 'Order Now'}
              </button>
            </Link>
          )}
        </div>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  )
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
  if (!drinks || drinks.length === 0) return (
    <div className="text-center py-8 text-muted-foreground">
      <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">No drinks yet — add some from admin!</p>
    </div>
  );
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
