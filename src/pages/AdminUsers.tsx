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
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import Page from "../components/Page";
import UserPanel from "../components/admin/users/UserPanel";

import { LaravelApiError } from "../lib/laravelApi";

import {
  createAdminUser,
  getAdminUser,
  getAdminUsers,
  updateAdminUser,
  type AdminManagedUser,
  type AdminPermission,
  type AdminPermissionProfile,
  type AdminUserRole,
  type AdminUsersPagination,
} from "../lib/adminUsersApi";

import { useAuthSession } from "../lib/useAuthSession";

import type {
  FieldErrors,
  PermissionOverrideMap,
  UserForm,
} from "../types/adminUsers";

const USERS_PERMISSION = "website-admin.users.manage";
const PAGE_SIZE = 20;

type StatusFilter = "" | "active" | "inactive";

type StatusConfirmation = {
  user: AdminManagedUser;
  nextActive: boolean;
} | null;

const EMPTY_FORM: UserForm = {
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

const EMPTY_PAGINATION: AdminUsersPagination = {
  current_page: 1,
  last_page: 1,
  per_page: PAGE_SIZE,
  total: 0,
  has_more: false,
};

export default function AdminUsers() {
  const navigate = useNavigate();

  const {
    user: authenticatedUser,
    isLoading: isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    hasPermission,
  } = useAuthSession();

  const canManageUsers = hasPermission(USERS_PERMISSION);

  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [roles, setRoles] = useState<AdminUserRole[]>([]);
  const [permissionProfiles, setPermissionProfiles] = useState<
    AdminPermissionProfile[]
  >([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);

  const [pagination, setPagination] =
    useState<AdminUsersPagination>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<UserForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");

  const [statusConfirmation, setStatusConfirmation] =
    useState<StatusConfirmation>(null);

  const [statusUpdatingUserId, setStatusUpdatingUserId] = useState<
    number | null
  >(null);

  const [discardConfirmationOpen, setDiscardConfirmationOpen] =
    useState(false);

  const directoryRef = useRef<HTMLElement | null>(null);
  const panelCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => getRoleValue(role) === form.role) ?? null,
    [roles, form.role],
  );

  const selectedFilterRole = useMemo(
    () =>
      roleFilter === null
        ? null
        : roles.find((role) => getRoleValue(role) === roleFilter) ?? null,
    [roles, roleFilter],
  );

  const isEditing = form.id !== null;
  const currentUserId = authenticatedUser?.id ?? null;

  const activeUsersOnPage = useMemo(
    () => users.filter((user) => user.is_active).length,
    [users],
  );

  const staffUsersOnPage = useMemo(
    () => users.filter((user) => user.is_staff).length,
    [users],
  );

  const hasFilters =
    search !== "" || roleFilter !== null || statusFilter !== "";

  const isDirty = useMemo(
    () => !formsEqual(form, initialForm),
    [form, initialForm],
  );

  const loadUsers = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!canManageUsers) {
        return;
      }

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorText("");

      try {
        const result = await getAdminUsers({
          search,
          role: roleFilter,
          status: statusFilter,
          page,
          perPage: PAGE_SIZE,
        });

        setUsers(result.users);
        setRoles(result.roles);
        setPagination(result.pagination);
      } catch (error) {
        setErrorText(getErrorMessage(error, "Could not load users."));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [canManageUsers, search, roleFilter, statusFilter, page],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (!canAccessWebsiteAdmin) {
      navigate("/account", { replace: true });
      return;
    }

    if (!canManageUsers) {
      navigate("/admin/dashboard", { replace: true });
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelCloseButtonRef.current?.focus();
    }, 60);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isSaving || statusConfirmation || discardConfirmationOpen) {
        return;
      }

      requestClosePanel();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    panelOpen,
    isSaving,
    statusConfirmation,
    discardConfirmationOpen,
    isDirty,
  ]);

  function resetPanelState() {
    setPanelOpen(false);
    setPanelError("");
    setFieldErrors({});
    setPermissionSearch("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDiscardConfirmationOpen(false);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
  }

  function requestClosePanel() {
    if (isSaving) {
      return;
    }

    if (isDirty) {
      setDiscardConfirmationOpen(true);
      return;
    }

    resetPanelState();
  }

  function discardChanges() {
    resetPanelState();
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setRoleFilter(null);
    setStatusFilter("");
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > pagination.last_page ||
      nextPage === pagination.current_page
    ) {
      return;
    }

    setPage(nextPage);

    window.setTimeout(() => {
      directoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function loadAccessMetadataForCreate() {
    if (permissionProfiles.length > 0 || permissions.length > 0) {
      return;
    }

    let sourceUser = users[0];

    if (!sourceUser) {
      try {
        const result = await getAdminUsers({
          page: 1,
          perPage: 1,
        });

        if (result.roles.length > 0) {
          setRoles(result.roles);
        }

        sourceUser = result.users[0];
      } catch {
        return;
      }
    }

    if (!sourceUser) {
      return;
    }

    try {
      const result = await getAdminUser(sourceUser.id);

      if (result.roles.length > 0) {
        setRoles(result.roles);
      }

      setPermissionProfiles(result.permission_profiles ?? []);
      setPermissions(result.permissions ?? []);
    } catch {
      /*
       * User creation can still continue.
       * Backend validation remains authoritative.
       */
    }
  }

  async function openCreatePanel() {
    const nextForm: UserForm = {
      ...EMPTY_FORM,
      role: roles[0] ? getRoleValue(roles[0]) : null,
      permissionProfileIds: [],
      permissionOverrides: {},
    };

    setForm(nextForm);
    setInitialForm(nextForm);
    setFieldErrors({});
    setPanelError("");
    setPermissionSearch("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPanelOpen(true);

    await loadAccessMetadataForCreate();
  }

  async function openEditPanel(user: AdminManagedUser) {
    const fallbackForm = userToForm(user);

    setPanelError("");
    setFieldErrors({});
    setPermissionSearch("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setForm(fallbackForm);
    setInitialForm(fallbackForm);
    setPanelOpen(true);
    setIsLoadingUser(true);

    try {
      const result = await getAdminUser(user.id);

      if (result.roles.length > 0) {
        setRoles(result.roles);
      }

      setPermissionProfiles(result.permission_profiles ?? []);
      setPermissions(result.permissions ?? []);

      const freshForm = userToForm(result.user);

      setForm(freshForm);
      setInitialForm(freshForm);
    } catch (error) {
      setPanelError(
        getErrorMessage(
          error,
          "Could not refresh this user's account details.",
        ),
      );
    } finally {
      setIsLoadingUser(false);
    }
  }

  function validateForm() {
    const errors = validateUserForm(form, selectedRole, isEditing);

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();

    setPanelError("");
    setSuccessText("");

    if (!validateForm()) {
      setPanelError("Check the highlighted fields and try again.");
      return;
    }

    if (form.role === null) {
      setFieldErrors((current) => ({
        ...current,
        role: "Select an account role.",
      }));

      setPanelError("Select an account role and try again.");
      return;
    }

    setIsSaving(true);

    const permissionOverrides = Object.entries(form.permissionOverrides)
      .filter(([, state]) => state !== "inherit")
      .map(([permissionId, state]) => ({
        permission_id: Number(permissionId),
        allowed: state === "allow",
      }));

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      default_delivery_address: form.defaultDeliveryAddress.trim(),
      role_id: form.role,
      is_active: form.isActive,
      password: form.password || undefined,
      permission_profile_ids: form.permissionProfileIds,
      permission_overrides: permissionOverrides,
    };

    try {
      if (form.id === null) {
        await createAdminUser(payload);
        setSuccessText("User created successfully.");
      } else {
        await updateAdminUser(form.id, payload);
        setSuccessText("User updated successfully.");
      }

      resetPanelState();

      await loadUsers({
        refreshing: true,
      });
    } catch (error) {
      const mappedErrors = mapLaravelFieldErrors(error);

      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors((current) => ({
          ...current,
          ...mappedErrors,
        }));
      }

      setPanelError(getErrorMessage(error, "Could not save the user."));
    } finally {
      setIsSaving(false);
    }
  }

  function requestToggleUserStatus(user: AdminManagedUser) {
    if (statusUpdatingUserId !== null) {
      return;
    }

    if (user.id === currentUserId && user.is_active) {
      setErrorText("You cannot deactivate your own account.");
      return;
    }

    setStatusConfirmation({
      user,
      nextActive: !user.is_active,
    });
  }

  async function confirmToggleUserStatus() {
    if (!statusConfirmation) {
      return;
    }

    const { user, nextActive } = statusConfirmation;

    setErrorText("");
    setSuccessText("");
    setStatusUpdatingUserId(user.id);

    try {
      await updateAdminUser(user.id, {
        is_active: nextActive,
      });

      setSuccessText(
        nextActive
          ? `${user.name} was activated successfully.`
          : `${user.name} was deactivated successfully.`,
      );

      setStatusConfirmation(null);

      await loadUsers({
        refreshing: true,
      });
    } catch (error) {
      setErrorText(
        getErrorMessage(error, "Could not update the user's status."),
      );

      setStatusConfirmation(null);
    } finally {
      setStatusUpdatingUserId(null);
    }
  }

  if (isAuthLoading) {
    return (
      <Page>
        <LoadingState text="Checking access..." />
      </Page>
    );
  }

  if (!isAuthenticated || !canAccessWebsiteAdmin || !canManageUsers) {
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
                Manage customer accounts, staff roles, permission profiles and
                individual access rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  void loadUsers({
                    refreshing: true,
                  })
                }
                disabled={isRefreshing || isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-brand-ink/10 bg-white/55 px-4 text-sm font-semibold text-brand-ink/65 shadow-sm backdrop-blur transition hover:border-brand-ink/20 hover:bg-white/80 hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RefreshCw
                  size={15}
                  className={isRefreshing ? "animate-spin" : ""}
                />

                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => void openCreatePanel()}
                disabled={roles.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_10px_24px_rgba(55,38,25,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(55,38,25,0.2)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <Plus size={17} />
                Add user
              </button>
            </div>
          </div>
        </header>

        {(errorText || successText) && (
          <div className="mt-5 space-y-2.5">
            {errorText && (
              <Notice type="error" onClose={() => setErrorText("")}>
                {errorText}
              </Notice>
            )}

            {successText && (
              <Notice type="success" onClose={() => setSuccessText("")}>
                {successText}
              </Notice>
            )}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={<UsersRound size={18} />}
              value={pagination.total}
              label="Users"
            />

            <Metric
              icon={<ShieldCheck size={18} />}
              value={roles.length}
              label="Roles"
            />

            <Metric
              icon={<UserRoundCheck size={18} />}
              value={activeUsersOnPage}
              label="Active on page"
            />

            <Metric
              icon={<CircleUserRound size={18} />}
              value={staffUsersOnPage}
              label="Staff on page"
              last
            />
          </div>

          <div className="border-t border-brand-ink/10 p-3 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form
                onSubmit={handleSearch}
                className="flex min-w-0 flex-1 gap-2"
              >
                <div className="relative min-w-0 flex-1 xl:max-w-[480px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35"
                  />

                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    name="user-search"
                    autoComplete="off"
                    placeholder="Search by name, email or phone..."
                    className="h-11 w-full rounded-2xl border border-brand-ink/10 bg-white/65 pl-10 pr-10 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/32 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.06]"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");

                        if (search) {
                          setSearch("");
                          setPage(1);
                        }
                      }}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-brand-ink/35 transition hover:bg-brand-ink/[0.06] hover:text-brand-ink"
                    >
                      <X size={14} />
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
                  <SlidersHorizontal size={13} />
                  Filter
                </div>

                <select
                  value={roleFilter ?? ""}
                  onChange={(event) => {
                    setRoleFilter(
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    );

                    setPage(1);
                  }}
                  aria-label="Filter users by role"
                  className="h-11 min-w-[160px] rounded-2xl border border-brand-ink/10 bg-white/65 px-3.5 text-sm font-semibold text-brand-ink/65 outline-none transition hover:border-brand-ink/20 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.06]"
                >
                  <option value="">All roles</option>

                  {roles.map((role) => (
                    <option
                      key={getRoleValue(role)}
                      value={getRoleValue(role)}
                    >
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                  aria-label="Filter users by status"
                  className="h-11 min-w-[150px] rounded-2xl border border-brand-ink/10 bg-white/65 px-3.5 text-sm font-semibold text-brand-ink/65 outline-none transition hover:border-brand-ink/20 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.06]"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
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
                      setSearch("");
                      setSearchInput("");
                      setPage(1);
                    }}
                  />
                )}

                {roleFilter !== null && (
                  <FilterChip
                    label={
                      selectedFilterRole
                        ? getRoleLabel(selectedFilterRole)
                        : "Role"
                    }
                    onRemove={() => {
                      setRoleFilter(null);
                      setPage(1);
                    }}
                  />
                )}

                {statusFilter && (
                  <FilterChip
                    label={statusFilter === "active" ? "Active" : "Inactive"}
                    onRemove={() => {
                      setStatusFilter("");
                      setPage(1);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        <section ref={directoryRef} className="mt-6 scroll-mt-6">
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
                {pagination.total}{" "}
                {pagination.total === 1 ? "account" : "accounts"}
              </p>
            )}
          </div>

          {isLoading ? (
            <UserTableSkeleton />
          ) : users.length === 0 ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-sm backdrop-blur">
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur md:block">
                <UserTable
                  users={users}
                  currentUserId={currentUserId}
                  statusUpdatingUserId={statusUpdatingUserId}
                  onEdit={(user) => void openEditPanel(user)}
                  onToggleStatus={requestToggleUserStatus}
                />
              </div>

              <div className="grid gap-3 md:hidden">
                {users.map((user) => (
                  <MobileUserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    isUpdatingStatus={statusUpdatingUserId === user.id}
                    onEdit={() => void openEditPanel(user)}
                    onToggleStatus={() => requestToggleUserStatus(user)}
                  />
                ))}
              </div>
            </>
          )}

          {!isLoading && pagination.total > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </div>

      {panelOpen && (
        <UserPanel
          form={form}
          setForm={setForm}
          roles={roles}
          permissionProfiles={permissionProfiles}
          permissions={permissions}
          selectedRole={selectedRole}
          isEditing={isEditing}
          isSaving={isSaving}
          isLoadingUser={isLoadingUser}
          errorText={panelError}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          currentUserId={currentUserId}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          permissionSearch={permissionSearch}
          setPermissionSearch={setPermissionSearch}
          closeButtonRef={panelCloseButtonRef}
          onClose={requestClosePanel}
          onSubmit={handleSave}
        />
      )}

      {statusConfirmation && (
        <ConfirmationModal
          title={
            statusConfirmation.nextActive
              ? "Activate account?"
              : "Deactivate account?"
          }
          description={
            statusConfirmation.nextActive
              ? `${statusConfirmation.user.name} will be able to access protected services again.`
              : `${statusConfirmation.user.name} will no longer be able to access protected services until the account is reactivated.`
          }
          confirmLabel={
            statusConfirmation.nextActive
              ? "Activate user"
              : "Deactivate user"
          }
          danger={!statusConfirmation.nextActive}
          loading={statusUpdatingUserId === statusConfirmation.user.id}
          onCancel={() => setStatusConfirmation(null)}
          onConfirm={() => void confirmToggleUserStatus()}
        />
      )}

      {discardConfirmationOpen && (
        <ConfirmationModal
          title="Discard changes?"
          description="You have unsaved changes in this account. Closing the editor now will discard them."
          confirmLabel="Discard changes"
          danger
          onCancel={() => setDiscardConfirmationOpen(false)}
          onConfirm={discardChanges}
        />
      )}
    </Page>
  );
}

function UserTable({
  users,
  currentUserId,
  statusUpdatingUserId,
  onEdit,
  onToggleStatus,
}: {
  users: AdminManagedUser[];
  currentUserId: number | null;
  statusUpdatingUserId: number | null;
  onEdit: (user: AdminManagedUser) => void;
  onToggleStatus: (user: AdminManagedUser) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead>
          <tr className="border-b border-brand-ink/10 bg-brand-bg/25">
            <Th>User</Th>
            <Th>Contact</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Security</Th>
            <Th>Joined</Th>

            <th className="w-[130px] px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/35">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isUpdatingStatus = statusUpdatingUserId === user.id;

            return (
              <tr
                key={user.id}
                className="group border-b border-brand-ink/[0.07] last:border-b-0 transition duration-200 hover:bg-white/65"
              >
                <Td>
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="flex max-w-full items-center gap-3 text-left focus:outline-none"
                  >
                    <Avatar name={user.name} active={user.is_active} />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="max-w-[220px] truncate text-[13px] font-semibold text-brand-ink">
                          {user.name}
                        </p>

                        {isCurrentUser && (
                          <span className="rounded-full border border-brand-ink/10 bg-brand-ink/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-ink/45">
                            You
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink/30">
                        ID {user.id}
                      </p>
                    </div>
                  </button>
                </Td>

                <Td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Mail
                        size={12}
                        className="shrink-0 text-brand-ink/30"
                      />

                      <p className="max-w-[220px] truncate text-[12px] font-medium text-brand-ink/65">
                        {user.email || "No email"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone
                        size={12}
                        className="shrink-0 text-brand-ink/30"
                      />

                      <p className="text-[11px] text-brand-ink/42">
                        {user.phone || "No phone"}
                      </p>
                    </div>
                  </div>
                </Td>

                <Td>
                  <RoleBadge
                    label={getUserRoleLabel(user)}
                    isStaff={user.is_staff}
                  />
                </Td>

                <Td>
                  <StatusBadge active={user.is_active} />
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
                        ].join(" ")}
                      >
                        {user.has_password ? (
                          <Check size={11} strokeWidth={2.5} />
                        ) : (
                          <X size={11} strokeWidth={2.2} />
                        )}
                      </span>

                      <span className="text-[11px] font-semibold text-brand-ink/55">
                        {user.has_password ? "Password set" : "No password"}
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
                    {formatDate(user.created_at)}
                  </span>
                </Td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      title="Edit user"
                      aria-label={`Edit ${user.name}`}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-brand-ink/40 transition hover:border-brand-ink/10 hover:bg-white hover:text-brand-ink hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/10"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        isUpdatingStatus ||
                        (isCurrentUser && user.is_active)
                      }
                      onClick={() => onToggleStatus(user)}
                      title={
                        user.is_active
                          ? "Deactivate user"
                          : "Activate user"
                      }
                      aria-label={
                        user.is_active
                          ? `Deactivate ${user.name}`
                          : `Activate ${user.name}`
                      }
                      className={[
                        "grid h-9 w-9 place-items-center rounded-xl border border-transparent transition focus:outline-none focus:ring-2 focus:ring-brand-ink/10 disabled:cursor-not-allowed disabled:opacity-25",
                        user.is_active
                          ? "text-brand-ink/35 hover:border-red-100 hover:bg-red-50/80 hover:text-red-600"
                          : "text-brand-ink/35 hover:border-emerald-100 hover:bg-emerald-50/80 hover:text-emerald-700",
                      ].join(" ")}
                    >
                      {isUpdatingStatus ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : user.is_active ? (
                        <XCircle size={15} />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      aria-label={`Open ${user.name}`}
                      className="grid h-9 w-8 place-items-center rounded-xl text-brand-ink/20 transition group-hover:text-brand-ink/45 hover:bg-brand-ink/[0.04] hover:text-brand-ink focus:outline-none"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileUserCard({
  user,
  currentUserId,
  isUpdatingStatus,
  onEdit,
  onToggleStatus,
}: {
  user: AdminManagedUser;
  currentUserId: number | null;
  isUpdatingStatus: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const isCurrentUser = user.id === currentUserId;

  return (
    <article className="overflow-hidden rounded-[1.3rem] border border-brand-ink/10 bg-white/55 shadow-[0_10px_28px_rgba(55,38,25,0.04)] backdrop-blur">
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-white/55"
      >
        <Avatar name={user.name} active={user.is_active} large />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-[15px] font-semibold text-brand-ink">
                  {user.name}
                </h3>

                {isCurrentUser && (
                  <span className="rounded-full border border-brand-ink/10 bg-brand-ink/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-ink/45">
                    You
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-brand-ink/30">
                Account #{user.id}
              </p>
            </div>

            <ChevronRight
              size={17}
              className="mt-0.5 shrink-0 text-brand-ink/25"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge
              label={getUserRoleLabel(user)}
              isStaff={user.is_staff}
            />

            <StatusBadge active={user.is_active} compact />
          </div>
        </div>
      </button>

      <div className="border-t border-brand-ink/[0.07] px-4 py-3">
        <div className="space-y-2">
          <ContactRow
            icon={<Mail size={13} />}
            value={user.email || "No email address"}
          />

          <ContactRow
            icon={<Phone size={13} />}
            value={user.phone || "No phone number"}
          />

          {user.default_delivery_address && (
            <ContactRow
              icon={<MapPin size={13} />}
              value={user.default_delivery_address}
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
            {formatDate(user.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/60 px-3 text-xs font-semibold text-brand-ink/60 transition hover:bg-white hover:text-brand-ink"
          >
            <Pencil size={13} />
            Edit
          </button>

          <button
            type="button"
            disabled={
              isUpdatingStatus ||
              (isCurrentUser && user.is_active)
            }
            onClick={onToggleStatus}
            className={[
              "inline-flex h-9 min-w-[94px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30",
              user.is_active
                ? "border-red-100 bg-red-50/60 text-red-600 hover:bg-red-50"
                : "border-emerald-100 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-50",
            ].join(" ")}
          >
            {isUpdatingStatus ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Saving
              </>
            ) : user.is_active ? (
              <>
                <XCircle size={13} />
                Disable
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                Activate
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function ConfirmationModal({
  title,
  description,
  confirmLabel,
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={loading ? undefined : onCancel}
        className="absolute inset-0 bg-brand-ink/30 backdrop-blur-[3px]"
      />

      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[1.5rem] border border-brand-ink/10 bg-brand-bg shadow-[0_30px_90px_rgba(55,38,25,0.24)]">
        <div className="p-5 sm:p-6">
          <div
            className={[
              "grid h-11 w-11 place-items-center rounded-2xl",
              danger
                ? "bg-red-500/10 text-red-600"
                : "bg-brand-ink/[0.06] text-brand-ink/60",
            ].join(" ")}
          >
            {danger ? (
              <XCircle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/35">
            Confirmation
          </p>

          <h2
            id="confirmation-modal-title"
            className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-ink"
          >
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-brand-ink/52">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-brand-ink/10 bg-white/30 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-xl border border-brand-ink/10 bg-white/50 px-4 text-xs font-semibold text-brand-ink/55 transition hover:bg-white hover:text-brand-ink disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              "inline-flex h-10 min-w-[112px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50",
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-brand-ink text-brand-bg hover:-translate-y-0.5",
            ].join(" ")}
          >
            {loading && (
              <RefreshCw size={13} className="animate-spin" />
            )}

            {loading ? "Updating..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
        last ? "lg:border-r-0" : "",
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
        ].join(" ")}
      >
        {initials(name)}
      </div>

      <span
        className={[
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white",
          large ? "h-3.5 w-3.5" : "h-3 w-3",
          active ? "bg-emerald-500" : "bg-red-400",
        ].join(" ")}
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
        {isStaff ? "Staff" : "Customer"}
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
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-red-400",
        ].join(" ")}
      />

      {active ? "Active" : "Inactive"}
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
      <span className="mt-0.5 shrink-0">{icon}</span>

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
      <span className="max-w-[200px] truncate">{label}</span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-brand-ink/35 transition hover:bg-brand-ink/[0.07] hover:text-brand-ink"
      >
        <X size={11} />
      </button>
    </span>
  );
}

function Pagination({
  pagination,
  disabled = false,
  onPageChange,
}: {
  pagination: AdminUsersPagination;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  const firstItem =
    pagination.total === 0
      ? 0
      : (pagination.current_page - 1) * pagination.per_page + 1;

  const lastItem = Math.min(
    pagination.current_page * pagination.per_page,
    pagination.total,
  );

  return (
    <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] font-medium text-brand-ink/40">
        Showing{" "}
        <span className="font-semibold text-brand-ink/65">
          {firstItem}–{lastItem}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-brand-ink/65">
          {pagination.total}
        </span>{" "}
        accounts
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          disabled={disabled || pagination.current_page <= 1}
          onClick={() => onPageChange(pagination.current_page - 1)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/45 px-3 text-xs font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft size={13} />
          Previous
        </button>

        <span className="min-w-[70px] text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-ink/35">
          {pagination.current_page} / {pagination.last_page}
        </span>

        <button
          type="button"
          disabled={disabled || !pagination.has_more}
          onClick={() => onPageChange(pagination.current_page + 1)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/45 px-3 text-xs font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ArrowRight size={13} />
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
  type: "error" | "success";
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={[
        "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3.5 text-sm shadow-sm",
        type === "error"
          ? "border-red-200/80 bg-red-50/80 text-red-700"
          : "border-emerald-200/80 bg-emerald-50/80 text-emerald-800",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {type === "error" ? (
          <XCircle size={16} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        )}

        <span className="font-medium leading-5">{children}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-45 transition hover:bg-black/[0.04] hover:opacity-100"
      >
        <X size={13} />
      </button>
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
        <UsersRound size={22} />
      </div>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/30">
        User directory
      </p>

      <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-brand-ink">
        {hasFilters ? "No matching users" : "No users yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-brand-ink/45">
        {hasFilters
          ? "No accounts match the current search and filters. Adjust them to see more results."
          : "User accounts will appear here once they have been created."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-brand-ink/10 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-ink/60 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function LoadingState({ text }: { text: string }) {
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

function UserTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur"
      aria-label="Loading users"
    >
      <div className="hidden md:block">
        <div className="grid grid-cols-[1.45fr_1.45fr_.8fr_.75fr_1fr_.7fr_100px] gap-4 border-b border-brand-ink/10 bg-brand-bg/25 px-4 py-3.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonLine
              key={index}
              className={index === 6 ? "ml-auto w-14" : "w-16"}
            />
          ))}
        </div>

        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1.45fr_1.45fr_.8fr_.75fr_1fr_.7fr_100px] items-center gap-4 border-b border-brand-ink/[0.06] px-4 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-xl" />

              <div className="min-w-0 flex-1">
                <SkeletonLine className="w-28" />
                <SkeletonLine className="mt-2 w-12" />
              </div>
            </div>

            <div>
              <SkeletonLine className="w-36" />
              <SkeletonLine className="mt-2 w-24" />
            </div>

            <SkeletonBlock className="h-7 w-20 rounded-full" />
            <SkeletonBlock className="h-7 w-16 rounded-full" />

            <div>
              <SkeletonLine className="w-24" />
              <SkeletonLine className="mt-2 w-20" />
            </div>

            <SkeletonLine className="w-20" />

            <div className="flex justify-end gap-2">
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.2rem] border border-brand-ink/[0.07] bg-white/35 p-4"
          >
            <div className="flex gap-3">
              <SkeletonBlock className="h-12 w-12 rounded-xl" />

              <div className="flex-1">
                <SkeletonLine className="w-32" />
                <SkeletonLine className="mt-2 w-16" />

                <div className="mt-3 flex gap-2">
                  <SkeletonBlock className="h-7 w-20 rounded-full" />
                  <SkeletonBlock className="h-7 w-16 rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-brand-ink/[0.06] pt-4">
              <SkeletonLine className="w-44" />
              <SkeletonLine className="mt-2 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-2.5 animate-pulse rounded-full bg-brand-ink/[0.07] ${className}`}
    />
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-brand-ink/[0.07] ${className}`}
    />
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/35">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-3.5 align-middle">
      {children}
    </td>
  );
}

function userToForm(user: AdminManagedUser): UserForm {
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
    role: user.role_id ?? getUserRoleId(user.role),
    isActive: user.is_active,
    password: "",
    confirmPassword: "",
    permissionProfileIds: profileIds,
    permissionOverrides: overrides,
  };
}

function formsEqual(first: UserForm, second: UserForm): boolean {
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

  const firstKeys = Object.keys(firstOverrides).sort(
    (a, b) => Number(a) - Number(b),
  );

  const secondKeys = Object.keys(secondOverrides).sort(
    (a, b) => Number(a) - Number(b),
  );

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

function normalizePermissionOverrides(
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

function validateUserForm(
  form: UserForm,
  selectedRole: AdminUserRole | null,
  isEditing: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const defaultDeliveryAddress = form.defaultDeliveryAddress.trim();

  if (!name) {
    errors.name = "Enter the user's full name.";
  } else if (name.length > 150) {
    errors.name = "Name cannot exceed 150 characters.";
  }

  if (form.role === null) {
    errors.role = "Select an account role.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phone.length > 30) {
    errors.phone = "Phone number cannot exceed 30 characters.";
  }

  if (defaultDeliveryAddress.length > 1000) {
    errors.defaultDeliveryAddress =
      "Delivery address cannot exceed 1000 characters.";
  }

  /*
   * Do not infer staff status from role names/codes here.
   * The Laravel backend remains authoritative for role-specific
   * requirements such as mandatory staff email/password.
   *
   * If AdminUserRole later exposes an explicit is_staff boolean,
   * this validation can safely use it.
   */
  const roleIsExplicitlyStaff = isExplicitStaffRole(selectedRole);

  if (roleIsExplicitlyStaff && !email) {
    errors.email = "Staff accounts require an email address.";
  }

  if (!isEditing && roleIsExplicitlyStaff && !form.password) {
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

function mapLaravelFieldErrors(error: unknown): FieldErrors {
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
    default_delivery_address: "defaultDeliveryAddress",
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initials(name: string): string {
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

function formatDate(value: string | null): string {
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

function getErrorMessage(
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

function getRoleValue(role: AdminUserRole): number {
  if ("value" in role && typeof role.value === "number") {
    return role.value;
  }

  if ("id" in role && typeof role.id === "number") {
    return role.id;
  }

  throw new Error(
    "Admin role does not contain a numeric identifier.",
  );
}

function getRoleLabel(role: AdminUserRole): string {
  if ("label" in role && typeof role.label === "string") {
    return role.label;
  }

  if ("name" in role && typeof role.name === "string") {
    return role.name;
  }

  return `Role ${getRoleValue(role)}`;
}

function getUserRoleLabel(user: AdminManagedUser): string {
  if (
    "role_label" in user &&
    typeof user.role_label === "string" &&
    user.role_label.trim()
  ) {
    return user.role_label;
  }

  if (
    user.role &&
    typeof user.role === "object" &&
    "name" in user.role &&
    typeof user.role.name === "string"
  ) {
    return user.role.name;
  }

  if (
    user.role &&
    typeof user.role === "object" &&
    "label" in user.role &&
    typeof user.role.label === "string"
  ) {
    return user.role.label;
  }

  return "Unassigned";
}

function isExplicitStaffRole(
  role: AdminUserRole | null,
): boolean {
  if (!role || typeof role !== "object") {
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

  if (role && typeof role === "object") {
    if ("id" in role && typeof role.id === "number") {
      return role.id;
    }

    if ("value" in role && typeof role.value === "number") {
      return role.value;
    }
  }

  return null;
}