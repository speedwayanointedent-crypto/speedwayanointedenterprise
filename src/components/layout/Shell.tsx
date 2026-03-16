import React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import {
  Menu,
  ShoppingCart,
  Sun,
  Moon,
  LayoutDashboard,
  Boxes,
  Tag,
  Layers,
  Truck,
  ReceiptText,
  Warehouse,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Search
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Products", to: "/admin/products", icon: Boxes },
  { label: "Categories", to: "/admin/categories", icon: Tag },
  { label: "Brands", to: "/admin/brands", icon: Layers },
  { label: "Models", to: "/admin/models", icon: Truck },
  { label: "Orders", to: "/admin/orders", icon: ReceiptText },
  { label: "Sales", to: "/admin/sales", icon: ShoppingCart },
  { label: "Inventory", to: "/admin/inventory", icon: Warehouse },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Settings", to: "/admin/settings", icon: Settings }
];

export const DashboardShell: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    const role = window.localStorage.getItem("user_role");
    if (!token || role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="page-shell">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-white dark:bg-slate-900 px-4 py-6 shadow-md rounded-r-xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Speedway Ops</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
          </Link>
          <button
            className="lg:hidden icon-btn"
            onClick={() => setOpen(false)}
          >
            X
          </button>
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`
              }
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 dark:bg-slate-900/90 backdrop-blur shadow-md rounded-b-xl">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden icon-btn"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                <Search className="h-4 w-4" />
                Search products, orders...
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="icon-btn" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  window.localStorage.removeItem("auth_token");
                  window.localStorage.removeItem("user_role");
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  A
                </div>
                <div>
                  <div className="text-xs font-semibold">Admin</div>
                  <div className="text-[10px] text-muted-foreground">admin@speedway.test</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {location.pathname
              .split("/")
              .filter(Boolean)
              .map((segment, idx, arr) => {
                const labels: Record<string, string> = {
                  admin: "Admin",
                  products: "Products",
                  categories: "Categories",
                  brands: "Brands",
                  models: "Models",
                  orders: "Orders",
                  sales: "Sales",
                  inventory: "Inventory",
                  reports: "Reports",
                  users: "Users",
                  settings: "Settings"
                };
                const label = labels[segment] || segment;
                const path = "/" + arr.slice(0, idx + 1).join("/");
                const isLast = idx === arr.length - 1;
                return (
                  <React.Fragment key={path}>
                    {isLast ? (
                      <span className="text-foreground">{label}</span>
                    ) : (
                      <Link to={path} className="hover:text-foreground">
                        {label}
                      </Link>
                    )}
                    {!isLast ? <span>/</span> : null}
                  </React.Fragment>
                );
              })}
          </div>
          <Outlet />
        </main>
        <footer className="border-t border-border bg-gray-100 text-gray-700 dark:bg-slate-900 dark:text-gray-200">
          <div className="mx-auto flex flex-col items-start justify-between gap-3 px-6 py-4 text-xs sm:flex-row sm:items-center">
            <div>Speedway Anointed Ent Admin</div>
            <div>© 2026 Speedway Anointed Ent.</div>
          </div>
        </footer>
      </div>
    </div>
  );
};
