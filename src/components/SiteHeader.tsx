import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import logo from "../../images/logos/logo.webp";
import { useAuthSession } from "../lib/useAuthSession";
import { logout } from "../lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/contact", label: "Contact" },
  { to: "/about-us", label: "About Us" },
];

export default function SiteHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin, isLoading } = useAuthSession();

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
          aria-label="Baura Bakers home"
        >
          <img
            src={logo}
            alt="Baura Bakers"
            className="h-20 w-20 rounded-xl object-contain"
            loading="eager"
            decoding="async"
          />
        </NavLink>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <nav className="flex items-center gap-1" aria-label="Primary">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    isActive
                      ? "bg-brand-ink text-brand-bg"
                      : "text-brand-ink/75 hover:bg-white/60 hover:text-brand-ink",
                  ].join(" ")
                }
                end={l.to === "/"}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <DesktopAccountMenu
            user={user}
            profile={profile}
            isAdmin={isAdmin}
            isLoading={isLoading}
            onLogout={handleLogout}
          />
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white/45 p-2 text-brand-ink hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-black/10 bg-brand-bg/95 md:hidden"
        >
          <nav
            className="mx-auto w-full max-w-6xl px-4 py-3"
            aria-label="Mobile"
          >
            <div className="grid gap-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-3 text-sm font-medium transition",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                      isActive
                        ? "bg-brand-ink text-brand-bg"
                        : "text-brand-ink/75 hover:bg-white/60 hover:text-brand-ink",
                    ].join(" ")
                  }
                  end={l.to === "/"}
                >
                  {l.label}
                </NavLink>
              ))}

              <MobileAccountMenu
                user={user}
                profile={profile}
                isAdmin={isAdmin}
                isLoading={isLoading}
                onClose={() => setOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function DesktopAccountMenu({
  user,
  profile,
  isAdmin,
  isLoading,
  onLogout,
}: {
  user: any;
  profile: any;
  isAdmin: boolean;
  isLoading: boolean;
  onLogout: () => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-full border border-black/10 bg-white/45 px-4 py-2 text-xs font-semibold text-brand-ink/55">
        Checking...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <NavLink
          to="/login"
          className="rounded-full border border-brand-ink/20 bg-white/50 px-4 py-2 text-xs font-semibold text-brand-ink transition hover:bg-white/75"
        >
          Login
        </NavLink>

        <NavLink
          to="/register"
          className="rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-brand-bg transition hover:bg-brand-ink/95"
        >
          Register
        </NavLink>
      </div>
    );
  }

  return (
    <div className="flex max-w-[520px] items-center gap-2 rounded-full border border-black/10 bg-white/45 px-2 py-2 shadow-sm backdrop-blur">
      <div className="max-w-[145px] px-2 leading-tight">
        <p className="truncate text-xs font-semibold text-brand-ink">
          {profile?.full_name || user.email}
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-ink/50">
          {profile?.role || "customer"}
        </p>
      </div>

      {isAdmin ? (
        <NavLink
          to="/admin/dashboard"
          className="rounded-full bg-brand-ink px-3 py-2 text-xs font-semibold text-brand-bg transition hover:bg-brand-ink/95"
        >
          Dashboard
        </NavLink>
      ) : (
        <>
          <NavLink
            to="/account"
            className="rounded-full border border-brand-ink/15 bg-white/55 px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-white/80"
          >
            My Profile
          </NavLink>

          <NavLink
            to="/orders"
            className="rounded-full border border-brand-ink/15 bg-white/55 px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-white/80"
          >
            My Orders
          </NavLink>
        </>
      )}

      <button
        type="button"
        onClick={onLogout}
        className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
      >
        Logout
      </button>
    </div>
  );
}

function MobileAccountMenu({
  user,
  profile,
  isAdmin,
  isLoading,
  onClose,
  onLogout,
}: {
  user: any;
  profile: any;
  isAdmin: boolean;
  isLoading: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-2 rounded-2xl border border-black/10 bg-white/45 px-4 py-3 text-sm font-semibold text-brand-ink/55">
        Checking account...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-black/10 pt-4">
        <NavLink
          to="/login"
          onClick={onClose}
          className="rounded-2xl border border-brand-ink/20 bg-white/55 px-4 py-3 text-center text-sm font-semibold text-brand-ink"
        >
          Login
        </NavLink>

        <NavLink
          to="/register"
          onClick={onClose}
          className="rounded-2xl bg-brand-ink px-4 py-3 text-center text-sm font-semibold text-brand-bg"
        >
          Register
        </NavLink>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3 border-t border-black/10 pt-4">
      <div className="rounded-2xl border border-black/10 bg-white/55 p-4">
        <p className="truncate text-sm font-semibold text-brand-ink">
          {profile?.full_name || user.email}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink/50">
          {profile?.role || "customer"}
        </p>
      </div>

      <div className="grid gap-2">
        {isAdmin ? (
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className="rounded-2xl bg-brand-ink px-4 py-3 text-center text-sm font-semibold text-brand-bg"
          >
            Admin Dashboard
          </NavLink>
        ) : (
          <>
            <NavLink
              to="/account"
              onClick={onClose}
              className="rounded-2xl border border-brand-ink/20 bg-white/55 px-4 py-3 text-center text-sm font-semibold text-brand-ink"
            >
              My Profile
            </NavLink>

            <NavLink
              to="/orders"
              onClick={onClose}
              className="rounded-2xl border border-brand-ink/20 bg-white/55 px-4 py-3 text-center text-sm font-semibold text-brand-ink"
            >
              My Orders
            </NavLink>
          </>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}