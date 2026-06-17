import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "customer";

// Module-level singleton session state — one auth listener for the whole app.
let cachedSession: Session | null = null;
let initialized = false;
const listeners = new Set<(s: Session | null) => void>();

function initAuthOnce() {
  if (initialized) return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => {
    cachedSession = data.session;
    listeners.forEach((l) => l(cachedSession));
  });
  supabase.auth.onAuthStateChange((event, session) => {
    // Ignore noisy non-identity events to avoid refetch storms.
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "INITIAL_SESSION") {
      return;
    }
    cachedSession = session;
    listeners.forEach((l) => l(cachedSession));
  });
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [ready, setReady] = useState(initialized && cachedSession !== undefined);

  useEffect(() => {
    initAuthOnce();
    const listener = (s: Session | null) => {
      setSession(s);
      setReady(true);
    };
    listeners.add(listener);
    // Push current state immediately if already initialized.
    if (cachedSession !== undefined) listener(cachedSession);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const user: User | null = session?.user ?? null;

  // React Query dedupes the role fetch across every useAuth() consumer.
  const { data: role } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AppRole> => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data?.role as AppRole) ?? "customer";
    },
  });

  return {
    user,
    role: user ? role ?? null : null,
    loading: !ready,
    isAdmin: role === "admin",
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
