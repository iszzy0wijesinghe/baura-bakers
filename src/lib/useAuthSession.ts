/** @format */

import { useEffect, useState } from "react";
import type { LaravelUser } from "./accountApi";
import {
  AUTH_CHANGED_EVENT,
  getCurrentUser,
} from "./auth";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

export function useAuthSession() {
  const [user, setUser] = useState<LaravelUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSession() {
    setIsLoading(true);

    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
      setProfile(
        currentUser
          ? {
              id: String(currentUser.id),
              full_name: currentUser.name,
              phone: currentUser.phone,
              role: currentUser.role,
            }
          : null,
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSession();

    const refresh = () => {
      void loadSession();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
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
