import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, ShoppingCart, Check, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useListDrinks, useListCategories, useCreateOrder } from "@/api";

interface CartItem {
  drinkId: number;
  name: string;
  price: number;
  discountFixed?: number | null;
  discountPercent?: number | null;
  imageUrl?: string | null;
  quantity: number;
}

function getEffectivePrice(price: number, discountFixed?: number | null, discountPercent?: number | null) {
  if (discountFixed != null && discountFixed > 0) return Math.max(0, price - discountFixed);
  if (discountPercent != null && discountPercent > 0) return price * (1 - discountPercent / 100);
  return price;
}

export default function AdminPosPage() {
  const { data: drinks, isLoading } = useListDrinks();
  const { data: categories } = useListCategories();
  const createOrder = useCreateOrder();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [orderType, setOrderType] = useState("pickup");
  const [success, setSuccess] = useState(false);

  const addToCart = (drink: { id: number; name: string; price: number; discountFixed?: number | null; discountPercent?: number | null; imageUrl?: string | null }) => {
    setCart((c) => {
      const existing = c.find((i) => i.drinkId === drink.id);
      if (existing) return c.map((i) => i.drinkId === drink.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { drinkId: drink.id, name: drink.name, price: drink.price, discountFixed: drink.discountFixed, discountPercent: drink.discountPercent, imageUrl: drink.imageUrl, quantity: 1 }];
    });
  };

  const updateQty = (drinkId: number, delta: number) => {
    setCart((c) => c.map((i) => i.drinkId === drinkId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  };

  const filteredDrinks = (drinks ?? []).filter((d) =>
    d.isAvailable &&
    (selectedCat == null || d.categoryId === selectedCat) &&
    (search === "" || d.name.toLowerCase().includes(search.toLowerCase()))
  );

  const subtotal = cart.reduce((sum, item) => sum + getEffectivePrice(item.price, item.discountFixed, item.discountPercent) * item.quantity, 0);
  const deliveryFee = orderType === "delivery" ? 100 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0) { toast({ title: "Cart is empty" }); return; }
    createOrder.mutate({
      data: {
        customerName,
        orderType,
        items: cart.map((i) => ({ drinkId: i.drinkId, quantity: i.quantity })),
      },
    }, {
      onSuccess: (order) => {
        setCart([]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        toast({ title: `Order #${order.id} placed — Rs ${Math.round(total)}` });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Left: Menu */}
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-serif font-bold text-foreground">POS Mode</h1>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drinks..." className="bg-muted border-border pl-9" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setSelectedCat(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCat == null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              All
            </button>
            {categories?.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCat === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Drink Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredDrinks.map((drink) => {
                const effPrice = getEffectivePrice(drink.price, drink.discountFixed, drink.discountPercent);
                const inCart = cart.find((c) => c.drinkId === drink.id);
                return (
                  <motion.button key={drink.id} whileTap={{ scale: 0.97 }} onClick={() => addToCart(drink)}
                    className={`glass-card border rounded-xl p-3 text-left transition-all relative ${inCart ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"}`}>
                    {drink.imageUrl && (
                      <div className="w-full aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                        <img src={drink.imageUrl} alt={drink.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="font-medium text-xs text-foreground leading-tight truncate">{drink.name}</p>
                    <p className="text-primary font-bold text-sm mt-0.5">Rs {Math.round(effPrice)}</p>
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="glass-card border border-border rounded-xl p-4 space-y-4 sticky top-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Current Order</h2>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Clear</button>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Customer Name</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 bg-muted border-border text-sm h-8" />
            </div>

            <div className="flex gap-2">
              {["pickup", "gym_upstairs", "delivery"].map((type) => (
                <button key={type} onClick={() => setOrderType(type)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${orderType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <Zap className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p>Tap drinks to add</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const effPrice = getEffectivePrice(item.price, item.discountFixed, item.discountPercent);
                    return (
                      <motion.div key={item.drinkId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate text-xs">{item.name}</p>
                          <p className="text-primary text-xs">Rs {Math.round(effPrice)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.drinkId, -1)} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors">
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.drinkId, 1)} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={() => setCart((c) => c.filter((i) => i.drinkId !== item.drinkId))} className="w-5 h-5 rounded-full flex items-center justify-center text-destructive/50 hover:text-destructive transition-colors">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {cart.length > 0 && (
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span><span>Rs {Math.round(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Delivery</span><span>Rs {deliveryFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground">
                  <span>Total</span><span className="text-primary">Rs {Math.round(total)}</span>
                </div>
              </div>
            )}

            <Button onClick={handleCheckout} disabled={cart.length === 0 || createOrder.isPending}
              className="w-full bg-primary text-primary-foreground font-semibold gap-2">
              {success ? (
                <><Check className="w-4 h-4" /> Order Placed!</>
              ) : createOrder.isPending ? "Placing..." : (
                <><ShoppingCart className="w-4 h-4" /> Place Order · Rs {Math.round(total)}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
