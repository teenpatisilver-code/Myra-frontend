import { motion } from "framer-motion";
import { ShoppingBag, DollarSign, Clock, Users, AlertTriangle, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AdminLayout from "@/components/AdminLayout";
import { useGetAdminDashboard, useGetDailySales, useGetAdminAnalytics } from "@/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  preparing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

function StatCard({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: React.ElementType; sub?: string; color?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color ?? "bg-primary/10"}`}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

function InsightCard({ insight }: { insight: { type: string; message: string; trend?: string | null; value?: string | null } }) {
  const TrendIcon = insight.trend === "up" ? TrendingUp : insight.trend === "down" ? TrendingDown : Minus;
  const trendColor = insight.trend === "up" ? "text-primary" : insight.trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 p-3 glass-card border border-border rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{insight.message}</p>
        {insight.value && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {insight.value}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const { data: dailySales, isLoading: salesLoading } = useGetDailySales();
  const { data: analytics, isLoading: analyticsLoading } = useGetAdminAnalytics();

  const stats = [
    { label: "Total Orders", value: dashboard?.totalOrders ?? 0, icon: ShoppingBag, sub: `${dashboard?.pendingOrders ?? 0} pending` },
    { label: "Today Revenue", value: `Rs ${Math.round(dashboard?.todayRevenue ?? 0)}`, icon: DollarSign, sub: `Rs ${Math.round(dashboard?.totalRevenue ?? 0)} total` },
    { label: "Pending Orders", value: dashboard?.pendingOrders ?? 0, icon: Clock, sub: "Needs action", color: "bg-yellow-500/10" },
    { label: "Total Users", value: dashboard?.totalUsers ?? 0, icon: Users },
    { label: "Low Stock Items", value: dashboard?.lowStockCount ?? 0, icon: AlertTriangle, sub: "Check inventory", color: "bg-destructive/10" },
    { label: "Points Issued", value: dashboard?.totalLoyaltyPointsIssued ?? 0, icon: TrendingUp, sub: "All time" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of Myra Drinks</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* AI Insights */}
        <div className="glass-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Business Insights</h3>
            <span className="text-xs text-muted-foreground ml-auto">Auto-generated</span>
          </div>
          {analyticsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : analytics?.insights?.length ? (
            <div className="space-y-2">
              {analytics.insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Place some orders to see insights</p>
          )}
        </div>

        {/* Top Drinks */}
        {analytics?.topDrinks && analytics.topDrinks.length > 0 && (
          <div className="glass-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4">Top Selling Drinks</h3>
            <div className="space-y-2">
              {analytics.topDrinks.slice(0, 5).map((d, i) => (
                <div key={d.drinkId} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (d.totalSold / (analytics.topDrinks[0].totalSold || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-primary">{d.totalSold} sold</p>
                    <p className="text-xs text-muted-foreground">Rs {Math.round(d.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Chart */}
        <div className="glass-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Daily Sales (Last 30 Days)</h3>
          {salesLoading ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailySales ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: number) => [`Rs ${Math.round(value)}`, "Revenue"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="revenue" fill="hsl(109 100% 54%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="glass-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium hidden md:table-cell">Type</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard?.recentOrders?.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 font-medium text-foreground">#{order.id}</td>
                      <td className="py-2.5 text-muted-foreground">{order.customerName}</td>
                      <td className="py-2.5 text-muted-foreground capitalize hidden md:table-cell">{order.orderType.replace("_", " ")}</td>
                      <td className="py-2.5 font-semibold text-primary">Rs {Math.round(order.total)}</td>
                      <td className="py-2.5">
                        <Badge className={`text-xs ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>{order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
