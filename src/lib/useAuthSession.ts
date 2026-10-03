/** @format */

import {
  useEffect,
  useState,
} from "react";

import type {
  LaravelUser,
} from "./accountApi";

import {
  AUTH_CHANGED_EVENT,
  getCurrentUser,
} from "./auth";

export type AuthProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;

  /**
   * Legacy role retained only for old
   * storefront compatibility.
   */
  legacyRole:
    | "customer"
    | "admin";

  /**
   * Canonical role metadata supplied
   * entirely by Laravel.
   */
  roleValue: number;
  roleName: string;
  roleLabel: string;

  isStaff: boolean;
  isActive: boolean;

  canAccessWebsiteAdmin: boolean;
  canAccessErp: boolean;

  permissions: string[];
};

type SessionSnapshot = {
  user: LaravelUser | null;
  profile: AuthProfile | null;
  isLoading: boolean;
};

const SESSION_REFRESH_MS = 60_000;

let snapshot: SessionSnapshot = {
  user: null,
  profile: null,
  isLoading: true,
};

let lastLoadedAt = 0;

let sessionRequest:
  | Promise<void>
  | null = null;

let globalListenersAttached =
  false;

const listeners = new Set<
  (
    next: SessionSnapshot,
  ) => void
>();

function normalizePermissions(
  permissions: unknown,
) {
  if (
    !Array.isArray(
      permissions,
    )
  ) {
    return [];
  }

  return permissions.filter(
    (
      permission,
    ): permission is string =>
      typeof permission ===
        "string" &&
      permission.length > 0,
  );
}

function profileFromUser(
  user: LaravelUser | null,
): AuthProfile | null {
  if (!user) {
    return null;
  }

  return {
    id: String(user.id),

    fullName:
      user.name || null,

    email:
      user.email || null,

    phone:
      user.phone,

    legacyRole:
      user.role,

    roleValue:
      user.role_value,

    roleName:
      user.role_name,

    roleLabel:
      user.role_label,

    isStaff:
      user.is_staff,

    isActive:
      user.is_active,

    canAccessWebsiteAdmin:
      user.can_access_website_admin,

    canAccessErp:
      user.can_access_erp,

    permissions:
      normalizePermissions(
        user.permissions,
      ),
  };
}

function publish(
  next: SessionSnapshot,
) {
  snapshot = next;

  for (
    const listener
    of listeners
  ) {
    listener(snapshot);
  }
}

async function loadSharedSession(
  forceRefresh = false,
) {
  if (
    !forceRefresh &&
    sessionRequest
  ) {
    return sessionRequest;
  }

  if (
    !forceRefresh &&
    lastLoadedAt > 0 &&
    Date.now() -
      lastLoadedAt <
      SESSION_REFRESH_MS
  ) {
    return;
  }

  const initialLoad =
    lastLoadedAt === 0;

  if (
    initialLoad &&
    !snapshot.isLoading
  ) {
    publish({
      ...snapshot,
      isLoading: true,
    });
  }

  sessionRequest =
    getCurrentUser(
      forceRefresh,
    )
      .then((user) => {
        lastLoadedAt =
          Date.now();

        publish({
          user,
          profile:
            profileFromUser(
              user,
            ),
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
        sessionRequest =
          null;
      });

  return sessionRequest;
}

function attachGlobalListeners() {
  if (
    globalListenersAttached ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  globalListenersAttached =
    true;

  window.addEventListener(
    AUTH_CHANGED_EVENT,
    () => {
      void loadSharedSession(
        true,
      );
    },
  );

  window.addEventListener(
    "focus",
    () => {
      if (
        Date.now() -
          lastLoadedAt >=
        SESSION_REFRESH_MS
      ) {
        void loadSharedSession(
          true,
        );
      }
    },
  );
}

function profileHasPermission(
  profile:
    | AuthProfile
    | null,
  permission: string,
) {
  if (
    !profile ||
    !profile.isActive
  ) {
    return false;
  }

  return (
    profile.permissions.includes(
      permission,
    )
  );
}

function profileHasAnyPermission(
  profile:
    | AuthProfile
    | null,
  permissions: string[],
) {
  if (
    !profile ||
    !profile.isActive
  ) {
    return false;
  }

  return permissions.some(
    (permission) =>
      profile.permissions.includes(
        permission,
      ),
  );
}

function profileHasAllPermissions(
  profile:
    | AuthProfile
    | null,
  permissions: string[],
) {
  if (
    !profile ||
    !profile.isActive
  ) {
    return false;
  }

  return permissions.every(
    (permission) =>
      profile.permissions.includes(
        permission,
      ),
  );
}

export function useAuthSession() {
  const [
    state,
    setState,
  ] =
    useState<SessionSnapshot>(
      snapshot,
    );

  useEffect(() => {
    attachGlobalListeners();

    listeners.add(
      setState,
    );

    setState(snapshot);

    void loadSharedSession();

    return () => {
      listeners.delete(
        setState,
      );
    };
  }, []);

  const profile =
    state.profile;

  return {
    user:
      state.user,

    profile,

    isLoading:
      state.isLoading,

    isAuthenticated:
      state.user !== null,

    isActive:
      profile?.isActive ===
      true,

    isStaff:
      profile?.isStaff ===
      true,

    canAccessWebsiteAdmin:
      profile
        ?.canAccessWebsiteAdmin ===
      true,

    canAccessErp:
      profile
        ?.canAccessErp ===
      true,

    hasPermission: (
      permission: string,
    ) =>
      profileHasPermission(
        profile,
        permission,
      ),

    hasAnyPermission: (
      permissions: string[],
    ) =>
      profileHasAnyPermission(
        profile,
        permissions,
      ),

    hasAllPermissions: (
      permissions: string[],
    ) =>
      profileHasAllPermissions(
        profile,
        permissions,
      ),

    refresh: () =>
      loadSharedSession(
        true,
      ),
  };
}