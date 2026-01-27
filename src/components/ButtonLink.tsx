import { Link } from "react-router-dom";

type Props = {
  to: string;
  children: React.ReactNode;
  variant?: "primary" | "soft";
  className?: string;
  /** If true, we won't apply built-in variant colors (you fully control colors via className) */
  unstyled?: boolean;
};

export default function ButtonLink({
  to,
  children,
  variant = "primary",
  className = "",
  unstyled = false,
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold " +
    "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-brand-ink";

  const variantStyles =
    variant === "primary"
      ? "bg-brand-ink text-brand-bg hover:bg-brand-ink/95"
      : "bg-black/5 text-brand-ink hover:bg-black/10";

  return (
    <Link to={to} className={`${base} ${unstyled ? "" : variantStyles} ${className}`}>
      {children}
    </Link>
  );
}
