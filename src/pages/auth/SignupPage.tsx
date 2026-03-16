import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicNavbar } from "../../components/layout/PublicNavbar";
import api from "../../lib/api";
import { useToast } from "../../components/ui/Toast";
import { Eye, EyeOff } from "lucide-react";
import { PublicFooterCTA } from "../../components/layout/PublicFooterCTA";

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { push } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        email,
        password,
        full_name: fullName
      });
      window.localStorage.setItem("auth_token", res.data.token);
      push("Account created", "success");
      navigate("/shop");
    } catch {
      push("Failed to create account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 pb-16 pt-20 md:px-6">
        <div className="w-full max-w-md card p-8">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join Speedway Anointed Ent and start ordering premium parts.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="form-label">Full name</label>
              <input
                required
                className="form-input mt-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Email address</label>
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
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </main>
      <PublicFooterCTA />
    </div>
  );
};


