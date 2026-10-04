/** @format */

import {
  useCallback,
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
   * Legacy storefront compatibility only.
   *
   * Never use this value for new authorization
   * decisions.
   */
  legacyRole:
    | "customer"
    | "admin";

  /**
   * Legacy role metadata retained while the
   * backend transition is completed.
   *
   * Authorization is permission-driven.
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

const SESSION_REFRESH_MS =
  60_000;

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
): string[] {
  if (
    !Array.isArray(
      permissions,
    )
  ) {
    return [];
  }

  return Array.from(
    new Set(
      permissions.filter(
        (
          permission,
        ): permission is string =>
          typeof permission ===
            "string" &&
          permission.trim()
            .length > 0,
      ),
    ),
  );
}

function profileFromUser(
  user: LaravelUser | null,
): AuthProfile | null {
  if (!user) {
    return null;
  }

  return {
    id:
      String(user.id),

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
      user.is_staff === true,

    isActive:
      user.is_active === true,

    canAccessWebsiteAdmin:
      user
        .can_access_website_admin ===
      true,

    canAccessErp:
      user.can_access_erp ===
      true,

    permissions:
      normalizePermissions(
        user.permissions,
      ),
  };
}

function publish(
  next: SessionSnapshot,
): void {
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
): Promise<void> {
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
        lastLoadedAt =
          Date.now();

        publish({
          user: null,
          profile: null,
          isLoading: false,
        });
      })
      .finally(() => {
        sessionRequest =
          null;
      });

  return sessionRequest;
}

function attachGlobalListeners(): void {
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
      lastLoadedAt = 0;

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
): boolean {
  if (
    !profile ||
    !profile.isActive
  ) {
    return false;
  }

  return profile.permissions.includes(
    permission,
  );
}

function profileHasAnyPermission(
  profile:
    | AuthProfile
    | null,
  permissions: string[],
): boolean {
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
): boolean {
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

  const hasPermission =
    useCallback(
      (
        permission: string,
      ): boolean =>
        profileHasPermission(
          profile,
          permission,
        ),
      [profile],
    );

  const hasAnyPermission =
    useCallback(
      (
        permissions: string[],
      ): boolean =>
        profileHasAnyPermission(
          profile,
          permissions,
        ),
      [profile],
    );

  const hasAllPermissions =
    useCallback(
      (
        permissions: string[],
      ): boolean =>
        profileHasAllPermissions(
          profile,
          permissions,
        ),
      [profile],
    );

  const refresh =
    useCallback(
      () =>
        loadSharedSession(
          true,
        ),
      [],
    );

  return {
    user:
      state.user,

    profile,

    permissions:
      profile?.permissions ?? [],

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

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh,
  };
}