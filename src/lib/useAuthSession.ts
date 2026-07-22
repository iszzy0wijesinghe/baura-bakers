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

type SessionSnapshot = {
  user: LaravelUser | null;
  profile: Profile | null;
  isLoading: boolean;
};

const SESSION_REFRESH_MS = 60_000;

let snapshot: SessionSnapshot = {
  user: null,
  profile: null,
  isLoading: true,
};

let lastLoadedAt = 0;
let sessionRequest: Promise<void> | null = null;
let globalListenersAttached = false;

const listeners = new Set<(next: SessionSnapshot) => void>();

function profileFromUser(user: LaravelUser | null): Profile | null {
  if (!user) return null;

  return {
    id: String(user.id),
    full_name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

function publish(next: SessionSnapshot) {
  snapshot = next;

  for (const listener of listeners) {
    listener(snapshot);
  }
}

async function loadSharedSession(forceRefresh = false) {
  if (!forceRefresh && sessionRequest) {
    return sessionRequest;
  }

  if (
    !forceRefresh &&
    lastLoadedAt > 0 &&
    Date.now() - lastLoadedAt < SESSION_REFRESH_MS
  ) {
    return;
  }

  const initialLoad = lastLoadedAt === 0;

  if (initialLoad && !snapshot.isLoading) {
    publish({
      ...snapshot,
      isLoading: true,
    });
  }

  sessionRequest = getCurrentUser(forceRefresh)
    .then((user) => {
      lastLoadedAt = Date.now();

      publish({
        user,
        profile: profileFromUser(user),
        isLoading: false,
      });
    })
    .catch(() => {
      if (initialLoad) {
        publish({
          user: null,
          profile: null,
          isLoading: false,
        });
      }
    })
    .finally(() => {
      sessionRequest = null;
    });

  return sessionRequest;
}

function attachGlobalListeners() {
  if (globalListenersAttached || typeof window === "undefined") {
    return;
  }

  globalListenersAttached = true;

  window.addEventListener(AUTH_CHANGED_EVENT, () => {
    void loadSharedSession(true);
  });

  window.addEventListener("focus", () => {
    if (Date.now() - lastLoadedAt >= SESSION_REFRESH_MS) {
      void loadSharedSession(true);
    }
  });
}

export function useAuthSession() {
  const [state, setState] = useState<SessionSnapshot>(snapshot);

  useEffect(() => {
    attachGlobalListeners();
    listeners.add(setState);
    setState(snapshot);
    void loadSharedSession();

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAdmin: state.profile?.role === "admin",
    isCustomer: state.profile?.role === "customer",
    refresh: () => loadSharedSession(true),
  };
}
