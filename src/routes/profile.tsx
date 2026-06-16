import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — ShopSphere" }] }),
  component: ProfilePage,
});

type Address = { id: string; full_name: string; phone: string; address_line: string; city: string; state: string; pincode: string };

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddr, setNewAddr] = useState({ full_name: "", phone: "", address_line: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({ full_name: data.full_name ?? "", phone: data.phone ?? "" });
    });
    supabase.from("addresses").select("*").eq("user_id", user.id).then(({ data }) => setAddresses((data ?? []) as Address[]));
  }, [user]);

  if (!user) return <AppShell><div className="container mx-auto p-10 text-center">
    <Button asChild><Link to="/auth">Sign in</Link></Button>
  </div></AppShell>;

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const addAddress = async () => {
    const { data, error } = await supabase.from("addresses").insert({ ...newAddr, user_id: user.id }).select().single();
    if (error) return toast.error(error.message);
    setAddresses([...addresses, data as Address]);
    setNewAddr({ full_name: "", phone: "", address_line: "", city: "", state: "", pincode: "" });
    toast.success("Address added");
  };

  const removeAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Personal Info</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <div className="card-elevated p-4 space-y-3">
              <div><Label>Email</Label><Input value={user.email ?? ""} disabled className="mt-1" /></div>
              <div><Label>Full Name</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1" /></div>
              <Button onClick={saveProfile}>Save Changes</Button>
            </div>
          </TabsContent>
          <TabsContent value="addresses">
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="card-elevated p-3 flex justify-between items-start">
                  <div className="text-sm">
                    <div className="font-medium">{a.full_name} · {a.phone}</div>
                    <div className="text-muted-foreground">{a.address_line}, {a.city}, {a.state} - {a.pincode}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAddress(a.id)}>Remove</Button>
                </div>
              ))}
              <div className="card-elevated p-4">
                <h3 className="font-semibold mb-3">Add new address</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(["full_name", "phone", "address_line", "city", "state", "pincode"] as const).map((k) => (
                    <div key={k} className={k === "address_line" ? "sm:col-span-2" : ""}>
                      <Label className="text-xs capitalize">{k.replace("_", " ")}</Label>
                      <Input value={newAddr[k]} onChange={(e) => setNewAddr({ ...newAddr, [k]: e.target.value })} className="mt-1" />
                    </div>
                  ))}
                </div>
                <Button className="mt-3" onClick={addAddress}>Add Address</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
