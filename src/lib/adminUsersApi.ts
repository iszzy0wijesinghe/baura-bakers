/** @format */

import {
  laravelGet,
  laravelPatch,
  laravelPost,
} from "./laravelApi";

export type AdminUserRole = {
  value: number;
  name: string;
  label: string;
  is_staff: boolean;
};

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
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  permissions: string[];
};

export type AdminPermissionOverrideState =
  | "inherit"
  | "allow"
  | "deny";

export type AdminPermissionOverride = {
  permission_id: number;
  permission_key: string;
  allowed: boolean;
};

export type AdminManagedUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  default_delivery_address: string | null;

  role: number;
  role_name: string;
  role_label: string;

  is_staff: boolean;
  is_active: boolean;
  has_password: boolean;
  email_verified: boolean;

  permission_profile_ids?: number[];
  permission_profiles?: AdminPermissionProfile[];
  permission_overrides?: AdminPermissionOverride[];
  effective_permissions?: string[];

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
  status?: "active" | "inactive" | "";
  page?: number;
  perPage?: number;
};

export type PermissionOverridePayload = {
  permission_id: number;
  allowed: boolean;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  phone: string;
  default_delivery_address: string;
  role: number;
  is_active: boolean;
  password?: string;

  permission_profile_ids?: number[];
  permission_overrides?: PermissionOverridePayload[];
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  default_delivery_address?: string;
  role?: number;
  is_active?: boolean;
  password?: string;

  permission_profile_ids?: number[];
  permission_overrides?: PermissionOverridePayload[];
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
  users: AdminManagedUser[];
  roles: AdminUserRole[];
  pagination: AdminUsersPagination;
};

type AdminUserShowResponse = {
  user: AdminManagedUser;
  roles: AdminUserRole[];
  permission_profiles: AdminPermissionProfile[];
  permissions: AdminPermission[];
};

type AdminUserMutationResponse = {
  message: string;
  user: AdminManagedUser;
};

function buildQuery(
  filters: AdminUsersFilters,
) {
  const params =
    new URLSearchParams();

  const search =
    filters.search?.trim();

  if (search) {
    params.set(
      "search",
      search,
    );
  }

  if (
    filters.role !== undefined &&
    filters.role !== null
  ) {
    params.set(
      "role",
      String(filters.role),
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

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

function nullableText(
  value: string,
) {
  const trimmed =
    value.trim();

  return trimmed || null;
}

function normalizeProfileIds(
  values?: number[],
) {
  if (!values) {
    return undefined;
  }

  return Array.from(
    new Set(
      values
        .map(Number)
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value > 0,
        ),
    ),
  );
}

function normalizePermissionOverrides(
  values?: PermissionOverridePayload[],
) {
  if (!values) {
    return undefined;
  }

  const overrides =
    new Map<
      number,
      PermissionOverridePayload
    >();

  for (const value of values) {
    const permissionId =
      Number(value.permission_id);

    if (
      !Number.isInteger(permissionId) ||
      permissionId <= 0
    ) {
      continue;
    }

    overrides.set(
      permissionId,
      {
        permission_id:
          permissionId,

        allowed:
          Boolean(value.allowed),
      },
    );
  }

  return Array.from(
    overrides.values(),
  );
}

function createPayload(
  payload: CreateAdminUserPayload,
) {
  const password =
    payload.password?.trim();

  const profileIds =
    normalizeProfileIds(
      payload.permission_profile_ids,
    );

  const permissionOverrides =
    normalizePermissionOverrides(
      payload.permission_overrides,
    );

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

    role:
      Number(payload.role),

    is_active:
      payload.is_active,

    ...(password
      ? {
          password,
        }
      : {}),

    ...(profileIds !== undefined
      ? {
          permission_profile_ids:
            profileIds,
        }
      : {}),

    ...(permissionOverrides !==
    undefined
      ? {
          permission_overrides:
            permissionOverrides,
        }
      : {}),
  };
}

function updatePayload(
  payload: UpdateAdminUserPayload,
) {
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
    payload.role !== undefined
  ) {
    body.role =
      Number(payload.role);
  }

  if (
    payload.is_active !==
    undefined
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
      normalizeProfileIds(
        payload.permission_profile_ids,
      ) ?? [];
  }

  if (
    payload.permission_overrides !==
    undefined
  ) {
    body.permission_overrides =
      normalizePermissionOverrides(
        payload.permission_overrides,
      ) ?? [];
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
      response.users,

    roles:
      response.roles,

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
      response.user,

    roles:
      response.roles,

    permission_profiles:
      response.permission_profiles ?? [],

    permissions:
      response.permissions ?? [],
  };
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
) {
  const response =
    await laravelPost<AdminUserMutationResponse>(
      "/api/v1/admin/users",
      createPayload(payload),
    );

  return response.user;
}

export async function updateAdminUser(
  userId: number,
  payload: UpdateAdminUserPayload,
) {
  const response =
    await laravelPatch<AdminUserMutationResponse>(
      `/api/v1/admin/users/${userId}`,
      updatePayload(payload),
    );

  return response.user;
}