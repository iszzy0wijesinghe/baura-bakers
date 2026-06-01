import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin" | string;
};

export function useAuthSession() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSession() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", user.id)
      .single();

    setProfile(data as Profile | null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === "admin",
    isCustomer: profile?.role === "customer",
    refresh: loadSession,
  };
}