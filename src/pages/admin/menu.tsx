import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDrinks, useListCategories, useCreateDrink, useUpdateDrink, useDeleteDrink, getListDrinksQueryKey,
} from "@/api";

const EMPTY_FORM = {
  name: "", description: "", categoryId: "", imageUrl: "",
  price: "", discountPercent: "", discountFixed: "",
  calories: "", protein: "", isFeatured: false, isAvailable: true,
};

export default function AdminMenuPage() {
  const { data: drinks, isLoading } = useListDrinks();
  const { data: categories } = useListCategories();
  const createDrink = useCreateDrink();
  const updateDrink = useUpdateDrink();
  const deleteDrink = useDeleteDrink();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };

  const openEdit = (drink: {
    id: number; name: string; description?: string | null; categoryId: number;
    imageUrl?: string | null; price: number; discountPercent?: number | null;
    discountFixed?: number | null; calories?: number | null; protein?: number | null;
    isFeatured: boolean; isAvailable: boolean;
  }) => {
    setEditId(drink.id);
    setForm({
      name: drink.name, description: drink.description ?? "",
      categoryId: String(drink.categoryId), imageUrl: drink.imageUrl ?? "",
      price: String(drink.price),
      discountPercent: drink.discountPercent != null ? String(drink.discountPercent) : "",
      discountFixed: drink.discountFixed != null ? String(drink.discountFixed) : "",
      calories: drink.calories != null ? String(drink.calories) : "",
      protein: drink.protein != null ? String(drink.protein) : "",
      isFeatured: drink.isFeatured, isAvailable: drink.isAvailable,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const payload = {
      name: form.name, description: form.description || null,
      categoryId: Number(form.categoryId), imageUrl: form.imageUrl || null,
      price: Number(form.price),
      discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
      discountFixed: form.discountFixed ? Number(form.discountFixed) : null,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      isFeatured: form.isFeatured, isAvailable: form.isAvailable, sortOrder: 0,
    };
    const onSuccess = () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: getListDrinksQueryKey() });
      toast({ title: editId ? "Drink updated" : "Drink added" });
    };
    if (editId) {
      updateDrink.mutate({ id: editId, data: payload }, { onSuccess });
    } else {
      createDrink.mutate({ data: payload }, { onSuccess });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteDrink.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDrinksQueryKey() });
        toast({ title: "Drink deleted" });
      },
    });
  };

  const getEffectivePrice = (drink: { price: number; discountPercent?: number | null; discountFixed?: number | null }) => {
    if (drink.discountFixed != null && drink.discountFixed > 0) return Math.max(0, drink.price - drink.discountFixed);
    if (drink.discountPercent != null && drink.discountPercent > 0) return drink.price * (1 - drink.discountPercent / 100);
    return drink.price;
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Menu Manager</h1>
            <p className="text-muted-foreground text-sm mt-1">{drinks?.length ?? 0} drinks</p>
          </div>
          <Button onClick={openAdd} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Drink
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {drinks?.map((drink, i) => {
              const effPrice = getEffectivePrice(drink);
              const hasDiscount = effPrice < drink.price;
              return (
                <motion.div key={drink.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {drink.imageUrl && !imgError[drink.id] ? (
                      <img src={drink.imageUrl} alt={drink.name} className="w-full h-full object-cover" onError={() => setImgError((e) => ({ ...e, [drink.id]: true }))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Zap className="w-8 h-8 text-primary/30" /></div>
                    )}
                    {!drink.isAvailable && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">Unavailable</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-foreground truncate">{drink.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-primary font-bold text-sm">Rs {Math.round(effPrice)}</p>
                      {hasDiscount && <p className="text-xs text-muted-foreground line-through">Rs {Math.round(drink.price)}</p>}
                    </div>
                    {drink.isFeatured && <span className="text-xs text-secondary">Featured</span>}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(drink)} className="flex-1 h-7 text-xs">
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(drink.id, drink.name)} className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editId ? "Edit Drink" : "Add New Drink"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input value={form.name} onChange={handleChange("name")} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input value={form.description} onChange={handleChange("description")} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category *</Label>
                <select value={form.categoryId} onChange={handleChange("categoryId")} className="w-full mt-1 h-9 rounded-lg bg-muted border border-border text-foreground text-sm px-3">
                  <option value="">Select category</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Image URL</Label>
                <Input value={form.imageUrl} onChange={handleChange("imageUrl")} placeholder="https://..." className="mt-1 bg-muted border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Price (Rs) *</Label>
                  <Input type="number" value={form.price} onChange={handleChange("price")} className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Discount Fixed (Rs)</Label>
                  <Input type="number" value={form.discountFixed} onChange={handleChange("discountFixed")} placeholder="e.g. 50" className="mt-1 bg-muted border-border" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Discount % (ignored if Fixed set)</Label>
                  <Input type="number" value={form.discountPercent} onChange={handleChange("discountPercent")} placeholder="e.g. 10" className="mt-1 bg-muted border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Calories</Label>
                  <Input type="number" value={form.calories} onChange={handleChange("calories")} className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                  <Input type="number" value={form.protein} onChange={handleChange("protein")} className="mt-1 bg-muted border-border" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Featured</Label>
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Available</Label>
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))} />
              </div>
              <Button onClick={handleSave} disabled={createDrink.isPending || updateDrink.isPending} className="w-full bg-primary text-primary-foreground">
                {createDrink.isPending || updateDrink.isPending ? "Saving..." : editId ? "Update Drink" : "Add Drink"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
