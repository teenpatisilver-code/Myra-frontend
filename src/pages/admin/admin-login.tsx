import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ADMIN_CREDENTIALS = {
  email: "admin@myra.com",
  password: "admin123", // Change this in production
};

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Error", description: "Email and password required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // Simple check (in production, use a backend API)
    if (form.email === ADMIN_CREDENTIALS.email && form.password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem("adminToken", "true");
      toast({ title: "Welcome admin!" });
      setLocation("/admin/dashboard");
    } else {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary">MYRA ADMIN</h1>
          <p className="text-muted-foreground text-sm">Management Portal</p>
        </div>

        {/* Form */}
        <div className="glass-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="admin@myra.com"
              className="mt-1 bg-muted border-border"
            />
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
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {isSubmitting ? "Logging in..." : "Admin Login"}
          </Button>
        </div>

        {/* Back to customer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Customer login?{" "}
            <a href="/auth" className="text-primary hover:underline">
              Go here
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
