import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const LOGO = "https://pvlvcqdhdwpgmurkqywe.supabase.co/storage/v1/object/public/images/Logo/att.qgHU85Xzobn7nlSvRwTbI8T_CgEW5K8BRgfTk-tBNH4.jpeg"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { signUp, signIn, loading, error } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    referralCode: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Error", description: "Email and password required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await signIn(form.email, form.password);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: `Welcome back!` });
      setLocation("/");
    } else {
      toast({ title: "Login failed", description: result.error || "Invalid email or password", variant: "destructive" });
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Error", description: "Name, email and password required", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await signUp(form.email, form.password, form.name);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Account created!", description: "Please check your email to confirm your account" });
      setForm({ name: "", email: "", password: "", phone: "", referralCode: "" });
      setMode("login");
    } else {
      toast({ title: "Registration failed", description: result.error || "Please try again", variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleGuestCheckout = () => {
    setLocation("/menu");
  };

  return (
    <Layout hideNav>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Logo */}
          <div className="flex flex-col items-center">
            <img
              src={LOGO}
              alt="Myra Mocktail Bar"
              className="w-28 h-28 rounded-full object-cover mb-3 shadow-xl shadow-purple-900/60 border-2 border-purple-800/40"
            />
            <p className="text-muted-foreground text-sm">Premium Mocktail Bar, Kathmandu</p>
          </div>

          {/* Tabs */}
          <div className="flex glass rounded-xl p-1">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="glass-card border border-border rounded-2xl p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {mode === "register" && (
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={form.name} onChange={handleChange("name")} placeholder="Your name" className="mt-1 bg-muted border-border" />
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input type="email" value={form.email} onChange={handleChange("email")} placeholder="you@email.com" className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Password"
                  className="bg-muted border-border pr-10"
                />
                <button onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {mode === "register" && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone (optional)</Label>
                  <Input value={form.phone} onChange={handleChange("phone")} placeholder="+977 98XXXXXXXX" className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Referral Code (optional)</Label>
                  <Input value={form.referralCode} onChange={handleChange("referralCode")} placeholder="Friend's referral code" className="mt-1 bg-muted border-border" />
                  <p className="text-xs text-muted-foreground mt-1">Get bonus points when you sign up with a referral code</p>
                </div>
              </>
            )}

            <Button
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={isSubmitting || loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isSubmitting || loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full border-border hover:bg-muted flex items-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="text-center">
            <Button variant="ghost" onClick={handleGuestCheckout} className="text-muted-foreground hover:text-foreground text-sm">
              Continue as Guest
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
