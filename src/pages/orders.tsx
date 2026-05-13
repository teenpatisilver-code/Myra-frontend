import Layout from "@/components/Layout";
export default function OrdersPage() {
  return (
    <Layout>
      <div className="py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground font-serif">My Orders</h1>
        <p className="text-muted-foreground mt-2">No orders yet</p>
      </div>
    </Layout>
  );
}