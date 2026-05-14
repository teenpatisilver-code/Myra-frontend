import { useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();

  const placeOrder = async () => {
    if (!isAuthenticated) { setLocation('/auth'); return; }
    setPlacing(true);
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user!.id,
        total_amount: getTotal(),
        status: 'pending',
        notes: items.map(i => `${i.drinkName} x${i.quantity}`).join(', ')
      }).select().single();

      if (error) throw new Error('Order failed: ' + error.message);

      const { error: itemsError } = await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: order.id,
          menu_item_id: i.drinkId,
          drink_name: i.drinkName,
          unit_price: i.price,
          quantity: i.quantity,
          subtotal: i.price * i.quantity
        }))
      );

      if (itemsError) throw new Error('Order items failed: ' + itemsError.message);

      clearCart();
      toast({ title: "Order placed! 🎉", description: "Your order is being prepared." });
      setLocation('/orders');
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to place order.", variant: "destructive" });
    }
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="py-16 text-center space-y-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
          <p className="text-muted-foreground">Add some drinks to get started</p>
          <Button onClick={() => setLocation('/menu')} className="bg-primary text-primary-foreground">
            Browse Menu
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4 space-y-4">
        <h1 className="text-2xl font-bold font-serif text-foreground">Your Cart</h1>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4 border border-border flex items-center gap-3">
              {item.drinkImageUrl && (
                <img src={item.drinkImageUrl} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">{item.drinkName}</h3>
                <p className="text-primary font-bold">Rs {Math.round(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-semibold text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20">
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 ml-1">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>Rs {Math.round(getTotal())}</span>
          </div>
          <div className="flex justify-between font-bold text-foreground text-lg border-t border-border pt-3">
            <span>Total</span>
            <span className="text-primary">Rs {Math.round(getTotal())}</span>
          </div>
          <Button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold">
            {placing ? 'Placing Order...' : `Place Order • Rs ${Math.round(getTotal())}`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">+10 loyalty points with this order</p>
        </div>
      </div>
    </Layout>
  );
}
