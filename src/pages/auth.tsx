import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 neon-glow">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-primary neon-text">MYRA</h1>
            <p className="text-muted-foreground text-sm">Premium Drinks, Kathmandu</p>
          </div>

          {/* Tabs */}
          <div className="flex glass rounded-xl p-1">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`button-auth-tab-${tab}`}
              >
                {tab === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="glass-card border border-border rounded-2xl p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {mode === "register" && (
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={form.name} onChange={handleChange("name")} placeholder="Your name" className="mt-1 bg-muted border-border" data-testid="input-name" />
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input type="email" value={form.email} onChange={handleChange("email")} placeholder="you@email.com" className="mt-1 bg-muted border-border" data-testid="input-email" />
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
                  data-testid="input-password"
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
                  <Input value={form.phone} onChange={handleChange("phone")} placeholder="+977 98XXXXXXXX" className="mt-1 bg-muted border-border" data-testid="input-phone" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Referral Code (optional)</Label>
                  <Input value={form.referralCode} onChange={handleChange("referralCode")} placeholder="Friend's referral code" className="mt-1 bg-muted border-border" data-testid="input-referral-code" />
                  <p className="text-xs text-muted-foreground mt-1">Get bonus points when you sign up with a referral code</p>
                </div>
              </>
            )}

            <Button
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={isSubmitting || loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              data-testid="button-auth-submit"
            >
              {isSubmitting || loading
                ? "Please wait..."
                : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </div>

          {/* Guest */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">or</p>
            <Button variant="ghost" onClick={handleGuestCheckout} className="text-muted-foreground hover:text-foreground text-sm" data-testid="button-guest">
              Continue as Guest
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
