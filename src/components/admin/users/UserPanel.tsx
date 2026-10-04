/** @format */

import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useMemo,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

import type {
  AdminPermission,
  AdminPermissionProfile,
  AdminUserRole,
} from "../../../lib/adminUsersApi";

import {
  getPasswordStrength,
  getRoleLabel,
  getRoleValue,
  isStaffRole,
} from "../../../lib/adminUserUtils";

import type {
  FieldErrors,
  UserForm,
} from "../../../types/adminUsers";

import UserPermissions from "./UserPermissions";

type UserPanelProps = {
  form: UserForm;
  setForm: Dispatch<SetStateAction<UserForm>>;
  roles: AdminUserRole[];
  permissionProfiles: AdminPermissionProfile[];
  permissions: AdminPermission[];
  selectedRole: AdminUserRole | null;
  isEditing: boolean;
  isSaving: boolean;
  isLoadingUser: boolean;
  errorText: string;
  fieldErrors: FieldErrors;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  currentUserId: number | null;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
  permissionSearch: string;
  setPermissionSearch: Dispatch<SetStateAction<string>>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function UserPanel({
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
  fieldErrors,
  setFieldErrors,
  currentUserId,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  permissionSearch,
  setPermissionSearch,
  closeButtonRef,
  onClose,
  onSubmit,
}: UserPanelProps) {
  const editingSelf =
    form.id !== null && form.id === currentUserId;

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  function updateField<K extends keyof UserForm>(
    key: K,
    value: UserForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const staffRole = isStaffRole(selectedRole);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-editor-title"
    >
      <button
        type="button"
        aria-label="Close user editor"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-brand-ink/25 backdrop-blur-[3px]"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full flex-col bg-brand-bg shadow-[-24px_0_70px_rgba(55,38,25,0.18)] sm:my-3 sm:mr-3 sm:max-w-[720px] sm:overflow-hidden sm:rounded-[1.6rem] sm:border sm:border-brand-ink/10">
        <PanelHeader
          form={form}
          selectedRole={selectedRole}
          isEditing={isEditing}
          isSaving={isSaving}
          closeButtonRef={closeButtonRef}
          onClose={onClose}
        />

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {errorText && (
              <div className="mb-5">
                <InlineError>{errorText}</InlineError>
              </div>
            )}

            {isLoadingUser && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-brand-ink/10 bg-white/45 px-4 py-3 text-xs font-medium text-brand-ink/45">
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
                Loading account access...
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
                  error={fieldErrors.name}
                >
                  <input
                    value={form.name}
                    onChange={(event) => {
                      updateField("name", event.target.value);
                      clearFieldError("name");
                    }}
                    className={getFieldClassName(
                      Boolean(fieldErrors.name),
                    )}
                    placeholder="Full name"
                    autoComplete="name"
                    maxLength={150}
                    aria-invalid={
                      fieldErrors.name ? true : undefined
                    }
                  />
                </Field>

                <Field
                  label="Account role"
                  required
                  error={fieldErrors.role}
                >
                  <select
                    value={form.role ?? ""}
                    onChange={(event) => {
                      updateField(
                        "role",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      );

                      clearFieldError("role");
                    }}
                    className={getFieldClassName(
                      Boolean(fieldErrors.role),
                    )}
                    aria-invalid={
                      fieldErrors.role ? true : undefined
                    }
                  >
                    <option value="" disabled>
                      Select role
                    </option>

                    {roles.map((role) => {
                      const value = getRoleValue(role);

                      return (
                        <option key={value} value={value}>
                          {getRoleLabel(role)}
                        </option>
                      );
                    })}
                  </select>
                </Field>
              </div>

              {selectedRole && (
                <div className="mt-4 rounded-2xl border border-brand-ink/[0.08] bg-white/45 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-ink/[0.055] text-brand-ink/55">
                      <ShieldCheck size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-brand-ink/75">
                        {getRoleLabel(selectedRole)}
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-brand-ink/45">
                        {staffRole
                          ? "This is a staff account. Administration access is controlled by the permission profiles and individual rules below."
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
                  required={staffRole}
                  error={fieldErrors.email}
                >
                  <div className="relative">
                    <Mail
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => {
                        updateField(
                          "email",
                          event.target.value,
                        );
                        clearFieldError("email");
                      }}
                      className={`${getFieldClassName(
                        Boolean(fieldErrors.email),
                      )} pl-10`}
                      placeholder="name@example.com"
                      autoComplete="email"
                      aria-invalid={
                        fieldErrors.email ? true : undefined
                      }
                    />
                  </div>
                </Field>

                <Field
                  label="Phone number"
                  error={fieldErrors.phone}
                >
                  <div className="relative">
                    <Phone
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                    />

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => {
                        updateField(
                          "phone",
                          event.target.value,
                        );
                        clearFieldError("phone");
                      }}
                      className={`${getFieldClassName(
                        Boolean(fieldErrors.phone),
                      )} pl-10`}
                      placeholder="07X XXX XXXX"
                      autoComplete="tel"
                      maxLength={30}
                      aria-invalid={
                        fieldErrors.phone ? true : undefined
                      }
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Default delivery address">
                  <div className="relative">
                    <MapPin
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-3.5 text-brand-ink/30"
                    />

                    <textarea
                      value={form.defaultDeliveryAddress}
                      onChange={(event) =>
                        updateField(
                          "defaultDeliveryAddress",
                          event.target.value,
                        )
                      }
                      className={`${getFieldClassName(
                        false,
                      )} min-h-[96px] resize-y py-3 pl-10`}
                      placeholder="Optional delivery address"
                      autoComplete="street-address"
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
                  ? "Leave the password fields empty unless this account needs new login credentials."
                  : "Configure login credentials for this account."
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    isEditing ? "New password" : "Password"
                  }
                  required={!isEditing && staffRole}
                  error={fieldErrors.password}
                >
                  <div className="relative">
                    <KeyRound
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                    />

                    <input
                      type={
                        showPassword ? "text" : "password"
                      }
                      value={form.password}
                      onChange={(event) => {
                        updateField(
                          "password",
                          event.target.value,
                        );

                        clearFieldError("password");
                        clearFieldError("confirmPassword");
                      }}
                      className={`${getFieldClassName(
                        Boolean(fieldErrors.password),
                      )} pl-10 pr-11`}
                      placeholder={
                        isEditing
                          ? "Leave empty to keep current"
                          : "Minimum 8 characters"
                      }
                      autoComplete="new-password"
                      aria-invalid={
                        fieldErrors.password
                          ? true
                          : undefined
                      }
                    />

                    <PasswordVisibilityButton
                      visible={showPassword}
                      onClick={() =>
                        setShowPassword(
                          (current) => !current,
                        )
                      }
                    />
                  </div>
                </Field>

                <Field
                  label="Confirm password"
                  required={Boolean(form.password)}
                  error={fieldErrors.confirmPassword}
                >
                  <div className="relative">
                    <LockKeyhole
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/30"
                    />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={form.confirmPassword}
                      onChange={(event) => {
                        updateField(
                          "confirmPassword",
                          event.target.value,
                        );

                        clearFieldError("confirmPassword");
                      }}
                      className={`${getFieldClassName(
                        Boolean(
                          fieldErrors.confirmPassword,
                        ),
                      )} pl-10 pr-11`}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      disabled={!form.password}
                      aria-invalid={
                        fieldErrors.confirmPassword
                          ? true
                          : undefined
                      }
                    />

                    <PasswordVisibilityButton
                      visible={showConfirmPassword}
                      disabled={!form.password}
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current,
                        )
                      }
                    />
                  </div>
                </Field>
              </div>

              {form.password ? (
                <PasswordStrength
                  score={passwordStrength.score}
                  label={passwordStrength.label}
                />
              ) : (
                <p className="mt-2 text-[11px] leading-5 text-brand-ink/38">
                  {isEditing
                    ? "The existing password remains unchanged when these fields are left empty."
                    : staffRole
                      ? "Staff accounts require a password containing at least 8 characters."
                      : "A password is optional for this account type."}
                </p>
              )}
            </FormSection>

            <UserPermissions
              form={form}
              setForm={setForm}
              permissionProfiles={permissionProfiles}
              permissions={permissions}
              permissionSearch={permissionSearch}
              setPermissionSearch={setPermissionSearch}
            />

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
                  editingSelf ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        form.isActive
                          ? "bg-emerald-500"
                          : "bg-red-400",
                      ].join(" ")}
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
                  checked={form.isActive}
                  disabled={editingSelf}
                  onChange={(checked) =>
                    updateField("isActive", checked)
                  }
                />
              </div>
            </FormSection>
          </div>

          <div className="shrink-0 border-t border-brand-ink/10 bg-brand-bg/95 px-5 py-4 backdrop-blur sm:px-7">
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-medium text-brand-ink/35">
                {isSaving
                  ? "Saving account changes..."
                  : "Changes are applied after saving."}
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="h-11 rounded-2xl border border-brand-ink/10 bg-white/50 px-5 text-sm font-semibold text-brand-ink/60 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    form.role === null ||
                    isLoadingUser
                  }
                  className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_9px_22px_rgba(55,38,25,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(55,38,25,0.2)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  {isSaving && (
                    <RefreshCw
                      size={14}
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
          </div>
        </form>
      </aside>
    </div>
  );
}

function PanelHeader({
  form,
  selectedRole,
  isEditing,
  isSaving,
  closeButtonRef,
  onClose,
}: {
  form: UserForm;
  selectedRole: AdminUserRole | null;
  isEditing: boolean;
  isSaving: boolean;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <div className="relative shrink-0 overflow-hidden border-b border-brand-ink/10 bg-white/45 px-5 py-5 backdrop-blur sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-brand-ink/[0.035] blur-2xl" />

      <div className="relative flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/35">
            {isEditing ? "Account details" : "Create account"}
          </p>

          <h2
            id="user-editor-title"
            className="mt-1 truncate text-2xl font-semibold tracking-[-0.035em] text-brand-ink"
          >
            {isEditing
              ? form.name || "Edit user"
              : "Add new user"}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-brand-ink/42">
            {selectedRole && (
              <>
                <span>{getRoleLabel(selectedRole)}</span>
                <span className="h-1 w-1 rounded-full bg-brand-ink/20" />
              </>
            )}

            <span>
              {form.isActive
                ? "Active account"
                : "Inactive account"}
            </span>

            {isEditing && form.id !== null && (
              <>
                <span className="h-1 w-1 rounded-full bg-brand-ink/20" />
                <span>#{form.id}</span>
              </>
            )}
          </div>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Close user editor"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-ink/10 bg-white/55 text-brand-ink/45 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-ink/15 disabled:opacity-40"
        >
          <X size={17} />
        </button>
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
        <p className="mt-1 max-w-lg text-[11px] leading-5 text-brand-ink/42">
          {description}
        </p>
      )}

      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-ink/42">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}

      {error && (
        <span className="mt-1.5 block text-[10px] font-medium leading-4 text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function PasswordVisibilityButton({
  visible,
  disabled = false,
  onClick,
}: {
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        visible ? "Hide password" : "Show password"
      }
      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-brand-ink/35 transition hover:bg-brand-ink/[0.05] hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-25"
    >
      {visible ? (
        <EyeOff size={14} />
      ) : (
        <Eye size={14} />
      )}
    </button>
  );
}

