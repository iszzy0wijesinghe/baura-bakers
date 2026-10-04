/** @format */

import type { ReactNode } from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import type { AdminUsersPagination } from "../../../lib/adminUsersApi";
import { initials } from "../../../lib/adminUserUtils";

export function Metric({
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

export function FormSection({
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
        last ? "pb-0" : "border-b border-brand-ink/[0.08]",
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

export function Field({
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

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}

      {error && (
        <span className="mt-1.5 flex items-start gap-1.5 text-[10px] font-medium leading-4 text-red-600">
          <AlertCircle
            size={11}
            className="mt-0.5 shrink-0"
          />
          {error}
        </span>
      )}
    </label>
  );
}

export function getFieldClassName(hasError: boolean) {
  return [
    "h-11 w-full rounded-2xl border bg-white/60 px-3.5 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/28 disabled:cursor-not-allowed disabled:opacity-45",
    hasError
      ? "border-red-300 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-500/[0.08]"
      : "border-brand-ink/10 hover:border-brand-ink/15 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/[0.055]",
  ].join(" ");
}

export function Toggle({
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
        disabled ? "cursor-not-allowed" : "cursor-pointer",
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

export function Avatar({
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

export function RoleBadge({
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

export function StatusBadge({
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

export function ContactRow({
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

export function FilterChip({
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

export function Pagination({
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
      : (pagination.current_page - 1) *
          pagination.per_page +
        1;

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
          onClick={() =>
            onPageChange(pagination.current_page - 1)
          }
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
          onClick={() =>
            onPageChange(pagination.current_page + 1)
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-ink/10 bg-white/45 px-3 text-xs font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

export function Notice({
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
        onClick={onClose}
        aria-label="Dismiss"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-45 transition hover:bg-black/[0.04] hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function InlineError({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/70 px-4 py-3 text-xs font-medium leading-5 text-red-700"
    >
      <XCircle
        size={15}
        className="mt-0.5 shrink-0"
      />

      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
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
          onClick={onClear}
          className="mt-5 rounded-xl border border-brand-ink/10 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-ink/60 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function LoadingState({
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

export function UserDirectorySkeleton() {
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
              className={
                index === 6
                  ? "ml-auto w-14"
                  : "w-16"
              }
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

export function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`h-2.5 animate-pulse rounded-full bg-brand-ink/[0.07] ${className}`}
    />
  );
}

export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-brand-ink/[0.07] ${className}`}
    />
  );
}

export function Th({
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

export function Td({
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

export function ContactPreview({
  email,
  phone,
}: {
  email?: string | null;
  phone?: string | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Mail
          size={12}
          className="shrink-0 text-brand-ink/30"
        />

        <p className="max-w-[220px] truncate text-[12px] font-medium text-brand-ink/65">
          {email || "No email"}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Phone
          size={12}
          className="shrink-0 text-brand-ink/30"
        />

        <p className="text-[11px] text-brand-ink/42">
          {phone || "No phone"}
        </p>
      </div>
    </div>
  );
}
