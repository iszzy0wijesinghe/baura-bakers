/** @format */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Copy,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import Page from "../components/Page";

import { LaravelApiError } from "../lib/laravelApi";

import {
  activateAdminRole,
  createAdminRole,
  deactivateAdminRole,
  deleteAdminRole,
  getAdminRole,
  getAdminRoles,
  updateAdminRole,
  type AdminRole,
  type AdminRolePermission,
  type AdminRolePermissionGroup,
} from "../lib/adminRolesApi";

import { useAuthSession } from "../lib/useAuthSession";

const READ_PERMISSION = "website-admin.roles.read";
const CREATE_PERMISSION = "website-admin.roles.create";
const UPDATE_PERMISSION = "website-admin.roles.update";
const DELETE_PERMISSION = "website-admin.roles.delete";

type RoleForm = {
  id: number | null;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  isAdministrator: boolean;
  permissionIds: number[];
};

const EMPTY_FORM: RoleForm = {
  id: null,
  name: "",
  code: "",
  description: "",
  isActive: true,
  isSystem: false,
  isAdministrator: false,
  permissionIds: [],
};

export default function AdminAccessManagement() {
  const navigate = useNavigate();

  const {
    isLoading: isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    hasPermission,
  } = useAuthSession();

  const canRead = hasPermission(READ_PERMISSION);
  const canCreate = hasPermission(CREATE_PERMISSION);
  const canUpdate = hasPermission(UPDATE_PERMISSION);
  const canDelete = hasPermission(DELETE_PERMISSION);

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<
    AdminRolePermissionGroup[]
  >([]);

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [originalSnapshot, setOriginalSnapshot] = useState("");

  const roleRequestIdRef = useRef(0);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const allPermissions = useMemo(
    () => permissionGroups.flatMap((group) => group.permissions),
    [permissionGroups],
  );

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return roles.filter((role) => {
      if (statusFilter === "active" && !role.is_active) {
        return false;
      }

      if (statusFilter === "inactive" && role.is_active) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [role.name, role.code, role.description ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [roles, search, statusFilter]);

  const filteredPermissionGroups = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();

    if (!query) {
      return permissionGroups;
    }

    return permissionGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) =>
          [
            permission.name,
            permission.key,
            permission.description ?? "",
            group.group,
          ].some((value) => value.toLowerCase().includes(query)),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [permissionGroups, permissionSearch]);

  const isCreating = form.id === null;

  const isDirty =
    originalSnapshot !== "" && snapshotForm(form) !== originalSnapshot;

  const enabledPermissionCount = form.permissionIds.length;

  const activeRoleCount = useMemo(
    () => roles.filter((role) => role.is_active).length,
    [roles],
  );

  const assignedUserCount = useMemo(
    () => roles.reduce((total, role) => total + role.users_count, 0),
    [roles],
  );

  const canEditCurrentRole = isCreating ? canCreate : canUpdate;

  const permissionsLocked = !canEditCurrentRole || form.isAdministrator;

  const permissionPercentage =
    allPermissions.length > 0
      ? Math.round((enabledPermissionCount / allPermissions.length) * 100)
      : 0;

  const loadRole = useCallback(
    async (
      role: AdminRole,
      fallbackGroups?: AdminRolePermissionGroup[],
    ) => {
      const requestId = ++roleRequestIdRef.current;

      setSelectedRoleId(role.id);
      setErrorText("");
      setSuccessText("");
      setPermissionSearch("");
      setIsLoadingRole(true);

      const immediateForm = roleToForm(role);

      setForm(immediateForm);
      setOriginalSnapshot(snapshotForm(immediateForm));

      try {
        const result = await getAdminRole(role.id);

        if (requestId !== roleRequestIdRef.current) {
          return;
        }

        setPermissionGroups(
          result.permissions ?? fallbackGroups ?? [],
        );

        setRoles((current) =>
          current
            .map((item) =>
              item.id === result.role.id ? result.role : item,
            )
            .sort(sortRoles),
        );

        const nextForm = roleToForm(result.role);

        setSelectedRoleId(result.role.id);
        setForm(nextForm);
        setOriginalSnapshot(snapshotForm(nextForm));
      } catch (error) {
        if (requestId !== roleRequestIdRef.current) {
          return;
        }

        setErrorText(
          getErrorMessage(error, "Could not load this role."),
        );
      } finally {
        if (requestId === roleRequestIdRef.current) {
          setIsLoadingRole(false);
        }
      }
    },
    [],
  );

  const loadRoles = useCallback(
    async (options?: {
      refreshing?: boolean;
      preserveSelection?: boolean;
      selectedId?: number | null;
    }) => {
      if (!canRead) {
        return;
      }

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorText("");

      try {
        const result = await getAdminRoles({
          status: "all",
        });

        const sortedRoles = [...result.roles].sort(sortRoles);

        setRoles(sortedRoles);
        setPermissionGroups(result.permissions ?? []);

        const requestedSelectedId = options?.selectedId ?? null;

        if (
          options?.preserveSelection &&
          requestedSelectedId !== null
        ) {
          const current = sortedRoles.find(
            (role) => role.id === requestedSelectedId,
          );

          if (current) {
            await loadRole(current, result.permissions ?? []);
            return;
          }
        }

        const firstRole = sortedRoles[0];

        if (firstRole) {
          await loadRole(firstRole, result.permissions ?? []);
        } else {
          const nextForm = {
            ...EMPTY_FORM,
            permissionIds: [],
          };

          setSelectedRoleId(null);
          setForm(nextForm);
          setOriginalSnapshot(snapshotForm(nextForm));
        }
      } catch (error) {
        setErrorText(
          getErrorMessage(error, "Could not load role management."),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [canRead, loadRole],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (!canAccessWebsiteAdmin) {
      navigate("/account", {
        replace: true,
      });

      return;
    }

    if (!canRead) {
      navigate("/admin/dashboard", {
        replace: true,
      });
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    canRead,
    navigate,
  ]);

  useEffect(() => {
    if (
      isAuthLoading ||
      !isAuthenticated ||
      !canAccessWebsiteAdmin ||
      !canRead
    ) {
      return;
    }

    void loadRoles();
  }, [
    isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    canRead,
    loadRoles,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  function confirmDiscard() {
    if (!isDirty) {
      return true;
    }

    return window.confirm(
      "You have unsaved role changes. Discard them?",
    );
  }

  async function selectRole(role: AdminRole) {
    if (role.id === selectedRoleId) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    await loadRole(role);
  }

  function startCreate() {
    if (!canCreate) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    ++roleRequestIdRef.current;

    setIsLoadingRole(false);

    const nextForm: RoleForm = {
      ...EMPTY_FORM,
      permissionIds: [],
    };

    setSelectedRoleId(null);
    setForm(nextForm);
    setOriginalSnapshot(snapshotForm(nextForm));

    setPermissionSearch("");
    setErrorText("");
    setSuccessText("");
  }

  function duplicateRole() {
    if (!selectedRole || !canCreate) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    ++roleRequestIdRef.current;

    setIsLoadingRole(false);

    const nextForm: RoleForm = {
      id: null,
      name: `${selectedRole.name} Copy`,
      code: "",
      description: selectedRole.description ?? "",
      isActive: true,
      isSystem: false,
      isAdministrator: false,
      permissionIds: [...(selectedRole.permission_ids ?? [])].sort(
        (first, second) => first - second,
      ),
    };

    setSelectedRoleId(null);
    setForm(nextForm);
    setOriginalSnapshot(snapshotForm(EMPTY_FORM));
    setPermissionSearch("");
    setErrorText("");
    setSuccessText("");
  }

  function togglePermission(permissionId: number) {
    if (permissionsLocked) {
      return;
    }

    setForm((current) => {
      const exists = current.permissionIds.includes(permissionId);

      return {
        ...current,
        permissionIds: exists
          ? current.permissionIds.filter((id) => id !== permissionId)
          : [...current.permissionIds, permissionId].sort(
              (first, second) => first - second,
            ),
      };
    });
  }

  function setGroupPermissions(
    group: AdminRolePermissionGroup,
    enabled: boolean,
  ) {
    if (permissionsLocked) {
      return;
    }

    setForm((current) => {
      const currentSet = new Set(current.permissionIds);

      for (const permission of group.permissions) {
        if (enabled) {
          currentSet.add(permission.id);
        } else {
          currentSet.delete(permission.id);
        }
      }

      return {
        ...current,
        permissionIds: Array.from(currentSet).sort(
          (first, second) => first - second,
        ),
      };
    });
  }

  function setAllPermissions(enabled: boolean) {
    if (permissionsLocked) {
      return;
    }

    setForm((current) => ({
      ...current,
      permissionIds: enabled
        ? allPermissions
            .map((permission) => permission.id)
            .sort((first, second) => first - second)
        : [],
    }));
  }

  function resetForm() {
    if (form.id === null) {
      const nextForm: RoleForm = {
        ...EMPTY_FORM,
        permissionIds: [],
      };

      setForm(nextForm);
      setOriginalSnapshot(snapshotForm(nextForm));
      return;
    }

    const role = roles.find((item) => item.id === form.id);

    if (!role) {
      return;
    }

    const nextForm = roleToForm(role);

    setForm(nextForm);
    setOriginalSnapshot(snapshotForm(nextForm));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();

    if (isCreating && !canCreate) {
      return;
    }

    if (!isCreating && !canUpdate) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    const name = form.name.trim();

    if (!name) {
      setErrorText("Enter a role name.");
      return;
    }

    setIsSaving(true);

    try {
      let savedRole: AdminRole;

      if (form.id === null) {
        savedRole = await createAdminRole({
          name,
          description: form.description,
          is_active: form.isActive,
          permission_ids: form.permissionIds,
        });

        setSuccessText("Role created successfully.");
      } else {
        savedRole = await updateAdminRole(form.id, {
          name,
          description: form.description,
          permission_ids: form.permissionIds,
        });

        setSuccessText("Role permissions saved successfully.");
      }

      setRoles((current) => {
        const exists = current.some(
          (role) => role.id === savedRole.id,
        );

        const next = exists
          ? current.map((role) =>
              role.id === savedRole.id ? savedRole : role,
            )
          : [...current, savedRole];

        return next.sort(sortRoles);
      });

      setSelectedRoleId(savedRole.id);

      const nextForm = roleToForm(savedRole);

      setForm(nextForm);
      setOriginalSnapshot(snapshotForm(nextForm));
    } catch (error) {
      setErrorText(
        getErrorMessage(error, "Could not save this role."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!selectedRole || !canUpdate || isChangingStatus) {
      return;
    }

    if (selectedRole.is_administrator || selectedRole.code === "customer") {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    const action = selectedRole.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} the "${selectedRole.name}" role?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorText("");
    setSuccessText("");
    setIsChangingStatus(true);

    try {
      const updated = selectedRole.is_active
        ? await deactivateAdminRole(selectedRole.id)
        : await activateAdminRole(selectedRole.id);

      setRoles((current) =>
        current
          .map((role) =>
            role.id === updated.id
              ? {
                  ...role,
                  ...updated,
                }
              : role,
          )
          .sort(sortRoles),
      );

      const nextForm = roleToForm({
        ...selectedRole,
        ...updated,
      });

      setForm(nextForm);
      setOriginalSnapshot(snapshotForm(nextForm));

      setSuccessText(
        updated.is_active
          ? "Role activated successfully."
          : "Role deactivated successfully.",
      );
    } catch (error) {
      setErrorText(
        getErrorMessage(error, `Could not ${action} this role.`),
      );
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleDelete() {
    if (
      !selectedRole ||
      !canDelete ||
      selectedRole.is_system ||
      isDeleting
    ) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the "${selectedRole.name}" role?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorText("");
    setSuccessText("");
    setIsDeleting(true);

    try {
      await deleteAdminRole(selectedRole.id);

      const remainingRoles = roles
        .filter((role) => role.id !== selectedRole.id)
        .sort(sortRoles);

      setRoles(remainingRoles);
      setSuccessText("Role deleted successfully.");

      const nextRole = remainingRoles[0];

      if (nextRole) {
        await loadRole(nextRole);
      } else {
        const nextForm = {
          ...EMPTY_FORM,
          permissionIds: [],
        };

        setSelectedRoleId(null);
        setForm(nextForm);
        setOriginalSnapshot(snapshotForm(nextForm));
      }
    } catch (error) {
      setErrorText(
        getErrorMessage(error, "Could not delete this role."),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isAuthLoading) {
    return (
      <Page>
        <LoadingState text="Checking access..." />
      </Page>
    );
  }

  if (!isAuthenticated || !canAccessWebsiteAdmin || !canRead) {
    return null;
  }

  return (
    <Page>
      <div className="mx-auto w-full max-w-[1540px] pb-14">
        <header className="mb-7">
          <Link
            to="/admin/dashboard"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-brand-ink/45 transition-colors hover:text-brand-ink"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Admin dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-6 bg-brand-ink/20" />

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/35">
                  Security & access
                </p>
              </div>

              <h1 className="text-[2.25rem] font-semibold leading-none tracking-[-0.045em] text-brand-ink sm:text-[2.8rem]">
                Roles & permissions
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-ink/48">
                Control what every staff role can see and do across your
                administration workspace.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  void loadRoles({
                    refreshing: true,
                    preserveSelection: true,
                    selectedId: selectedRoleId,
                  })
                }
                disabled={isRefreshing || isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-ink/10 bg-white/60 px-4 text-xs font-semibold text-brand-ink/55 shadow-sm transition-all hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {canCreate && (
                <button
                  type="button"
                  onClick={startCreate}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-xs font-semibold text-brand-bg shadow-[0_8px_22px_rgba(55,38,25,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(55,38,25,0.2)] disabled:pointer-events-none disabled:opacity-40"
                >
                  <Plus size={15} />
                  New role
                </button>
              )}
            </div>
          </div>
        </header>

        {(errorText || successText) && (
          <div className="mb-5 space-y-2">
            {errorText && (
              <Notice
                type="error"
                onClose={() => setErrorText("")}
              >
                {errorText}
              </Notice>
            )}

            {successText && (
              <Notice
                type="success"
                onClose={() => setSuccessText("")}
              >
                {successText}
              </Notice>
            )}
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <SummaryCard
            icon={<ShieldCheck size={16} />}
            label="Total roles"
            value={roles.length}
          />

          <SummaryCard
            icon={<CircleDot size={16} />}
            label="Active roles"
            value={activeRoleCount}
          />

          <SummaryCard
            icon={<KeyRound size={16} />}
            label="Capabilities"
            value={allPermissions.length}
          />

          <SummaryCard
            icon={<UsersRound size={16} />}
            label="Role assignments"
            value={assignedUserCount}
          />
        </div>

        {isLoading ? (
          <Surface>
            <LoadingState text="Loading access controls..." />
          </Surface>
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-[20px] border border-brand-ink/[0.09] bg-white/55 shadow-[0_12px_35px_rgba(55,38,25,0.035)] backdrop-blur-xl xl:sticky xl:top-5">
              <div className="border-b border-brand-ink/[0.07] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand-ink/30">
                      Access control
                    </p>

                    <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-ink">
                      Staff roles
                    </h2>
                  </div>

                  <span className="grid min-w-7 place-items-center rounded-lg bg-brand-ink/[0.055] px-2 py-1 text-[10px] font-bold text-brand-ink/45">
                    {roles.length}
                  </span>
                </div>

                <div className="relative mt-4">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/25"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find a role..."
                    className="h-10 w-full rounded-xl border border-brand-ink/[0.09] bg-white/55 pl-9 pr-9 text-xs font-medium text-brand-ink outline-none transition-all placeholder:text-brand-ink/25 focus:border-brand-ink/20 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.04]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-brand-ink/30 transition hover:bg-brand-ink/[0.05] hover:text-brand-ink"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                <div className="mt-2.5 flex rounded-xl bg-brand-ink/[0.035] p-1">
                  {(["all", "active", "inactive"] as const).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={[
                          "h-8 flex-1 rounded-lg text-[9px] font-bold capitalize transition-all",
                          statusFilter === status
                            ? "bg-white text-brand-ink shadow-[0_1px_4px_rgba(55,38,25,0.08)]"
                            : "text-brand-ink/35 hover:text-brand-ink/60",
                        ].join(" ")}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="max-h-[670px] overflow-y-auto p-2">
                {filteredRoles.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-brand-ink/[0.04] text-brand-ink/25">
                      <Shield size={17} />
                    </div>

                    <p className="mt-3 text-xs font-semibold text-brand-ink/55">
                      No matching roles
                    </p>

                    <p className="mt-1 text-[10px] text-brand-ink/30">
                      Try changing your search or filter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredRoles.map((role) => (
                      <RoleItem
                        key={role.id}
                        role={role}
                        selected={role.id === selectedRoleId}
                        onClick={() => void selectRole(role)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {canCreate && (
                <div className="border-t border-brand-ink/[0.07] p-3">
                  <button
                    type="button"
                    onClick={startCreate}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-ink/15 text-[11px] font-semibold text-brand-ink/45 transition-all hover:border-brand-ink/25 hover:bg-white/65 hover:text-brand-ink"
                  >
                    <Plus size={13} />
                    Add another role
                  </button>
                </div>
              )}
            </aside>

            <main className="min-w-0">
              <form
                onSubmit={handleSave}
                className="overflow-hidden rounded-[20px] border border-brand-ink/[0.09] bg-white/55 shadow-[0_12px_35px_rgba(55,38,25,0.035)] backdrop-blur-xl"
              >
                <div className="border-b border-brand-ink/[0.075] bg-white/30 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-brand-ink text-brand-bg shadow-sm sm:grid">
                        {form.isAdministrator ? (
                          <ShieldCheck size={19} />
                        ) : form.isSystem ? (
                          <LockKeyhole size={18} />
                        ) : (
                          <Shield size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-ink/30">
                            {isCreating
                              ? "Creating role"
                              : "Selected role"}
                          </p>

                          {form.isAdministrator && (
                            <HeaderBadge dark>
                              Administrator
                            </HeaderBadge>
                          )}

                          {form.isSystem && !form.isAdministrator && (
                            <HeaderBadge>System</HeaderBadge>
                          )}

                          {!form.isActive && (
                            <HeaderBadge danger>
                              Inactive
                            </HeaderBadge>
                          )}

                          {isDirty && (
                            <HeaderBadge warning>
                              Unsaved
                            </HeaderBadge>
                          )}
                        </div>

                        <h2 className="mt-1 truncate text-[1.55rem] font-semibold leading-tight tracking-[-0.035em] text-brand-ink">
                          {isCreating
                            ? form.name || "Untitled role"
                            : form.name}
                        </h2>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-brand-ink/38">
                          {!isCreating && selectedRole && (
                            <>
                              <span className="inline-flex items-center gap-1">
                                <UsersRound size={10} />
                                {selectedRole.users_count}{" "}
                                {selectedRole.users_count === 1
                                  ? "user"
                                  : "users"}
                              </span>

                              <span className="h-0.5 w-0.5 rounded-full bg-brand-ink/25" />
                            </>
                          )}

                          <span>
                            {enabledPermissionCount} permissions
                          </span>

                          {form.code && (
                            <>
                              <span className="h-0.5 w-0.5 rounded-full bg-brand-ink/25" />

                              <span className="font-mono">
                                {form.code}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isCreating && selectedRole && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {canCreate && (
                          <ActionButton
                            icon={<Copy size={12} />}
                            onClick={duplicateRole}
                            disabled={isSaving}
                          >
                            Duplicate
                          </ActionButton>
                        )}

                        {canDelete && !selectedRole.is_system && (
                          <ActionButton
                            icon={
                              isDeleting ? (
                                <RefreshCw
                                  size={12}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={12} />
                              )
                            }
                            onClick={() => void handleDelete()}
                            disabled={
                              isDeleting ||
                              selectedRole.users_count > 0
                            }
                            danger
                          >
                            Delete
                          </ActionButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isLoadingRole ? (
                  <LoadingState text="Loading role permissions..." />
                ) : (
                  <>
                    <div className="p-5 sm:p-6">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <section className="rounded-2xl border border-brand-ink/[0.075] bg-white/38 p-4 sm:p-5">
                          <SectionHeading
                            eyebrow="Identity"
                            title="Role details"
                            description="Name this role so your team can immediately understand who it is intended for."
                          />

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Field label="Role name" required>
                              <input
                                value={form.name}
                                disabled={!canEditCurrentRole}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                  }))
                                }
                                className={fieldClassName}
                                placeholder="e.g. Store Manager"
                              />
                            </Field>

                            <Field label="Role code">
                              <input
                                value={
                                  form.code ||
                                  (isCreating
                                    ? "Generated after creation"
                                    : "")
                                }
                                disabled
                                className={fieldClassName}
                              />
                            </Field>
                          </div>

                          <div className="mt-4">
                            <Field label="Description">
                              <textarea
                                value={form.description}
                                disabled={!canEditCurrentRole}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                className={`${fieldClassName} min-h-[94px] resize-y py-3 leading-5`}
                                placeholder="Describe this role's responsibilities..."
                              />
                            </Field>
                          </div>
                        </section>

                        <section className="rounded-2xl border border-brand-ink/[0.075] bg-brand-bg/35 p-4 sm:p-5">
                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-ink/30">
                            Role overview
                          </p>

                          <div className="mt-4 space-y-3">
                            <OverviewRow
                              icon={<KeyRound size={13} />}
                              label="Permissions"
                              value={`${enabledPermissionCount} / ${allPermissions.length}`}
                            />

                            <OverviewRow
                              icon={<UserRound size={13} />}
                              label="Assigned users"
                              value={
                                selectedRole
                                  ? String(selectedRole.users_count)
                                  : "0"
                              }
                            />

                            <OverviewRow
                              icon={<CircleDot size={13} />}
                              label="Status"
                              value={form.isActive ? "Active" : "Inactive"}
                            />

                            <OverviewRow
                              icon={<LockKeyhole size={13} />}
                              label="Type"
                              value={
                                form.isAdministrator
                                  ? "Administrator"
                                  : form.isSystem
                                    ? "System"
                                    : "Custom"
                              }
                            />
                          </div>

                          {!isCreating &&
                            selectedRole &&
                            canUpdate && (
                              <div className="mt-5 border-t border-brand-ink/[0.07] pt-4">
                                <p className="text-[10px] leading-4 text-brand-ink/38">
                                  {selectedRole.is_administrator
                                    ? "Administrator is protected and cannot be deactivated."
                                    : selectedRole.code === "customer"
                                      ? "Customer is a protected role and cannot be deactivated."
                                      : selectedRole.is_active
                                        ? "Deactivate this role to temporarily stop it granting access."
                                        : "Activate this role to allow assigned users to receive its access."}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleStatusChange()
                                  }
                                  disabled={
                                    isChangingStatus ||
                                    selectedRole.is_administrator ||
                                    selectedRole.code === "customer"
                                  }
                                  className={[
                                    "mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border text-[10px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-35",
                                    selectedRole.is_active
                                      ? "border-red-200/70 bg-red-50/55 text-red-600 hover:bg-red-50"
                                      : "border-brand-ink bg-brand-ink text-brand-bg",
                                  ].join(" ")}
                                >
                                  {isChangingStatus && (
                                    <RefreshCw
                                      size={11}
                                      className="animate-spin"
                                    />
                                  )}

                                  {selectedRole.is_active
                                    ? "Deactivate role"
                                    : "Activate role"}
                                </button>
                              </div>
                            )}
                        </section>
                      </div>

                      <section className="mt-4 overflow-hidden rounded-2xl border border-brand-ink/[0.075] bg-white/38">
                        <div className="border-b border-brand-ink/[0.07] p-4 sm:p-5">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <SectionHeading
                              eyebrow="Access sheet"
                              title="Permissions"
                              description="Choose exactly what users assigned to this role are allowed to access and manage."
                            />

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <div className="relative sm:w-[230px]">
                                <Search
                                  size={13}
                                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/25"
                                />

                                <input
                                  value={permissionSearch}
                                  onChange={(event) =>
                                    setPermissionSearch(
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Find permission..."
                                  className="h-9 w-full rounded-xl border border-brand-ink/[0.09] bg-white/60 pl-8 pr-8 text-[11px] font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/25 focus:border-brand-ink/20 focus:bg-white"
                                />

                                {permissionSearch && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPermissionSearch("")
                                    }
                                    className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center text-brand-ink/30 hover:text-brand-ink"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>

                              {!permissionsLocked && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAllPermissions(true)
                                    }
                                    className="h-9 rounded-xl border border-brand-ink/[0.09] bg-white/55 px-3 text-[10px] font-semibold text-brand-ink/48 transition hover:bg-white hover:text-brand-ink"
                                  >
                                    Select all
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAllPermissions(false)
                                    }
                                    className="h-9 rounded-xl border border-brand-ink/[0.09] bg-white/55 px-3 text-[10px] font-semibold text-brand-ink/48 transition hover:bg-white hover:text-brand-ink"
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-5 rounded-xl bg-brand-bg/45 p-3.5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[11px] font-semibold text-brand-ink/65">
                                  {form.isAdministrator
                                    ? "Full administrator access"
                                    : `${enabledPermissionCount} of ${allPermissions.length} capabilities enabled`}
                                </p>

                                <p className="mt-0.5 text-[9px] text-brand-ink/35">
                                  {form.isAdministrator
                                    ? "This protected role automatically receives every registered permission."
                                    : `${permissionPercentage}% of available access is currently granted.`}
                                </p>
                              </div>

                              <span className="shrink-0 text-sm font-semibold tracking-[-0.02em] text-brand-ink/55">
                                {form.isAdministrator
                                  ? "100%"
                                  : `${permissionPercentage}%`}
                              </span>
                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-ink/[0.07]">
                              <div
                                className="h-full rounded-full bg-brand-ink transition-[width] duration-300"
                                style={{
                                  width: `${
                                    form.isAdministrator
                                      ? 100
                                      : permissionPercentage
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-3 sm:p-4">
                          {filteredPermissionGroups.length === 0 ? (
                            <div className="py-16 text-center">
                              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-ink/[0.04] text-brand-ink/25">
                                <Search size={17} />
                              </div>

                              <p className="mt-3 text-xs font-semibold text-brand-ink/55">
                                No permissions found
                              </p>

                              <p className="mt-1 text-[10px] text-brand-ink/30">
                                Try a different permission name or key.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {filteredPermissionGroups.map((group) => {
                                const enabled =
                                  group.permissions.filter((permission) =>
                                    form.permissionIds.includes(
                                      permission.id,
                                    ),
                                  ).length;

                                const allEnabled =
                                  enabled === group.permissions.length &&
                                  group.permissions.length > 0;

                                return (
                                  <PermissionGroup
                                    key={group.group}
                                    group={group}
                                    selectedIds={form.permissionIds}
                                    allEnabled={allEnabled}
                                    enabledCount={enabled}
                                    disabled={permissionsLocked}
                                    onTogglePermission={
                                      togglePermission
                                    }
                                    onToggleAll={() =>
                                      setGroupPermissions(
                                        group,
                                        !allEnabled,
                                      )
                                    }
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="sticky bottom-0 z-10 border-t border-brand-ink/[0.08] bg-brand-bg/[0.96] px-5 py-3.5 shadow-[0_-10px_30px_rgba(55,38,25,0.025)] backdrop-blur-xl sm:px-6">
                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "h-1.5 w-1.5 rounded-full",
                              isDirty
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                            ].join(" ")}
                          />

                          <p
                            className={[
                              "text-[10px] font-semibold",
                              isDirty
                                ? "text-amber-700"
                                : "text-brand-ink/35",
                            ].join(" ")}
                          >
                            {isDirty
                              ? "Changes have not been saved"
                              : "Everything is up to date"}
                          </p>
                        </div>

                        {canEditCurrentRole && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={resetForm}
                              disabled={!isDirty || isSaving}
                              className="h-10 rounded-xl border border-brand-ink/[0.1] bg-white/55 px-4 text-[11px] font-semibold text-brand-ink/50 transition-all hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Reset
                            </button>

                            <button
                              type="submit"
                              disabled={
                                isSaving ||
                                !form.name.trim() ||
                                !isDirty
                              }
                              className="inline-flex h-10 min-w-[138px] items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-[11px] font-semibold text-brand-bg shadow-[0_7px_18px_rgba(55,38,25,0.13)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(55,38,25,0.18)] disabled:pointer-events-none disabled:opacity-40"
                            >
                              {isSaving ? (
                                <RefreshCw
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save size={13} />
                              )}

                              {isSaving
                                ? "Saving..."
                                : isCreating
                                  ? "Create role"
                                  : "Save changes"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </form>
            </main>
          </div>
        )}
      </div>
    </Page>
  );
}

function PermissionGroup({
  group,
  selectedIds,
  allEnabled,
  enabledCount,
  disabled,
  onTogglePermission,
  onToggleAll,
}: {
  group: AdminRolePermissionGroup;
  selectedIds: number[];
  allEnabled: boolean;
  enabledCount: number;
  disabled: boolean;
  onTogglePermission: (id: number) => void;
  onToggleAll: () => void;
}) {
  const [open, setOpen] = useState(true);

  const percentage =
    group.permissions.length > 0
      ? Math.round((enabledCount / group.permissions.length) * 100)
      : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-brand-ink/[0.08] bg-white/50">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div
            className={[
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
              enabledCount > 0
                ? "bg-brand-ink text-brand-bg"
                : "bg-brand-ink/[0.045] text-brand-ink/35",
            ].join(" ")}
          >
            <Shield size={13} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-[11px] font-semibold text-brand-ink/72">
                {formatGroupName(group.group)}
              </h4>

              <span className="rounded-md bg-brand-ink/[0.045] px-1.5 py-0.5 text-[8px] font-bold text-brand-ink/35">
                {group.permissions.length}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 w-20 overflow-hidden rounded-full bg-brand-ink/[0.07]">
                <div
                  className="h-full rounded-full bg-brand-ink"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <span className="text-[8px] font-semibold text-brand-ink/30">
                {enabledCount} enabled
              </span>
            </div>
          </div>

          <ChevronDown
            size={13}
            className={[
              "shrink-0 text-brand-ink/25 transition-transform duration-200",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {!disabled && (
          <button
            type="button"
            onClick={onToggleAll}
            className={[
              "hidden h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[9px] font-semibold transition sm:inline-flex",
              allEnabled
                ? "border-brand-ink bg-brand-ink text-brand-bg"
                : "border-brand-ink/[0.09] bg-white/60 text-brand-ink/42 hover:border-brand-ink/18 hover:text-brand-ink",
            ].join(" ")}
          >
            {allEnabled && <Check size={9} strokeWidth={3} />}
            {allEnabled ? "Enabled" : "Enable all"}
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-brand-ink/[0.065]">
          <div className="grid md:grid-cols-2 xl:grid-cols-3">
            {group.permissions.map((permission, index) => {
              const checked = selectedIds.includes(permission.id);

              return (
                <PermissionItem
                  key={permission.id}
                  permission={permission}
                  checked={checked}
                  disabled={disabled}
                  index={index}
                  onChange={() =>
                    onTogglePermission(permission.id)
                  }
                />
              );
            })}
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={onToggleAll}
              className="flex h-9 w-full items-center justify-center gap-1.5 border-t border-brand-ink/[0.06] text-[9px] font-semibold text-brand-ink/38 transition hover:bg-brand-bg/35 hover:text-brand-ink sm:hidden"
            >
              {allEnabled && <Check size={9} />}
              {allEnabled
                ? "Disable group"
                : "Enable entire group"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function PermissionItem({
  permission,
  checked,
  disabled,
  index,
  onChange,
}: {
  permission: AdminRolePermission;
  checked: boolean;
  disabled: boolean;
  index: number;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={[
        "group relative flex min-h-[86px] items-start gap-2.5 border-brand-ink/[0.055] p-3.5 text-left transition-colors",
        "border-b md:border-r",
        index % 2 === 1 ? "md:border-r-0 xl:border-r" : "",
        index % 3 === 2 ? "xl:border-r-0" : "",
        checked
          ? "bg-brand-bg/45"
          : "bg-white/40 hover:bg-brand-bg/25",
        disabled ? "cursor-default" : "",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-all",
          checked
            ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
            : "border-brand-ink/15 bg-white/60 text-transparent group-hover:border-brand-ink/30",
        ].join(" ")}
      >
        <Check size={9} strokeWidth={3.2} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block text-[10px] font-semibold leading-4",
            checked ? "text-brand-ink" : "text-brand-ink/62",
          ].join(" ")}
        >
          {permission.name}
        </span>

        {permission.description && (
          <span className="mt-0.5 line-clamp-2 block text-[9px] leading-[1.45] text-brand-ink/34">
            {permission.description}
          </span>
        )}

        <span className="mt-1 block truncate font-mono text-[8px] text-brand-ink/22">
          {permission.key}
        </span>
      </span>
    </button>
  );
}

function RoleItem({
  role,
  selected,
  onClick,
}: {
  role: AdminRole;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
        selected
          ? "bg-brand-ink text-brand-bg shadow-[0_5px_14px_rgba(55,38,25,0.12)]"
          : "text-brand-ink hover:bg-white/70",
      ].join(" ")}
    >
      <div
        className={[
          "grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border transition-colors",
          selected
            ? "border-brand-bg/15 bg-brand-bg/10 text-brand-bg"
            : "border-brand-ink/[0.065] bg-brand-ink/[0.04] text-brand-ink/38",
        ].join(" ")}
      >
        {role.is_administrator ? (
          <Sparkles size={14} />
        ) : role.is_system ? (
          <LockKeyhole size={13} />
        ) : (
          <Shield size={14} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={[
              "truncate text-[11px] font-semibold",
              selected ? "text-brand-bg" : "text-brand-ink/72",
            ].join(" ")}
          >
            {role.name}
          </p>

          {!role.is_active && (
            <span
              className={[
                "h-1.5 w-1.5 shrink-0 rounded-full",
                selected ? "bg-red-300" : "bg-red-400",
              ].join(" ")}
            />
          )}
        </div>

        <div
          className={[
            "mt-1 flex items-center gap-1.5 text-[8px] font-semibold",
            selected ? "text-brand-bg/45" : "text-brand-ink/30",
          ].join(" ")}
        >
          <span>{role.permissions_count} permissions</span>

          <span>•</span>

          <span>
            {role.users_count} {role.users_count === 1 ? "user" : "users"}
          </span>
        </div>
      </div>

      <ChevronRight
        size={13}
        className={[
          "shrink-0 transition-transform group-hover:translate-x-0.5",
          selected ? "text-brand-bg/35" : "text-brand-ink/18",
        ].join(" ")}
      />
    </button>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-brand-ink/[0.075] bg-white/45 px-3.5 py-3.5 shadow-[0_5px_18px_rgba(55,38,25,0.025)] backdrop-blur">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand-ink/[0.05] text-brand-ink/42">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tracking-[-0.03em] text-brand-ink">
          {value}
        </p>

        <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.11em] text-brand-ink/30">
          {label}
        </p>
      </div>
    </div>
  );
}

function OverviewRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/60 text-brand-ink/35">
        {icon}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-brand-ink/38">
          {label}
        </span>

        <span className="truncate text-[10px] font-semibold text-brand-ink/68">
          {value}
        </span>
      </div>
    </div>
  );
}

function HeaderBadge({
  children,
  dark = false,
  danger = false,
  warning = false,
}: {
  children: ReactNode;
  dark?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em]",
        dark
          ? "border-brand-ink bg-brand-ink text-brand-bg"
          : danger
            ? "border-red-200 bg-red-50 text-red-500"
            : warning
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-brand-ink/[0.08] bg-brand-ink/[0.04] text-brand-ink/38",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-3 text-[10px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-35",
        danger
          ? "border-red-200/70 bg-red-50/55 text-red-600 hover:bg-red-50"
          : "border-brand-ink/[0.09] bg-white/55 text-brand-ink/48 hover:bg-white hover:text-brand-ink",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-[0.17em] text-brand-ink/28">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-sm font-semibold tracking-[-0.015em] text-brand-ink">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-xl text-[10px] leading-4 text-brand-ink/38">
          {description}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.09em] text-brand-ink/36">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

function Surface({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-brand-ink/[0.09] bg-white/55 shadow-[0_12px_35px_rgba(55,38,25,0.035)] backdrop-blur-xl">
      {children}
    </div>
  );
}

function Notice({
  type,
  children,
  onClose,
}: {
  type: "error" | "success";
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-xs shadow-sm",
        type === "error"
          ? "border-red-200/80 bg-red-50/80 text-red-700"
          : "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        {type === "error" ? (
          <XCircle size={14} className="shrink-0" />
        ) : (
          <CheckCircle2 size={14} className="shrink-0" />
        )}

        <span className="font-medium leading-5">
          {children}
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg opacity-45 transition hover:bg-black/[0.04] hover:opacity-100"
      >
        <X size={11} />
      </button>
    </div>
  );
}

function LoadingState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="px-5 py-20 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-brand-ink/[0.08] bg-white/55 shadow-sm">
        <RefreshCw
          size={15}
          className="animate-spin text-brand-ink/35"
        />
      </div>

      <p className="mt-3 text-[11px] font-medium text-brand-ink/40">
        {text}
      </p>
    </div>
  );
}

const fieldClassName =
  "h-10 w-full rounded-xl border border-brand-ink/[0.09] bg-white/60 px-3 text-[12px] font-medium text-brand-ink outline-none transition-all placeholder:text-brand-ink/25 hover:border-brand-ink/15 focus:border-brand-ink/22 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.04] disabled:cursor-not-allowed disabled:bg-brand-ink/[0.03] disabled:text-brand-ink/40";

function formatGroupName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function roleToForm(role: AdminRole): RoleForm {
  return {
    id: role.id,
    name: role.name,
    code: role.code,
    description: role.description ?? "",
    isActive: role.is_active,
    isSystem: role.is_system,
    isAdministrator: role.is_administrator,
    permissionIds: [...(role.permission_ids ?? [])].sort(
      (first, second) => first - second,
    ),
  };
}

function snapshotForm(form: RoleForm) {
  return JSON.stringify({
    id: form.id,
    name: form.name.trim(),
    code: form.code,
    description: form.description.trim(),
    isActive: form.isActive,
    isSystem: form.isSystem,
    isAdministrator: form.isAdministrator,
    permissionIds: [...form.permissionIds].sort(
      (first, second) => first - second,
    ),
  });
}

function sortRoles(first: AdminRole, second: AdminRole) {
  if (first.is_administrator !== second.is_administrator) {
    return first.is_administrator ? -1 : 1;
  }

  if (first.is_system !== second.is_system) {
    return first.is_system ? -1 : 1;
  }

  return first.name.localeCompare(second.name);
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
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