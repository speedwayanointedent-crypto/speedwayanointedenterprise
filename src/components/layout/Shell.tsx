import React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import {
  Menu, X, Sun, Moon, LayoutDashboard, Boxes, Tag, Layers,
  Truck, ReceiptText, Warehouse, BarChart3, Users, Settings,
  LogOut, Search, FileSearch, ShieldCheck, ChevronRight, Sparkles,
  Home, ShoppingBag
} from "lucide-react";

const mainNav = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Products", to: "/admin/products", icon: Boxes },
  { label: "Categories", to: "/admin/categories", icon: Tag },
  { label: "Brands", to: "/admin/brands", icon: Layers },
  { label: "Models", to: "/admin/models", icon: Truck },
  { label: "Orders", to: "/admin/orders", icon: ReceiptText },
  { label: "Sales", to: "/admin/sales", icon: ShoppingBag },
  { label: "Inventory", to: "/admin/inventory", icon: Warehouse },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
];

const secondaryNav = [
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: FileSearch },
  { label: "System Health", to: "/admin/system-health", icon: ShieldCheck },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const DashboardShell: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    const role = window.localStorage.getItem("user_role");
    if (!token || !["admin", "manager", "staff"].includes(role || "")) {
      navigate("/login");
    }
  }, [navigate]);

  const breadcrumbs = React.useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const items = [{ label: "Admin", path: "/admin" }];
    const labels: Record<string, string> = {
      admin: "Dashboard", products: "Products", categories: "Categories",
      brands: "Brands", models: "Models", orders: "Orders", sales: "Sales",
      inventory: "Inventory", reports: "Reports", users: "Users",
      settings: "Settings", "audit-logs": "Audit Logs", "system-health": "System Health"
    };
    let path = "";
    segments.forEach((segment) => {
      path += `/${segment}`;
      if (segment !== "admin") {
        items.push({ label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1), path });
      }
    });
    return items;
  }, [location.pathname]);

  const handleLogout = () => {
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("user_role");
    navigate("/");
  };

  const NavLinkItem = ({ item }: { item: typeof mainNav[0] }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/admin"}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`
      }
      onClick={() => setOpen(false)}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
          )}
          <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 ${isActive ? 'text-primary' : 'group-hover:scale-110 group-hover:text-foreground'}`} />
          <span className="flex-1">{item.label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className="page-shell flex min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-border/50 bg-card/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border/50 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Speedway</div>
              <div className="text-[11px] text-muted-foreground">Admin Panel</div>
            </div>
            <button className="ml-auto lg:hidden icon-btn" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {mainNav.map((item) => <NavLinkItem key={item.to} item={item} />)}

            <div className="my-3 border-t border-border/50 mx-3" />

            {secondaryNav.map((item) => <NavLinkItem key={item.to} item={item} />)}
          </nav>

          {/* Footer */}
          <div className="border-t border-border/50 p-3">
            <Link
              to="/"
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
            >
              <Home className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
              <span className="flex-1">View Store</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-[260px] overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden icon-btn" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                {breadcrumbs.map((item, idx) => (
                  <React.Fragment key={item.path}>
                    {idx > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-foreground">{item.label}</span>
                    ) : (
                      <Link to={item.path} className="hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
              <button
                className="icon-btn text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50">
          <div className="mx-auto flex items-center justify-between px-6 py-4 text-[11px] text-muted-foreground sm:px-8">
            <span>Speedway Anointed Ent — Admin Panel</span>
            <span>&copy; 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
