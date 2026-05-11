import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/AdminLayout";
import { useListOrders, useUpdateOrderStatus, useDeleteOrder, getListOrdersQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; nextStatus?: string; nextLabel?: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", nextStatus: "accepted", nextLabel: "Accept" },
  accepted: { label: "Accepted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", nextStatus: "preparing", nextLabel: "Start Preparing" },
  preparing: { label: "Preparing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", nextStatus: "completed", nextLabel: "Mark Complete" },
  completed: { label: "Completed", color: "bg-primary/20 text-primary border-primary/30" },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive border-destructive/30" },
};

const STATUS_TABS = ["all", "pending", "accepted", "preparing", "completed", "cancelled"];

type OrderRowProps = {
  order: {
    id: number; customerName: string; orderType: string; total: number;
    status: string; createdAt: string; deliveryAddress?: string | null;
    notes?: string | null; pointsEarned: number;
  };
};

function OrderRow({ order }: OrderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  const handleAdvance = () => {
    if (!cfg.nextStatus) return;
    updateStatus.mutate({ id: order.id, data: { status: cfg.nextStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: `Order #${order.id} ${cfg.nextLabel?.toLowerCase()}` });
      },
    });
  };

  const handleCancel = () => {
    updateStatus.mutate({ id: order.id, data: { status: "cancelled" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: `Order #${order.id} cancelled` });
      },
    });
  };

  const handleDelete = () => {
    if (!confirm(`Permanently delete order #${order.id}?`)) return;
    deleteOrder.mutate({ id: order.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: `Order #${order.id} deleted` });
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <p className="font-bold text-foreground">#{order.id}</p>
            <p className="text-xs text-muted-foreground">{order.customerName}</p>
          </div>
          <div className="hidden md:block">
            <p className="text-muted-foreground capitalize">{order.orderType.replace("_", " ")}</p>
            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div>
            <p className="font-semibold text-primary">Rs {Math.round(order.total)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {order.deliveryAddress && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Address:</span> {order.deliveryAddress}</p>}
          {order.notes && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Notes:</span> {order.notes}</p>}
          <p className="text-xs text-muted-foreground">+{order.pointsEarned} points earned by customer</p>
          <div className="flex gap-2 flex-wrap">
            {cfg.nextStatus && (
              <Button size="sm" onClick={handleAdvance} disabled={updateStatus.isPending} className="bg-primary text-primary-foreground">
                {cfg.nextLabel}
              </Button>
            )}
            {order.status !== "completed" && order.status !== "cancelled" && (
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={updateStatus.isPending} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                Cancel
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleteOrder.isPending} className="border-destructive/30 text-destructive hover:bg-destructive/10 ml-auto">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function exportToCSV(orders: Array<{ id: number; customerName: string; orderType: string; total: number; status: string; createdAt: string }>) {
  const headers = ["ID", "Customer", "Type", "Total (Rs)", "Status", "Date"];
  const rows = orders.map((o) => [
    o.id, o.customerName, o.orderType, Math.round(o.total), o.status,
    new Date(o.createdAt).toLocaleString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: orders, isLoading } = useListOrders(
    activeTab !== "all" ? { status: activeTab } : undefined,
    { query: { queryKey: getListOrdersQueryKey(activeTab !== "all" ? { status: activeTab } : undefined) } }
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">{orders?.length ?? 0} orders</p>
          </div>
          {orders && orders.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportToCSV(orders)} className="border-border text-muted-foreground hover:text-foreground gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><p>No {activeTab !== "all" ? activeTab : ""} orders</p></div>
        ) : (
          <div className="space-y-3">
            {orders?.map((order) => <OrderRow key={order.id} order={order} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
