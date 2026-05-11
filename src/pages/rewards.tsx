import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Star, TrendingUp, Gift, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGetLoyaltyPoints, useGetLoyaltyHistory, useRedeemLoyaltyPoints, getGetLoyaltyPointsQueryKey, getGetLoyaltyHistoryQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";

const HOW_IT_WORKS = [
  { icon: "01", title: "Earn Points", desc: "Get 2 points for every Rs 100 spent on orders" },
  { icon: "02", title: "Refer Friends", desc: "Earn 50 bonus points when a friend signs up with your code" },
  { icon: "03", title: "Redeem Rewards", desc: "Use 100 points to get a discount or free item" },
];

export default function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [redeemPoints, setRedeemPoints] = useState(100);

  const { data: loyalty, isLoading } = useGetLoyaltyPoints(
    user?.id ?? 0,
    { query: { enabled: !!user, queryKey: getGetLoyaltyPointsQueryKey(user?.id ?? 0) } }
  );

  const { data: history, isLoading: histLoading } = useGetLoyaltyHistory(
    user?.id ?? 0,
    { query: { enabled: !!user, queryKey: getGetLoyaltyHistoryQueryKey(user?.id ?? 0) } }
  );

  const redeemMutation = useRedeemLoyaltyPoints();

  const nextMilestone = Math.ceil((loyalty?.totalPoints ?? 0) / 100) * 100;
  const progress = ((loyalty?.totalPoints ?? 0) % 100);

  const handleRedeem = () => {
    if (!user) return;
    if ((loyalty?.totalPoints ?? 0) < redeemPoints) {
      toast({ title: "Insufficient points", variant: "destructive" });
      return;
    }
    redeemMutation.mutate(
      { userId: user.id, data: { points: redeemPoints, description: "Points redeemed for reward" } },
      {
        onSuccess: () => {
          toast({ title: "Points redeemed!", description: `${redeemPoints} points used successfully.` });
          queryClient.invalidateQueries({ queryKey: getGetLoyaltyPointsQueryKey(user.id) });
          queryClient.invalidateQueries({ queryKey: getGetLoyaltyHistoryQueryKey(user.id) });
        },
      }
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-16 text-center text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sign in to view your rewards</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4 space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Loyalty Rewards</h1>
          <p className="text-muted-foreground text-sm mt-1">Earn points with every order</p>
        </div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-6 border border-primary/30 neon-glow"
          style={{ background: "linear-gradient(135deg, rgba(57,255,20,0.08) 0%, rgba(0,0,0,0) 60%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          {isLoading ? <Skeleton className="h-20 w-full" /> : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Available Points</span>
              </div>
              <div className="text-5xl font-bold text-primary neon-text" data-testid="text-loyalty-points">
                {loyalty?.totalPoints ?? 0}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{progress} / 100 to next reward</span>
                  <span>{nextMilestone - (loyalty?.totalPoints ?? 0)} more needed</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Lifetime</p>
                  <p className="font-bold text-foreground">{loyalty?.lifetimePoints ?? 0} pts</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Redeemed</p>
                  <p className="font-bold text-foreground">{loyalty?.redeemedPoints ?? 0} pts</p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Redeem */}
        <div className="glass-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> Redeem Points</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Points to redeem (min 100)</Label>
              <Input
                type="number"
                min={100}
                step={100}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Math.max(100, Number(e.target.value)))}
                className="mt-1 bg-muted border-border"
                data-testid="input-redeem-points"
              />
            </div>
            <Button
              onClick={handleRedeem}
              disabled={redeemMutation.isPending || (loyalty?.totalPoints ?? 0) < redeemPoints}
              className="bg-primary text-primary-foreground"
              data-testid="button-redeem"
            >
              {redeemMutation.isPending ? "..." : "Redeem"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">100 points = Rs 10 discount on your next order</p>
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">How It Works</h3>
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div key={item.icon} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card border border-border rounded-xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{item.icon}</div>
              <div>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* History */}
        <div className="glass-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Points History</h3>
          {histLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : history?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {history?.slice().reverse().map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`item-loyalty-${tx.id}`}>
                  <div className="flex items-center gap-2">
                    {tx.points > 0
                      ? <ArrowUpRight className="w-4 h-4 text-primary flex-shrink-0" />
                      : <ArrowDownRight className="w-4 h-4 text-destructive flex-shrink-0" />}
                    <div>
                      <p className="text-sm text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${tx.points > 0 ? "text-primary" : "text-destructive"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
