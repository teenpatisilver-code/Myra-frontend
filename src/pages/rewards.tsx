import { useEffect, useState } from "react";
import { Star, Gift, Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export default function RewardsPage() {
  const { user, isAuthenticated } = useAuth();
  const [points, setPoints] = useState(0);
  const [config, setConfig] = useState({ points_per_order: 10, min_redeem: 500, referral_bonus: 100 });
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('loyalty_points').eq('id', user.id).single()
      .then(({ data }) => setPoints(data?.loyalty_points || 0));
    supabase.from('loyalty_config').select('*').single()
      .then(({ data }) => { if (data) setConfig(data); });
  }, [user]);

  const referralCode = user?.id?.slice(0, 8).toUpperCase() || '';

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://myra-frontend.vercel.app/auth?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) return (
    <Layout>
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Please login to view rewards</h2>
        <Button onClick={() => setLocation('/auth')} className="bg-primary text-primary-foreground">Login</Button>
      </div>
    </Layout>
  );

  const progressToRedeem = Math.min((points / config.min_redeem) * 100, 100);

  return (
    <Layout>
      <div className="py-4 space-y-6">
        <h1 className="text-2xl font-bold font-serif text-foreground">Rewards</h1>

        {/* Points Card */}
        <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Points</p>
              <p className="text-3xl font-bold text-primary">{points} pts</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{points} pts</span>
              <span>{config.min_redeem} pts to redeem</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressToRedeem}%` }} />
            </div>
          </div>
          {points >= config.min_redeem && (
            <Button className="w-full bg-primary text-primary-foreground">Redeem {config.min_redeem} Points</Button>
          )}
        </div>

        {/* How to earn */}
        <div className="glass-card rounded-2xl p-5 border border-border space-y-3">
          <h3 className="font-semibold text-foreground">How to Earn Points</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Place an Order</p>
                <p className="text-muted-foreground text-xs">Earn {config.points_per_order} points per order</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Refer a Friend</p>
                <p className="text-muted-foreground text-xs">Earn {config.referral_bonus} points per referral</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Redeem Rewards</p>
                <p className="text-muted-foreground text-xs">Use {config.min_redeem} points for discounts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral */}
        <div className="glass-card rounded-2xl p-5 border border-border space-y-3">
          <h3 className="font-semibold text-foreground">Your Referral Code</h3>
          <p className="text-sm text-muted-foreground">Share this link and earn {config.referral_bonus} points when a friend signs up</p>
          <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
            <code className="flex-1 text-sm text-primary font-mono">{referralCode}</code>
            <button onClick={copyReferral} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={copyReferral} variant="outline" className="w-full border-primary/30 text-primary">
            {copied ? 'Copied!' : 'Copy Referral Link'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
