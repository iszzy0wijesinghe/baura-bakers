import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import logo from "../assets/logo.webp";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/contact", label: "Contact" },
  { to: "/about-us", label: "About Us" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

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
    // <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
    <header className="sticky top-0 z-40 border-b border-black/10 bg-brand-bg/90 backdrop-blur">

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
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

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100",
                ].join(" ")
              }
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-zinc-200 md:hidden">
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
                      "rounded-lg px-3 py-3 text-sm font-medium",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-100",
                    ].join(" ")
                  }
                  end={l.to === "/"}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
