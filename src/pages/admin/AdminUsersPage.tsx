import React from "react";
import { Search, Users } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "staff" | "customer";
  created_at: string;
};

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
      setLastUpdated(new Date());
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateRole = async (id: string, role: "admin" | "manager" | "staff" | "customer") => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      push("User role updated", "success");
      load();
    } catch {
      push("Failed to update role", "error");
    }
  };

  const filtered = users.filter((u) =>
    `${u.full_name} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Users"
        subtitle="Manage customer and staff access levels."
        meta={
          <>
            {users.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">
              Search: {query}
            </span>
          </div>
        ) : null}

        {loading ? (
          <Skeleton className="mt-6 h-40" />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No users found"
              description="Try adjusting your search to locate a specific user."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th className="text-right">Role</th>
                  <th className="text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {u.full_name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            User ID {u.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td className="text-right">
                      <select
                        className="form-input h-8 py-1 text-xs"
                        value={u.role}
                        onChange={(e) =>
                          updateRole(
                            u.id,
                            e.target.value as "admin" | "manager" | "staff" | "customer"
                          )
                        }
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="text-right text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
