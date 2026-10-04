/** @format */

import {
  Check,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";

import type { AdminManagedUser } from "../../../lib/adminUsersApi";
import { formatDate } from "../../../lib/adminUserUtils";

import {
  Avatar,
  ContactRow,
  RoleBadge,
  StatusBadge,
  Td,
  Th,
} from "./UserUi";

type UserDirectoryProps = {
  users: AdminManagedUser[];
  currentUserId: number | null;
  statusUpdatingUserId: number | null;
  onEdit: (user: AdminManagedUser) => void;
  onToggleStatus: (user: AdminManagedUser) => void;
};

export default function UserDirectory({
  users,
  currentUserId,
  statusUpdatingUserId,
  onEdit,
  onToggleStatus,
}: UserDirectoryProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur md:block">
        <UserTable
          users={users}
          currentUserId={currentUserId}
          statusUpdatingUserId={statusUpdatingUserId}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {users.map((user) => (
          <MobileUserCard
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            isUpdatingStatus={statusUpdatingUserId === user.id}
            onEdit={() => onEdit(user)}
            onToggleStatus={() => onToggleStatus(user)}
          />
        ))}
      </div>
    </>
  );
}

function UserTable({
  users,
  currentUserId,
  statusUpdatingUserId,
  onEdit,
  onToggleStatus,
}: UserDirectoryProps) {
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
            const isUpdatingStatus =
              statusUpdatingUserId === user.id;

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
                    <Avatar
                      name={user.name}
                      active={user.is_active}
                    />

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
                          <Check
                            size={11}
                            strokeWidth={2.5}
                          />
                        ) : (
                          <X
                            size={11}
                            strokeWidth={2.2}
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
                        <RefreshCw
                          size={14}
                          className="animate-spin"
                        />
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
        <Avatar
          name={user.name}
          active={user.is_active}
          large
        />

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

            <StatusBadge
              active={user.is_active}
              compact
            />
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
                <RefreshCw
                  size={13}
                  className="animate-spin"
                />
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

function getUserRoleLabel(user: AdminManagedUser): string {
  if (
    "role_label" in user &&
    typeof user.role_label === "string" &&
    user.role_label.trim()
  ) {
    return user.role_label;
  }

  const role = user.role;

  if (role && typeof role === "object") {
    if (
      "label" in role &&
      typeof role.label === "string"
    ) {
      return role.label;
    }

    if (
      "name" in role &&
      typeof role.name === "string"
    ) {
      return role.name;
    }
  }

  return "User";
}