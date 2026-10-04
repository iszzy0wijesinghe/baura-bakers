/** @format */

import {
  laravelGet,
  laravelPatch,
  laravelPost,
} from "./laravelApi";

export type AdminPermissionOverrideState =
  | "inherit"
  | "allow"
  | "deny";

export type AdminPermission = {
  id: number;
  key: string;
  name: string;
  group: string | null;
  description: string | null;
};

export type AdminPermissionProfile = {
  id: number;
  name: string;
  code?: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
};

export type AdminPermissionOverride = {
  permission_id: number;
  allowed: boolean;
};

export type AdminUserRole = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  is_staff?: boolean;

  /*
   * Compatibility fields used by the admin UI.
   *
   * The backend currently returns id/name, while some of the
   * frontend components use value/label.
   */
  value?: number;
  label?: string;
};

export type AdminManagedUserRole = {
  id: number;
  name: string;
  code: string;
  is_system: boolean;
  is_active: boolean;
};

export type AdminManagedPermissionProfile = {
  id: number;
  name: string;
  code?: string;
  description?: string | null;
  is_system?: boolean;
};

export type AdminManagedUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  default_delivery_address: string | null;

  role_id: number | null;
  role: AdminManagedUserRole | number | null;

  /*
   * Convenience label returned by some versions of the API.
   * It is also normalized client-side when absent.
   */
  role_label?: string;

  is_staff: boolean;
  is_administrator: boolean;
  is_active: boolean;
  has_password: boolean;
  email_verified: boolean;

  effective_permissions?: string[];

  permission_profile_ids?: number[];
  permission_profiles?: AdminManagedPermissionProfile[];
  permission_overrides?: AdminPermissionOverride[];

  created_at: string | null;
  updated_at: string | null;
};

export type AdminUsersPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

export type AdminUsersFilters = {
  search?: string;
  role?: number | null;
  role_id?: number | null;
  status?: "active" | "inactive" | "";
  page?: number;
  perPage?: number;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  phone: string;
  default_delivery_address: string;

  role_id: number;

  is_active: boolean;

  password?: string;

  permission_profile_ids?: number[];
  permission_overrides?: AdminPermissionOverride[];
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  default_delivery_address?: string;

  role_id?: number;

  is_active?: boolean;

  password?: string;

  permission_profile_ids?: number[];
  permission_overrides?: AdminPermissionOverride[];
};

export type AdminUsersResult = {
  users: AdminManagedUser[];
  roles: AdminUserRole[];
  pagination: AdminUsersPagination;
};

export type AdminUserResult = {
  user: AdminManagedUser;
  roles: AdminUserRole[];
  permission_profiles: AdminPermissionProfile[];
  permissions: AdminPermission[];
};

type AdminUsersResponse = {
  users?: AdminManagedUser[];
  roles?: AdminUserRole[];
  pagination: AdminUsersPagination;
};

type AdminUserShowResponse = {
  user: AdminManagedUser;
  roles?: AdminUserRole[];
  permission_profiles?: AdminPermissionProfile[];
  permissions?: AdminPermission[];
};

type AdminUserMutationResponse = {
  message: string;
  user: AdminManagedUser;
};

function buildQuery(
  filters: AdminUsersFilters,
): string {
  const params = new URLSearchParams();

  const search = filters.search?.trim();

  if (search) {
    params.set(
      "search",
      search,
    );
  }

  const roleId =
    filters.role_id ??
    filters.role;

  if (
    roleId !== undefined &&
    roleId !== null
  ) {
    params.set(
      "role_id",
      String(roleId),
    );
  }

  if (filters.status) {
    params.set(
      "status",
      filters.status,
    );
  }

  if (
    filters.page !== undefined
  ) {
    params.set(
      "page",
      String(filters.page),
    );
  }

  if (
    filters.perPage !== undefined
  ) {
    params.set(
      "per_page",
      String(filters.perPage),
    );
  }

  const query = params.toString();

  return query
    ? `?${query}`
    : "";
}

function nullableText(
  value: string,
): string | null {
  const trimmed = value.trim();

  return trimmed || null;
}

function normalizeRoleId(
  value: number,
): number {
  const roleId = Number(value);

  return Number.isInteger(roleId) &&
    roleId > 0
    ? roleId
    : value;
}

function normalizeRole(
  role: AdminUserRole,
): AdminUserRole {
  return {
    ...role,
    value:
      typeof role.value === "number"
        ? role.value
        : role.id,
    label:
      typeof role.label === "string" &&
      role.label.trim()
        ? role.label
        : role.name,
  };
}

