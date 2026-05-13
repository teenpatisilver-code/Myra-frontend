import Layout from "@/components/Layout";
export default function CartPage() {
  return (
    <Layout>
      <div className="py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground font-serif">Cart</h1>
        <p className="text-muted-foreground mt-2">Your cart is empty</p>
      </div>
    </Layout>
  );
}
