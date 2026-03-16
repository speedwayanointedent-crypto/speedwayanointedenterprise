import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicNavbar } from "../../components/layout/PublicNavbar";
import api from "../../lib/api";
import { useToast } from "../../components/ui/Toast";
import { Eye, EyeOff } from "lucide-react";
import { PublicFooterCTA } from "../../components/layout/PublicFooterCTA";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { push } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      window.localStorage.setItem("auth_token", res.data.token);
      const role =
        res.data?.role ||
        res.data?.user?.role ||
        res.data?.profile?.role ||
        "user";
      window.localStorage.setItem("user_role", role);
      push("Logged in successfully", "success");
      navigate(role === "admin" ? "/admin" : "/shop");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.error ||
        "Login failed. Check your credentials and server.";
      setError(message);
      push(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your account.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                className="form-input mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            ) : null}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Logging in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <Link to="/forgot-password" className="hover:text-foreground">
              Forgot password?
            </Link>
            <Link to="/signup" className="hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
      </main>
      <PublicFooterCTA />
    </div>
  );
};

