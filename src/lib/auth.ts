/** @format */

import {
  getAuthenticatedUser,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "./accountApi";

export const AUTH_CHANGED_EVENT = "baura:auth-changed";

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
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
  const user = await loginAccount(
    email.trim().toLowerCase(),
    password,
  );

  notifyAuthChanged();

  return { user };
}

export async function loginWithGoogle() {
  throw new Error("Google login is not currently available.");
}

export async function logout() {
  try {
    await logoutAccount();
  } finally {
    notifyAuthChanged();
  }
}

export async function getCurrentUser() {
  return getAuthenticatedUser();
}
