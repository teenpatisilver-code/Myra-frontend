import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Instagram, Youtube, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useUpdateSetting } from "@/api";

type SettingKey = string;

interface SettingGroup {
  title: string;
  icon: React.ReactNode;
  keys: Array<{ key: SettingKey; label: string; type?: string; placeholder?: string }>;
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: "Social Media",
    icon: <Instagram className="w-4 h-4" />,
    keys: [
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/..." },
      { key: "social_tiktok", label: "TikTok URL", placeholder: "https://tiktok.com/..." },
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/..." },
      { key: "social_whatsapp", label: "WhatsApp Number", placeholder: "+977 98XXXXXXXX" },
      { key: "social_youtube", label: "YouTube URL", placeholder: "https://youtube.com/..." },
    ],
  },
  {
    title: "Loyalty Program",
    icon: <Youtube className="w-4 h-4 text-yellow-400" />,
    keys: [
      { key: "loyalty_points_per_100", label: "Points earned per Rs 100 spent", type: "number", placeholder: "1" },
      { key: "loyalty_points_value", label: "Rs discount per 100 points redeemed", type: "number", placeholder: "20" },
      { key: "loyalty_referrer_bonus", label: "Points for referring a friend", type: "number", placeholder: "50" },
      { key: "loyalty_referee_bonus", label: "Points for new referred user", type: "number", placeholder: "25" },
    ],
  },
  {
    title: "Delivery & Fees",
    icon: <Facebook className="w-4 h-4 text-blue-400" />,
    keys: [
      { key: "delivery_fee", label: "Delivery fee (Rs)", type: "number", placeholder: "100" },
    ],
  },
  {
    title: "Notifications",
    icon: <Save className="w-4 h-4" />,
    keys: [
      { key: "notification_sound_enabled", label: "Enable order notification sound (true/false)", placeholder: "false" },
      { key: "notification_sound_url", label: "Custom notification sound URL (mp3)", placeholder: "https://..." },
    ],
  },
  {
    title: "Cloudinary Image Upload",
    icon: <Save className="w-4 h-4" />,
    keys: [
      { key: "cloudinary_cloud_name", label: "Cloudinary Cloud Name", placeholder: "your-cloud-name" },
      { key: "cloudinary_upload_preset", label: "Upload Preset (unsigned)", placeholder: "your-preset" },
    ],
  },
];

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      for (const s of settings) { map[s.key] = s.value; }
      setLocalValues(map);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalValues((v) => ({ ...v, [key]: value }));
    setDirtyKeys((d) => new Set([...d, key]));
  };

  const handleSave = (key: string) => {
    const value = localValues[key] ?? "";
    updateSetting.mutate({ key, data: { value } }, {
      onSuccess: () => {
        setDirtyKeys((d) => { const n = new Set(d); n.delete(key); return n; });
        toast({ title: "Setting saved" });
      },
    });
  };

  const handleSaveAll = () => {
    const dirtyArr = Array.from(dirtyKeys);
    if (dirtyArr.length === 0) { toast({ title: "Nothing to save" }); return; }
    let done = 0;
    for (const key of dirtyArr) {
      updateSetting.mutate({ key, data: { value: localValues[key] ?? "" } }, {
        onSuccess: () => {
          done++;
          if (done === dirtyArr.length) {
            setDirtyKeys(new Set());
            toast({ title: `${done} setting(s) saved` });
          }
        },
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure your store</p>
          </div>
          {dirtyKeys.size > 0 && (
            <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground gap-1.5">
              <Save className="w-4 h-4" /> Save All ({dirtyKeys.size})
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-4">
            {SETTING_GROUPS.map((group, gi) => (
              <motion.div key={gi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}
                className="glass-card border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="text-primary">{group.icon}</span>
                  <h3 className="font-semibold text-foreground">{group.title}</h3>
                </div>
                {group.keys.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{item.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type={item.type ?? "text"}
                        value={localValues[item.key] ?? ""}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        placeholder={item.placeholder}
                        className="bg-muted border-border flex-1"
                      />
                      {dirtyKeys.has(item.key) && (
                        <Button size="sm" onClick={() => handleSave(item.key)} disabled={updateSetting.isPending} className="bg-primary text-primary-foreground px-3">
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
