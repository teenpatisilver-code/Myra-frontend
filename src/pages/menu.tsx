import { useState } from "react";
import { useSearch } from "wouter";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import DrinkCard from "@/components/DrinkCard";
import { useCategories, useMenuItems } from "@/hooks/useMenuData";

export default function MenuPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("categoryId") ?? null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: drinks, isLoading: drinksLoading } = useMenuItems();

  const filtered = drinks?.filter((d) => {
    const matchesCategory = selectedCategory
      ? d.categoryName === categories?.find(c => c.id === selectedCategory)?.name
      : true;
    const matchesSearch = searchQuery
      ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="py-5 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: "#3A0014" }}>
            Our Menu
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(58,0,20,0.6)" }}>
            Premium drinks for every mood
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(58,0,20,0.4)" }} />
          <input
            type="search"
            placeholder="Search drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#111111",
              boxShadow: "0 2px 12px rgba(91,0,30,0.08)",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4" style={{ color: "rgba(58,0,20,0.4)" }} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={selectedCategory === null ? {
              background: "linear-gradient(180deg, #5B001E 0%, #3A0014 100%)",
              color: "#D4AF37",
              boxShadow: "0 4px 12px rgba(91,0,30,0.3)",
            } : {
              background: "rgba(255,255,255,0.7)",
              color: "rgba(58,0,20,0.7)",
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            All
          </button>
          {catLoading && Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
          ))}
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={selectedCategory === cat.id ? {
                background: "linear-gradient(180deg, #5B001E 0%, #3A0014 100%)",
                color: "#D4AF37",
                boxShadow: "0 4px 12px rgba(91,0,30,0.3)",
              } : {
                background: "rgba(255,255,255,0.7)",
                color: "rgba(58,0,20,0.7)",
                border: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Count */}
        {!drinksLoading && (
          <p className="text-xs" style={{ color: "rgba(58,0,20,0.5)" }}>
            {filtered?.length ?? 0} drink{filtered?.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Grid */}
        {drinksLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-60 rounded-3xl animate-pulse"
                style={{ background: "linear-gradient(180deg, #3A0014 0%, #22000C 100%)", opacity: 0.3 }} />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "#3A0014" }} />
            <p className="font-medium" style={{ color: "#3A0014" }}>No drinks found</p>
            <p className="text-sm mt-1" style={{ color: "rgba(58,0,20,0.6)" }}>Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered?.map((drink, i) => (
              <motion.div key={drink.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <DrinkCard drink={drink} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
