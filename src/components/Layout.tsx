import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Home, UtensilsCrossed, Heart, User, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const LOGO = "https://pvlvcqdhdwpgmurkqywe.supabase.co/storage/v1/object/public/images/Logo/att.qgHU85Xzobn7nlSvRwTbI8T_CgEW5K8BRgfTk-tBNH4.jpeg"

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

export default function Layout({ children, hideNav }: LayoutProps) {
  const [location] = useLocation();
  const { items } = useCartStore();
  useAuth();

  const [socials, setSocials] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('settings')
      .select('key, value')
      .in('key', ['instagram_url', 'facebook_url', 'youtube_url', 'tiktok_url'])
      .then(({ data }) => {
        const map: Record<string, string> = {}
        data?.forEach(s => { map[s.key] = s.value })
        setSocials(map)
      })
  }, [])

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/menu", icon: UtensilsCrossed, label: "Menu" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const socialLinks = [
    { key: 'instagram_url', icon: <InstagramIcon />, label: 'Instagram' },
    { key: 'youtube_url', icon: <YouTubeIcon />, label: 'YouTube' },
    { key: 'tiktok_url', icon: <TikTokIcon />, label: 'TikTok' },
    { key: 'facebook_url', icon: <FacebookIcon />, label: 'Facebook' },
  ].filter(s => socials[s.key])

  return (
    <div className="min-h-screen text-foreground" style={{ background: "#F6F1EB" }}>

      <header
        className="sticky top-0 z-40"
        style={{
          background: "linear-gradient(180deg, #5B001E 0%, #3A0014 100%)",
          boxShadow: "0 4px 24px rgba(91,0,30,0.4)",
        }}
      >
        {cartCount > 0 && (
          <div className="text-xs text-center py-1.5 px-4 font-medium"
            style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
            🛒 {cartCount} item{cartCount > 1 ? "s" : ""} in your cart —{" "}
            <Link href="/cart" className="underline font-bold">View Cart</Link>
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo — cropped to MYRA letters only */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              {/* Golden glow behind */}
              <div
                className="absolute -inset-2 rounded-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300"
                style={{
                  background: "radial-gradient(ellipse, rgba(212,175,55,0.7) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              {/* Cropped viewport showing just MYRA text */}
              <div
                className="relative overflow-hidden transition-all duration-300 group-hover:scale-105"
                style={{
                  width: "96px",
                  height: "36px",
                  borderRadius: "6px",
                  border: "1px solid rgba(212,175,55,0.35)",
                  boxShadow: "0 0 16px rgba(212,175,55,0.3), 0 0 32px rgba(212,175,55,0.15)",
                }}
              >
                <img
                  src={LOGO}
                  alt="Myra"
                  style={{
                    width: "160px",
                    height: "160px",
                    objectFit: "cover",
                    position: "absolute",
                    left: "-32px",
                    top: "-62px",
                  }}
                />
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}
                  className="text-sm font-medium transition-colors"
                  style={{ color: location === item.path ? "#D4AF37" : "rgba(255,255,255,0.7)" }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/cart" className="relative">
              <ShoppingCart
                className="w-5 h-5"
                style={{ color: location === "/cart" ? "#D4AF37" : "rgba(255,255,255,0.7)" }}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ background: "#D4AF37", color: "#3A0014" }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24 md:pb-8 min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>

      {socialLinks.length > 0 && (
        <div
          className="pb-20 md:pb-4 pt-4 border-t"
          style={{
            background: "linear-gradient(180deg, #3A0014 0%, #2A000F 100%)",
            borderColor: "rgba(212,175,55,0.2)",
          }}
        >
          <p className="text-center text-xs mb-3" style={{ color: "rgba(212,175,55,0.6)" }}>
            Follow us
          </p>
          <div className="flex items-center justify-center gap-6">
            {socialLinks.map(s => (
              <a
                key={s.key}
                href={socials[s.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-100 opacity-70"
                style={{ color: "#D4AF37" }}
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          style={{
            background: "linear-gradient(180deg, #4A0019 0%, #2A000F 100%)",
            boxShadow: "0 -4px 24px rgba(91,0,30,0.5)",
          }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex flex-col items-center gap-0.5 relative px-3 py-1"
                >
                  <div className="relative">
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-full blur-md"
                        style={{ background: "rgba(212,175,55,0.3)", transform: "scale(1.8)" }}
                      />
                    )}
                    <item.icon
                      className="w-5 h-5 relative z-10 transition-colors"
                      style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.65)" }}
                    />
                  </div>
                  <span
                    className="text-xs transition-colors font-medium"
                    style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.65)" }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-0 right-0 h-0.5 rounded-b"
                      style={{ background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
