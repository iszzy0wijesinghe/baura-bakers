/** @format */

import {
  laravelDelete,
  laravelGet,
  laravelPatch,
  laravelPost,
} from "./laravelApi";

export type AdminRolePermission = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  action: string;
};

export type AdminRolePermissionGroup = {
  group: string;
  permissions: AdminRolePermission[];
};

export type AdminRole = {
  id: number;
  name: string;
  code: string;
  description: string | null;

  is_system: boolean;
  is_active: boolean;
  is_administrator: boolean;

  users_count: number;
  permissions_count: number;

  permission_ids?: number[];
  permission_keys?: string[];

  created_at: string | null;
  updated_at: string | null;
};

export type AdminRolesFilters = {
  search?: string;
  status?: "active" | "inactive" | "all";
};

export type AdminRolesResult = {
  roles: AdminRole[];
  permissions: AdminRolePermissionGroup[];
};

export type AdminRoleResult = {
  role: AdminRole;
  permissions: AdminRolePermissionGroup[];
};

export type CreateAdminRolePayload = {
  name: string;
  description?: string;
  is_active?: boolean;
  permission_ids?: number[];
};

export type UpdateAdminRolePayload = {
  name?: string;
  description?: string;
  permission_ids?: number[];
};

type AdminRolesResponse = {
  roles: AdminRole[];
  permissions: AdminRolePermissionGroup[];
};

type AdminRoleShowResponse = {
  role: AdminRole;
  permissions: AdminRolePermissionGroup[];
};

type AdminRoleMutationResponse = {
  message: string;
  role: AdminRole;
};

type AdminRoleDeleteResponse = {
  message: string;
};

function buildQuery(
  filters: AdminRolesFilters,
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

  if (filters.status) {
    params.set(
      "status",
      filters.status,
    );
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

function nullableText(
  value: string | undefined,
) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed =
    value.trim();

  return trimmed || null;
}

function normalizePermissionIds(
  values: number[] | undefined,
) {
  if (values === undefined) {
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
  ).sort(
    (first, second) =>
      first - second,
  );
}

function createPayload(
  payload: CreateAdminRolePayload,
) {
  return {
    name:
      payload.name.trim(),

    description:
      nullableText(
        payload.description,
      ),

    is_active:
      payload.is_active ??
      true,

    permission_ids:
      normalizePermissionIds(
        payload.permission_ids,
      ) ?? [],
  };
}

function updatePayload(
  payload: UpdateAdminRolePayload,
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
    payload.description !== undefined
  ) {
    body.description =
      nullableText(
        payload.description,
      );
  }

  if (
    payload.permission_ids !== undefined
  ) {
    body.permission_ids =
      normalizePermissionIds(
        payload.permission_ids,
      ) ?? [];
  }

  return body;
}

export async function getAdminRoles(
  filters: AdminRolesFilters = {},
): Promise<AdminRolesResult> {
  const response =
    await laravelGet<AdminRolesResponse>(
      `/api/v1/admin/roles${buildQuery(
        filters,
      )}`,
    );

  return {
    roles:
      response.roles ?? [],

    permissions:
      response.permissions ?? [],
  };
}

export async function getAdminRole(
  roleId: number,
): Promise<AdminRoleResult> {
  const response =
    await laravelGet<AdminRoleShowResponse>(
      `/api/v1/admin/roles/${roleId}`,
    );

  return {
    role:
      response.role,

    permissions:
      response.permissions ?? [],
  };
}

export async function createAdminRole(
  payload: CreateAdminRolePayload,
): Promise<AdminRole> {
  const response =
    await laravelPost<AdminRoleMutationResponse>(
      "/api/v1/admin/roles",
      createPayload(
        payload,
      ),
    );

  return response.role;
}

export async function updateAdminRole(
  roleId: number,
  payload: UpdateAdminRolePayload,
): Promise<AdminRole> {
  const response =
    await laravelPatch<AdminRoleMutationResponse>(
      `/api/v1/admin/roles/${roleId}`,
      updatePayload(
        payload,
      ),
    );

  return response.role;
}

export async function activateAdminRole(
  roleId: number,
): Promise<AdminRole> {
  const response =
    await laravelPatch<AdminRoleMutationResponse>(
      `/api/v1/admin/roles/${roleId}/activate`,
    );

  return response.role;
}

export async function deactivateAdminRole(
  roleId: number,
): Promise<AdminRole> {
  const response =
    await laravelPatch<AdminRoleMutationResponse>(
      `/api/v1/admin/roles/${roleId}/deactivate`,
    );

  return response.role;
}

export async function deleteAdminRole(
  roleId: number,
): Promise<string> {
  const response =
    await laravelDelete<AdminRoleDeleteResponse>(
      `/api/v1/admin/roles/${roleId}`,
    );

  return response.message;
}