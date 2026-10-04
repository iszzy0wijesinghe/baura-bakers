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
  Trash2,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Page from "../components/Page";

import {
  LaravelApiError,
} from "../lib/laravelApi";

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

import {
  useAuthSession,
} from "../lib/useAuthSession";

const READ_PERMISSION =
  "website-admin.roles.read";

const CREATE_PERMISSION =
  "website-admin.roles.create";

const UPDATE_PERMISSION =
  "website-admin.roles.update";

const DELETE_PERMISSION =
  "website-admin.roles.delete";

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
  const navigate =
    useNavigate();

  const {
    isLoading: isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    hasPermission,
  } = useAuthSession();

  const canRead =
    hasPermission(
      READ_PERMISSION,
    );

  const canCreate =
    hasPermission(
      CREATE_PERMISSION,
    );

  const canUpdate =
    hasPermission(
      UPDATE_PERMISSION,
    );

  const canDelete =
    hasPermission(
      DELETE_PERMISSION,
    );

  const [
    roles,
    setRoles,
  ] = useState<
    AdminRole[]
  >([]);

  const [
    permissionGroups,
    setPermissionGroups,
  ] = useState<
    AdminRolePermissionGroup[]
  >([]);

  const [
    selectedRoleId,
    setSelectedRoleId,
  ] = useState<
    number | null
  >(null);

  const [
    form,
    setForm,
  ] = useState<RoleForm>(
    EMPTY_FORM,
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    isLoadingRole,
    setIsLoadingRole,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isChangingStatus,
    setIsChangingStatus,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    errorText,
    setErrorText,
  ] = useState("");

  const [
    successText,
    setSuccessText,
  ] = useState("");

  const [
    originalSnapshot,
    setOriginalSnapshot,
  ] = useState("");

  const roleRequestIdRef =
    useRef(0);

  const selectedRole =
    useMemo(
      () =>
        roles.find(
          (role) =>
            role.id ===
            selectedRoleId,
        ) ?? null,
      [
        roles,
        selectedRoleId,
      ],
    );

  const allPermissions =
    useMemo(
      () =>
        permissionGroups.flatMap(
          (group) =>
            group.permissions,
        ),
      [permissionGroups],
    );

  const filteredRoles =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return roles.filter(
        (role) => {
          if (
            statusFilter ===
              "active" &&
            !role.is_active
          ) {
            return false;
          }

          if (
            statusFilter ===
              "inactive" &&
            role.is_active
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            role.name,
            role.code,
            role.description ?? "",
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      roles,
      search,
      statusFilter,
    ]);

  const isCreating =
    form.id === null;

  const isDirty =
    originalSnapshot !== "" &&
    snapshotForm(form) !==
      originalSnapshot;

  const enabledPermissionCount =
    form.permissionIds.length;

  const activeRoleCount =
    useMemo(
      () =>
        roles.filter(
          (role) =>
            role.is_active,
        ).length,
      [roles],
    );

  const systemRoleCount =
    useMemo(
      () =>
        roles.filter(
          (role) =>
            role.is_system,
        ).length,
      [roles],
    );

  const canEditCurrentRole =
    isCreating
      ? canCreate
      : canUpdate;

  const permissionsLocked =
    !canEditCurrentRole ||
    form.isAdministrator;

  const loadRoles =
    useCallback(
      async (
        options?: {
          refreshing?: boolean;
          preserveSelection?: boolean;
          selectedId?: number | null;
        },
      ) => {
        if (!canRead) {
          return;
        }

        if (
          options?.refreshing
        ) {
          setIsRefreshing(
            true,
          );
        } else {
          setIsLoading(
            true,
          );
        }

        setErrorText("");

        try {
          const result =
            await getAdminRoles({
              status: "all",
            });

          const sortedRoles =
            [...result.roles].sort(
              sortRoles,
            );

          setRoles(
            sortedRoles,
          );

          setPermissionGroups(
            result.permissions ?? [],
          );

          const requestedSelectedId =
            options?.selectedId ??
            null;

          if (
            options?.preserveSelection &&
            requestedSelectedId !==
              null
          ) {
            const current =
              sortedRoles.find(
                (role) =>
                  role.id ===
                  requestedSelectedId,
              );

            if (current) {
              await loadRole(
                current,
                result.permissions ??
                  [],
              );

              return;
            }
          }

          const firstRole =
            sortedRoles[0];

          if (firstRole) {
            await loadRole(
              firstRole,
              result.permissions ??
                [],
            );
          } else {
            const nextForm = {
              ...EMPTY_FORM,
              permissionIds: [],
            };

            setSelectedRoleId(
              null,
            );

            setForm(
              nextForm,
            );

            setOriginalSnapshot(
              snapshotForm(
                nextForm,
              ),
            );
          }
        } catch (error) {
          setErrorText(
            getErrorMessage(
              error,
              "Could not load role management.",
            ),
          );
        } finally {
          setIsLoading(
            false,
          );

          setIsRefreshing(
            false,
          );
        }
      },
      [canRead],
    );

  const loadRole =
    useCallback(
      async (
        role: AdminRole,
        fallbackGroups?:
          AdminRolePermissionGroup[],
      ) => {
        const requestId =
          ++roleRequestIdRef.current;

        setSelectedRoleId(
          role.id,
        );

        setErrorText("");
        setSuccessText("");

        setIsLoadingRole(
          true,
        );

        const immediateForm =
          roleToForm(
            role,
          );

        setForm(
          immediateForm,
        );

        setOriginalSnapshot(
          snapshotForm(
            immediateForm,
          ),
        );

        try {
          const result =
            await getAdminRole(
              role.id,
            );

          if (
            requestId !==
            roleRequestIdRef.current
          ) {
            return;
          }

          setPermissionGroups(
            result.permissions ??
              fallbackGroups ??
              [],
          );

          setRoles(
            (current) =>
              current
                .map(
                  (item) =>
                    item.id ===
                    result.role.id
                      ? result.role
                      : item,
                )
                .sort(
                  sortRoles,
                ),
          );

          const nextForm =
            roleToForm(
              result.role,
            );

          setSelectedRoleId(
            result.role.id,
          );

          setForm(
            nextForm,
          );

          setOriginalSnapshot(
            snapshotForm(
              nextForm,
            ),
          );
        } catch (error) {
          if (
            requestId !==
            roleRequestIdRef.current
          ) {
            return;
          }

          setErrorText(
            getErrorMessage(
              error,
              "Could not load this role.",
            ),
          );
        } finally {
          if (
            requestId ===
            roleRequestIdRef.current
          ) {
            setIsLoadingRole(
              false,
            );
          }
        }
      },
      [],
    );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate(
        "/login",
        {
          replace: true,
        },
      );

      return;
    }

    if (
      !canAccessWebsiteAdmin
    ) {
      navigate(
        "/account",
        {
          replace: true,
        },
      );

      return;
    }

    if (!canRead) {
      navigate(
        "/admin/dashboard",
        {
          replace: true,
        },
      );
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
    const handleBeforeUnload =
      (
        event:
          BeforeUnloadEvent,
      ) => {
        if (!isDirty) {
          return;
        }

        event.preventDefault();
      };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
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

  async function selectRole(
    role: AdminRole,
  ) {
    if (
      role.id ===
      selectedRoleId
    ) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    await loadRole(
      role,
    );
  }

  function startCreate() {
    if (!canCreate) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    ++roleRequestIdRef.current;

    setIsLoadingRole(
      false,
    );

    const nextForm: RoleForm =
      {
        ...EMPTY_FORM,
        permissionIds: [],
      };

    setSelectedRoleId(
      null,
    );

    setForm(
      nextForm,
    );

    setOriginalSnapshot(
      snapshotForm(
        nextForm,
      ),
    );

    setErrorText("");
    setSuccessText("");
  }

  function duplicateRole() {
    if (
      !selectedRole ||
      !canCreate
    ) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    ++roleRequestIdRef.current;

    setIsLoadingRole(
      false,
    );

    const nextForm: RoleForm =
      {
        id: null,

        name:
          `${selectedRole.name} Copy`,

        code: "",

        description:
          selectedRole.description ??
          "",

        isActive: true,
        isSystem: false,
        isAdministrator: false,

        permissionIds:
          [
            ...(selectedRole.permission_ids ??
              []),
          ].sort(
            (
              first,
              second,
            ) =>
              first -
              second,
          ),
      };

    setSelectedRoleId(
      null,
    );

    setForm(
      nextForm,
    );

    setOriginalSnapshot(
      snapshotForm(
        EMPTY_FORM,
      ),
    );

    setErrorText("");
    setSuccessText("");
  }

  function togglePermission(
    permissionId: number,
  ) {
    if (
      permissionsLocked
    ) {
      return;
    }

    setForm(
      (current) => {
        const exists =
          current.permissionIds.includes(
            permissionId,
          );

        return {
          ...current,

          permissionIds:
            exists
              ? current.permissionIds.filter(
                  (id) =>
                    id !==
                    permissionId,
                )
              : [
                  ...current.permissionIds,
                  permissionId,
                ].sort(
                  (
                    first,
                    second,
                  ) =>
                    first -
                    second,
                ),
        };
      },
    );
  }

  function setGroupPermissions(
    group:
      AdminRolePermissionGroup,
    enabled: boolean,
  ) {
    if (
      permissionsLocked
    ) {
      return;
    }

    setForm(
      (current) => {
        const currentSet =
          new Set(
            current.permissionIds,
          );

        for (
          const permission
          of group.permissions
        ) {
          if (enabled) {
            currentSet.add(
              permission.id,
            );
          } else {
            currentSet.delete(
              permission.id,
            );
          }
        }

        return {
          ...current,

          permissionIds:
            Array.from(
              currentSet,
            ).sort(
              (
                first,
                second,
              ) =>
                first -
                second,
            ),
        };
      },
    );
  }

  function setAllPermissions(
    enabled: boolean,
  ) {
    if (
      permissionsLocked
    ) {
      return;
    }

    setForm(
      (current) => ({
        ...current,

        permissionIds:
          enabled
            ? allPermissions
                .map(
                  (permission) =>
                    permission.id,
                )
                .sort(
                  (
                    first,
                    second,
                  ) =>
                    first -
                    second,
                )
            : [],
      }),
    );
  }

  function resetForm() {
    if (
      form.id === null
    ) {
      const nextForm: RoleForm =
        {
          ...EMPTY_FORM,
          permissionIds: [],
        };

      setForm(
        nextForm,
      );

      setOriginalSnapshot(
        snapshotForm(
          nextForm,
        ),
      );

      return;
    }

    const role =
      roles.find(
        (item) =>
          item.id ===
          form.id,
      );

    if (!role) {
      return;
    }

    const nextForm =
      roleToForm(
        role,
      );

    setForm(
      nextForm,
    );

    setOriginalSnapshot(
      snapshotForm(
        nextForm,
      ),
    );
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      isCreating &&
      !canCreate
    ) {
      return;
    }

    if (
      !isCreating &&
      !canUpdate
    ) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    const name =
      form.name.trim();

    if (!name) {
      setErrorText(
        "Enter a role name.",
      );

      return;
    }

    setIsSaving(
      true,
    );

    try {
      let savedRole:
        AdminRole;

      if (
        form.id === null
      ) {
        savedRole =
          await createAdminRole(
            {
              name,

              description:
                form.description,

              is_active:
                form.isActive,

              permission_ids:
                form.permissionIds,
            },
          );

        setSuccessText(
          "Role created successfully.",
        );
      } else {
        savedRole =
          await updateAdminRole(
            form.id,
            {
              name,

              description:
                form.description,

              permission_ids:
                form.permissionIds,
            },
          );

        setSuccessText(
          "Role permissions saved successfully.",
        );
      }

      setRoles(
        (current) => {
          const exists =
            current.some(
              (role) =>
                role.id ===
                savedRole.id,
            );

          const next =
            exists
              ? current.map(
                  (role) =>
                    role.id ===
                    savedRole.id
                      ? savedRole
                      : role,
                )
              : [
                  ...current,
                  savedRole,
                ];

          return next.sort(
            sortRoles,
          );
        },
      );

      setSelectedRoleId(
        savedRole.id,
      );

      const nextForm =
        roleToForm(
          savedRole,
        );

      setForm(
        nextForm,
      );

      setOriginalSnapshot(
        snapshotForm(
          nextForm,
        ),
      );
    } catch (error) {
      setErrorText(
        getErrorMessage(
          error,
          "Could not save this role.",
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function handleStatusChange() {
    if (
      !selectedRole ||
      !canUpdate ||
      isChangingStatus
    ) {
      return;
    }

    if (
      selectedRole.is_administrator
    ) {
      return;
    }

    if (
      selectedRole.code ===
      "customer"
    ) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    const action =
      selectedRole.is_active
        ? "deactivate"
        : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} the "${selectedRole.name}" role?`,
      );

    if (!confirmed) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    setIsChangingStatus(
      true,
    );

    try {
      const updated =
        selectedRole.is_active
          ? await deactivateAdminRole(
              selectedRole.id,
            )
          : await activateAdminRole(
              selectedRole.id,
            );

      setRoles(
        (current) =>
          current
            .map(
              (role) =>
                role.id ===
                updated.id
                  ? {
                      ...role,
                      ...updated,
                    }
                  : role,
            )
            .sort(
              sortRoles,
            ),
      );

      const nextForm =
        roleToForm({
          ...selectedRole,
          ...updated,
        });

      setForm(
        nextForm,
      );

      setOriginalSnapshot(
        snapshotForm(
          nextForm,
        ),
      );

      setSuccessText(
        updated.is_active
          ? "Role activated successfully."
          : "Role deactivated successfully.",
      );
    } catch (error) {
      setErrorText(
        getErrorMessage(
          error,
          `Could not ${action} this role.`,
        ),
      );
    } finally {
      setIsChangingStatus(
        false,
      );
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

    const confirmed =
      window.confirm(
        `Delete the "${selectedRole.name}" role?\n\nThis cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    setIsDeleting(
      true,
    );

    try {
      await deleteAdminRole(
        selectedRole.id,
      );

      const remainingRoles =
        roles
          .filter(
            (role) =>
              role.id !==
              selectedRole.id,
          )
          .sort(
            sortRoles,
          );

      setRoles(
        remainingRoles,
      );

      setSuccessText(
        "Role deleted successfully.",
      );

      const nextRole =
        remainingRoles[0];

      if (nextRole) {
        await loadRole(
          nextRole,
        );
      } else {
        const nextForm = {
          ...EMPTY_FORM,
          permissionIds: [],
        };

        setSelectedRoleId(
          null,
        );

        setForm(
          nextForm,
        );

        setOriginalSnapshot(
          snapshotForm(
            nextForm,
          ),
        );
      }
    } catch (error) {
      setErrorText(
        getErrorMessage(
          error,
          "Could not delete this role.",
        ),
      );
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

  if (isAuthLoading) {
    return (
      <Page>
        <LoadingState
          text="Checking access..."
        />
      </Page>
    );
  }

  if (
    !isAuthenticated ||
    !canAccessWebsiteAdmin ||
    !canRead
  ) {
    return null;
  }

  return (
    <Page>
      <div className="mx-auto w-full max-w-[1480px] pb-12">
        <header>
          <Link
            to="/admin/dashboard"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-brand-ink/50 transition hover:text-brand-ink"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />

            Admin dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-ink/38">
                Security & access
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-brand-ink sm:text-5xl">
                Role management
              </h1>

              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-brand-ink/58 sm:text-[15px]">
                Create staff roles and
                control the exact website
                administration, ERP and POS
                permissions granted to each
                role.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  void loadRoles({
                    refreshing: true,
                    preserveSelection:
                      true,
                    selectedId:
                      selectedRoleId,
                  })
                }
                disabled={
                  isRefreshing ||
                  isSaving
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-brand-ink/10 bg-white/55 px-4 text-sm font-semibold text-brand-ink/65 shadow-sm backdrop-blur transition hover:border-brand-ink/20 hover:bg-white/80 hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>

              {canCreate && (
                <button
                  type="button"
                  onClick={
                    startCreate
                  }
                  disabled={
                    isSaving
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_10px_24px_rgba(55,38,25,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(55,38,25,0.2)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  <Plus
                    size={17}
                  />
                  New role
                </button>
              )}
            </div>
          </div>
        </header>

        {(errorText ||
          successText) && (
          <div className="mt-5 space-y-2.5">
            {errorText && (
              <Notice
                type="error"
                onClose={() =>
                  setErrorText(
                    "",
                  )
                }
              >
                {errorText}
              </Notice>
            )}

            {successText && (
              <Notice
                type="success"
                onClose={() =>
                  setSuccessText(
                    "",
                  )
                }
              >
                {successText}
              </Notice>
            )}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={
                <ShieldCheck
                  size={18}
                />
              }
              value={
                roles.length
              }
              label="Roles"
            />

            <Metric
              icon={
                <CircleDot
                  size={18}
                />
              }
              value={
                activeRoleCount
              }
              label="Active"
            />

            <Metric
              icon={
                <KeyRound
                  size={18}
                />
              }
              value={
                allPermissions.length
              }
              label="Permissions"
            />

            <Metric
              icon={
                <LockKeyhole
                  size={18}
                />
              }
              value={
                systemRoleCount
              }
              label="System roles"
              last
            />
          </div>
        </section>

        {isLoading ? (
          <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-sm backdrop-blur">
            <LoadingState
              text="Loading roles..."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="self-start overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur xl:sticky xl:top-5">
              <div className="border-b border-brand-ink/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-ink/30">
                      Access roles
                    </p>

                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-brand-ink">
                      Roles
                    </h2>
                  </div>

                  <span className="rounded-full border border-brand-ink/10 bg-white/55 px-2.5 py-1 text-[10px] font-semibold text-brand-ink/45">
                    {roles.length}
                  </span>
                </div>

                <div className="relative mt-4">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                  />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Search roles..."
                    className="h-10 w-full rounded-xl border border-brand-ink/10 bg-white/60 pl-9 pr-9 text-xs font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/28 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.055]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch(
                          "",
                        )
                      }
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brand-ink/30 transition hover:bg-brand-ink/[0.06] hover:text-brand-ink"
                    >
                      <X
                        size={
                          12
                        }
                      />
                    </button>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-brand-ink/[0.07] bg-brand-ink/[0.025] p-1">
                  {(
                    [
                      "all",
                      "active",
                      "inactive",
                    ] as const
                  ).map(
                    (status) => (
                      <button
                        key={
                          status
                        }
                        type="button"
                        onClick={() =>
                          setStatusFilter(
                            status,
                          )
                        }
                        className={[
                          "h-8 rounded-lg text-[9px] font-bold uppercase tracking-[0.07em] transition",
                          statusFilter ===
                          status
                            ? "bg-white text-brand-ink shadow-sm"
                            : "text-brand-ink/35 hover:text-brand-ink/60",
                        ].join(
                          " ",
                        )}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="max-h-[640px] overflow-y-auto p-2">
                {filteredRoles.length ===
                0 ? (
                  <div className="px-4 py-10 text-center">
                    <Shield
                      size={
                        22
                      }
                      className="mx-auto text-brand-ink/25"
                    />

                    <p className="mt-3 text-xs font-semibold text-brand-ink/55">
                      No roles found
                    </p>
                  </div>
                ) : (
                  filteredRoles.map(
                    (role) => (
                      <RoleListItem
                        key={
                          role.id
                        }
                        role={
                          role
                        }
                        selected={
                          role.id ===
                          selectedRoleId
                        }
                        onClick={() =>
                          void selectRole(
                            role,
                          )
                        }
                      />
                    ),
                  )
                )}
              </div>

              {canCreate && (
                <div className="border-t border-brand-ink/10 p-3">
                  <button
                    type="button"
                    onClick={
                      startCreate
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-ink/15 px-3 py-2.5 text-xs font-semibold text-brand-ink/50 transition hover:border-brand-ink/25 hover:bg-white/55 hover:text-brand-ink"
                  >
                    <Plus
                      size={14}
                    />
                    Create role
                  </button>
                </div>
              )}
            </aside>

            <main className="min-w-0">
              <form
                onSubmit={
                  handleSave
                }
                className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur"
              >
                <div className="border-b border-brand-ink/10 bg-white/30 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-brand-ink/32">
                          {isCreating
                            ? "New role"
                            : "Access role"}
                        </p>

                        {form.isSystem && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-ink/10 bg-brand-ink/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-ink/45">
                            <LockKeyhole
                              size={
                                9
                              }
                            />
                            System
                          </span>
                        )}

                        {form.isAdministrator && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-ink/10 bg-brand-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-bg">
                            <ShieldCheck
                              size={
                                9
                              }
                            />
                            Administrator
                          </span>
                        )}

                        {isDirty && (
                          <span className="rounded-full border border-amber-200/70 bg-amber-50/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-700">
                            Unsaved
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1.5 truncate text-2xl font-semibold tracking-[-0.035em] text-brand-ink">
                        {isCreating
                          ? form.name ||
                            "Create role"
                          : form.name}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-brand-ink/42">
                        <span>
                          {
                            enabledPermissionCount
                          }{" "}
                          permission
                          {enabledPermissionCount ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        {!isCreating &&
                          selectedRole && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-brand-ink/20" />

                              <span className="inline-flex items-center gap-1">
                                <UsersRound
                                  size={
                                    11
                                  }
                                />

                                {
                                  selectedRole.users_count
                                }{" "}
                                user
                                {selectedRole.users_count ===
                                1
                                  ? ""
                                  : "s"}
                              </span>
                            </>
                          )}

                        <span className="h-1 w-1 rounded-full bg-brand-ink/20" />

                        <span>
                          {form.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                        {form.code && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-brand-ink/20" />

                            <span className="font-mono text-[10px]">
                              {
                                form.code
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {!isCreating &&
                      selectedRole && (
                        <div className="flex flex-wrap items-center gap-2">
                          {canCreate && (
                            <button
                              type="button"
                              onClick={
                                duplicateRole
                              }
                              disabled={
                                isSaving
                              }
                              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/55 px-3 text-xs font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:opacity-40"
                            >
                              <Copy
                                size={
                                  13
                                }
                              />
                              Duplicate
                            </button>
                          )}

                          {canDelete &&
                            !selectedRole.is_system && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete()
                                }
                                disabled={
                                  isDeleting ||
                                  selectedRole.users_count >
                                    0
                                }
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200/70 bg-red-50/60 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isDeleting ? (
                                  <RefreshCw
                                    size={
                                      13
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />
                                )}

                                Delete
                              </button>
                            )}
                        </div>
                      )}
                  </div>
                </div>

                {isLoadingRole ? (
                  <LoadingState
                    text="Loading role..."
                  />
                ) : (
                  <>
                    <div className="px-5 py-6 sm:px-6">
                      <FormSection
                        eyebrow="Role"
                        title="Role details"
                        description="Define the staff role and the capabilities assigned to every user with this role."
                      >
                        <div className="grid gap-4 lg:grid-cols-2">
                          <Field
                            label="Role name"
                            required
                          >
                            <input
                              value={
                                form.name
                              }
                              disabled={
                                !canEditCurrentRole
                              }
                              onChange={(
                                event,
                              ) =>
                                setForm(
                                  (
                                    current,
                                  ) => ({
                                    ...current,
                                    name: event
                                      .target
                                      .value,
                                  }),
                                )
                              }
                              className={
                                fieldClassName
                              }
                              placeholder="e.g. Store Manager"
                            />
                          </Field>

                          <Field label="Role code">
                            <input
                              value={
                                form.code ||
                                (isCreating
                                  ? "Generated automatically"
                                  : "")
                              }
                              disabled
                              className={
                                fieldClassName
                              }
                            />
                          </Field>
                        </div>

                        <div className="mt-4">
                          <Field label="Description">
                            <textarea
                              value={
                                form.description
                              }
                              disabled={
                                !canEditCurrentRole
                              }
                              onChange={(
                                event,
                              ) =>
                                setForm(
                                  (
                                    current,
                                  ) => ({
                                    ...current,
                                    description:
                                      event
                                        .target
                                        .value,
                                  }),
                                )
                              }
                              className={`${fieldClassName} min-h-[88px] resize-y py-3`}
                              placeholder="Explain who should receive this role..."
                            />
                          </Field>
                        </div>

                        {!isCreating &&
                          selectedRole &&
                          canUpdate && (
                            <div className="mt-4">
                              <div
                                className={[
                                  "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5",
                                  selectedRole.is_active
                                    ? "border-brand-ink/10 bg-white/50"
                                    : "border-red-100 bg-red-50/45",
                                ].join(
                                  " ",
                                )}
                              >
                                <div>
                                  <p className="text-xs font-semibold text-brand-ink/70">
                                    Role status
                                  </p>

                                  <p className="mt-0.5 text-[10px] leading-4 text-brand-ink/38">
                                    {selectedRole.is_administrator
                                      ? "The Administrator role cannot be deactivated."
                                      : selectedRole.code ===
                                          "customer"
                                        ? "The Customer role cannot be deactivated."
                                        : selectedRole.is_active
                                          ? "Users assigned to this role currently receive its permissions."
                                          : "This role is inactive and does not grant access."}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleStatusChange()
                                  }
                                  disabled={
                                    isChangingStatus ||
                                    selectedRole.is_administrator ||
                                    selectedRole.code ===
                                      "customer"
                                  }
                                  className={[
                                    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                                    selectedRole.is_active
                                      ? "border-red-200/70 bg-red-50/60 text-red-600 hover:bg-red-50"
                                      : "border-brand-ink/10 bg-brand-ink text-brand-bg",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {isChangingStatus && (
                                    <RefreshCw
                                      size={
                                        11
                                      }
                                      className="animate-spin"
                                    />
                                  )}

                                  {selectedRole.is_active
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                              </div>
                            </div>
                          )}
                      </FormSection>

                      <FormSection
                        eyebrow="Permissions"
                        title="Allowed capabilities"
                        description="Permissions are inherited directly from this role by every user assigned to it."
                        last
                      >
                        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-brand-ink/[0.08] bg-brand-bg/25 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand-ink/[0.07] bg-white/55 text-brand-ink/50">
                              <KeyRound
                                size={
                                  16
                                }
                              />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-brand-ink/70">
                                {
                                  enabledPermissionCount
                                }{" "}
                                of{" "}
                                {
                                  allPermissions.length
                                }{" "}
                                enabled
                              </p>

                              <p className="mt-0.5 text-[10px] leading-4 text-brand-ink/38">
                                {form.isAdministrator
                                  ? "Administrator is protected and always receives every registered permission."
                                  : "Users inherit these permissions from their assigned role."}
                              </p>
                            </div>
                          </div>

                          {!permissionsLocked && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setAllPermissions(
                                    true,
                                  )
                                }
                                className="h-8 rounded-xl border border-brand-ink/10 bg-white/55 px-3 text-[10px] font-semibold text-brand-ink/50 transition hover:bg-white hover:text-brand-ink"
                              >
                                Select all
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setAllPermissions(
                                    false,
                                  )
                                }
                                className="h-8 rounded-xl border border-brand-ink/10 bg-white/55 px-3 text-[10px] font-semibold text-brand-ink/50 transition hover:bg-white hover:text-brand-ink"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {permissionGroups.map(
                            (
                              group,
                            ) => {
                              const enabled =
                                group.permissions.filter(
                                  (
                                    permission,
                                  ) =>
                                    form.permissionIds.includes(
                                      permission.id,
                                    ),
                                ).length;

                              const allEnabled =
                                enabled ===
                                  group
                                    .permissions
                                    .length &&
                                group
                                  .permissions
                                  .length >
                                  0;

                              return (
                                <PermissionGroupCard
                                  key={
                                    group.group
                                  }
                                  group={
                                    group
                                  }
                                  selectedIds={
                                    form.permissionIds
                                  }
                                  allEnabled={
                                    allEnabled
                                  }
                                  enabledCount={
                                    enabled
                                  }
                                  disabled={
                                    permissionsLocked
                                  }
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
                            },
                          )}
                        </div>
                      </FormSection>
                    </div>

                    <div className="sticky bottom-0 border-t border-brand-ink/10 bg-brand-bg/95 px-5 py-4 backdrop-blur sm:px-6">
                      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          {isDirty ? (
                            <p className="text-[10px] font-semibold text-amber-700">
                              You have unsaved
                              changes.
                            </p>
                          ) : (
                            <p className="text-[10px] font-medium text-brand-ink/35">
                              No unsaved
                              changes.
                            </p>
                          )}
                        </div>

                        {canEditCurrentRole && (
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={
                                resetForm
                              }
                              disabled={
                                !isDirty ||
                                isSaving
                              }
                              className="h-11 rounded-2xl border border-brand-ink/10 bg-white/50 px-5 text-sm font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-35"
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
                              className="inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_9px_22px_rgba(55,38,25,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(55,38,25,0.2)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                            >
                              {isSaving ? (
                                <RefreshCw
                                  size={
                                    14
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Save
                                  size={
                                    14
                                  }
                                />
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

function PermissionGroupCard({
  group,
  selectedIds,
  allEnabled,
  enabledCount,
  disabled,
  onTogglePermission,
  onToggleAll,
}: {
  group:
    AdminRolePermissionGroup;
  selectedIds: number[];
  allEnabled: boolean;
  enabledCount: number;
  disabled: boolean;
  onTogglePermission: (
    id: number,
  ) => void;
  onToggleAll: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-ink/[0.09] bg-white/42">
      <div className="flex items-center justify-between gap-4 border-b border-brand-ink/[0.07] bg-brand-bg/20 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-ink/[0.05] text-brand-ink/48">
            <Shield
              size={14}
            />
          </div>

          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-brand-ink/72">
              {formatGroupName(
                group.group,
              )}
            </h4>

            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.09em] text-brand-ink/30">
              {enabledCount} /{" "}
              {
                group.permissions
                  .length
              }{" "}
              enabled
            </p>
          </div>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={
              onToggleAll
            }
            className={[
              "inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-semibold transition",
              allEnabled
                ? "border-brand-ink/15 bg-brand-ink text-brand-bg"
                : "border-brand-ink/10 bg-white/55 text-brand-ink/50 hover:bg-white hover:text-brand-ink",
            ].join(" ")}
          >
            {allEnabled && (
              <Check
                size={11}
                strokeWidth={3}
              />
            )}

            {allEnabled
              ? "All enabled"
              : "Enable all"}
          </button>
        )}
      </div>

      <div className="grid gap-px bg-brand-ink/[0.055] md:grid-cols-2">
        {group.permissions.map(
          (
            permission,
          ) => {
            const checked =
              selectedIds.includes(
                permission.id,
              );

            return (
              <PermissionItem
                key={
                  permission.id
                }
                permission={
                  permission
                }
                checked={
                  checked
                }
                disabled={
                  disabled
                }
                onChange={() =>
                  onTogglePermission(
                    permission.id,
                  )
                }
              />
            );
          },
        )}
      </div>
    </section>
  );
}

function PermissionItem({
  permission,
  checked,
  disabled,
  onChange,
}: {
  permission:
    AdminRolePermission;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={
        checked
      }
      disabled={
        disabled
      }
      onClick={
        onChange
      }
      className={[
        "group flex min-h-[92px] items-start gap-3 bg-white/55 p-4 text-left transition",
        checked
          ? "bg-white/80"
          : "hover:bg-white/72",
        disabled
          ? "cursor-default opacity-75"
          : "",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
          checked
            ? "border-brand-ink bg-brand-ink text-brand-bg"
            : "border-brand-ink/15 bg-white/55 text-transparent group-hover:border-brand-ink/25",
        ].join(" ")}
      >
        <Check
          size={11}
          strokeWidth={3}
        />
      </span>

      <span className="min-w-0">
        <span className="block text-xs font-semibold text-brand-ink/72">
          {permission.name}
        </span>

        {permission.description && (
          <span className="mt-1 block text-[10px] leading-[1.55] text-brand-ink/40">
            {
              permission.description
            }
          </span>
        )}

        <span className="mt-1.5 block break-all font-mono text-[9px] leading-4 text-brand-ink/25">
          {permission.key}
        </span>
      </span>
    </button>
  );
}

function RoleListItem({
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
      onClick={
        onClick
      }
      className={[
        "group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",
        selected
          ? "bg-brand-ink text-brand-bg shadow-sm"
          : "text-brand-ink hover:bg-white/65",
      ].join(" ")}
    >
      <div
        className={[
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
          selected
            ? "border-brand-bg/15 bg-brand-bg/10 text-brand-bg"
            : "border-brand-ink/[0.07] bg-brand-ink/[0.04] text-brand-ink/45",
        ].join(" ")}
      >
        {role.is_system ? (
          <LockKeyhole
            size={14}
          />
        ) : (
          <ShieldCheck
            size={15}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={[
              "truncate text-xs font-semibold",
              selected
                ? "text-brand-bg"
                : "text-brand-ink/75",
            ].join(" ")}
          >
            {role.name}
          </p>

          <ChevronRight
            size={14}
            className={[
              "mt-0.5 shrink-0 transition",
              selected
                ? "text-brand-bg/45"
                : "text-brand-ink/20 group-hover:text-brand-ink/45",
            ].join(" ")}
          />
        </div>

        <p
          className={[
            "mt-0.5 truncate font-mono text-[9px]",
            selected
              ? "text-brand-bg/40"
              : "text-brand-ink/25",
          ].join(" ")}
        >
          {role.code}
        </p>

        <div
          className={[
            "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold",
            selected
              ? "text-brand-bg/55"
              : "text-brand-ink/32",
          ].join(" ")}
        >
          <span>
            {
              role.permissions_count
            }{" "}
            permissions
          </span>

          <span>•</span>

          <span>
            {
              role.users_count
            }{" "}
            users
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {role.is_system && (
            <MiniBadge
              selected={
                selected
              }
            >
              System
            </MiniBadge>
          )}

          {role.is_administrator && (
            <MiniBadge
              selected={
                selected
              }
            >
              Administrator
            </MiniBadge>
          )}

          <MiniBadge
            selected={
              selected
            }
            muted={
              !role.is_active
            }
          >
            {role.is_active
              ? "Active"
              : "Inactive"}
          </MiniBadge>
        </div>
      </div>
    </button>
  );
}

function MiniBadge({
  children,
  selected,
  muted = false,
}: {
  children: ReactNode;
  selected: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.07em]",
        selected
          ? "border-brand-bg/15 bg-brand-bg/10 text-brand-bg/65"
          : muted
            ? "border-red-100 bg-red-50/60 text-red-500"
            : "border-brand-ink/[0.08] bg-white/45 text-brand-ink/35",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Metric({
  icon,
  value,
  label,
  last = false,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  last?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex items-center gap-3.5 px-4 py-4 sm:px-5 sm:py-5",
        "border-b border-brand-ink/[0.07] odd:border-r",
        "lg:border-b-0 lg:border-r",
        last
          ? "lg:border-r-0"
          : "",
      ].join(" ")}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-ink/[0.07] bg-white/55 text-brand-ink/50 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xl font-semibold tracking-[-0.035em] text-brand-ink sm:text-2xl">
          {value}
        </p>

        <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-ink/35 sm:text-[10px]">
          {label}
        </p>
      </div>
    </div>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
  last = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={[
        "py-6 first:pt-0",
        last
          ? "pb-0"
          : "border-b border-brand-ink/[0.08]",
      ].join(" ")}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-brand-ink/32">
        {eyebrow}
      </p>

      <h3 className="mt-1.5 text-[16px] font-semibold tracking-[-0.015em] text-brand-ink">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-2xl text-[11px] leading-5 text-brand-ink/42">
          {description}
        </p>
      )}

      <div className="mt-4">
        {children}
      </div>
    </section>
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
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-ink/42">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

const fieldClassName =
  "h-11 w-full rounded-2xl border border-brand-ink/10 bg-white/60 px-3.5 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/28 hover:border-brand-ink/15 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.055] disabled:cursor-not-allowed disabled:bg-brand-ink/[0.035] disabled:text-brand-ink/45";

function Notice({
  type,
  children,
  onClose,
}: {
  type:
    | "error"
    | "success";
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3.5 text-sm shadow-sm",
        type === "error"
          ? "border-red-200/80 bg-red-50/80 text-red-700"
          : "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {type ===
        "error" ? (
          <XCircle
            size={16}
            className="mt-0.5 shrink-0"
          />
        ) : (
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0"
          />
        )}

        <span className="font-medium leading-5">
          {children}
        </span>
      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Dismiss"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-45 transition hover:bg-black/[0.04] hover:opacity-100"
      >
        <X
          size={13}
        />
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
    <div className="px-5 py-16 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-brand-ink/10 bg-white/55 shadow-sm">
        <RefreshCw
          size={17}
          className="animate-spin text-brand-ink/40"
        />
      </div>

      <p className="mt-3 text-xs font-medium text-brand-ink/45">
        {text}
      </p>
    </div>
  );
}

function formatGroupName(
  value: string,
) {
  return value
    .replace(
      /[_-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function roleToForm(
  role: AdminRole,
): RoleForm {
  return {
    id: role.id,

    name:
      role.name,

    code:
      role.code,

    description:
      role.description ??
      "",

    isActive:
      role.is_active,

    isSystem:
      role.is_system,

    isAdministrator:
      role.is_administrator,

    permissionIds:
      [
        ...(role.permission_ids ??
          []),
      ].sort(
        (
          first,
          second,
        ) =>
          first -
          second,
      ),
  };
}

function snapshotForm(
  form: RoleForm,
) {
  return JSON.stringify({
    id:
      form.id,

    name:
      form.name.trim(),

    code:
      form.code,

    description:
      form.description.trim(),

    isActive:
      form.isActive,

    isSystem:
      form.isSystem,

    isAdministrator:
      form.isAdministrator,

    permissionIds:
      [
        ...form.permissionIds,
      ].sort(
        (
          first,
          second,
        ) =>
          first -
          second,
      ),
  });
}

function sortRoles(
  first: AdminRole,
  second: AdminRole,
) {
  if (
    first.is_administrator !==
    second.is_administrator
  ) {
    return first.is_administrator
      ? -1
      : 1;
  }

  if (
    first.is_system !==
    second.is_system
  ) {
    return first.is_system
      ? -1
      : 1;
  }

  return first.name.localeCompare(
    second.name,
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    LaravelApiError
  ) {
    if (
      error.payload?.errors
    ) {
      for (
        const messages
        of Object.values(
          error.payload.errors,
        )
      ) {
        if (
          messages?.[0]
        ) {
          return messages[0];
        }
      }
    }

    return (
      error.message ||
      fallback
    );
  }

  if (
    error instanceof Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
}