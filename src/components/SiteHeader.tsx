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
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logo from "../../images/logos/logo.webp";
import { logout } from "../lib/auth";
import { useAuthSession } from "../lib/useAuthSession";

const links: {
  to: string;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    to: "/",
    label: "Home",
    icon: Home,
  },
  {
    to: "/menu",
    label: "Menu",
    icon: ShoppingBag,
  },
  {
    to: "/contact",
    label: "Contact",
    icon: Phone,
  },
  {
    to: "/about-us",
    label: "About Us",
    icon: Info,
  },
];

const HEADER_SCROLL_THRESHOLD = 42;

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(
    () =>
      typeof window !== "undefined" &&
      window.scrollY > HEADER_SCROLL_THRESHOLD,
  );

  const {
    user,
    profile,
    isAdmin,
    isLoading,
  } = useAuthSession();

  const isHome = location.pathname === "/";
  const isOverlay = isHome && !scrolled && !open;

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const next =
        window.scrollY > HEADER_SCROLL_THRESHOLD;

      setScrolled((current) =>
        current === next ? current : next,
      );
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  return (
    <>
      <header
        className={[
          "z-50 w-full",
          "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          isHome
            ? "fixed inset-x-0 top-0"
            : "sticky top-0",
          isOverlay
            ? [
                "border-b border-white/[0.12]",
                "bg-gradient-to-b from-black/30 via-black/10 to-transparent",
                "text-white",
              ].join(" ")
            : [
                "border-b border-brand-ink/10",
                "bg-brand-bg/[0.96]",
                "text-brand-ink",
                "shadow-[0_10px_35px_rgba(55,38,25,0.045)]",
                "backdrop-blur-xl",
              ].join(" "),
        ].join(" ")}
      >
        <div
          className={[
            "mx-auto flex w-full items-center justify-between",
            "px-5 sm:px-7 lg:px-10 xl:px-14",
            "transition-[height] duration-300",
            isOverlay
              ? "h-[84px] sm:h-[88px] lg:h-[92px]"
              : "h-[70px] sm:h-[72px] lg:h-[76px]",
          ].join(" ")}
        >
          {/* LOGO */}
          <NavLink
            to="/"
            aria-label="Baura Bakers home"
            className={[
              "relative z-10 flex shrink-0 items-center",
              "rounded-sm",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4",
              isOverlay
                ? "focus-visible:outline-white"
                : "focus-visible:outline-brand-ink",
            ].join(" ")}
          >
            <img
              src={logo}
              alt="Baura Bakers"
              loading="eager"
              decoding="async"
              className={[
                "w-auto object-contain",
                "transition-[height,filter,opacity] duration-300",
                isOverlay
                  ? [
                      "h-[48px]",
                      "sm:h-[52px]",
                      "lg:h-[56px]",
                      "brightness-0 invert",
                      "drop-shadow-[0_2px_12px_rgba(0,0,0,0.18)]",
                    ].join(" ")
                  : [
                      "h-[44px]",
                      "sm:h-[48px]",
                      "lg:h-[50px]",
                    ].join(" "),
              ].join(" ")}
            />
          </NavLink>

          {/* DESKTOP */}
          <div className="hidden min-w-0 items-center md:flex">
            <nav
              className={[
                "flex items-center",
                "lg:gap-1 xl:gap-2",
                isOverlay
                  ? [
                      "rounded-full",
                      "border border-white/[0.13]",
                      "bg-black/[0.10]",
                      "px-2 py-1",
                      "backdrop-blur-[8px]",
                      "shadow-[0_8px_28px_rgba(0,0,0,0.08)]",
                    ].join(" ")
                  : "",
              ].join(" ")}
              aria-label="Primary navigation"
            >
              {links.map((link) => (
                <DesktopNavLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  overlay={isOverlay}
                />
              ))}
            </nav>

            <DesktopAccountMenu
              user={user}
              profile={profile}
              isAdmin={isAdmin}
              isLoading={isLoading}
              overlay={isOverlay}
              onLogout={handleLogout}
            />
          </div>

          {/* MOBILE BUTTON */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className={[
              "relative z-10 inline-flex",
              "h-11 w-11",
              "items-center justify-center",
              "rounded-full border",
              "transition-all duration-200",
              "md:hidden",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4",
              isOverlay
                ? [
                    "border-white/25",
                    "bg-black/15",
                    "text-white",
                    "backdrop-blur-md",
                    "hover:bg-white/10",
                    "focus-visible:outline-white",
                  ].join(" ")
                : [
                    "border-brand-ink/10",
                    "bg-white/40",
                    "text-brand-ink",
                    "hover:bg-white/70",
                    "focus-visible:outline-brand-ink",
                  ].join(" "),
            ].join(" ")}
          >
            <MenuIcon
              size={20}
              strokeWidth={1.8}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[9999] md:hidden"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            />

            <motion.aside
              className={[
                "absolute right-0 top-0",
                "flex h-dvh",
                "w-[90vw] max-w-[390px]",
                "flex-col",
                "overflow-y-auto overscroll-contain",
                "bg-brand-bg",
                "px-5",
                "pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
                "pt-[max(1rem,env(safe-area-inset-top))]",
                "shadow-[-24px_0_80px_rgba(36,20,12,0.24)]",
              ].join(" ")}
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 32,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <NavLink
                  to="/"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="flex items-center"
                  aria-label="Baura Bakers home"
                >
                  <img
                    src={logo}
                    alt="Baura Bakers"
                    className="h-[52px] w-auto object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </NavLink>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className={[
                    "grid h-11 w-11",
                    "place-items-center",
                    "rounded-full",
                    "border border-brand-ink/10",
                    "bg-brand-ink",
                    "text-brand-bg",
                    "transition-transform",
                    "hover:scale-[0.97]",
                  ].join(" ")}
                  aria-label="Close menu"
                >
                  <X
                    size={19}
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              <div className="mt-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">
                  Explore Baura
                </p>

                <nav
                  className="mt-3"
                  aria-label="Mobile navigation"
                >
                  {links.map(
                    (link, index) => (
                      <MobileNavLink
                        key={link.to}
                        to={link.to}
                        label={link.label}
                        icon={link.icon}
                        index={index}
                        onClose={() =>
                          setOpen(false)
                        }
                      />
                    ),
                  )}
                </nav>
              </div>

              <div className="mt-7 border-t border-brand-ink/10 pt-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-ink/[0.06] text-brand-ink">
                    <Sparkles
                      size={15}
                      strokeWidth={1.7}
                    />
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-brand-ink">
                      Freshly prepared with care
                    </p>

                    <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-brand-ink/55">
                      Orders are carefully
                      prepared and can be
                      arranged for collection
                      or delivery.
                    </p>
                  </div>
                </div>
              </div>

              <MobileAccountMenu
                user={user}
                profile={profile}
                isAdmin={isAdmin}
                isLoading={isLoading}
                onClose={() =>
                  setOpen(false)
                }
                onLogout={handleLogout}
              />

              <div className="mt-auto border-t border-brand-ink/10 pt-5">
                <p className="text-[10px] leading-relaxed text-brand-ink/40">
                  Baura Bakers · Fresh baked
                  moments
                </p>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* =======================================================
   DESKTOP NAV LINK