function normalizeRoles(
  roles: AdminUserRole[] | undefined,
): AdminUserRole[] {
  return (roles ?? []).map(
    normalizeRole,
  );
}

function getRoleLabelFromUser(
  user: AdminManagedUser,
): string {
  if (
    user.role_label &&
    user.role_label.trim()
  ) {
    return user.role_label;
  }

  if (
    user.role &&
    typeof user.role === "object"
  ) {
    return user.role.name;
  }

  return "Unassigned";
}

function normalizeUser(
  user: AdminManagedUser,
): AdminManagedUser {
  return {
    ...user,

    role_label:
      getRoleLabelFromUser(user),

    permission_profile_ids:
      user.permission_profile_ids ??
      user.permission_profiles?.map(
        (profile) => profile.id,
      ) ??
      [],

    permission_profiles:
      user.permission_profiles ?? [],

    permission_overrides:
      user.permission_overrides ?? [],

    effective_permissions:
      user.effective_permissions ?? [],
  };
}

function createPayload(
  payload: CreateAdminUserPayload,
): Record<string, unknown> {
  const password =
    payload.password?.trim();

  return {
    name:
      payload.name.trim(),

    email:
      nullableText(
        payload.email,
      ),

    phone:
      nullableText(
        payload.phone,
      ),

    default_delivery_address:
      nullableText(
        payload.default_delivery_address,
      ),

    role_id:
      normalizeRoleId(
        payload.role_id,
      ),

    is_active:
      payload.is_active,

    permission_profile_ids:
      payload.permission_profile_ids ??
      [],

    permission_overrides:
      payload.permission_overrides ??
      [],

    ...(password
      ? {
          password,
        }
      : {}),
  };
}

function updatePayload(
  payload: UpdateAdminUserPayload,
): Record<string, unknown> {
  const body: Record<
    string,
    unknown
  > = {};

  if (
    payload.name !== undefined
  ) {
    body.name =
      payload.name.trim();
  }

  if (
    payload.email !== undefined
  ) {
    body.email =
      nullableText(
        payload.email,
      );
  }

  if (
    payload.phone !== undefined
  ) {
    body.phone =
      nullableText(
        payload.phone,
      );
  }

  if (
    payload.default_delivery_address !==
    undefined
  ) {
    body.default_delivery_address =
      nullableText(
        payload.default_delivery_address,
      );
  }

  if (
    payload.role_id !== undefined
  ) {
    body.role_id =
      normalizeRoleId(
        payload.role_id,
      );
  }

  if (
    payload.is_active !== undefined
  ) {
    body.is_active =
      payload.is_active;
  }

  if (
    payload.password !== undefined
  ) {
    const password =
      payload.password.trim();

    if (password) {
      body.password =
        password;
    }
  }

  if (
    payload.permission_profile_ids !==
    undefined
  ) {
    body.permission_profile_ids =
      payload.permission_profile_ids;
  }

  if (
    payload.permission_overrides !==
    undefined
  ) {
    body.permission_overrides =
      payload.permission_overrides;
  }

  return body;
}

export async function getAdminUsers(
  filters: AdminUsersFilters = {},
): Promise<AdminUsersResult> {
  const response =
    await laravelGet<AdminUsersResponse>(
      `/api/v1/admin/users${buildQuery(
        filters,
      )}`,
    );

  return {
    users:
      (response.users ?? []).map(
        normalizeUser,
      ),

    roles:
      normalizeRoles(
        response.roles,
      ),

    pagination:
      response.pagination,
  };
}

export async function getAdminUser(
  userId: number,
): Promise<AdminUserResult> {
  const response =
    await laravelGet<AdminUserShowResponse>(
      `/api/v1/admin/users/${userId}`,
    );

  return {
    user:
      normalizeUser(
        response.user,
      ),

    roles:
      normalizeRoles(
        response.roles,
      ),

    permission_profiles:
      response.permission_profiles ??
      [],

    permissions:
      response.permissions ??
      [],
  };
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminManagedUser> {
  const response =
    await laravelPost<AdminUserMutationResponse>(
      "/api/v1/admin/users",
      createPayload(
        payload,
      ),
    );

  return normalizeUser(
    response.user,
  );
}

export async function updateAdminUser(
  userId: number,
  payload: UpdateAdminUserPayload,
): Promise<AdminManagedUser> {
  const response =
    await laravelPatch<AdminUserMutationResponse>(
      `/api/v1/admin/users/${userId}`,
      updatePayload(
        payload,
      ),
    );

  return normalizeUser(
    response.user,
  );
}