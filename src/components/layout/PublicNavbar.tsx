import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Sun, Moon, ShoppingCart, User } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { getCartCount } from "../../lib/cart";

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [isAuthed, setIsAuthed] = React.useState(
    Boolean(localStorage.getItem("auth_token"))
  );
  const [cartCount, setCartCount] = React.useState(0);

  React.useEffect(() => {
    const handleStorage = () =>
      setIsAuthed(Boolean(localStorage.getItem("auth_token")));
    const handleCart = () => setCartCount(getCartCount());
    handleCart();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart_updated", handleCart);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart_updated", handleCart);
    };
  }, []);

  React.useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const menu = mobileMenuRef.current;
    if (!menu) {
      return;
    }

    const focusableSelector =
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(
      menu.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter((el) => !el.hasAttribute("disabled"));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) {
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last?.focus();
        }
        return;
      }
      if (active === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Reviews", path: "/reviews" },
    { label: "Orders", path: "/orders" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md rounded-b-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">
              Speedway Anointed Ent
            </div>
            <div className="text-xs text-muted-foreground">
              Parts & Inventory
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/cart"
            className="relative icon-btn"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            onClick={toggleTheme}
            className="icon-btn"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {isAuthed ? (
            <div className="flex items-center gap-2 rounded-xl px-2 py-1 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Admin
            </div>
          ) : (
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden icon-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          ref={mobileMenuRef}
          className="md:hidden fixed inset-0 z-[60] bg-white/98 text-foreground shadow-2xl backdrop-blur dark:bg-slate-900/98"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-base font-semibold">Menu</span>
            <button
              className="icon-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <Menu className="h-6 w-6 rotate-180" />
            </button>
          </div>
          <nav className="flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-foreground/90 hover:bg-secondary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="btn-outline h-9 px-3 text-sm"
              >
                {theme === "dark" ? "Light" : "Dark"} Mode
              </button>
              <Link to="/cart" className="btn-secondary h-9 text-sm">
                Cart ({cartCount})
              </Link>
            </div>
            {isAuthed ? (
              <button
                className="btn-destructive h-9 text-sm"
                onClick={() => {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("user_role");
                  setIsAuthed(false);
                  setMobileMenuOpen(false);
                }}
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="btn-primary h-9 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
