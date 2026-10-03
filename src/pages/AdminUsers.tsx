/** @format */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
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
  createAdminUser,
  getAdminUser,
  getAdminUsers,
  updateAdminUser,
  type AdminManagedUser,
  type AdminPermission,
  type AdminPermissionOverrideState,
  type AdminPermissionProfile,
  type AdminUserRole,
  type AdminUsersPagination,
} from "../lib/adminUsersApi";

import {
  useAuthSession,
} from "../lib/useAuthSession";

const USERS_PERMISSION =
  "website-admin.users.manage";

const PAGE_SIZE = 20;

type StatusFilter =
  | ""
  | "active"
  | "inactive";

type PermissionOverrideMap =
  Record<
    number,
    AdminPermissionOverrideState
  >;

type UserForm = {
  id: number | null;
  name: string;
  email: string;
  phone: string;
  defaultDeliveryAddress: string;
  role: number | null;
  isActive: boolean;
  password: string;

  permissionProfileIds: number[];
  permissionOverrides: PermissionOverrideMap;
};

const EMPTY_FORM: UserForm = {
  id: null,
  name: "",
  email: "",
  phone: "",
  defaultDeliveryAddress: "",
  role: null,
  isActive: true,
  password: "",

  permissionProfileIds: [],
  permissionOverrides: {},
};

const EMPTY_PAGINATION:
  AdminUsersPagination = {
    current_page: 1,
    last_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
    has_more: false,
  };