function PasswordStrength({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-brand-ink/[0.07] bg-white/35 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold text-brand-ink/45">
          Password strength
        </span>

        <span className="text-[10px] font-semibold text-brand-ink/60">
          {label}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={[
              "h-1.5 rounded-full transition",
              level <= score
                ? "bg-brand-ink/65"
                : "bg-brand-ink/[0.08]",
            ].join(" ")}
          />
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-4 text-brand-ink/38">
        Use a longer password with a mix of letters,
        numbers and symbols.
      </p>
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 shrink-0 rounded-full border transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-ink/10",
        checked
          ? "border-brand-ink bg-brand-ink"
          : "border-brand-ink/10 bg-brand-ink/10",
        disabled
          ? "cursor-not-allowed"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] grid h-5 w-5 place-items-center rounded-full bg-brand-bg shadow-sm transition-all duration-200",
          checked ? "left-[23px]" : "left-[3px]",
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

function InlineError({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200/80 bg-red-50/70 px-4 py-3 text-xs font-medium leading-5 text-red-700"
    >
      {children}
    </div>
  );
}

function getFieldClassName(
  hasError: boolean,
): string {
  return [
    "h-11 w-full rounded-2xl border bg-white/60 px-3.5 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/28 disabled:cursor-not-allowed disabled:opacity-45",
    hasError
      ? "border-red-300 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-500/[0.08]"
      : "border-brand-ink/10 hover:border-brand-ink/15 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.055]",
  ].join(" ");
}