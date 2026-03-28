import React from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Sun, Moon, ShoppingCart, User, LayoutDashboard, ChevronRight } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { getCartCount } from "../../lib/cart";

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [isAuthed, setIsAuthed] = React.useState(
    Boolean(localStorage.getItem("auth_token"))
  );
  const [role, setRole] = React.useState<string | null>(
    localStorage.getItem("user_role")
  );
  const [cartCount, setCartCount] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const handleStorage = () => {
      setIsAuthed(Boolean(localStorage.getItem("auth_token")));
      setRole(localStorage.getItem("user_role"));
    };
    const handleCart = () => setCartCount(getCartCount());
    handleCart();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart_updated", handleCart);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart_updated", handleCart);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Trap focus + escape in mobile menu
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const menu = mobileMenuRef.current;
    if (!menu) return;

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
      if (event.key !== "Tab" || focusables.length === 0) return;
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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const signOut = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    setIsAuthed(false);
    setRole(null);
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Reviews", path: "/reviews" },
    { label: "Orders", path: "/orders" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14 sm:h-16 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/25">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="leading-none">
            <div className="text-sm sm:text-base font-semibold text-foreground">
              Speedway
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              Auto Parts
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          {isAuthed ? (
            <>
              {role && ["admin", "manager", "staff"].includes(role) && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              )}
              <Link
                to="/account"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                {role ? role[0].toUpperCase() + role.slice(1) : "Account"}
              </Link>
              <button
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all active:scale-[0.98]"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-1">
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Portal ───────────────────────────────── */}
      {mobileMenuOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="md:hidden fixed inset-0 z-[100]">
              {/* Overlay */}
              <button
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu overlay"
              />

              {/* Panel */}
              <div
                id="mobile-nav"
                ref={mobileMenuRef}
                className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-foreground">Menu</span>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Links */}
                <nav className="px-4 py-4 space-y-1">
                  {navLinks.map((link, index) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors animate-fade-in-up ${
                          isActive
                            ? "bg-primary/5 text-primary"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                        }`
                      }
                      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </NavLink>
                  ))}
                </nav>

                {/* Divider */}
                <div className="mx-5 border-t border-slate-100 dark:border-slate-800" />

                {/* Quick actions */}
                <div className="px-4 py-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { toggleTheme(); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === "dark" ? "Light" : "Dark"}
                    </button>
                    <Link
                      to="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Cart {cartCount > 0 && `(${cartCount})`}
                    </Link>
                  </div>

                  {/* Admin */}
                  {isAuthed && role && ["admin", "manager", "staff"].includes(role) && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors animate-fade-in-up"
                      style={{ animationDelay: '280ms', animationFillMode: 'backwards' }}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Admin Dashboard</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                    </Link>
                  )}
                </div>

                {/* Bottom auth */}
                <div className="px-4 pb-6 mt-auto">
                  {isAuthed ? (
                    <div className="space-y-2">
                      <Link
                        to="/account"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 h-11 rounded-xl px-4 border border-slate-200 dark:border-slate-700 text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                      <button
                        className="w-full flex items-center justify-center h-11 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center h-12 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/25 transition-all"
                    >
                      Sign In to Your Account
                    </Link>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
};
