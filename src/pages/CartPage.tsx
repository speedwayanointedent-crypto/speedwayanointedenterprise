import React from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { CartItem, getCart, removeFromCart, saveCart, updateQty } from "../lib/cart";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export const CartPage: React.FC = () => {
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    setItems(getCart());
    const handler = () => setItems(getCart());
    window.addEventListener("cart_updated", handler);
    return () => window.removeEventListener("cart_updated", handler);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const onDecrease = (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    if (current.qty <= 1) {
      removeFromCart(id);
      setItems(getCart());
      return;
    }
    updateQty(id, current.qty - 1);
    setItems(getCart());
  };

  const onIncrease = (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    updateQty(id, current.qty + 1);
    setItems(getCart());
  };

  const onRemove = (id: string) => {
    removeFromCart(id);
    setItems(getCart());
  };

  const onClear = () => {
    saveCart([]);
    setItems([]);
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <PageHeader
          title="Shopping cart"
          subtitle="Review items before checkout."
          size="lg"
          actions={
            <>
              {items.length > 0 ? (
                <button className="btn-outline h-9 text-sm" onClick={onClear}>
                  Clear cart
                </button>
              ) : null}
              <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">
                Continue shopping
              </Link>
            </>
          }
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.4fr)]">
          <div className="card p-4 sm:p-5">
            {items.length === 0 ? (
              <EmptyState
                title="Your cart is empty"
                description="Add items from the shop to get started."
                action={
                  <Link to="/shop" className="btn-primary h-11 px-5">
                    Shop parts
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop"}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Verified fitment • In stock
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          GHS {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="icon-btn"
                        onClick={() => onDecrease(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold">{item.qty}</span>
                      <button
                        className="icon-btn"
                        onClick={() => onIncrease(item.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        className="icon-btn text-rose-500 hover:text-rose-700"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="card p-6">
            <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>GHS {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>GHS {total.toLocaleString()}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary mt-6 h-11 w-full">
              Proceed to checkout
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              Secure checkout with encrypted payments.
            </p>
          </aside>
        </div>
      </div>
      <PublicFooterCTA />
    </div>
  );
};



