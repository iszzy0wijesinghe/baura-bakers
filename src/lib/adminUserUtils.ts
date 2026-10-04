/** @format */

import { LaravelApiError } from "./laravelApi";

import type {
  AdminManagedUser,
  AdminPermission,
  AdminUserRole,
} from "./adminUsersApi";

import type {
  FieldErrors,
  PermissionOverrideMap,
  UserForm,
} from "../types/adminUsers";

export function userToForm(user: AdminManagedUser): UserForm {
  const overrides: PermissionOverrideMap = {};

  for (const override of user.permission_overrides ?? []) {
    overrides[override.permission_id] = override.allowed
      ? "allow"
      : "deny";
  }

  const profileIds =
    user.permission_profile_ids ??
    user.permission_profiles?.map((profile) => profile.id) ??
    [];

  return {
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    phone: user.phone ?? "",
    defaultDeliveryAddress: user.default_delivery_address ?? "",
    role: getUserRoleId(user.role),
    isActive: user.is_active,
    password: "",
    confirmPassword: "",
    permissionProfileIds: profileIds,
    permissionOverrides: overrides,
  };
}

export function formsEqual(
  first: UserForm,
  second: UserForm,
): boolean {
  if (
    first.id !== second.id ||
    first.name !== second.name ||
    first.email !== second.email ||
    first.phone !== second.phone ||
    first.defaultDeliveryAddress !== second.defaultDeliveryAddress ||
    first.role !== second.role ||
    first.isActive !== second.isActive ||
    first.password !== second.password ||
    first.confirmPassword !== second.confirmPassword
  ) {
    return false;
  }

  const firstProfiles = [...first.permissionProfileIds].sort(
    (a, b) => a - b,
  );

  const secondProfiles = [...second.permissionProfileIds].sort(
    (a, b) => a - b,
  );

  if (firstProfiles.length !== secondProfiles.length) {
    return false;
  }

  for (let index = 0; index < firstProfiles.length; index += 1) {
    if (firstProfiles[index] !== secondProfiles[index]) {
      return false;
    }
  }

  const firstOverrides = normalizePermissionOverrides(
    first.permissionOverrides,
  );

  const secondOverrides = normalizePermissionOverrides(
    second.permissionOverrides,
  );

  const firstKeys = Object.keys(firstOverrides).sort();
  const secondKeys = Object.keys(secondOverrides).sort();

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  for (let index = 0; index < firstKeys.length; index += 1) {
    const key = firstKeys[index];

    if (
      key !== secondKeys[index] ||
      firstOverrides[Number(key)] !== secondOverrides[Number(key)]
    ) {
      return false;
    }
  }

  return true;
}

export function normalizePermissionOverrides(
  overrides: PermissionOverrideMap,
): PermissionOverrideMap {
  const normalized: PermissionOverrideMap = {};

  for (const [permissionId, state] of Object.entries(overrides)) {
    if (state === "inherit") {
      continue;
    }

    normalized[Number(permissionId)] = state;
  }

  return normalized;
}

export function validateUserForm(
  form: UserForm,
  selectedRole: AdminUserRole | null,
  isEditing: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();

  if (!name) {
    errors.name = "Enter the user's full name.";
  } else if (name.length > 150) {
    errors.name = "Name cannot exceed 150 characters.";
  }

  if (form.role === null) {
    errors.role = "Select an account role.";
  }

  if (isStaffRole(selectedRole) && !email) {
    errors.email = "Staff accounts require an email address.";
  } else if (email && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phone.length > 30) {
    errors.phone = "Phone number cannot exceed 30 characters.";
  }

  if (!isEditing && isStaffRole(selectedRole) && !form.password) {
    errors.password = "Staff accounts require a password.";
  }

  if (form.password && form.password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  if (form.password && !form.confirmPassword) {
    errors.confirmPassword = "Confirm the password.";
  }

  if (
    form.password &&
    form.confirmPassword &&
    form.password !== form.confirmPassword
  ) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function mapLaravelFieldErrors(
  error: unknown,
): FieldErrors {
  if (
    !(error instanceof LaravelApiError) ||
    !error.payload?.errors
  ) {
    return {};
  }

  const result: FieldErrors = {};

  const fieldMap: Record<string, keyof FieldErrors> = {
    name: "name",
    email: "email",
    phone: "phone",
    role: "role",
    role_id: "role",
    password: "password",
    password_confirmation: "confirmPassword",
  };

  for (const [serverField, messages] of Object.entries(
    error.payload.errors,
  )) {
    const localField = fieldMap[serverField];

    if (localField && messages?.[0]) {
      result[localField] = messages[0];
    }
  }

  return result;
}

export function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: "Not set",
    };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password)
  ) {
    score += 1;
  }

  if (
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  ) {
    score += 1;
  }

  const normalizedScore = Math.min(
    Math.max(score, 1),
    4,
  );

  const labels = [
    "",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
  };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string): boolean {
  const normalized = value.replace(/[\s\-().]/g, "");

  return /^\+?\d{7,15}$/.test(normalized);
}

export function groupPermissions(
  permissions: AdminPermission[],
): Record<string, AdminPermission[]> {
  return permissions.reduce<Record<string, AdminPermission[]>>(
    (groups, permission) => {
      const group = permission.group?.trim() || "Other";

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(permission);

      return groups;
    },
    {},
  );
}

export function formatPermissionGroup(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof LaravelApiError) {
    if (error.payload?.errors) {
      for (const messages of Object.values(error.payload.errors)) {
        if (messages?.[0]) {
          return messages[0];
        }
      }
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function getRoleValue(
  role: AdminUserRole,
): number {
  if ("value" in role && typeof role.value === "number") {
    return role.value;
  }

  if ("id" in role && typeof role.id === "number") {
    return role.id;
  }

  throw new Error("Admin role does not contain a numeric identifier.");
}

export function getRoleLabel(
  role: AdminUserRole,
): string {
  if ("label" in role && typeof role.label === "string") {
    return role.label;
  }

  if ("name" in role && typeof role.name === "string") {
    return role.name;
  }

  return `Role ${getRoleValue(role)}`;
}

export function isStaffRole(
  role: AdminUserRole | null,
): boolean {
  if (!role) {
    return false;
  }

  if (
    "is_staff" in role &&
    typeof role.is_staff === "boolean"
  ) {
    return role.is_staff;
  }

  return false;
}

function getUserRoleId(role: unknown): number | null {
  if (typeof role === "number") {
    return role;
  }

  if (
    role &&
    typeof role === "object"
  ) {
    if (
      "id" in role &&
      typeof role.id === "number"
    ) {
      return role.id;
    }

    if (
      "value" in role &&
      typeof role.value === "number"
    ) {
      return role.value;
    }
  }

  return null;
}