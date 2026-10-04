/** @format */

import type { AdminManagedUser } from "../lib/adminUsersApi";

export type StatusFilter = "" | "active" | "inactive";

export type AdminPermissionOverrideState =
  | "inherit"
  | "allow"
  | "deny";

export type PermissionOverrideMap = Record<
  number,
  AdminPermissionOverrideState
>;

export type UserForm = {
  id: number | null;
  name: string;
  email: string;
  phone: string;
  defaultDeliveryAddress: string;
  role: number | null;
  isActive: boolean;
  password: string;
  confirmPassword: string;
  permissionProfileIds: number[];
  permissionOverrides: PermissionOverrideMap;
};

export type FieldErrors = Partial<
  Record<
    | "name"
    | "email"
    | "phone"
    | "defaultDeliveryAddress"
    | "role"
    | "password"
    | "confirmPassword",
    string
  >
>;

export type StatusConfirmation = {
  user: AdminManagedUser;
  nextActive: boolean;
} | null;

export const EMPTY_FORM: UserForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  defaultDeliveryAddress: "",
  role: null,
  isActive: true,
  password: "",
  confirmPassword: "",
  permissionProfileIds: [],
  permissionOverrides: {},
};