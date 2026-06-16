import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, full_name, phone, created_at").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const filtered = (users ?? []).filter((u) => !search || (u.email?.toLowerCase() ?? "").includes(search.toLowerCase()) || (u.full_name?.toLowerCase() ?? "").includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <div className="card-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Phone</th><th className="p-2">Joined</th></tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="p-2">{u.full_name ?? "—"}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.phone ?? "—"}</td>
                <td className="p-2">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
