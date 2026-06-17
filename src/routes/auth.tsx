import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ShopSphere" }] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email();
const pwSchema = z.string().min(6).max(72);

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("login");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ full_name: "", email: "", password: "" });

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(login.email).success) return toast.error("Invalid email");
    if (!pwSchema.safeParse(login.password).success) return toast.error("Password too short");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(login);
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back!"); navigate({ to: "/" }); }
  };

  const doSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(signup.email).success) return toast.error("Invalid email");
    if (!pwSchema.safeParse(signup.password).success) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signup.email,
      password: signup.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: signup.full_name },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created!"); navigate({ to: "/" }); }
  };

  const useDemo = (kind: "admin" | "user") => {
    if (kind === "admin") setLogin({ email: "admin@shopsphere.com", password: "Admin123" });
    else setLogin({ email: "user@shopsphere.com", password: "User123" });
    setTab("login");
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 max-w-5xl">
        <div className="hidden md:block bg-primary text-primary-foreground rounded-lg p-8">
          <h2 className="text-3xl font-bold">Welcome to ShopSphere</h2>
          <p className="mt-2 opacity-90">Sign in to access your orders, wishlist, recommendations, and more.</p>
          <ul className="mt-6 space-y-2 text-sm opacity-90 list-disc list-inside">
            <li>Track orders and manage addresses</li>
            <li>Save favourites to your wishlist</li>
            <li>Faster checkout on every visit</li>
          </ul>
        </div>


        <div className="card-elevated p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={doLogin} className="space-y-3 mt-4">
                <div><Label>Email</Label><Input type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} className="mt-1" /></div>
                <div><Label>Password</Label><Input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} className="mt-1" /></div>
                <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:opacity-90 font-semibold">{loading ? "Signing in…" : "Sign in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={doSignup} className="space-y-3 mt-4">
                <div><Label>Full Name</Label><Input value={signup.full_name} onChange={(e) => setSignup({ ...signup, full_name: e.target.value })} className="mt-1" /></div>
                <div><Label>Email</Label><Input type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} className="mt-1" /></div>
                <div><Label>Password</Label><Input type="password" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} className="mt-1" /></div>
                <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:opacity-90 font-semibold">{loading ? "Creating…" : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground text-center mt-4">
            <Link to="/" className="hover:text-primary">← Back to home</Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