export default function AdminUsers() {
  const navigate =
    useNavigate();

  const {
    user: authenticatedUser,
    isLoading: isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    hasPermission,
  } = useAuthSession();

  const canManageUsers =
    hasPermission(
      USERS_PERMISSION,
    );

  const [
    users,
    setUsers,
  ] = useState<
    AdminManagedUser[]
  >([]);

  const [
    roles,
    setRoles,
  ] = useState<
    AdminUserRole[]
  >([]);

  const [
    permissionProfiles,
    setPermissionProfiles,
  ] = useState<
    AdminPermissionProfile[]
  >([]);

  const [
    permissions,
    setPermissions,
  ] = useState<
    AdminPermission[]
  >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<AdminUsersPagination>(
      EMPTY_PAGINATION,
    );

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState<
    number | null
  >(null);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
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
    panelOpen,
    setPanelOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] =
    useState<UserForm>(
      EMPTY_FORM,
    );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isLoadingUser,
    setIsLoadingUser,
  ] = useState(false);

  const [
    panelError,
    setPanelError,
  ] = useState("");

  const selectedRole =
    useMemo(
      () =>
        roles.find(
          (role) =>
            role.value ===
            form.role,
        ) ?? null,
      [
        roles,
        form.role,
      ],
    );

  const isEditing =
    form.id !== null;

  const currentUserId =
    authenticatedUser?.id ??
    null;

  const activeUsersOnPage =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.is_active,
        ).length,
      [users],
    );

  const staffUsersOnPage =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.is_staff,
        ).length,
      [users],
    );

  const hasFilters =
    search !== "" ||
    roleFilter !== null ||
    statusFilter !== "";

  const loadUsers =
    useCallback(
      async (
        options?: {
          refreshing?: boolean;
        },
      ) => {
        if (
          !canManageUsers
        ) {
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
            await getAdminUsers(
              {
                search,
                role:
                  roleFilter,
                status:
                  statusFilter,
                page,
                perPage:
                  PAGE_SIZE,
              },
            );

          setUsers(
            result.users,
          );

          setRoles(
            result.roles,
          );

          setPagination(
            result.pagination,
          );
        } catch (error) {
          setErrorText(
            getErrorMessage(
              error,
              "Could not load users.",
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
      [
        canManageUsers,
        search,
        roleFilter,
        statusFilter,
        page,
      ],
    );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (
      !isAuthenticated
    ) {
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

    if (
      !canManageUsers
    ) {
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
    canManageUsers,
    navigate,
  ]);

  useEffect(() => {
    if (
      isAuthLoading ||
      !isAuthenticated ||
      !canAccessWebsiteAdmin ||
      !canManageUsers
    ) {
      return;
    }

    void loadUsers();
  }, [
    isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    canManageUsers,
    loadUsers,
  ]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    const handleKeyDown =
      (
        event:
          KeyboardEvent,
      ) => {
        if (
          event.key ===
            "Escape" &&
          !isSaving
        ) {
          setPanelOpen(
            false,
          );

          setPanelError(
            "",
          );

          setForm(
            EMPTY_FORM,
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    panelOpen,
    isSaving,
  ]);

  function handleSearch(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim(),
    );
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setRoleFilter(null);
    setStatusFilter("");
    setPage(1);
  }

  async function loadAccessMetadataForCreate() {
    if (
      permissionProfiles.length >
        0 ||
      permissions.length > 0
    ) {
      return;
    }

    /*
     * The show endpoint currently returns the access-control
     * metadata. We use an existing user to retrieve it before
     * opening a new-user editor.
     */
    const sourceUser =
      users[0];

    if (!sourceUser) {
      return;
    }

    try {
      const result =
        await getAdminUser(
          sourceUser.id,
        );

      if (
        result.roles.length
      ) {
        setRoles(
          result.roles,
        );
      }

      setPermissionProfiles(
        result.permission_profiles,
      );

      setPermissions(
        result.permissions,
      );
    } catch {
      /*
       * Creating the account itself can still continue.
       * The backend remains authoritative for validation.
       */
    }
  }

  async function openCreatePanel() {
    setForm({
      ...EMPTY_FORM,
      role:
        roles[0]?.value ??
        null,
    });

    setPanelError("");
    setPanelOpen(true);

    await loadAccessMetadataForCreate();
  }

  async function openEditPanel(
    user: AdminManagedUser,
  ) {
    setPanelError("");

    setForm(
      userToForm(user),
    );

    setPanelOpen(true);
    setIsLoadingUser(true);

    try {
      const result =
        await getAdminUser(
          user.id,
        );

      if (
        result.roles.length
      ) {
        setRoles(
          result.roles,
        );
      }

      setPermissionProfiles(
        result.permission_profiles,
      );

      setPermissions(
        result.permissions,
      );

      setForm(
        userToForm(
          result.user,
        ),
      );
    } catch (error) {
      setPanelError(
        getErrorMessage(
          error,
          "Could not refresh this user's details.",
        ),
      );
    } finally {
      setIsLoadingUser(
        false,
      );
    }
  }

  function closePanel() {
    if (isSaving) {
      return;
    }

    setPanelOpen(false);
    setPanelError("");
    setForm(EMPTY_FORM);
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPanelError("");
    setSuccessText("");

    if (
      !form.name.trim()
    ) {
      setPanelError(
        "Enter the user's name.",
      );

      return;
    }

    if (
      form.role === null
    ) {
      setPanelError(
        "Select a role.",
      );

      return;
    }

    if (
      selectedRole
        ?.is_staff &&
      !form.email.trim()
    ) {
      setPanelError(
        "Staff accounts require an email address.",
      );

      return;
    }

    if (
      !isEditing &&
      selectedRole
        ?.is_staff &&
      !form.password.trim()
    ) {
      setPanelError(
        "Staff accounts require a password.",
      );

      return;
    }

    if (
      form.password &&
      form.password.length <
        8
    ) {
      setPanelError(
        "Password must contain at least 8 characters.",
      );

      return;
    }

    setIsSaving(true);

    const permissionOverrides =
      Object.entries(
        form.permissionOverrides,
      )
        .filter(
          (
            [, state],
          ) =>
            state !==
            "inherit",
        )
        .map(
          ([
            permissionId,
            state,
          ]) => ({
            permission_id:
              Number(
                permissionId,
              ),

            allowed:
              state ===
              "allow",
          }),
        );

    try {
      if (
        form.id === null
      ) {
        await createAdminUser(
          {
            name:
              form.name,

            email:
              form.email,

            phone:
              form.phone,

            default_delivery_address:
              form.defaultDeliveryAddress,

            role:
              form.role,

            is_active:
              form.isActive,

            password:
              form.password ||
              undefined,

            permission_profile_ids:
              form.permissionProfileIds,

            permission_overrides:
              permissionOverrides,
          },
        );

        setSuccessText(
          "User created successfully.",
        );
      } else {
        await updateAdminUser(
          form.id,
          {
            name:
              form.name,

            email:
              form.email,

            phone:
              form.phone,

            default_delivery_address:
              form.defaultDeliveryAddress,

            role:
              form.role,

            is_active:
              form.isActive,

            password:
              form.password ||
              undefined,

            permission_profile_ids:
              form.permissionProfileIds,

            permission_overrides:
              permissionOverrides,
          },
        );

        setSuccessText(
          "User updated successfully.",
        );
      }

      setPanelOpen(
        false,
      );

      setForm(
        EMPTY_FORM,
      );

      await loadUsers({
        refreshing: true,
      });
    } catch (error) {
      setPanelError(
        getErrorMessage(
          error,
          "Could not save the user.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleUserStatus(
    user: AdminManagedUser,
  ) {
    if (
      user.id ===
        currentUserId &&
      user.is_active
    ) {
      setErrorText(
        "You cannot deactivate your own account.",
      );

      return;
    }

    const nextActive =
      !user.is_active;

    const confirmed =
      window.confirm(
        nextActive
          ? `Activate ${user.name}?`
          : `Deactivate ${user.name}?`,
      );

    if (!confirmed) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    try {
      await updateAdminUser(
        user.id,
        {
          is_active:
            nextActive,
        },
      );

      setSuccessText(
        nextActive
          ? "User activated successfully."
          : "User deactivated successfully.",
      );

      await loadUsers({
        refreshing: true,
      });
    } catch (error) {
      setErrorText(
        getErrorMessage(
          error,
          "Could not update the user's status.",
        ),
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
    !canManageUsers
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
                User management
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-brand-ink sm:text-5xl">
                Users & staff
              </h1>

              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-brand-ink/58 sm:text-[15px]">
                Manage customer accounts,
                staff roles, permission
                profiles and individual
                access rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  void loadUsers({
                    refreshing:
                      true,
                  })
                }
                disabled={
                  isRefreshing
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

              <button
                type="button"
                onClick={() =>
                  void openCreatePanel()
                }
                disabled={
                  roles.length === 0
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_10px_24px_rgba(55,38,25,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(55,38,25,0.2)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <Plus
                  size={17}
                />

                Add user
              </button>
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
                <UsersRound
                  size={18}
                />
              }
              value={
                pagination.total
              }
              label="Users"
            />

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
                <UserRoundCheck
                  size={18}
                />
              }
              value={
                activeUsersOnPage
              }
              label="Active"
            />

            <Metric
              icon={
                <CircleUserRound
                  size={18}
                />
              }
              value={
                staffUsersOnPage
              }
              label="Staff"
              last
            />
          </div>

          <div className="border-t border-brand-ink/10 p-3 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form
                onSubmit={
                  handleSearch
                }
                className="flex min-w-0 flex-1 gap-2"
              >
                <div className="relative min-w-0 flex-1 xl:max-w-[480px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35"
                  />

                  <input
                    value={
                      searchInput
                    }
                    onChange={(
                      event,
                    ) =>
                      setSearchInput(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Search by name, email or phone..."
                    className="h-11 w-full rounded-2xl border border-brand-ink/10 bg-white/65 pl-10 pr-10 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/32 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.06]"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput(
                          "",
                        );

                        if (
                          search
                        ) {
                          setSearch(
                            "",
                          );

                          setPage(
                            1,
                          );
                        }
                      }}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-brand-ink/35 transition hover:bg-brand-ink/[0.06] hover:text-brand-ink"
                    >
                      <X
                        size={
                          14
                        }
                      />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-2xl border border-brand-ink/10 bg-white/65 px-4 text-sm font-semibold text-brand-ink/65 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink sm:px-5"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="hidden items-center gap-2 pr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink/35 sm:flex">
                  <SlidersHorizontal
                    size={
                      13
                    }
                  />
                  Filter
                </div>

                <select
                  value={
                    roleFilter ??
                    ""
                  }
                  onChange={(
                    event,
                  ) => {
                    setRoleFilter(
                      event
                        .target
                        .value ===
                        ""
                        ? null
                        : Number(
                            event
                              .target
                              .value,
                          ),
                    );

                    setPage(
                      1,
                    );
                  }}
                  className="h-11 min-w-[160px] rounded-2xl border border-brand-ink/10 bg-white/65 px-3.5 text-sm font-semibold text-brand-ink/65 outline-none transition hover:border-brand-ink/20 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.06]"
                >
                  <option value="">
                    All roles
                  </option>

                  {roles.map(
                    (
                      role,
                    ) => (
                      <option
                        key={
                          role.value
                        }
                        value={
                          role.value
                        }
                      >
                        {
                          role.label
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event,
                  ) => {
                    setStatusFilter(
                      event
                        .target
                        .value as StatusFilter,
                    );

                    setPage(
                      1,
                    );
                  }}
                  className="h-11 min-w-[150px] rounded-2xl border border-brand-ink/10 bg-white/65 px-3.5 text-sm font-semibold text-brand-ink/65 outline-none transition hover:border-brand-ink/20 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.06]"
                >
                  <option value="">
                    All statuses
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="h-11 rounded-2xl px-3 text-xs font-semibold text-brand-ink/45 transition hover:bg-brand-ink/[0.04] hover:text-brand-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {hasFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-ink/[0.07] pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/30">
                  Applied
                </span>

                {search && (
                  <FilterChip
                    label={`Search: ${search}`}
                    onRemove={() => {
                      setSearch(
                        "",
                      );

                      setSearchInput(
                        "",
                      );

                      setPage(
                        1,
                      );
                    }}
                  />
                )}

                {roleFilter !==
                  null && (
                  <FilterChip
                    label={
                      roles.find(
                        (
                          role,
                        ) =>
                          role.value ===
                          roleFilter,
                      )
                        ?.label ??
                      "Role"
                    }
                    onRemove={() => {
                      setRoleFilter(
                        null,
                      );

                      setPage(
                        1,
                      );
                    }}
                  />
                )}

                {statusFilter && (
                  <FilterChip
                    label={
                      statusFilter ===
                      "active"
                        ? "Active"
                        : "Inactive"
                    }
                    onRemove={() => {
                      setStatusFilter(
                        "",
                      );

                      setPage(
                        1,
                      );
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/35">
                Accounts
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-brand-ink">
                User directory
              </h2>
            </div>

            {!isLoading && (
              <p className="rounded-full border border-brand-ink/10 bg-white/45 px-3.5 py-1.5 text-xs font-semibold text-brand-ink/45">
                {
                  pagination.total
                }{" "}
                {pagination.total ===
                1
                  ? "account"
                  : "accounts"}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-sm backdrop-blur">
              <LoadingState
                text="Loading users..."
              />
            </div>
          ) : users.length ===
            0 ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-sm backdrop-blur">
              <EmptyState
                hasFilters={
                  hasFilters
                }
                onClear={
                  clearFilters
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur md:block">
                <UserTable
                  users={
                    users
                  }
                  currentUserId={
                    currentUserId
                  }
                  onEdit={(
                    user,
                  ) =>
                    void openEditPanel(
                      user,
                    )
                  }
                  onToggleStatus={(
                    user,
                  ) =>
                    void toggleUserStatus(
                      user,
                    )
                  }
                />
              </div>

              <div className="grid gap-3 md:hidden">
                {users.map(
                  (
                    user,
                  ) => (
                    <MobileUserCard
                      key={
                        user.id
                      }
                      user={
                        user
                      }
                      currentUserId={
                        currentUserId
                      }
                      onEdit={() =>
                        void openEditPanel(
                          user,
                        )
                      }
                      onToggleStatus={() =>
                        void toggleUserStatus(
                          user,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </>
          )}

          {!isLoading &&
            pagination.total >
              0 && (
              <Pagination
                pagination={
                  pagination
                }
                onPageChange={
                  setPage
                }
              />
            )}
        </section>
      </div>

      {panelOpen && (
        <UserPanel
          form={form}
          setForm={
            setForm
          }
          roles={
            roles
          }
          permissionProfiles={
            permissionProfiles
          }
          permissions={
            permissions
          }
          selectedRole={
            selectedRole
          }
          isEditing={
            isEditing
          }
          isSaving={
            isSaving
          }
          isLoadingUser={
            isLoadingUser
          }
          errorText={
            panelError
          }
          currentUserId={
            currentUserId
          }
          onClose={
            closePanel
          }
          onSubmit={
            handleSave
          }
        />
      )}
    </Page>
  );
}

function UserPanel({
  form,
  setForm,
  roles,
  permissionProfiles,
  permissions,
  selectedRole,
  isEditing,
  isSaving,
  isLoadingUser,
  errorText,
  currentUserId,
  onClose,
  onSubmit,
}: {
  form: UserForm;
  setForm: React.Dispatch<
    React.SetStateAction<UserForm>
  >;
  roles: AdminUserRole[];
  permissionProfiles:
    AdminPermissionProfile[];
  permissions:
    AdminPermission[];
  selectedRole:
    AdminUserRole | null;
  isEditing: boolean;
  isSaving: boolean;
  isLoadingUser: boolean;
  errorText: string;
  currentUserId:
    number | null;
  onClose: () => void;
  onSubmit: (
    event: FormEvent,
  ) => void;
}) {
  const editingSelf =
    form.id !== null &&
    form.id ===
      currentUserId;

  const groupedPermissions =
    useMemo(
      () =>
        groupPermissions(
          permissions,
        ),
      [permissions],
    );

  const inheritedKeys =
    useMemo(
      () => {
        const keys =
          new Set<string>();

        for (
          const profile
          of permissionProfiles
        ) {
          if (
            !form.permissionProfileIds.includes(
              profile.id,
            )
          ) {
            continue;
          }

          for (
            const permissionKey
            of profile.permissions
          ) {
            keys.add(
              permissionKey,
            );
          }
        }

        return keys;
      },
      [
        permissionProfiles,
        form.permissionProfileIds,
      ],
    );

  const effectiveKeys =
    useMemo(
      () => {
        const keys =
          new Set(
            inheritedKeys,
          );

        for (
          const permission
          of permissions
        ) {
          const state =
            form
              .permissionOverrides[
              permission.id
            ] ??
            "inherit";

          if (
            state ===
            "allow"
          ) {
            keys.add(
              permission.key,
            );
          }

          if (
            state ===
            "deny"
          ) {
            keys.delete(
              permission.key,
            );
          }
        }

        return keys;
      },
      [
        inheritedKeys,
        permissions,
        form.permissionOverrides,
      ],
    );

  function toggleProfile(
    profileId: number,
  ) {
    setForm(
      (
        current,
      ) => {
        const exists =
          current.permissionProfileIds.includes(
            profileId,
          );

        return {
          ...current,

          permissionProfileIds:
            exists
              ? current.permissionProfileIds.filter(
                  (
                    id,
                  ) =>
                    id !==
                    profileId,
                )
              : [
                  ...current.permissionProfileIds,
                  profileId,
                ],
        };
      },
    );
  }

  function setPermissionOverride(
    permissionId: number,
    state:
      AdminPermissionOverrideState,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        permissionOverrides:
          {
            ...current.permissionOverrides,

            [permissionId]:
              state,
          },
      }),
    );
  }

  const hasAccessMetadata =
    permissionProfiles.length >
      0 ||
    permissions.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close user editor"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-brand-ink/25 backdrop-blur-[3px]"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full flex-col bg-brand-bg shadow-[-24px_0_70px_rgba(55,38,25,0.18)] sm:my-3 sm:mr-3 sm:max-w-[720px] sm:overflow-hidden sm:rounded-[1.6rem] sm:border sm:border-brand-ink/10">
        <div className="relative shrink-0 overflow-hidden border-b border-brand-ink/10 bg-white/45 px-5 py-5 backdrop-blur sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-brand-ink/[0.035] blur-2xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="hidden sm:block">
                <Avatar
                  name={
                    form.name ||
                    (isEditing
                      ? "User"
                      : "New User")
                  }
                  active={
                    form.isActive
                  }
                  large
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/35">
                  {isEditing
                    ? "Account details"
                    : "Create account"}
                </p>

                <h2 className="mt-1 truncate text-2xl font-semibold tracking-[-0.035em] text-brand-ink">
                  {isEditing
                    ? form.name ||
                      "Edit user"
                    : "Add new user"}
                </h2>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-brand-ink/42">
                  {selectedRole && (
                    <span>
                      {
                        selectedRole.label
                      }
                    </span>
                  )}

                  {selectedRole && (
                    <span className="h-1 w-1 rounded-full bg-brand-ink/20" />
                  )}

                  <span>
                    {form.isActive
                      ? "Active account"
                      : "Inactive account"}
                  </span>

                  {isEditing &&
                    form.id !==
                      null && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-brand-ink/20" />

                        <span>
                          #
                          {
                            form.id
                          }
                        </span>
                      </>
                    )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                isSaving
              }
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-ink/10 bg-white/55 text-brand-ink/45 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:opacity-40"
            >
              <X
                size={
                  17
                }
              />
            </button>
          </div>
        </div>

        <form
          onSubmit={
            onSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {errorText && (
              <div className="mb-5">
                <InlineError>
                  {
                    errorText
                  }
                </InlineError>
              </div>
            )}

            {isLoadingUser && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-brand-ink/10 bg-white/45 px-4 py-3 text-xs font-medium text-brand-ink/45">
                <RefreshCw
                  size={
                    14
                  }
                  className="animate-spin"
                />

                Loading account
                access...
              </div>
            )}

            <FormSection
              eyebrow="Basic information"
              title="Profile & role"
              description="Core account details and the account classification assigned to this user."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                >
                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          name:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className={
                      fieldClassName
                    }
                    placeholder="Full name"
                    autoFocus
                  />
                </Field>

                <Field
                  label="Account role"
                  required
                >
                  <select
                    value={
                      form.role ??
                      ""
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          role:
                            event
                              .target
                              .value ===
                            ""
                              ? null
                              : Number(
                                  event
                                    .target
                                    .value,
                                ),
                        }),
                      )
                    }
                    className={
                      fieldClassName
                    }
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select role
                    </option>

                    {roles.map(
                      (
                        role,
                      ) => (
                        <option
                          key={
                            role.value
                          }
                          value={
                            role.value
                          }
                        >
                          {
                            role.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </Field>
              </div>

              {selectedRole && (
                <div className="mt-4 rounded-2xl border border-brand-ink/[0.08] bg-white/45 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-ink/[0.055] text-brand-ink/55">
                      <ShieldCheck
                        size={
                          15
                        }
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-brand-ink/75">
                        {
                          selectedRole.label
                        }
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-brand-ink/45">
                        {selectedRole.is_staff
                          ? "This is a staff account. Its actual administration access is controlled separately by the permission profiles and individual rules below."
                          : "This is a customer or general account. Administration permissions should normally remain unassigned."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            <FormSection
              eyebrow="Contact"
              title="Contact details"
              description="Used for account communication and delivery information."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Email address"
                  required={Boolean(
                    selectedRole
                      ?.is_staff,
                  )}
                >
                  <div className="relative">
                    <Mail
                      size={
                        15
                      }
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                    />

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            email:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className={`${fieldClassName} pl-10`}
                      placeholder="name@example.com"
                    />
                  </div>
                </Field>

                <Field label="Phone number">
                  <div className="relative">
                    <Phone
                      size={
                        15
                      }
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                    />

                    <input
                      type="tel"
                      value={
                        form.phone
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            phone:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className={`${fieldClassName} pl-10`}
                      placeholder="07X XXX XXXX"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Default delivery address">
                  <div className="relative">
                    <MapPin
                      size={
                        15
                      }
                      className="pointer-events-none absolute left-3.5 top-3.5 text-brand-ink/30"
                    />

                    <textarea
                      value={
                        form.defaultDeliveryAddress
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            defaultDeliveryAddress:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className={`${fieldClassName} min-h-[96px] resize-y py-3 pl-10`}
                      placeholder="Optional delivery address"
                    />
                  </div>
                </Field>
              </div>
            </FormSection>

            <FormSection
              eyebrow="Security"
              title="Credentials"
              description={
                isEditing
                  ? "Change the password only when new login credentials are required."
                  : "Configure login credentials for this account."
              }
            >
              <Field
                label={
                  isEditing
                    ? "New password"
                    : "Password"
                }
                required={
                  !isEditing &&
                  Boolean(
                    selectedRole
                      ?.is_staff,
                  )
                }
              >
                <div className="relative">
                  <KeyRound
                    size={
                      15
                    }
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                  />

                  <input
                    type="password"
                    value={
                      form.password
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          password:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className={`${fieldClassName} pl-10`}
                    placeholder={
                      isEditing
                        ? "Leave empty to keep current password"
                        : "Minimum 8 characters"
                    }
                    autoComplete="new-password"
                  />
                </div>
              </Field>

              <p className="mt-2 text-[11px] leading-5 text-brand-ink/38">
                {isEditing
                  ? "The existing password remains unchanged when this field is left empty."
                  : selectedRole?.is_staff
                    ? "Staff accounts require a password containing at least 8 characters."
                    : "A password is optional for this account type."}
              </p>
            </FormSection>

            <FormSection
              eyebrow="Administration access"
              title="Permission profiles"
              description="Profiles provide a reusable set of permissions. A user can belong to more than one profile."
            >
              {!hasAccessMetadata ? (
                <AccessEmptyState />
              ) : permissionProfiles.length ===
                0 ? (
                <AccessEmptyState />
              ) : (
                <div className="grid gap-2.5">
                  {permissionProfiles.map(
                    (
                      profile,
                    ) => {
                      const selected =
                        form.permissionProfileIds.includes(
                          profile.id,
                        );

                      return (
                        <button
                          key={
                            profile.id
                          }
                          type="button"
                          onClick={() =>
                            toggleProfile(
                              profile.id,
                            )
                          }
                          className={[
                            "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                            selected
                              ? "border-brand-ink/25 bg-brand-ink/[0.055]"
                              : "border-brand-ink/[0.08] bg-white/45 hover:border-brand-ink/15 hover:bg-white/65",
                          ].join(
                            " ",
                          )}
                        >
                          <span
                            className={[
                              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                              selected
                                ? "border-brand-ink bg-brand-ink text-brand-bg"
                                : "border-brand-ink/15 bg-white/50 text-transparent",
                            ].join(
                              " ",
                            )}
                          >
                            <Check
                              size={
                                12
                              }
                              strokeWidth={
                                3
                              }
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-brand-ink/75">
                                {
                                  profile.name
                                }
                              </span>

                              {profile.is_system && (
                                <span className="rounded-full border border-brand-ink/10 bg-white/55 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-brand-ink/35">
                                  System
                                </span>
                              )}
                            </span>

                            {profile.description && (
                              <span className="mt-1 block text-[10px] leading-4 text-brand-ink/40">
                                {
                                  profile.description
                                }
                              </span>
                            )}

                            <span className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.1em] text-brand-ink/30">
                              {
                                profile
                                  .permissions
                                  .length
                              }{" "}
                              {profile
                                .permissions
                                .length ===
                              1
                                ? "permission"
                                : "permissions"}
                            </span>
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </FormSection>

            <FormSection
              eyebrow="Fine-grained access"
              title="Individual permissions"
              description="Use overrides only when this user needs access that differs from their assigned profiles."
            >
              {permissions.length ===
              0 ? (
                <AccessEmptyState />
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <AccessMetric
                      value={
                        form
                          .permissionProfileIds
                          .length
                      }
                      label="Profiles"
                    />

                    <AccessMetric
                      value={
                        effectiveKeys.size
                      }
                      label="Effective"
                    />

                    <AccessMetric
                      value={
                        Object.values(
                          form.permissionOverrides,
                        ).filter(
                          (
                            state,
                          ) =>
                            state !==
                            "inherit",
                        ).length
                      }
                      label="Overrides"
                    />
                  </div>

                  <div className="space-y-3">
                    {Object.entries(
                      groupedPermissions,
                    ).map(
                      ([
                        group,
                        groupPermissions,
                      ]) => (
                        <PermissionGroup
                          key={
                            group
                          }
                          group={
                            group
                          }
                          permissions={
                            groupPermissions
                          }
                          inheritedKeys={
                            inheritedKeys
                          }
                          effectiveKeys={
                            effectiveKeys
                          }
                          overrides={
                            form.permissionOverrides
                          }
                          onChange={
                            setPermissionOverride
                          }
                        />
                      ),
                    )}
                  </div>
                </>
              )}
            </FormSection>

            <FormSection
              eyebrow="Account access"
              title="Account status"
              description="Control whether this account can currently access protected services."
              last
            >
              <div
                className={[
                  "flex items-center justify-between gap-5 rounded-2xl border px-4 py-4 transition",
                  form.isActive
                    ? "border-brand-ink/10 bg-white/50"
                    : "border-red-100 bg-red-50/45",
                  editingSelf
                    ? "opacity-60"
                    : "",
                ].join(
                  " ",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        form.isActive
                          ? "bg-emerald-500"
                          : "bg-red-400",
                      ].join(
                        " ",
                      )}
                    />

                    <p className="text-sm font-semibold text-brand-ink">
                      {form.isActive
                        ? "Account is active"
                        : "Account is inactive"}
                    </p>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-brand-ink/42">
                    {editingSelf
                      ? "You cannot deactivate the account you are currently signed in with."
                      : form.isActive
                        ? "The account can sign in and use the permissions granted above."
                        : "This user cannot access protected services until the account is activated."}
                  </p>
                </div>

                <Toggle
                  checked={
                    form.isActive
                  }
                  disabled={
                    editingSelf
                  }
                  onChange={(
                    checked,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        isActive:
                          checked,
                      }),
                    )
                  }
                />
              </div>
            </FormSection>
          </div>

          <div className="shrink-0 border-t border-brand-ink/10 bg-brand-bg/95 px-5 py-4 backdrop-blur sm:px-7">
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  isSaving
                }
                className="h-11 rounded-2xl border border-brand-ink/10 bg-white/50 px-5 text-sm font-semibold text-brand-ink/60 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSaving ||
                  form.role ===
                    null ||
                  isLoadingUser
                }
                className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_9px_22px_rgba(55,38,25,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(55,38,25,0.2)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                {isSaving && (
                  <RefreshCw
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                )}

                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create user"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}

function PermissionGroup({
  group,
  permissions,
  inheritedKeys,
  effectiveKeys,
  overrides,
  onChange,
}: {
  group: string;
  permissions:
    AdminPermission[];
  inheritedKeys:
    Set<string>;
  effectiveKeys:
    Set<string>;
  overrides:
    PermissionOverrideMap;
  onChange: (
    permissionId: number,
    state:
      AdminPermissionOverrideState,
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] = useState(true);

  const activeCount =
    permissions.filter(
      (
        permission,
      ) =>
        effectiveKeys.has(
          permission.key,
        ),
    ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-ink/[0.08] bg-white/40">
      <button
        type="button"
        onClick={() =>
          setOpen(
            (
              current,
            ) =>
              !current,
          )
        }
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-white/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-ink/[0.05] text-brand-ink/45">
            <Shield
              size={
                14
              }
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-brand-ink/70">
              {formatPermissionGroup(
                group,
              )}
            </p>

            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.09em] text-brand-ink/30">
              {
                activeCount
              }{" "}
              of{" "}
              {
                permissions.length
              }{" "}
              effective
            </p>
          </div>
        </div>

        <ChevronDown
          size={
            15
          }
          className={[
            "shrink-0 text-brand-ink/30 transition-transform",
            open
              ? "rotate-180"
              : "",
          ].join(
            " ",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-brand-ink/[0.07]">
          {permissions.map(
            (
              permission,
            ) => {
              const state =
                overrides[
                  permission.id
                ] ??
                "inherit";

              const inherited =
                inheritedKeys.has(
                  permission.key,
                );

              const effective =
                effectiveKeys.has(
                  permission.key,
                );

              return (
                <div
                  key={
                    permission.id
                  }
                  className="border-b border-brand-ink/[0.06] px-4 py-4 last:border-b-0"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold text-brand-ink/70">
                          {
                            permission.name
                          }
                        </p>

                        <EffectiveBadge
                          effective={
                            effective
                          }
                        />
                      </div>

                      {permission.description && (
                        <p className="mt-1 max-w-lg text-[10px] leading-4 text-brand-ink/40">
                          {
                            permission.description
                          }
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <code className="break-all text-[9px] font-medium text-brand-ink/30">
                          {
                            permission.key
                          }
                        </code>

                        {inherited && (
                          <span className="text-[9px] font-semibold text-brand-ink/35">
                            • inherited
                            from profile
                          </span>
                        )}
                      </div>
                    </div>

                    <PermissionStateControl
                      value={
                        state
                      }
                      inherited={
                        inherited
                      }
                      onChange={(
                        nextState,
                      ) =>
                        onChange(
                          permission.id,
                          nextState,
                        )
                      }
                    />
                  </div>
                </div>
              );
            },
          )}
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
  value:
    AdminPermissionOverrideState;
  inherited: boolean;
  onChange: (
    state:
      AdminPermissionOverrideState,
  ) => void;
}) {
  return (
    <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-xl border border-brand-ink/10 bg-brand-bg/35 p-1">
      <PermissionStateButton
        active={
          value ===
          "inherit"
        }
        onClick={() =>
          onChange(
            "inherit",
          )
        }
      >
        {inherited
          ? "Profile"
          : "Default"}
      </PermissionStateButton>

      <PermissionStateButton
        active={
          value ===
          "allow"
        }
        onClick={() =>
          onChange(
            "allow",
          )
        }
      >
        Allow
      </PermissionStateButton>

      <PermissionStateButton
        active={
          value ===
          "deny"
        }
        onClick={() =>
          onChange(
            "deny",
          )
        }
        danger
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
  children:
    ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "min-w-[66px] rounded-lg px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.06em] transition",
        active
          ? danger
            ? "bg-red-50 text-red-600 shadow-sm"
            : "bg-white text-brand-ink shadow-sm"
          : "text-brand-ink/30 hover:text-brand-ink/60",
      ].join(
        " ",
      )}
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
      ].join(
        " ",
      )}
    >
      {effective ? (
        <Check
          size={
            8
          }
          strokeWidth={
            3
          }
        />
      ) : (
        <LockKeyhole
          size={
            8
          }
        />
      )}

      {effective
        ? "Granted"
        : "No access"}
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
        <ShieldCheck
          size={
            16
          }
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-brand-ink/60">
        No access rules
        available
      </p>

      <p className="mx-auto mt-1 max-w-sm text-[10px] leading-4 text-brand-ink/38">
        Permission profiles and
        permissions will appear
        here when they are
        available from the
        server.
      </p>
    </div>
  );
}

function UserTable({
  users,
  currentUserId,
  onEdit,
  onToggleStatus,
}: {
  users:
    AdminManagedUser[];
  currentUserId:
    number | null;
  onEdit: (
    user:
      AdminManagedUser,
  ) => void;
  onToggleStatus: (
    user:
      AdminManagedUser,
  ) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead>
          <tr className="border-b border-brand-ink/10 bg-brand-bg/25">
            <Th>
              User
            </Th>

            <Th>
              Contact
            </Th>

            <Th>
              Role
            </Th>

            <Th>
              Status
            </Th>

            <Th>
              Security
            </Th>

            <Th>
              Joined
            </Th>

            <th className="w-[130px] px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/35">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map(
            (
              user,
            ) => {
              const isCurrentUser =
                user.id ===
                currentUserId;

              return (
                <tr
                  key={
                    user.id
                  }
                  className="group border-b border-brand-ink/[0.07] last:border-b-0 transition duration-200 hover:bg-white/65"
                >
                  <Td>
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          user,
                        )
                      }
                      className="flex max-w-full items-center gap-3 text-left"
                    >
                      <Avatar
                        name={
                          user.name
                        }
                        active={
                          user.is_active
                        }
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="max-w-[220px] truncate text-[13px] font-semibold text-brand-ink">
                            {
                              user.name
                            }
                          </p>

                          {isCurrentUser && (
                            <span className="rounded-full border border-brand-ink/10 bg-brand-ink/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-ink/45">
                              You
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink/30">
                          ID{" "}
                          {
                            user.id
                          }
                        </p>
                      </div>
                    </button>
                  </Td>

                  <Td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Mail
                          size={
                            12
                          }
                          className="shrink-0 text-brand-ink/30"
                        />

                        <p className="max-w-[220px] truncate text-[12px] font-medium text-brand-ink/65">
                          {user.email ||
                            "No email"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone
                          size={
                            12
                          }
                          className="shrink-0 text-brand-ink/30"
                        />

                        <p className="text-[11px] text-brand-ink/42">
                          {user.phone ||
                            "No phone"}
                        </p>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <RoleBadge
                      label={
                        user.role_label
                      }
                      isStaff={
                        user.is_staff
                      }
                    />
                  </Td>

                  <Td>
                    <StatusBadge
                      active={
                        user.is_active
                      }
                    />
                  </Td>

                  <Td>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "grid h-5 w-5 place-items-center rounded-full",
                            user.has_password
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-brand-ink/[0.05] text-brand-ink/30",
                          ].join(
                            " ",
                          )}
                        >
                          {user.has_password ? (
                            <Check
                              size={
                                11
                              }
                              strokeWidth={
                                2.5
                              }
                            />
                          ) : (
                            <X
                              size={
                                11
                              }
                              strokeWidth={
                                2.2
                              }
                            />
                          )}
                        </span>

                        <span className="text-[11px] font-semibold text-brand-ink/55">
                          {user.has_password
                            ? "Password set"
                            : "No password"}
                        </span>
                      </div>

                      {user.email && (
                        <p className="mt-1 pl-7 text-[10px] font-medium text-brand-ink/35">
                          {user.email_verified
                            ? "Email verified"
                            : "Email unverified"}
                        </p>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <span className="whitespace-nowrap text-[11px] font-medium text-brand-ink/45">
                      {formatDate(
                        user.created_at,
                      )}
                    </span>
                  </Td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onEdit(
                            user,
                          )
                        }
                        title="Edit user"
                        aria-label={`Edit ${user.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-brand-ink/40 transition hover:border-brand-ink/10 hover:bg-white hover:text-brand-ink hover:shadow-sm"
                      >
                        <Pencil
                          size={
                            14
                          }
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          isCurrentUser &&
                          user.is_active
                        }
                        onClick={() =>
                          onToggleStatus(
                            user,
                          )
                        }
                        title={
                          user.is_active
                            ? "Deactivate user"
                            : "Activate user"
                        }
                        className={[
                          "grid h-9 w-9 place-items-center rounded-xl border border-transparent transition disabled:cursor-not-allowed disabled:opacity-25",
                          user.is_active
                            ? "text-brand-ink/35 hover:border-red-100 hover:bg-red-50/80 hover:text-red-600"
                            : "text-brand-ink/35 hover:border-emerald-100 hover:bg-emerald-50/80 hover:text-emerald-700",
                        ].join(
                          " ",
                        )}
                      >
                        {user.is_active ? (
                          <XCircle
                            size={
                              15
                            }
                          />
                        ) : (
                          <CheckCircle2
                            size={
                              15
                            }
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onEdit(
                            user,
                          )
                        }
                        className="grid h-9 w-8 place-items-center rounded-xl text-brand-ink/20 transition group-hover:text-brand-ink/45 hover:bg-brand-ink/[0.04] hover:text-brand-ink"
                      >
                        <ChevronRight
                          size={
                            16
                          }
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}

function MobileUserCard({
  user,
  currentUserId,
  onEdit,
  onToggleStatus,
}: {
  user:
    AdminManagedUser;
  currentUserId:
    number | null;
  onEdit: () => void;
  onToggleStatus:
    () => void;
}) {
  const isCurrentUser =
    user.id ===
    currentUserId;

  return (
    <article className="overflow-hidden rounded-[1.3rem] border border-brand-ink/10 bg-white/55 shadow-[0_10px_28px_rgba(55,38,25,0.04)] backdrop-blur">
      <button
        type="button"
        onClick={
          onEdit
        }
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-white/55"
      >
        <Avatar
          name={
            user.name
          }
          active={
            user.is_active
          }
          large
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-[15px] font-semibold text-brand-ink">
                  {
                    user.name
                  }
                </h3>

                {isCurrentUser && (
                  <span className="rounded-full border border-brand-ink/10 bg-brand-ink/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-ink/45">
                    You
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-brand-ink/30">
                Account #
                {
                  user.id
                }
              </p>
            </div>

            <ChevronRight
              size={
                17
              }
              className="mt-0.5 shrink-0 text-brand-ink/25"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge
              label={
                user.role_label
              }
              isStaff={
                user.is_staff
              }
            />

            <StatusBadge
              active={
                user.is_active
              }
              compact
            />
          </div>
        </div>
      </button>

      <div className="border-t border-brand-ink/[0.07] px-4 py-3">
        <div className="space-y-2">
          <ContactRow
            icon={
              <Mail
                size={
                  13
                }
              />
            }
            value={
              user.email ||
              "No email address"
            }
          />

          <ContactRow
            icon={
              <Phone
                size={
                  13
                }
              />
            }
            value={
              user.phone ||
              "No phone number"
            }
          />

          {user.default_delivery_address && (
            <ContactRow
              icon={
                <MapPin
                  size={
                    13
                  }
                />
              }
              value={
                user.default_delivery_address
              }
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-brand-ink/[0.07] bg-brand-bg/20 px-4 py-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-ink/30">
            Joined
          </p>

          <p className="mt-0.5 text-[11px] font-semibold text-brand-ink/55">
            {formatDate(
              user.created_at,
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              onEdit
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/60 px-3 text-xs font-semibold text-brand-ink/60 transition hover:bg-white hover:text-brand-ink"
          >
            <Pencil
              size={
                13
              }
            />
            Edit
          </button>

          <button
            type="button"
            disabled={
              isCurrentUser &&
              user.is_active
            }
            onClick={
              onToggleStatus
            }
            className={[
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30",
              user.is_active
                ? "border-red-100 bg-red-50/60 text-red-600 hover:bg-red-50"
                : "border-emerald-100 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-50",
            ].join(
              " ",
            )}
          >
            {user.is_active ? (
              <>
                <XCircle
                  size={
                    13
                  }
                />
                Disable
              </>
            ) : (
              <>
                <CheckCircle2
                  size={
                    13
                  }
                />
                Activate
              </>
            )}
          </button>
        </div>
      </div>
    </article>
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
      ].join(
        " ",
      )}
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
      ].join(
        " ",
      )}
    >
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
  "h-11 w-full rounded-2xl border border-brand-ink/10 bg-white/60 px-3.5 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/28 hover:border-brand-ink/15 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.055]";

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }
      disabled={
        disabled
      }
      onClick={() =>
        onChange(
          !checked,
        )
      }
      className={[
        "relative h-7 w-12 shrink-0 rounded-full border transition duration-200",
        checked
          ? "border-brand-ink bg-brand-ink"
          : "border-brand-ink/10 bg-brand-ink/10",
        disabled
          ? "cursor-not-allowed"
          : "cursor-pointer",
      ].join(
        " ",
      )}
    >
      <span
        className={[
          "absolute top-[3px] grid h-5 w-5 place-items-center rounded-full bg-brand-bg shadow-sm transition-all duration-200",
          checked
            ? "left-[23px]"
            : "left-[3px]",
        ].join(
          " ",
        )}
      >
        {checked && (
          <Check
            size={
              10
            }
            strokeWidth={
              3
            }
            className="text-brand-ink"
          />
        )}
      </span>
    </button>
  );
}

function Avatar({
  name,
  active = true,
  large = false,
}: {
  name: string;
  active?: boolean;
  large?: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={[
          "grid place-items-center rounded-xl border border-brand-ink/10 bg-brand-ink/[0.045] font-bold tracking-[-0.025em] text-brand-ink/60",
          large
            ? "h-12 w-12 text-[13px]"
            : "h-10 w-10 text-[11px]",
        ].join(
          " ",
        )}
      >
        {initials(
          name,
        )}
      </div>

      <span
        className={[
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
          large
            ? "h-3.5 w-3.5"
            : "h-3 w-3",
          active
            ? "bg-emerald-500"
            : "bg-red-400",
        ].join(
          " ",
        )}
      />
    </div>
  );
}

function RoleBadge({
  label,
  isStaff,
}: {
  label: string;
  isStaff: boolean;
}) {
  return (
    <div>
      <span className="inline-flex rounded-full border border-brand-ink/10 bg-white/55 px-2.5 py-1 text-[10px] font-semibold text-brand-ink/65">
        {label}
      </span>

      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-brand-ink/30">
        {isStaff
          ? "Staff"
          : "Customer"}
      </p>
    </div>
  );
}

function StatusBadge({
  active,
  compact = false,
}: {
  active: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        compact
          ? "px-2.5 py-1 text-[10px]"
          : "px-2.5 py-1.5 text-[10px]",
        active
          ? "border-emerald-200/70 bg-emerald-50/70 text-emerald-700"
          : "border-red-200/70 bg-red-50/70 text-red-600",
      ].join(
        " ",
      )}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          active
            ? "bg-emerald-500"
            : "bg-red-400",
        ].join(
          " ",
        )}
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function ContactRow({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 text-brand-ink/45">
      <span className="mt-0.5 shrink-0">
        {icon}
      </span>

      <span className="min-w-0 break-words text-[11px] font-medium leading-5 text-brand-ink/55">
        {value}
      </span>
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-brand-ink/10 bg-white/55 pl-2.5 pr-1.5 text-[10px] font-semibold text-brand-ink/50">
      <span className="max-w-[200px] truncate">
        {label}
      </span>

      <button
        type="button"
        onClick={
          onRemove
        }
        aria-label={`Remove ${label} filter`}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-brand-ink/35 transition hover:bg-brand-ink/[0.07] hover:text-brand-ink"
      >
        <X
          size={
            11
          }
        />
      </button>
    </span>
  );
}

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination:
    AdminUsersPagination;
  onPageChange: (
    page: number,
  ) => void;
}) {
  const firstItem =
    pagination.total === 0
      ? 0
      : (pagination.current_page -
          1) *
          pagination.per_page +
        1;

  const lastItem =
    Math.min(
      pagination.current_page *
        pagination.per_page,
      pagination.total,
    );

  return (
    <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] font-medium text-brand-ink/40">
        Showing{" "}
        <span className="font-semibold text-brand-ink/65">
          {firstItem}–
          {lastItem}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-brand-ink/65">
          {
            pagination.total
          }
        </span>{" "}
        accounts
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          disabled={
            pagination.current_page <=
            1
          }
          onClick={() =>
            onPageChange(
              pagination.current_page -
                1,
            )
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/45 px-3 text-xs font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft
            size={
              13
            }
          />
          Previous
        </button>

        <span className="min-w-[70px] text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink/35">
          {
            pagination.current_page
          }{" "}
          /{" "}
          {
            pagination.last_page
          }
        </span>

        <button
          type="button"
          disabled={
            !pagination.has_more
          }
          onClick={() =>
            onPageChange(
              pagination.current_page +
                1,
            )
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/45 px-3 text-xs font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ArrowRight
            size={
              13
            }
          />
        </button>
      </div>
    </div>
  );
}

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
        type ===
        "error"
          ? "border-red-200/80 bg-red-50/80 text-red-700"
          : "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
      ].join(
        " ",
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {type ===
        "error" ? (
          <XCircle
            size={
              16
            }
            className="mt-0.5 shrink-0"
          />
        ) : (
          <CheckCircle2
            size={
              16
            }
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
          size={
            13
          }
        />
      </button>
    </div>
  );
}

function InlineError({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/70 px-4 py-3 text-xs font-medium leading-5 text-red-700">
      <XCircle
        size={
          15
        }
        className="mt-0.5 shrink-0"
      />

      <span>
        {children}
      </span>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-16 text-center sm:py-20">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand-ink/10 bg-white/55 text-brand-ink/35 shadow-sm">
        <UsersRound
          size={
            22
          }
        />
      </div>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/30">
        User directory
      </p>

      <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-brand-ink">
        {hasFilters
          ? "No matching users"
          : "No users yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-brand-ink/45">
        {hasFilters
          ? "No accounts match the current search and filters. Adjust them to see more results."
          : "User accounts will appear here once they have been created."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={
            onClear
          }
          className="mt-5 rounded-xl border border-brand-ink/10 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-ink/60 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
        >
          Clear all filters
        </button>
      )}
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
          size={
            17
          }
          className="animate-spin text-brand-ink/40"
        />
      </div>

      <p className="mt-3 text-xs font-medium text-brand-ink/45">
        {text}
      </p>
    </div>
  );
}

function Th({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/35">
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="px-4 py-3.5 align-middle">
      {children}
    </td>
  );
}

function userToForm(
  user:
    AdminManagedUser,
): UserForm {
  const overrides:
    PermissionOverrideMap =
      {};

  for (
    const override
    of user.permission_overrides ??
    []
  ) {
    overrides[
      override.permission_id
    ] =
      override.allowed
        ? "allow"
        : "deny";
  }

  const profileIds =
    user.permission_profile_ids ??
    user.permission_profiles?.map(
      (
        profile,
      ) =>
        profile.id,
    ) ??
    [];

  return {
    id:
      user.id,

    name:
      user.name,

    email:
      user.email ??
      "",

    phone:
      user.phone ??
      "",

    defaultDeliveryAddress:
      user.default_delivery_address ??
      "",

    role:
      user.role,

    isActive:
      user.is_active,

    password:
      "",

    permissionProfileIds:
      profileIds,

    permissionOverrides:
      overrides,
  };
}

function groupPermissions(
  permissions:
    AdminPermission[],
) {
  return permissions.reduce<
    Record<
      string,
      AdminPermission[]
    >
  >(
    (
      groups,
      permission,
    ) => {
      const group =
        permission.group?.trim() ||
        "Other";

      if (
        !groups[group]
      ) {
        groups[group] =
          [];
      }

      groups[group].push(
        permission,
      );

      return groups;
    },
    {},
  );
}

function formatPermissionGroup(
  value: string,
) {
  return value
    .replace(
      /[_-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}

function initials(
  name: string,
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(
        Boolean,
      );

  if (
    !parts.length
  ) {
    return "?";
  }

  return parts
    .slice(
      0,
      2,
    )
    .map(
      (
        part,
      ) =>
        part[0]
          ?.toUpperCase() ??
        "",
    )
    .join("");
}

function formatDate(
  value:
    string | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      year:
        "numeric",
      month:
        "short",
      day:
        "numeric",
    },
  ).format(
    date,
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
      error.payload
        ?.errors
    ) {
      for (
        const messages
        of Object.values(
          error.payload
            .errors,
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
    error instanceof
    Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
}