/** @format */

import {
  Check,
  ChevronDown,
  LockKeyhole,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type {
  AdminPermission,
  AdminPermissionOverrideState,
  AdminPermissionProfile,
} from "../../../lib/adminUsersApi";

import type {
  PermissionOverrideMap,
  UserForm,
} from "../../../types/adminUsers";

import {
  formatPermissionGroup,
  groupPermissions,
} from "../../../lib/adminUserUtils";

type UserPermissionsProps = {
  form: UserForm;
  setForm: Dispatch<SetStateAction<UserForm>>;
  permissionProfiles: AdminPermissionProfile[];
  permissions: AdminPermission[];
  permissionSearch: string;
  setPermissionSearch: Dispatch<SetStateAction<string>>;
};

export default function UserPermissions({
  form,
  setForm,
  permissionProfiles,
  permissions,
  permissionSearch,
  setPermissionSearch,
}: UserPermissionsProps) {
  const inheritedKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const profile of permissionProfiles) {
      if (!form.permissionProfileIds.includes(profile.id)) {
        continue;
      }

      for (const permissionKey of profile.permissions) {
        keys.add(permissionKey);
      }
    }

    return keys;
  }, [permissionProfiles, form.permissionProfileIds]);

  const effectiveKeys = useMemo(() => {
    const keys = new Set(inheritedKeys);

    for (const permission of permissions) {
      const state =
        form.permissionOverrides[permission.id] ?? "inherit";

      if (state === "allow") {
        keys.add(permission.key);
      }

      if (state === "deny") {
        keys.delete(permission.key);
      }
    }

    return keys;
  }, [
    inheritedKeys,
    permissions,
    form.permissionOverrides,
  ]);

  const filteredPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();

    if (!query) {
      return permissions;
    }

    return permissions.filter((permission) => {
      const searchable = [
        permission.name,
        permission.key,
        permission.group ?? "",
        permission.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [permissions, permissionSearch]);

  const groupedPermissions = useMemo(
    () => groupPermissions(filteredPermissions),
    [filteredPermissions],
  );

  const overrideCount = useMemo(
    () =>
      Object.values(form.permissionOverrides).filter(
        (state) => state !== "inherit",
      ).length,
    [form.permissionOverrides],
  );

  const hasPermissionSearch =
    permissionSearch.trim().length > 0;

  function toggleProfile(profileId: number) {
    setForm((current) => {
      const exists =
        current.permissionProfileIds.includes(profileId);

      return {
        ...current,
        permissionProfileIds: exists
          ? current.permissionProfileIds.filter(
              (id) => id !== profileId,
            )
          : [...current.permissionProfileIds, profileId],
      };
    });
  }

  function setPermissionOverride(
    permissionId: number,
    state: AdminPermissionOverrideState,
  ) {
    setForm((current) => ({
      ...current,
      permissionOverrides: {
        ...current.permissionOverrides,
        [permissionId]: state,
      },
    }));
  }

  function resetAllOverrides() {
    setForm((current) => ({
      ...current,
      permissionOverrides: {},
    }));
  }

  return (
    <>
      <PermissionProfiles
        form={form}
        permissionProfiles={permissionProfiles}
        onToggleProfile={toggleProfile}
      />

      <IndividualPermissions
        form={form}
        permissions={permissions}
        inheritedKeys={inheritedKeys}
        effectiveKeys={effectiveKeys}
        groupedPermissions={groupedPermissions}
        filteredPermissions={filteredPermissions}
        overrideCount={overrideCount}
        permissionSearch={permissionSearch}
        hasPermissionSearch={hasPermissionSearch}
        setPermissionSearch={setPermissionSearch}
        onPermissionChange={setPermissionOverride}
        onResetOverrides={resetAllOverrides}
      />
    </>
  );
}

function PermissionProfiles({
  form,
  permissionProfiles,
  onToggleProfile,
}: {
  form: UserForm;
  permissionProfiles: AdminPermissionProfile[];
  onToggleProfile: (profileId: number) => void;
}) {
  return (
    <PermissionSection
      eyebrow="Administration access"
      title="Permission profiles"
      description="Profiles provide reusable permission sets. A user can belong to more than one profile."
    >
      {permissionProfiles.length === 0 ? (
        <AccessEmptyState />
      ) : (
        <div className="grid gap-2.5">
          {permissionProfiles.map((profile) => {
            const selected =
              form.permissionProfileIds.includes(profile.id);

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onToggleProfile(profile.id)}
                aria-pressed={selected}
                className={[
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-brand-ink/25 bg-brand-ink/[0.055]"
                    : "border-brand-ink/[0.08] bg-white/45 hover:border-brand-ink/15 hover:bg-white/65",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                    selected
                      ? "border-brand-ink bg-brand-ink text-brand-bg"
                      : "border-brand-ink/15 bg-white/50 text-transparent",
                  ].join(" ")}
                >
                  <Check size={12} strokeWidth={3} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-brand-ink/75">
                      {profile.name}
                    </span>

                    {profile.is_system && (
                      <span className="rounded-full border border-brand-ink/10 bg-white/55 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-brand-ink/35">
                        System
                      </span>
                    )}
                  </span>

                  {profile.description && (
                    <span className="mt-1 block text-[10px] leading-4 text-brand-ink/40">
                      {profile.description}
                    </span>
                  )}

                  <span className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.1em] text-brand-ink/30">
                    {profile.permissions.length}{" "}
                    {profile.permissions.length === 1
                      ? "permission"
                      : "permissions"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </PermissionSection>
  );
}

function IndividualPermissions({
  form,
  permissions,
  inheritedKeys,
  effectiveKeys,
  groupedPermissions,
  filteredPermissions,
  overrideCount,
  permissionSearch,
  hasPermissionSearch,
  setPermissionSearch,
  onPermissionChange,
  onResetOverrides,
}: {
  form: UserForm;
  permissions: AdminPermission[];
  inheritedKeys: Set<string>;
  effectiveKeys: Set<string>;
  groupedPermissions: Record<string, AdminPermission[]>;
  filteredPermissions: AdminPermission[];
  overrideCount: number;
  permissionSearch: string;
  hasPermissionSearch: boolean;
  setPermissionSearch: Dispatch<SetStateAction<string>>;
  onPermissionChange: (
    permissionId: number,
    state: AdminPermissionOverrideState,
  ) => void;
  onResetOverrides: () => void;
}) {
  return (
    <PermissionSection
      eyebrow="Fine-grained access"
      title="Individual permissions"
      description="Use overrides only when this user needs access that differs from their assigned profiles."
    >
      {permissions.length === 0 ? (
        <AccessEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <AccessMetric
              value={form.permissionProfileIds.length}
              label="Profiles"
            />

            <AccessMetric
              value={effectiveKeys.size}
              label="Effective"
            />

            <AccessMetric
              value={overrideCount}
              label="Overrides"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
              />

              <input
                value={permissionSearch}
                onChange={(event) =>
                  setPermissionSearch(event.target.value)
                }
                placeholder="Search permissions..."
                className="h-10 w-full rounded-xl border border-brand-ink/10 bg-white/50 pl-9 pr-9 text-xs font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/28 focus:border-brand-ink/20 focus:bg-white"
              />

              {permissionSearch && (
                <button
                  type="button"
                  onClick={() => setPermissionSearch("")}
                  aria-label="Clear permission search"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-brand-ink/30 transition hover:bg-brand-ink/[0.05] hover:text-brand-ink"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {overrideCount > 0 && (
              <button
                type="button"
                onClick={onResetOverrides}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/45 px-3 text-[10px] font-semibold text-brand-ink/50 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
              >
                <RotateCcw size={12} />
                Reset overrides
              </button>
            )}
          </div>

          {filteredPermissions.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-brand-ink/15 bg-white/30 px-5 py-7 text-center">
              <Search
                size={17}
                className="mx-auto text-brand-ink/30"
              />

              <p className="mt-2 text-xs font-semibold text-brand-ink/55">
                No matching permissions
              </p>

              <p className="mt-1 text-[10px] text-brand-ink/35">
                Try another permission name, key or group.
              </p>

              {hasPermissionSearch && (
                <button
                  type="button"
                  onClick={() => setPermissionSearch("")}
                  className="mt-3 text-[10px] font-semibold text-brand-ink/55 underline decoration-brand-ink/20 underline-offset-4"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {Object.entries(groupedPermissions).map(
                ([group, groupPermissions]) => (
                  <PermissionGroup
                    key={group}
                    group={group}
                    permissions={groupPermissions}
                    inheritedKeys={inheritedKeys}
                    effectiveKeys={effectiveKeys}
                    overrides={form.permissionOverrides}
                    forceOpen={hasPermissionSearch}
                    onChange={onPermissionChange}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </PermissionSection>
  );
}

function PermissionGroup({
  group,
  permissions,
  inheritedKeys,
  effectiveKeys,
  overrides,
  forceOpen = false,
  onChange,
}: {
  group: string;
  permissions: AdminPermission[];
  inheritedKeys: Set<string>;
  effectiveKeys: Set<string>;
  overrides: PermissionOverrideMap;
  forceOpen?: boolean;
  onChange: (
    permissionId: number,
    state: AdminPermissionOverrideState,
  ) => void;
}) {
  const [open, setOpen] = useState(true);

  const visible = forceOpen || open;

  const activeCount = permissions.filter((permission) =>
    effectiveKeys.has(permission.key),
  ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-ink/[0.08] bg-white/40">
      <button
        type="button"
        onClick={() => {
          if (!forceOpen) {
            setOpen((current) => !current);
          }
        }}
        aria-expanded={visible}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-white/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-ink/[0.05] text-brand-ink/45">
            <Shield size={14} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-brand-ink/70">
              {formatPermissionGroup(group)}
            </p>

            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.09em] text-brand-ink/30">
              {activeCount} of {permissions.length} effective
            </p>
          </div>
        </div>

        <ChevronDown
          size={15}
          className={[
            "shrink-0 text-brand-ink/30 transition-transform",
            visible ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {visible && (
        <div className="border-t border-brand-ink/[0.07]">
          {permissions.map((permission) => {
            const state =
              overrides[permission.id] ?? "inherit";

            const inherited =
              inheritedKeys.has(permission.key);

            const effective =
              effectiveKeys.has(permission.key);

            return (
              <div
                key={permission.id}
                className="border-b border-brand-ink/[0.06] px-4 py-4 last:border-b-0"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold text-brand-ink/70">
                        {permission.name}
                      </p>

                      <EffectiveBadge
                        effective={effective}
                      />
                    </div>

                    {permission.description && (
                      <p className="mt-1 max-w-lg text-[10px] leading-4 text-brand-ink/40">
                        {permission.description}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <code className="break-all text-[9px] font-medium text-brand-ink/30">
                        {permission.key}
                      </code>

                      {inherited && (
                        <span className="text-[9px] font-semibold text-brand-ink/35">
                          • inherited from profile
                        </span>
                      )}
                    </div>
                  </div>

                  <PermissionStateControl
                    value={state}
                    inherited={inherited}
                    onChange={(nextState) =>
                      onChange(
                        permission.id,
                        nextState,
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PermissionStateControl({
  value,
  inherited,
  onChange,
}: {
  value: AdminPermissionOverrideState;
  inherited: boolean;
  onChange: (
    state: AdminPermissionOverrideState,
  ) => void;
}) {
  return (
    <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-xl border border-brand-ink/10 bg-brand-bg/35 p-1">
      <PermissionStateButton
        active={value === "inherit"}
        onClick={() => onChange("inherit")}
      >
        {inherited ? "Profile" : "Default"}
      </PermissionStateButton>

      <PermissionStateButton
        active={value === "allow"}
        onClick={() => onChange("allow")}
      >
        Allow
      </PermissionStateButton>

      <PermissionStateButton
        active={value === "deny"}
        danger
        onClick={() => onChange("deny")}
      >
        Deny
      </PermissionStateButton>
    </div>
  );
}

function PermissionStateButton({
  active,
  danger = false,
  children,
  onClick,
}: {
  active: boolean;
  danger?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "min-w-[66px] rounded-lg px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.06em] transition",
        active
          ? danger
            ? "bg-red-50 text-red-600 shadow-sm"
            : "bg-white text-brand-ink shadow-sm"
          : "text-brand-ink/30 hover:text-brand-ink/60",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function EffectiveBadge({
  effective,
}: {
  effective: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.07em]",
        effective
          ? "border-emerald-200/70 bg-emerald-50/70 text-emerald-700"
          : "border-brand-ink/10 bg-brand-ink/[0.035] text-brand-ink/35",
      ].join(" ")}
    >
      {effective ? (
        <Check size={8} strokeWidth={3} />
      ) : (
        <LockKeyhole size={8} />
      )}

      {effective ? "Granted" : "No access"}
    </span>
  );
}

function AccessMetric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-ink/[0.08] bg-white/45 px-3 py-3 text-center">
      <p className="text-lg font-semibold tracking-[-0.03em] text-brand-ink">
        {value}
      </p>

      <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-brand-ink/30">
        {label}
      </p>
    </div>
  );
}

function AccessEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-brand-ink/15 bg-white/30 px-5 py-7 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-brand-ink/[0.05] text-brand-ink/35">
        <ShieldCheck size={16} />
      </div>

      <p className="mt-3 text-xs font-semibold text-brand-ink/60">
        No access rules available
      </p>

      <p className="mx-auto mt-1 max-w-sm text-[10px] leading-4 text-brand-ink/38">
        Permission profiles and permissions will appear here when they are
        available from the server.
      </p>
    </div>
  );
}

function PermissionSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-brand-ink/[0.08] py-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-brand-ink/32">
        {eyebrow}
      </p>

      <h3 className="mt-1.5 text-[16px] font-semibold tracking-[-0.015em] text-brand-ink">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-lg text-[11px] leading-5 text-brand-ink/42">
          {description}
        </p>
      )}

      <div className="mt-4">{children}</div>
    </section>
  );
}