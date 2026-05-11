import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, Save, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  getListInventoryQueryKey,
} from "@/api";

const EMPTY_FORM = { name: "", unit: "", currentStock: "", minStock: "", costPerUnit: "" };

export default function AdminInventoryPage() {
  const { data: items, isLoading } = useListInventory();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingStock, setEditingStock] = useState<Record<number, string>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };

  const openEdit = (item: { id: number; name: string; unit: string; currentStock: number; minStock: number; costPerUnit: number }) => {
    setEditId(item.id);
    setForm({ name: item.name, unit: item.unit, currentStock: String(item.currentStock), minStock: String(item.minStock), costPerUnit: String(item.costPerUnit) });
    setShowForm(true);
  };

  const handleSave = () => {
    const data = {
      name: form.name, unit: form.unit,
      currentStock: Number(form.currentStock), minStock: Number(form.minStock), costPerUnit: Number(form.costPerUnit),
    };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      setShowForm(false);
      toast({ title: editId ? "Item updated" : "Item added to inventory" });
    };
    if (editId) {
      updateItem.mutate({ id: editId, data }, { onSuccess });
    } else {
      createItem.mutate({ data }, { onSuccess });
    }
  };

  const handleUpdateStock = (id: number) => {
    const newStock = editingStock[id];
    if (newStock === undefined) return;
    updateItem.mutate({ id, data: { currentStock: Number(newStock) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        setEditingStock((s) => { const n = { ...s }; delete n[id]; return n; });
        toast({ title: "Stock updated" });
      },
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}" from inventory?`)) return;
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        toast({ title: "Item deleted" });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground text-sm mt-1">{items?.length ?? 0} items tracked</p>
          </div>
          <Button onClick={openAdd} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : (
          <div className="glass-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Min</th>
                    <th className="px-4 py-3 font-medium">Cost/Unit</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items?.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    const isCritical = item.currentStock === 0;
                    return (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`hover:bg-muted/20 transition-colors ${isLow ? "bg-destructive/5" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Input type="number"
                              value={editingStock[item.id] ?? item.currentStock}
                              onChange={(e) => setEditingStock((s) => ({ ...s, [item.id]: e.target.value }))}
                              className={`w-20 h-8 text-sm bg-muted border-border ${isLow ? "border-destructive/50" : ""}`}
                            />
                            {editingStock[item.id] !== undefined && (
                              <Button size="sm" onClick={() => handleUpdateStock(item.id)} disabled={updateItem.isPending} className="h-8 w-8 p-0 bg-primary text-primary-foreground">
                                <Save className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.minStock} {item.unit}</td>
                        <td className="px-4 py-3 text-muted-foreground">Rs {item.costPerUnit}</td>
                        <td className="px-4 py-3">
                          {isCritical ? (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> Empty
                            </Badge>
                          ) : isLow ? (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> Low
                            </Badge>
                          ) : (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">OK</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="h-7 w-7 p-0">
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(item.id, item.name)} disabled={deleteItem.isPending} className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Item" : "New Inventory Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Item Name</Label>
                  <Input value={form.name} onChange={handleChange("name")} className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Unit (kg, L, pcs)</Label>
                  <Input value={form.unit} onChange={handleChange("unit")} className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Stock</Label>
                  <Input type="number" value={form.currentStock} onChange={handleChange("currentStock")} className="mt-1 bg-muted border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Min Stock</Label>
                  <Input type="number" value={form.minStock} onChange={handleChange("minStock")} className="mt-1 bg-muted border-border" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Cost per Unit (Rs)</Label>
                  <Input type="number" value={form.costPerUnit} onChange={handleChange("costPerUnit")} className="mt-1 bg-muted border-border" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={createItem.isPending || updateItem.isPending} className="w-full bg-primary text-primary-foreground">
                {createItem.isPending || updateItem.isPending ? "Saving..." : editId ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
