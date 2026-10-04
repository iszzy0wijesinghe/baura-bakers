/** @format */

import {
  laravelGet,
  laravelPatch,
  laravelPost,
} from "./laravelApi";

export type AdminPermission = {
  id: number;
  key: string;
  name: string;
  group: string;
  description: string | null;
};

export type AdminPermissionProfile = {
  id: number;
  name: string;
  description: string | null;

  is_system: boolean;
  is_active: boolean;

  users_count: number;

  permissions: string[];

  created_at: string | null;
  updated_at: string | null;
};

export type AdminPermissionProfilesResult = {
  profiles: AdminPermissionProfile[];
  permissions: AdminPermission[];
};

export type AdminPermissionProfileResult = {
  profile: AdminPermissionProfile;
  permissions: AdminPermission[];
};

export type CreateAdminPermissionProfilePayload = {
  name: string;
  description?: string;
  is_active?: boolean;
  permissions?: string[];
};

export type UpdateAdminPermissionProfilePayload = {
  name?: string;
  description?: string;
  is_active?: boolean;
  permissions?: string[];
};

type AdminPermissionProfilesResponse = {
  profiles: AdminPermissionProfile[];
  permissions: AdminPermission[];
};

type AdminPermissionProfileShowResponse = {
  profile: AdminPermissionProfile;
  permissions: AdminPermission[];
};

type AdminPermissionProfileMutationResponse = {
  message: string;
  profile: AdminPermissionProfile;
};

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

function normalizePermissionKeys(
  permissions: string[] | undefined,
) {
  if (permissions === undefined) {
    return undefined;
  }

  return Array.from(
    new Set(
      permissions
        .map((permission) =>
          permission.trim(),
        )
        .filter(Boolean),
    ),
  ).sort();
}

function createPayload(
  payload: CreateAdminPermissionProfilePayload,
) {
  const permissions =
    normalizePermissionKeys(
      payload.permissions,
    );

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

    permissions:
      permissions ??
      [],
  };
}

function updatePayload(
  payload: UpdateAdminPermissionProfilePayload,
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
    payload.is_active !== undefined
  ) {
    body.is_active =
      payload.is_active;
  }

  if (
    payload.permissions !== undefined
  ) {
    body.permissions =
      normalizePermissionKeys(
        payload.permissions,
      ) ?? [];
  }

  return body;
}

export async function getAdminPermissionProfiles(): Promise<AdminPermissionProfilesResult> {
  const response =
    await laravelGet<AdminPermissionProfilesResponse>(
      "/api/v1/admin/permission-profiles",
    );

  return {
    profiles:
      response.profiles,

    permissions:
      response.permissions,
  };
}

export async function getAdminPermissionProfile(
  profileId: number,
): Promise<AdminPermissionProfileResult> {
  const response =
    await laravelGet<AdminPermissionProfileShowResponse>(
      `/api/v1/admin/permission-profiles/${profileId}`,
    );

  return {
    profile:
      response.profile,

    permissions:
      response.permissions,
  };
}

export async function createAdminPermissionProfile(
  payload: CreateAdminPermissionProfilePayload,
): Promise<AdminPermissionProfile> {
  const response =
    await laravelPost<AdminPermissionProfileMutationResponse>(
      "/api/v1/admin/permission-profiles",
      createPayload(
        payload,
      ),
    );

  return response.profile;
}

export async function updateAdminPermissionProfile(
  profileId: number,
  payload: UpdateAdminPermissionProfilePayload,
): Promise<AdminPermissionProfile> {
  const response =
    await laravelPatch<AdminPermissionProfileMutationResponse>(
      `/api/v1/admin/permission-profiles/${profileId}`,
      updatePayload(
        payload,
      ),
    );

  return response.profile;
}