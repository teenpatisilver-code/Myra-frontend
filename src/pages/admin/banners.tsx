import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner,
  getListAllBannersQueryKey,
} from "@/api";

const EMPTY_FORM = { title: "", subtitle: "", imageUrl: "", linkUrl: "", isActive: true, sortOrder: "0" };

export default function AdminBannersPage() {
  const { data: banners, isLoading } = useListAllBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };

  const openEdit = (b: { id: number; title: string; subtitle?: string | null; imageUrl: string; linkUrl?: string | null; isActive: boolean; sortOrder: number }) => {
    setEditId(b.id);
    setForm({ title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? "", isActive: b.isActive, sortOrder: String(b.sortOrder) });
    setShowModal(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListAllBannersQueryKey() });

  const handleSave = () => {
    const payload = {
      title: form.title, subtitle: form.subtitle || null, imageUrl: form.imageUrl,
      linkUrl: form.linkUrl || null, isActive: form.isActive, sortOrder: Number(form.sortOrder),
    };
    const onSuccess = () => { setShowModal(false); invalidate(); toast({ title: editId ? "Banner updated" : "Banner created" }); };
    if (editId) {
      updateBanner.mutate({ id: editId, data: payload }, { onSuccess });
    } else {
      createBanner.mutate({ data: payload }, { onSuccess });
    }
  };

  const toggleActive = (id: number, current: boolean) => {
    const b = banners?.find((x) => x.id === id);
    if (!b) return;
    updateBanner.mutate({ id, data: { title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl, isActive: !current, sortOrder: b.sortOrder } }, {
      onSuccess: () => { invalidate(); toast({ title: `Banner ${!current ? "activated" : "deactivated"}` }); },
    });
  };

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete banner "${title}"?`)) return;
    deleteBanner.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Banner deleted" }); },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Banner Ads</h1>
            <p className="text-muted-foreground text-sm mt-1">{banners?.length ?? 0} banners</p>
          </div>
          <Button onClick={openAdd} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Banner
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : banners?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No banners yet. Add your first banner ad.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners?.map((banner, i) => (
              <motion.div key={banner.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card border border-border rounded-xl overflow-hidden flex gap-4 p-4">
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-muted-foreground/40" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{banner.title}</p>
                      {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                      {banner.linkUrl && <p className="text-xs text-secondary truncate">{banner.linkUrl}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(banner.id, banner.isActive)} className={`h-7 w-7 p-0 ${banner.isActive ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>
                        {banner.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(banner)} className="h-7 w-7 p-0">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(banner.id, banner.title)} className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${banner.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-muted-foreground">Sort: {banner.sortOrder}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Banner" : "New Banner Ad"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={form.title} onChange={handleChange("title")} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subtitle</Label>
                <Input value={form.subtitle} onChange={handleChange("subtitle")} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Image URL *</Label>
                <Input value={form.imageUrl} onChange={handleChange("imageUrl")} placeholder="https://..." className="mt-1 bg-muted border-border" />
                {form.imageUrl && <img src={form.imageUrl} alt="preview" className="mt-2 rounded-lg h-20 object-cover w-full" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Link URL (optional)</Label>
                <Input value={form.linkUrl} onChange={handleChange("linkUrl")} placeholder="https://..." className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={handleChange("sortOrder")} className="mt-1 bg-muted border-border" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Active</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              </div>
              <Button onClick={handleSave} disabled={createBanner.isPending || updateBanner.isPending} className="w-full bg-primary text-primary-foreground">
                {createBanner.isPending || updateBanner.isPending ? "Saving..." : editId ? "Update Banner" : "Create Banner"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
