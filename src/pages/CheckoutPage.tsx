import React from "react";
import { CreditCard, Mail, MapPin, Phone, User } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { clearCart, getCart, CartItem } from "../lib/cart";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { EmptyState } from "../components/ui/EmptyState";

const InputField = ({
  label,
  type = "text",
  icon: Icon
}: {
  label: string;
  type?: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div>
    <label className="form-label">{label}</label>
    <div className="relative mt-2">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input type={type} className="form-input pl-10" />
    </div>
  </div>
);

export const CheckoutPage: React.FC = () => {
  const { push } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [addresses, setAddresses] = React.useState<
    { id: string; label?: string | null; address_line1: string }[]
  >([]);
  const [addressId, setAddressId] = React.useState("");
  const [couponCode, setCouponCode] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [applyingCoupon, setApplyingCoupon] = React.useState(false);

  React.useEffect(() => {
    setItems(getCart());
    async function loadAddresses() {
      try {
        const res = await api.get("/addresses");
        const list = Array.isArray(res.data) ? res.data : [];
        setAddresses(list);
        const defaultAddress = list.find((a: any) => a.is_default);
        if (defaultAddress) {
          setAddressId(defaultAddress.id);
        }
      } catch {
        setAddresses([]);
      }
    }
    loadAddresses();
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = Math.max(0, total - discount);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      push("Your cart is empty.", "error");
      return;
    }
    if (!localStorage.getItem("auth_token")) {
      push("Please sign in to place an order.", "error");
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      const orderItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
        price: item.price
      }));
      await api.post("/orders", {
        items: orderItems,
        total: grandTotal,
        coupon_code: couponCode || null,
        delivery_address_id: addressId || null,
        shipping_fee: 0
      });
      clearCart();
      push("Order placed successfully.", "success");
      navigate("/orders");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.error || "Failed to place order.";
      push(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      setApplyingCoupon(true);
      const res = await api.post<{ discount: number }>("/coupons/validate", {
        code: couponCode,
        total
      });
      setDiscount(res.data.discount || 0);
      push("Coupon applied", "success");
    } catch (err) {
      setDiscount(0);
      const message =
        (err as any)?.response?.data?.error || "Failed to apply coupon.";
      push(message, "error");
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)]">
          <form onSubmit={onSubmit} className="card p-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Provide your contact and delivery details to complete the order.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Contact information
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InputField label="First name" icon={User} />
                  <InputField label="Last name" icon={User} />
                  <InputField label="Email" type="email" icon={Mail} />
                  <InputField label="Phone" type="tel" icon={Phone} />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Delivery address
                </h2>
                {addresses.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Add a saved address in your account before checkout.
                  </p>
                ) : (
                  <select
                    className="form-input mt-3"
                    value={addressId}
                    onChange={(e) => setAddressId(e.target.value)}
                  >
                    <option value="">Select an address</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label || addr.address_line1}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Payment method
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InputField label="Card number" icon={CreditCard} />
                  <InputField label="Name on card" icon={User} />
                  <InputField label="Expiry date" icon={CreditCard} />
                  <InputField label="CVV" icon={CreditCard} />
                </div>
              </div>
            </div>

            <button className="btn-primary mt-8 h-11 w-full" disabled={submitting}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </form>

          <aside className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Order summary
            </h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {items.length === 0 ? (
                <EmptyState
                  title="Your cart is empty"
                  description="Add items before checking out."
                  action={
                    <Link to="/shop" className="btn-primary h-11 px-5">
                      Shop parts
                    </Link>
                  }
                />
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>
                      {item.name} x{item.qty}
                    </span>
                    <span>GHS {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))
              )}
              <div className="mt-4 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <input
                    className="form-input h-9"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-outline h-9 px-3 text-xs"
                    onClick={applyCoupon}
                    disabled={applyingCoupon}
                  >
                    Apply
                  </button>
                </div>
              </div>
              {discount > 0 ? (
                <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
                  <span>Discount</span>
                  <span>- GHS {discount.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between pt-3 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>GHS {grandTotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
              Secure checkout with encrypted payments and instant confirmation.
            </div>
            <Link to="/cart" className="btn-outline mt-4 h-10 w-full">
              Back to cart
            </Link>
          </aside>
        </div>
      </div>
      <PublicFooterCTA />
    </div>
  );
};

