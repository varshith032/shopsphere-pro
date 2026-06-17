import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { verifyAdmin } from "@/lib/orders.functions";
import { LayoutDashboard, Package, ShoppingCart, Tags, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const verify = useServerFn(verifyAdmin);

  const { data, isLoading: checking, isError } = useQuery({
    queryKey: ["admin-verify", user?.id],
    queryFn: () => verify(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const serverIsAdmin = data?.isAdmin === true;

  useEffect(() => {
    if (loading || checking) return;
    if (!user || isError || !serverIsAdmin) navigate({ to: "/" });
  }, [user, loading, checking, serverIsAdmin, isError, navigate]);

  if (loading || checking || !user || !serverIsAdmin) {
    return <AppShell><div className="container mx-auto p-10 text-center">Checking access…</div></AppShell>;
  }


  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    { to: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[220px_1fr] gap-4">
        <aside className="card-elevated p-2 h-fit lg:sticky lg:top-32">
          <nav className="flex lg:flex-col overflow-x-auto">
            {links.map((l) => (
              <Link key={l.to} to={l.to} activeOptions={{ exact: l.exact }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                inactiveProps={{ className: "hover:bg-secondary" }}
                className={cn("flex items-center gap-2 px-3 py-2 rounded text-sm whitespace-nowrap")}>
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </AppShell>
  );
}
