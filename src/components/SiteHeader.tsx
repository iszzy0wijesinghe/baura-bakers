import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  ClipboardList,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu as MenuIcon,
  Phone,
  ShoppingBag,
  Sparkles,
  User,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../images/logos/logo.webp";
import { logout } from "../lib/auth";
import { useAuthSession } from "../lib/useAuthSession";

const links: {
  to: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: ShoppingBag },
  { to: "/contact", label: "Contact", icon: Phone },
  { to: "/about-us", label: "About Us", icon: Info },
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
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-brand-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 md:gap-4 md:py-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
            aria-label="Baura Bakers home"
          >
            <img
              src={logo}
              alt="Baura Bakers"
              className="h-14 w-14 rounded-xl object-contain md:h-20 md:w-20"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/60 text-brand-ink shadow-sm transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-brand-bg md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-brand-ink/10 blur-3xl" />
            </div>

            <motion.div
              className="relative flex min-h-dvh flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={logo}
                    alt="Baura Bakers"
                    className="h-12 w-12 rounded-2xl object-contain"
                    loading="eager"
                    decoding="async"
                  />

                  <div>
                    <p className="text-sm font-semibold text-brand-ink">
                      Baura Bakers
                    </p>
                    <p className="text-[11px] font-medium text-brand-ink/55">
                      Fresh baked moments
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative z-[10000] grid h-10 w-10 place-items-center rounded-2xl bg-brand-ink text-brand-bg shadow-sm"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-black/10 bg-white/45 p-3 shadow-sm backdrop-blur">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-bg text-brand-ink shadow-sm">
                    <Sparkles size={15} />
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-brand-ink">
                      Carefully packed deliveries
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-brand-ink/60">
                      Delivered through PickMe Flash or Uber Parcel.
                    </p>
                  </div>
                </div>
              </div>

              <nav className="mt-4 grid gap-2" aria-label="Mobile">
                {links.map((l, index) => (
                  <MobileNavLink
                    key={l.to}
                    to={l.to}
                    label={l.label}
                    icon={l.icon}
                    index={index}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </nav>

              <MobileAccountMenu
                user={user}
                profile={profile}
                isAdmin={isAdmin}
                isLoading={isLoading}
                onClose={() => setOpen(false)}
                onLogout={handleLogout}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

function MobileNavLink({
  to,
  label,
  icon: Icon,
  index,
  onClose,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  index: number;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.035 }}
    >
      <NavLink
        to={to}
        onClick={onClose}
        className={({ isActive }) =>
          [
            "group flex items-center justify-between rounded-[1.2rem] border px-3.5 py-3 text-sm font-semibold shadow-sm transition",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
            isActive
              ? "border-brand-ink bg-brand-ink text-brand-bg"
              : "border-black/10 bg-white/60 text-brand-ink hover:bg-white/85",
          ].join(" ")
        }
        end={to === "/"}
      >
        {({ isActive }) => (
          <>
            <span className="flex items-center gap-3">
              <span
                className={[
                  "grid h-9 w-9 place-items-center rounded-xl transition",
                  isActive
                    ? "bg-brand-bg/10 text-brand-bg"
                    : "bg-brand-bg text-brand-ink",
                ].join(" ")}
              >
                <Icon size={17} />
              </span>

              {label}
            </span>

            <ChevronRight
              size={17}
              className={isActive ? "text-brand-bg" : "text-brand-ink/35"}
            />
          </>
        )}
      </NavLink>
    </motion.div>
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
      <motion.div
        className="mt-4 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-semibold text-brand-ink/55 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Checking account...
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        className="mt-4 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-black/10 bg-white/45 p-2.5 shadow-sm backdrop-blur"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <NavLink
          to="/login"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-2xl border border-brand-ink/15 bg-white/75 px-3 py-2.5 text-sm font-semibold text-brand-ink"
        >
          <LogIn size={16} />
          Login
        </NavLink>

        <NavLink
          to="/register"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-ink px-3 py-2.5 text-sm font-semibold text-brand-bg"
        >
          <UserPlus size={16} />
          Register
        </NavLink>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mt-4 space-y-2.5 rounded-[1.5rem] border border-black/10 bg-white/45 p-2.5 shadow-sm backdrop-blur"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="rounded-2xl border border-black/10 bg-white/65 p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-ink text-brand-bg">
            <User size={17} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-ink">
              {profile?.full_name || user.email}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-ink/50">
              {profile?.role || "customer"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {isAdmin ? (
          <MobileSmallLink
            to="/admin/dashboard"
            label="Admin Dashboard"
            icon={LayoutDashboard}
            onClose={onClose}
          />
        ) : (
          <>
            <MobileSmallLink
              to="/account"
              label="My Profile"
              icon={User}
              onClose={onClose}
            />

            <MobileSmallLink
              to="/orders"
              label="My Orders"
              icon={ClipboardList}
              onClose={onClose}
            />
          </>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </motion.div>
  );
}

function MobileSmallLink({
  to,
  label,
  icon: Icon,
  onClose,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  onClose: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className="flex items-center justify-center gap-2 rounded-2xl border border-brand-ink/15 bg-white/70 px-3 py-2.5 text-sm font-semibold text-brand-ink"
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}