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
  Sparkles,
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
  createAdminPermissionProfile,
  getAdminPermissionProfile,
  getAdminPermissionProfiles,
  updateAdminPermissionProfile,
  type AdminPermission,
  type AdminPermissionProfile,
} from "../lib/adminPermissionProfilesApi";

import {
  useAuthSession,
} from "../lib/useAuthSession";

const ACCESS_PERMISSION =
  "website-admin.permission-profiles.manage";

type ProfileForm = {
  id: number | null;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: string[];
};

const EMPTY_FORM: ProfileForm = {
  id: null,
  name: "",
  description: "",
  isActive: true,
  isSystem: false,
  permissions: [],
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

  const canManageAccess =
    hasPermission(
      ACCESS_PERMISSION,
    );

  const [
    profiles,
    setProfiles,
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
    selectedProfileId,
    setSelectedProfileId,
  ] = useState<
    number | null
  >(null);

  const [
    form,
    setForm,
  ] = useState<ProfileForm>(
    EMPTY_FORM,
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    isLoadingProfile,
    setIsLoadingProfile,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
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

  /*
   * Every profile request receives an incrementing ID.
   *
   * This prevents an older request from overwriting a newer
   * profile selection if the user changes profiles quickly.
   */
  const profileRequestIdRef =
    useRef(0);

  const selectedProfile =
    useMemo(
      () =>
        profiles.find(
          (profile) =>
            profile.id ===
            selectedProfileId,
        ) ?? null,
      [
        profiles,
        selectedProfileId,
      ],
    );

  const groupedPermissions =
    useMemo(
      () =>
        groupPermissions(
          permissions,
        ),
      [permissions],
    );

  const filteredProfiles =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return profiles;
      }

      return profiles.filter(
        (profile) => {
          return [
            profile.name,
            profile.description ?? "",
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      profiles,
      search,
    ]);

  const isCreating =
    form.id === null;

  const isDirty =
    originalSnapshot !== "" &&
    snapshotForm(form) !==
      originalSnapshot;

  const enabledPermissionCount =
    form.permissions.length;

  const activeProfileCount =
    useMemo(
      () =>
        profiles.filter(
          (profile) =>
            profile.is_active,
        ).length,
      [profiles],
    );

  const systemProfileCount =
    useMemo(
      () =>
        profiles.filter(
          (profile) =>
            profile.is_system,
        ).length,
      [profiles],
    );

  /*
   * IMPORTANT:
   *
   * selectedProfileId is deliberately NOT a dependency of this
   * callback.
   *
   * Previously changing selectedProfileId recreated loadProfiles(),
   * which retriggered the loading useEffect and selected the first
   * profile again.
   */
  const loadProfiles =
    useCallback(
      async (
        options?: {
          refreshing?: boolean;
          preserveSelection?: boolean;
          selectedId?: number | null;
        },
      ) => {
        if (!canManageAccess) {
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
            await getAdminPermissionProfiles();

          setProfiles(
            result.profiles,
          );

          setPermissions(
            result.permissions,
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
              result.profiles.find(
                (profile) =>
                  profile.id ===
                  requestedSelectedId,
              );

            if (current) {
              const nextForm =
                profileToForm(
                  current,
                );

              setSelectedProfileId(
                current.id,
              );

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
          }

          const firstProfile =
            result.profiles[0];

          if (firstProfile) {
            setSelectedProfileId(
              firstProfile.id,
            );

            const nextForm =
              profileToForm(
                firstProfile,
              );

            setForm(
              nextForm,
            );

            setOriginalSnapshot(
              snapshotForm(
                nextForm,
              ),
            );
          } else {
            const nextForm: ProfileForm =
              {
                ...EMPTY_FORM,
                permissions: [],
              };

            setSelectedProfileId(
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
              "Could not load access management.",
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
        canManageAccess,
      ],
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

    if (!canManageAccess) {
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
    canManageAccess,
    navigate,
  ]);

  useEffect(() => {
    if (
      isAuthLoading ||
      !isAuthenticated ||
      !canAccessWebsiteAdmin ||
      !canManageAccess
    ) {
      return;
    }

    void loadProfiles();
  }, [
    isAuthLoading,
    isAuthenticated,
    canAccessWebsiteAdmin,
    canManageAccess,
    loadProfiles,
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
      "You have unsaved access changes. Discard them?",
    );
  }

  async function selectProfile(
    profile:
      AdminPermissionProfile,
  ) {
    if (
      profile.id ===
      selectedProfileId
    ) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    const requestId =
      ++profileRequestIdRef.current;

    setSelectedProfileId(
      profile.id,
    );

    setErrorText("");
    setSuccessText("");

    setIsLoadingProfile(
      true,
    );

    const immediateForm =
      profileToForm(
        profile,
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
        await getAdminPermissionProfile(
          profile.id,
        );

      /*
       * Ignore this response when another profile request
       * has been started after it.
       */
      if (
        requestId !==
        profileRequestIdRef.current
      ) {
        return;
      }

      setPermissions(
        result.permissions,
      );

      setProfiles(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              result.profile.id
                ? result.profile
                : item,
          ),
      );

      const nextForm =
        profileToForm(
          result.profile,
        );

      setSelectedProfileId(
        result.profile.id,
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
        profileRequestIdRef.current
      ) {
        return;
      }

      setErrorText(
        getErrorMessage(
          error,
          "Could not load this permission profile.",
        ),
      );
    } finally {
      if (
        requestId ===
        profileRequestIdRef.current
      ) {
        setIsLoadingProfile(
          false,
        );
      }
    }
  }

  function startCreate() {
    if (!confirmDiscard()) {
      return;
    }

    /*
     * Invalidate any currently running profile request so an old
     * response cannot replace the new-profile form.
     */
    ++profileRequestIdRef.current;

    setIsLoadingProfile(
      false,
    );

    const nextForm: ProfileForm =
      {
        ...EMPTY_FORM,
        permissions: [],
      };

    setSelectedProfileId(
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

  function duplicateProfile() {
    if (
      !selectedProfile
    ) {
      return;
    }

    if (!confirmDiscard()) {
      return;
    }

    ++profileRequestIdRef.current;

    setIsLoadingProfile(
      false,
    );

    const nextForm: ProfileForm =
      {
        id: null,

        name:
          `${selectedProfile.name} Copy`,

        description:
          selectedProfile.description ??
          "",

        isActive: true,
        isSystem: false,

        permissions:
          [
            ...selectedProfile.permissions,
          ],
      };

    setSelectedProfileId(
      null,
    );

    setForm(
      nextForm,
    );

    /*
     * Intentionally compare the duplicate against EMPTY_FORM so
     * the duplicated profile is immediately considered unsaved.
     */
    setOriginalSnapshot(
      snapshotForm(
        EMPTY_FORM,
      ),
    );

    setErrorText("");
    setSuccessText("");
  }

  function togglePermission(
    permissionKey: string,
  ) {
    setForm(
      (current) => {
        const exists =
          current.permissions.includes(
            permissionKey,
          );

        return {
          ...current,

          permissions:
            exists
              ? current.permissions.filter(
                  (key) =>
                    key !==
                    permissionKey,
                )
              : [
                  ...current.permissions,
                  permissionKey,
                ].sort(),
        };
      },
    );
  }

  function setGroupPermissions(
    group:
      PermissionGroup,
    enabled: boolean,
  ) {
    setForm(
      (current) => {
        const currentSet =
          new Set(
            current.permissions,
          );

        for (
          const permission
          of group.permissions
        ) {
          if (enabled) {
            currentSet.add(
              permission.key,
            );
          } else {
            currentSet.delete(
              permission.key,
            );
          }
        }

        return {
          ...current,

          permissions:
            Array.from(
              currentSet,
            ).sort(),
        };
      },
    );
  }

  function setAllPermissions(
    enabled: boolean,
  ) {
    setForm(
      (current) => ({
        ...current,

        permissions:
          enabled
            ? permissions
                .map(
                  (permission) =>
                    permission.key,
                )
                .sort()
            : [],
      }),
    );
  }

  function resetForm() {
    if (
      form.id === null
    ) {
      const nextForm: ProfileForm =
        {
          ...EMPTY_FORM,
          permissions: [],
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

    const profile =
      profiles.find(
        (item) =>
          item.id ===
          form.id,
      );

    if (!profile) {
      return;
    }

    const nextForm =
      profileToForm(
        profile,
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

    setErrorText("");
    setSuccessText("");

    const name =
      form.name.trim();

    if (!name) {
      setErrorText(
        "Enter a profile name.",
      );

      return;
    }

    setIsSaving(
      true,
    );

    try {
      let savedProfile:
        AdminPermissionProfile;

      if (
        form.id === null
      ) {
        savedProfile =
          await createAdminPermissionProfile(
            {
              name,

              description:
                form.description,

              is_active:
                form.isActive,

              permissions:
                form.permissions,
            },
          );

        setSuccessText(
          "Permission profile created successfully.",
        );
      } else {
        savedProfile =
          await updateAdminPermissionProfile(
            form.id,
            {
              name,

              description:
                form.description,

              is_active:
                form.isActive,

              permissions:
                form.permissions,
            },
          );

        setSuccessText(
          "Access permissions saved successfully.",
        );
      }

      setProfiles(
        (current) => {
          const exists =
            current.some(
              (profile) =>
                profile.id ===
                savedProfile.id,
            );

          const next =
            exists
              ? current.map(
                  (profile) =>
                    profile.id ===
                    savedProfile.id
                      ? savedProfile
                      : profile,
                )
              : [
                  ...current,
                  savedProfile,
                ];

          return next.sort(
            sortProfiles,
          );
        },
      );

      setSelectedProfileId(
        savedProfile.id,
      );

      const nextForm =
        profileToForm(
          savedProfile,
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
          "Could not save this permission profile.",
        ),
      );
    } finally {
      setIsSaving(
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
    !canManageAccess
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
                Access management
              </h1>

              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-brand-ink/58 sm:text-[15px]">
                Configure reusable permission
                profiles for website administration,
                ERP and POS access.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  void loadProfiles({
                    refreshing: true,
                    preserveSelection:
                      true,
                    selectedId:
                      selectedProfileId,
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
                <Plus size={17} />
                New profile
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
                <ShieldCheck
                  size={18}
                />
              }
              value={
                profiles.length
              }
              label="Profiles"
            />

            <Metric
              icon={
                <CircleDot
                  size={18}
                />
              }
              value={
                activeProfileCount
              }
              label="Active"
            />

            <Metric
              icon={
                <LockKeyhole
                  size={18}
                />
              }
              value={
                permissions.length
              }
              label="Permissions"
            />

            <Metric
              icon={
                <Sparkles
                  size={18}
                />
              }
              value={
                systemProfileCount
              }
              label="System profiles"
              last
            />
          </div>
        </section>

        {isLoading ? (
          <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-sm backdrop-blur">
            <LoadingState
              text="Loading access profiles..."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="self-start overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur xl:sticky xl:top-5">
              <div className="border-b border-brand-ink/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-ink/30">
                      Access profiles
                    </p>

                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-brand-ink">
                      Permission sets
                    </h2>
                  </div>

                  <span className="rounded-full border border-brand-ink/10 bg-white/55 px-2.5 py-1 text-[10px] font-semibold text-brand-ink/45">
                    {profiles.length}
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
                    placeholder="Search profiles..."
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
              </div>

              <div className="max-h-[640px] overflow-y-auto p-2">
                {filteredProfiles.length ===
                0 ? (
                  <div className="px-4 py-10 text-center">
                    <Shield
                      size={
                        22
                      }
                      className="mx-auto text-brand-ink/25"
                    />

                    <p className="mt-3 text-xs font-semibold text-brand-ink/55">
                      No profiles
                      found
                    </p>
                  </div>
                ) : (
                  filteredProfiles.map(
                    (
                      profile,
                    ) => (
                      <ProfileListItem
                        key={
                          profile.id
                        }
                        profile={
                          profile
                        }
                        selected={
                          profile.id ===
                          selectedProfileId
                        }
                        onClick={() =>
                          void selectProfile(
                            profile,
                          )
                        }
                      />
                    ),
                  )
                )}
              </div>

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
                  Create permission
                  profile
                </button>
              </div>
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
                            ? "New access profile"
                            : "Permission profile"}
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

                        {isDirty && (
                          <span className="rounded-full border border-amber-200/70 bg-amber-50/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-700">
                            Unsaved
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1.5 truncate text-2xl font-semibold tracking-[-0.035em] text-brand-ink">
                        {isCreating
                          ? form.name ||
                            "Create profile"
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
                          selectedProfile && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-brand-ink/20" />

                              <span className="inline-flex items-center gap-1">
                                <UsersRound
                                  size={
                                    11
                                  }
                                />

                                {
                                  selectedProfile.users_count
                                }{" "}
                                user
                                {selectedProfile.users_count ===
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
                      </div>
                    </div>

                    {!isCreating &&
                      selectedProfile && (
                        <button
                          type="button"
                          onClick={
                            duplicateProfile
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
                  </div>
                </div>

                {isLoadingProfile ? (
                  <LoadingState
                    text="Loading profile..."
                  />
                ) : (
                  <>
                    <div className="px-5 py-6 sm:px-6">
                      <FormSection
                        eyebrow="Profile"
                        title="Profile details"
                        description="Give this reusable access profile a clear name and description."
                      >
                        <div className="grid gap-4 lg:grid-cols-2">
                          <Field
                            label="Profile name"
                            required
                          >
                            <input
                              value={
                                form.name
                              }
                              disabled={
                                form.isSystem
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

                          <div className="flex items-end">
                            <div
                              className={[
                                "flex min-h-11 w-full items-center justify-between gap-4 rounded-2xl border px-3.5 py-2.5",
                                form.isActive
                                  ? "border-brand-ink/10 bg-white/50"
                                  : "border-red-100 bg-red-50/45",
                                form.isSystem
                                  ? "opacity-65"
                                  : "",
                              ].join(
                                " ",
                              )}
                            >
                              <div>
                                <p className="text-xs font-semibold text-brand-ink/70">
                                  Profile
                                  active
                                </p>

                                <p className="mt-0.5 text-[10px] text-brand-ink/38">
                                  {form.isSystem
                                    ? "System profiles remain active."
                                    : "Inactive profiles are not used for active profile access."}
                                </p>
                              </div>

                              <Toggle
                                checked={
                                  form.isActive
                                }
                                disabled={
                                  form.isSystem
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
                          </div>
                        </div>

                        <div className="mt-4">
                          <Field label="Description">
                            <textarea
                              value={
                                form.description
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
                              placeholder="Explain who should receive this access profile..."
                            />
                          </Field>
                        </div>
                      </FormSection>

                      <FormSection
                        eyebrow="Permissions"
                        title="Allowed capabilities"
                        description="Select the capabilities users receive when this permission profile is assigned to them."
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
                                  permissions.length
                                }{" "}
                                enabled
                              </p>

                              <p className="mt-0.5 text-[10px] leading-4 text-brand-ink/38">
                                Profile
                                permissions
                                combine with
                                any
                                user-specific
                                overrides.
                              </p>
                            </div>
                          </div>

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
                        </div>

                        <div className="space-y-3">
                          {groupedPermissions.map(
                            (
                              group,
                            ) => {
                              const enabled =
                                group.permissions.filter(
                                  (
                                    permission,
                                  ) =>
                                    form.permissions.includes(
                                      permission.key,
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
                                    group.key
                                  }
                                  group={
                                    group
                                  }
                                  selectedKeys={
                                    form.permissions
                                  }
                                  allEnabled={
                                    allEnabled
                                  }
                                  enabledCount={
                                    enabled
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
                              You have
                              unsaved
                              changes.
                            </p>
                          ) : (
                            <p className="text-[10px] font-medium text-brand-ink/35">
                              No unsaved
                              changes.
                            </p>
                          )}
                        </div>

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
                                ? "Create profile"
                                : "Save changes"}
                          </button>
                        </div>
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

type PermissionGroup = {
  key: string;
  label: string;
  permissions:
    AdminPermission[];
};

function PermissionGroupCard({
  group,
  selectedKeys,
  allEnabled,
  enabledCount,
  onTogglePermission,
  onToggleAll,
}: {
  group: PermissionGroup;
  selectedKeys: string[];
  allEnabled: boolean;
  enabledCount: number;
  onTogglePermission: (
    key: string,
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
              {group.label}
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
      </div>

      <div className="grid gap-px bg-brand-ink/[0.055] md:grid-cols-2">
        {group.permissions.map(
          (
            permission,
          ) => {
            const checked =
              selectedKeys.includes(
                permission.key,
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
                onChange={() =>
                  onTogglePermission(
                    permission.key,
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
  onChange,
}: {
  permission:
    AdminPermission;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={
        checked
      }
      onClick={
        onChange
      }
      className={[
        "group flex min-h-[92px] items-start gap-3 bg-white/55 p-4 text-left transition",
        checked
          ? "bg-white/80"
          : "hover:bg-white/72",
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

function ProfileListItem({
  profile,
  selected,
  onClick,
}: {
  profile:
    AdminPermissionProfile;
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
        {profile.is_system ? (
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
            {profile.name}
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
              profile.permissions
                .length
            }{" "}
            permissions
          </span>

          <span>•</span>

          <span>
            {
              profile.users_count
            }{" "}
            users
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.is_system && (
            <MiniBadge
              selected={
                selected
              }
            >
              System
            </MiniBadge>
          )}

          <MiniBadge
            selected={
              selected
            }
            muted={
              !profile.is_active
            }
          >
            {profile.is_active
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

function Toggle({
  checked,
  disabled = false,
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
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] grid h-5 w-5 place-items-center rounded-full bg-brand-bg shadow-sm transition-all duration-200",
          checked
            ? "left-[23px]"
            : "left-[3px]",
        ].join(" ")}
      >
        {checked && (
          <Check
            size={10}
            strokeWidth={3}
            className="text-brand-ink"
          />
        )}
      </span>
    </button>
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

function groupPermissions(
  permissions:
    AdminPermission[],
): PermissionGroup[] {
  const groups =
    new Map<
      string,
      AdminPermission[]
    >();

  for (
    const permission
    of permissions
  ) {
    const groupKey =
      permission.group?.trim() ||
      "Other";

    const current =
      groups.get(
        groupKey,
      ) ?? [];

    current.push(
      permission,
    );

    groups.set(
      groupKey,
      current,
    );
  }

  return Array.from(
    groups.entries(),
  )
    .map(
      ([
        key,
        groupPermissions,
      ]) => ({
        key,

        label:
          formatGroupName(
            key,
          ),

        permissions:
          [...groupPermissions].sort(
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
              ),
          ),
      }),
    )
    .sort(
      (
        first,
        second,
      ) =>
        first.label.localeCompare(
          second.label,
        ),
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

function profileToForm(
  profile:
    AdminPermissionProfile,
): ProfileForm {
  return {
    id: profile.id,
    name: profile.name,

    description:
      profile.description ??
      "",

    isActive:
      profile.is_active,

    isSystem:
      profile.is_system,

    permissions:
      [
        ...profile.permissions,
      ].sort(),
  };
}

function snapshotForm(
  form: ProfileForm,
) {
  return JSON.stringify({
    id: form.id,

    name:
      form.name.trim(),

    description:
      form.description.trim(),

    isActive:
      form.isActive,

    isSystem:
      form.isSystem,

    permissions:
      [
        ...form.permissions,
      ].sort(),
  });
}

function sortProfiles(
  first:
    AdminPermissionProfile,
  second:
    AdminPermissionProfile,
) {
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