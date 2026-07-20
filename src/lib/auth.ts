/** @format */

import {
  getAuthenticatedUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  type LaravelUser,
} from "./accountApi";

export const AUTH_CHANGED_EVENT = "baura:auth-changed";

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

async function createTemporaryAdminSupabaseSession(
  user: LaravelUser,
  email: string,
  password: string,
) {
  if (user.role !== "admin") return;

  try {
    const { supabase } = await import("./supabase");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    await logoutAccount().catch(() => undefined);

    throw new Error(
      error instanceof Error
        ? `Admin compatibility login failed: ${error.message}`
        : "Admin compatibility login failed.",
    );
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
) {
  const user = await registerAccount({
    email: email.trim().toLowerCase(),
    password,
    name: fullName.trim(),
    phone: phone?.trim() || null,
  });

  notifyAuthChanged();

  return { user };
}

export async function loginWithEmail(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await loginAccount(normalizedEmail, password);

  await createTemporaryAdminSupabaseSession(
    user,
    normalizedEmail,
    password,
  );

  notifyAuthChanged();

  return { user };
}

export async function loginWithGoogle() {
  throw new Error(
    "Google login is temporarily unavailable while authentication is moved to Laravel.",
  );
}

export async function logout() {
  try {
    await logoutAccount();
  } finally {
    try {
      const { supabase } = await import("./supabase");
      await supabase.auth.signOut();
    } catch {
      // Customer authentication no longer requires Supabase.
    }

    notifyAuthChanged();
  }
}

export async function getCurrentUser() {
  return getAuthenticatedUser();
}
