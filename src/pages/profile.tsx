import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  User, Phone, Mail, MapPin, LogOut, Star,
  ShoppingBag, ChevronRight, Shield, Save, Bell, Lock, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("phone, address, loyalty_points, full_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setPoints(data.loyalty_points || 0);
          setFullName(data.full_name || user?.user_metadata?.name || "");
          setAvatarUrl(data.avatar_url || "");
        }
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    const newUrl = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setAvatarUrl(newUrl);
    toast({ title: "Profile picture updated! 📸" });
    setUploadingAvatar(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone, address, full_name: fullName })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      setEditing(false);
      toast({ title: "Profile saved ✅", description: "Your info has been updated." });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLocation("/auth");
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="py-16 text-center space-y-4">
          <User className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold text-foreground">Not logged in</h2>
          <p className="text-muted-foreground">Please login to view your profile</p>
          <Button onClick={() => setLocation("/auth")} className="bg-primary text-primary-foreground">
            Login / Sign Up
          </Button>
        </div>
      </Layout>
    );
  }

  const email = user?.email ?? "";
  const displayName = fullName || user?.user_metadata?.name || email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Layout>
      <div className="py-4 space-y-6 pb-10">

        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-border">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              {uploadingAvatar
                ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-3 h-3" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Mail className="w-3 h-3" /> {email}
            </p>
            {phone && (
              <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> {phone}
              </p>
            )}
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
                <p className="text-2xl font-bold text-primary">{points} pts</p>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              className="border-primary/30 text-primary"
              onClick={() => setLocation("/rewards")}
            >
              Redeem
            </Button>
          </div>
        </div>

        {/* Contact & Delivery */}
        <div className="glass-card rounded-2xl p-5 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Contact & Delivery</h3>
            <button onClick={() => setEditing(!editing)} className="text-primary text-sm font-medium">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Your delivery address..."
                  rows={2}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <Button onClick={saveProfile} disabled={saving} className="w-full bg-primary text-primary-foreground">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-foreground">{phone || "No phone number added"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-foreground">{address || "No address added"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="glass-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Settings</h3>
          </div>
          <div className="divide-y divide-border">
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Notifications</p>
                  <p className="text-xs text-muted-foreground">Order updates & offers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400">On</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your password</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <div className="glass-card rounded-2xl border border-border overflow-hidden">
          {isAdmin && (
            <button
              onClick={() => setLocation("/admin")}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors border-b border-border bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">Admin Dashboard</span>
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          )}
          <button
            onClick={() => setLocation("/orders")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">My Orders</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setLocation("/rewards")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Rewards & Points</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="outline"
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>

      </div>
    </Layout>
  );
}
