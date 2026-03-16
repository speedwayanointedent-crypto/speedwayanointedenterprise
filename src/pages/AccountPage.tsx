import React from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

type Address = {
  id: string;
  label?: string | null;
  recipient_name?: string | null;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  is_default: boolean;
};

type WishlistItem = {
  id: number;
  products: { id: string; name: string; price: number; image_url?: string | null };
};

type Notification = {
  id: number;
  title: string;
  body?: string | null;
  type?: string | null;
  read_at?: string | null;
  created_at: string;
};

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profileForm, setProfileForm] = React.useState({ full_name: "", email: "" });
  const [addressForm, setAddressForm] = React.useState({
    label: "",
    recipient_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    postal_code: "",
    is_default: false
  });
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, addressRes, wishlistRes, notificationsRes] =
        await Promise.all([
          api.get<Profile>("/users/me"),
          api.get<Address[]>("/addresses"),
          api.get<{ items: WishlistItem[] }>("/wishlist"),
          api.get<Notification[]>("/notifications")
        ]);
      setProfile(profileRes.data);
      setProfileForm({
        full_name: profileRes.data.full_name || "",
        email: profileRes.data.email || ""
      });
      setAddresses(addressRes.data || []);
      setWishlist(wishlistRes.data.items || []);
      setNotifications(notificationsRes.data || []);
    } catch {
      setProfile(null);
      setAddresses([]);
      setWishlist([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch<Profile>("/users/me", profileForm);
      setProfile(res.data);
      push("Profile updated", "success");
    } catch {
      push("Failed to update profile", "error");
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<Address>("/addresses", addressForm);
      setAddresses((prev) => [res.data, ...prev]);
      setAddressForm({
        label: "",
        recipient_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        region: "",
        postal_code: "",
        is_default: false
      });
      push("Address saved", "success");
    } catch {
      push("Failed to save address", "error");
    }
  };

  const removeWishlistItem = async (id: number) => {
    try {
      await api.delete(`/wishlist/items/${id}`);
      setWishlist((prev) => prev.filter((item) => item.id !== id));
      push("Removed from wishlist", "success");
    } catch {
      push("Failed to remove item", "error");
    }
  };

  const markAllRead = async () => {
    try {
      const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
      if (ids.length === 0) return;
      await api.post("/notifications/mark-read", { ids });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      push("Failed to mark read", "error");
    }
  };

  const signOut = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    push("Signed out", "success");
    navigate("/");
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <PageHeader title="My account" subtitle="Manage your profile, addresses, and wishlist." />

        {loading ? (
          <Skeleton className="mt-6 h-64" />
        ) : !profile ? (
          <EmptyState
            title="Sign in required"
            description="Please sign in to access your account dashboard."
            action={
              <Link to="/login" className="btn-primary h-10 text-sm">
                Sign in
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="card p-5">
                <h2 className="text-base font-semibold">Profile</h2>
                <form onSubmit={updateProfile} className="mt-4 grid gap-3">
                  <input
                    className="form-input"
                    placeholder="Full name"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                  />
                  <input
                    className="form-input"
                    placeholder="Email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                  <button className="btn-primary h-10 text-sm">Save profile</button>
                </form>
                <button
                  type="button"
                  className="btn-destructive mt-4 h-10 text-sm"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>

              <div className="card p-5">
                <h2 className="text-base font-semibold">Saved addresses</h2>
                {addresses.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No addresses yet.</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="rounded-xl border border-border p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{addr.label || "Address"}</div>
                          {addr.is_default ? (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {addr.recipient_name || profile.full_name}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {addr.address_line1}
                          {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {[addr.city, addr.region, addr.postal_code].filter(Boolean).join(", ")}
                        </div>
                        {addr.phone ? (
                          <div className="mt-1 text-muted-foreground">{addr.phone}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={addAddress} className="mt-4 grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="form-input"
                      placeholder="Label"
                      value={addressForm.label}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, label: e.target.value }))
                      }
                    />
                    <input
                      className="form-input"
                      placeholder="Recipient name"
                      value={addressForm.recipient_name}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, recipient_name: e.target.value }))
                      }
                    />
                  </div>
                  <input
                    className="form-input"
                    placeholder="Phone"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                  <input
                    className="form-input"
                    placeholder="Address line 1"
                    required
                    value={addressForm.address_line1}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, address_line1: e.target.value }))
                    }
                  />
                  <input
                    className="form-input"
                    placeholder="Address line 2"
                    value={addressForm.address_line2}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, address_line2: e.target.value }))
                    }
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      className="form-input"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                    />
                    <input
                      className="form-input"
                      placeholder="Region"
                      value={addressForm.region}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, region: e.target.value }))
                      }
                    />
                    <input
                      className="form-input"
                      placeholder="Postal code"
                      value={addressForm.postal_code}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, postal_code: e.target.value }))
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))
                      }
                    />
                    Set as default
                  </label>
                  <button className="btn-primary h-10 text-sm">Add address</button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Wishlist</h2>
                  <Link to="/shop" className="text-xs text-muted-foreground hover:text-foreground">
                    Browse shop
                  </Link>
                </div>
                {wishlist.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No wishlist items yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {wishlist.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                        <div className="font-semibold">{item.products?.name}</div>
                        <div className="mt-1 text-muted-foreground">
                          GHS {item.products?.price?.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          className="btn-outline mt-3 h-8 text-xs"
                          onClick={() => removeWishlistItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Notifications</h2>
                  <button className="btn-outline h-8 text-xs" onClick={markAllRead}>
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-xl border border-border p-3 text-sm ${
                          n.read_at ? "bg-background" : "bg-secondary/60"
                        }`}
                      >
                        <div className="font-semibold">{n.title}</div>
                        {n.body ? <div className="mt-1 text-muted-foreground">{n.body}</div> : null}
                        <div className="mt-2 text-xs text-muted-foreground">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <PublicFooterCTA />
    </div>
  );
};