======================================================= */

function DesktopNavLink({
  to,
  label,
  overlay,
}: {
  to: string;
  label: string;
  overlay: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "relative",
          "inline-flex h-9 items-center",
          "rounded-full",
          "px-3",
          "text-[12px]",
          "font-semibold",
          "whitespace-nowrap",
          "transition-all duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          overlay
            ? [
                isActive
                  ? "bg-white/[0.14] text-white"
                  : "text-white/80 hover:bg-white/[0.08] hover:text-white",
                "focus-visible:outline-white",
              ].join(" ")
            : [
                isActive
                  ? "bg-brand-ink/[0.07] text-brand-ink"
                  : "text-brand-ink/60 hover:bg-brand-ink/[0.04] hover:text-brand-ink",
                "focus-visible:outline-brand-ink",
              ].join(" "),
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

/* =======================================================
   DESKTOP ACCOUNT
======================================================= */

function DesktopAccountMenu({
  user,
  profile,
  isAdmin,
  isLoading,
  overlay,
  onLogout,
}: {
  user: any;
  profile: any;
  isAdmin: boolean;
  isLoading: boolean;
  overlay: boolean;
  onLogout: () => void;
}) {
  if (isLoading) {
    return (
      <div
        className={[
          "ml-4 h-9 w-24",
          "animate-pulse rounded-full",
          overlay
            ? "bg-white/10"
            : "bg-brand-ink/[0.06]",
        ].join(" ")}
      />
    );
  }

  if (!user) {
    return (
      <div className="ml-4 flex items-center gap-2">
        <NavLink
          to="/login"
          className={[
            "inline-flex h-9",
            "items-center justify-center",
            "rounded-full",
            "px-4",
            "text-[11px]",
            "font-semibold",
            "transition-all",
            overlay
              ? [
                  "border border-white/20",
                  "bg-black/10",
                  "text-white",
                  "hover:bg-white/10",
                ].join(" ")
              : [
                  "border border-brand-ink/15",
                  "text-brand-ink",
                  "hover:bg-brand-ink/[0.05]",
                ].join(" "),
          ].join(" ")}
        >
          Login
        </NavLink>

        <NavLink
          to="/register"
          className={[
            "inline-flex h-9",
            "items-center justify-center",
            "rounded-full",
            "px-4",
            "text-[11px]",
            "font-semibold",
            "transition-all",
            overlay
              ? [
                  "bg-brand-bg",
                  "text-brand-ink",
                  "shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
                  "hover:bg-white",
                ].join(" ")
              : [
                  "bg-brand-ink",
                  "text-brand-bg",
                  "hover:bg-brand-ink/90",
                ].join(" "),
          ].join(" ")}
        >
          Register
        </NavLink>
      </div>
    );
  }

  return (
    <div
      className={[
        "ml-4 flex items-center gap-2",
        "border-l pl-4",
        overlay
          ? "border-white/20"
          : "border-brand-ink/10",
      ].join(" ")}
    >
      {/* USER */}
      <div className="hidden max-w-[120px] xl:block">
        <p
          className={[
            "truncate text-[10px]",
            "font-semibold",
            overlay
              ? "text-white"
              : "text-brand-ink",
          ].join(" ")}
        >
          {profile?.full_name ||
            user.email}
        </p>

        <p
          className={[
            "mt-0.5",
            "text-[7px]",
            "font-bold uppercase",
            "tracking-[0.18em]",
            overlay
              ? "text-white/45"
              : "text-brand-ink/40",
          ].join(" ")}
        >
          {profile?.role || "customer"}
        </p>
      </div>

      {/* PRIMARY ACCOUNT ACTION */}
      {isAdmin ? (
        <NavLink
          to="/admin/dashboard"
          className={[
            "inline-flex h-9",
            "items-center justify-center",
            "gap-1.5",
            "rounded-full",
            "px-3.5",
            "text-[11px]",
            "font-semibold",
            "whitespace-nowrap",
            "transition-all",
            overlay
              ? [
                  "bg-brand-bg",
                  "text-brand-ink",
                  "shadow-[0_8px_25px_rgba(0,0,0,0.12)]",
                  "hover:bg-white",
                ].join(" ")
              : [
                  "bg-brand-ink",
                  "text-brand-bg",
                  "hover:bg-brand-ink/90",
                ].join(" "),
          ].join(" ")}
        >
          <LayoutDashboard
            size={13}
            strokeWidth={1.8}
          />
          Dashboard
        </NavLink>
      ) : (
        <NavLink
          to="/account"
          className={[
            "inline-flex h-9",
            "items-center justify-center",
            "gap-1.5",
            "rounded-full",
            "px-3.5",
            "text-[11px]",
            "font-semibold",
            "whitespace-nowrap",
            "transition-all",
            overlay
              ? [
                  "bg-brand-bg",
                  "text-brand-ink",
                  "hover:bg-white",
                ].join(" ")
              : [
                  "bg-brand-ink",
                  "text-brand-bg",
                  "hover:bg-brand-ink/90",
                ].join(" "),
          ].join(" ")}
        >
          <User
            size={13}
            strokeWidth={1.8}
          />
          Account
        </NavLink>
      )}

      {!isAdmin ? (
        <NavLink
          to="/orders"
          aria-label="My orders"
          title="My orders"
          className={[
            "grid h-9 w-9",
            "place-items-center",
            "rounded-full",
            "transition-all",
            overlay
              ? [
                  "border border-white/20",
                  "text-white/75",
                  "hover:bg-white/10",
                  "hover:text-white",
                ].join(" ")
              : [
                  "border border-brand-ink/10",
                  "text-brand-ink/55",
                  "hover:bg-brand-ink/[0.05]",
                  "hover:text-brand-ink",
                ].join(" "),
          ].join(" ")}
        >
          <ClipboardList
            size={14}
            strokeWidth={1.7}
          />
        </NavLink>
      ) : null}

      <button
        type="button"
        onClick={onLogout}
        aria-label="Logout"
        title="Logout"
        className={[
          "grid h-9 w-9",
          "place-items-center",
          "rounded-full",
          "transition-all",
          overlay
            ? [
                "text-white/60",
                "hover:bg-white/10",
                "hover:text-white",
              ].join(" ")
            : [
                "text-brand-ink/45",
                "hover:bg-brand-ink/[0.05]",
                "hover:text-brand-ink",
              ].join(" "),
        ].join(" ")}
      >
        <LogOut
          size={14}
          strokeWidth={1.7}
        />
      </button>
    </div>
  );
}

/* =======================================================
   MOBILE NAV LINK
======================================================= */

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
      initial={{
        opacity: 0,
        x: 14,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.3,
        delay: 0.04 + index * 0.035,
      }}
    >
      <NavLink
        to={to}
        onClick={onClose}
        end={to === "/"}
        className={({ isActive }) =>
          [
            "group flex",
            "min-h-[58px]",
            "items-center justify-between",
            "border-b border-brand-ink/10",
            "transition-colors",
            isActive
              ? "text-brand-ink"
              : "text-brand-ink/62 hover:text-brand-ink",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <span className="flex items-center gap-3">
              <Icon
                size={17}
                strokeWidth={
                  isActive ? 2 : 1.6
                }
                className={
                  isActive
                    ? "text-brand-ink"
                    : "text-brand-ink/40"
                }
              />

              <span
                className={[
                  "text-[15px]",
                  isActive
                    ? "font-semibold"
                    : "font-medium",
                ].join(" ")}
              >
                {label}
              </span>
            </span>

            <ChevronRight
              size={16}
              strokeWidth={1.6}
              className="text-brand-ink/30 transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </NavLink>
    </motion.div>
  );
}

/* =======================================================
   MOBILE ACCOUNT
======================================================= */

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
      <div className="mt-6">
        <div className="h-16 animate-pulse rounded-2xl bg-brand-ink/[0.05]" />
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        className="mt-6 grid grid-cols-2 gap-2"
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.16,
        }}
      >
        <NavLink
          to="/login"
          onClick={onClose}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-brand-ink/15 text-sm font-semibold text-brand-ink"
        >
          <LogIn
            size={15}
            strokeWidth={1.8}
          />
          Login
        </NavLink>

        <NavLink
          to="/register"
          onClick={onClose}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-ink text-sm font-semibold text-brand-bg"
        >
          <UserPlus
            size={15}
            strokeWidth={1.8}
          />
          Register
        </NavLink>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mt-6"
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.16,
      }}
    >
      <div className="flex items-center gap-3 border-b border-brand-ink/10 pb-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-ink text-brand-bg">
          <User
            size={17}
            strokeWidth={1.7}
          />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-ink">
            {profile?.full_name ||
              user.email}
          </p>

          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-ink/40">
            {profile?.role ||
              "customer"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-1">
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
          className="flex min-h-[46px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-brand-ink/55 transition hover:bg-brand-ink/[0.05] hover:text-brand-ink"
        >
          <LogOut
            size={16}
            strokeWidth={1.6}
          />
          Logout
        </button>
      </div>
    </motion.div>
  );
}

/* =======================================================
   MOBILE SMALL LINK
======================================================= */

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
      className="flex min-h-[46px] items-center gap-3 rounded-xl px-2 text-sm font-medium text-brand-ink/65 transition hover:bg-brand-ink/[0.05] hover:text-brand-ink"
    >
      <Icon
        size={16}
        strokeWidth={1.6}
      />

      {label}
    </NavLink>
  );
}